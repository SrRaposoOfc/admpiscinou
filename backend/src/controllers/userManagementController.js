const User = require('../models/User');

// Middleware para verificar permissões de admin
const checkAdminPermissions = (req, res, next) => {
  const { admin } = req;
  
  if (!admin) {
    return res.status(401).json({ 
      success: false, 
      message: 'Acesso negado - Admin não autenticado' 
    });
  }

  // Verificar se tem permissão para gerenciar usuários
  if (!admin.permissions?.manageUsers) {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado - Sem permissão para gerenciar usuários' 
    });
  }

  next();
};

// Listar todos os usuários com filtros avançados
const listAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      status = '', 
      userType = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (search) {
      filters.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { cpf: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filters.status = status;
    }
    
    if (userType) {
      filters.is_piscineiro = userType === 'piscineiro';
    }

    // Configurar ordenação
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Executar consulta com paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, totalUsers] = await Promise.all([
      User.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password') // Não retornar senhas
        .lean(),
      User.countDocuments(filters)
    ]);

    // Calcular informações de paginação
    const totalPages = Math.ceil(totalUsers / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Formatar dados dos usuários
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.full_name || 'Nome não informado',
      email: user.email,
      phone: user.phone || 'Não informado',
      cpf: user.cpf || 'Não informado',
      rg: user.rg || 'Não informado',
      status: user.status,
      userType: user.is_piscineiro ? 'piscineiro' : 'cliente',
      isVerified: {
        email: user.emailVerified || false,
        phone: false // Não vamos verificar telefone por enquanto
      },
      location: user.location?.latitude && user.location?.longitude ? {
        latitude: user.location.latitude,
        longitude: user.location.longitude
      } : null,
      isAvailable: user.isAvailable,
      address: user.addresses && user.addresses.length > 0 ? user.addresses[0] : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastActivity: user.lastActivity,
      kycStatus: user.kyc_status || null,
      loginAttempts: user.loginAttempts || 0
    }));

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          limit: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao listar usuários'
    });
  }
};

// Obter estatísticas detalhadas dos usuários
const getUserStats = async (req, res) => {
  try {
    // Estatísticas básicas
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      inactiveUsers,
      suspendedUsers,
      piscineiros,
      clientes,
      emailVerified
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'pending' }),
      User.countDocuments({ status: 'inactive' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ is_piscineiro: true }),
      User.countDocuments({ is_piscineiro: false }),
      User.countDocuments({ emailVerified: true })
    ]);

    // Estatísticas por período (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Estatísticas por status
    const statusBreakdown = {
      ativo: activeUsers,
      pendente: pendingUsers,
      inativo: inactiveUsers,
      suspenso: suspendedUsers
    };

    // Estatísticas por tipo
    const typeBreakdown = {
      cliente: clientes,
      piscineiro: piscineiros
    };

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        pendingUsers,
        inactiveUsers,
        suspendedUsers,
        piscineiros,
        clientes,
        emailVerified,
        phoneVerified: null, // Removido daqui
        recentUsers,
        statusBreakdown,
        typeBreakdown
      }
    });

  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao obter estatísticas'
    });
  }
};

// Obter dados de crescimento mensal para gráficos
const getMonthlyGrowthData = async (req, res) => {
  try {
    console.log('📊 Obtendo dados de crescimento mensal...');
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthlyData = [];
    
    // Gerar dados para os últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const startDate = new Date(currentYear, now.getMonth() - i, 1);
      const endDate = new Date(currentYear, now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      
      // Contar usuários criados neste mês
      const userCount = await User.countDocuments({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      const monthLabel = startDate.toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: '2-digit' 
      });
      
      monthlyData.push({
        month: monthLabel,
        count: userCount,
        startDate: startDate,
        endDate: endDate
      });
    }
    
    console.log('✅ Dados de crescimento mensal calculados:', monthlyData);
    
    res.json({
      success: true,
      data: {
        monthlyData,
        totalMonths: monthlyData.length,
        totalUsers: monthlyData.reduce((sum, month) => sum + month.count, 0),
        averageMonthly: Math.round(monthlyData.reduce((sum, month) => sum + month.count, 0) / monthlyData.length * 10) / 10
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter dados de crescimento mensal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao obter dados de crescimento mensal'
    });
  }
};

// Deletar usuário específico
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário existe
    const user = await User.findById(userId).select('name email status');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Log da ação para auditoria
    console.log(`🗑️ Admin ${req.admin.username} deletou usuário: ${user.email} (${user.name})`);

    // Deletar usuário
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: `Usuário ${user.name} (${user.email}) deletado com sucesso`
    });

  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao deletar usuário'
    });
  }
};

// Deletar múltiplos usuários
const deleteMultipleUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de IDs de usuários é obrigatória'
      });
    }

    // Verificar se todos os usuários existem
    const users = await User.find({ _id: { $in: userIds } }).select('name email status');
    
    if (users.length !== userIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Alguns usuários não foram encontrados'
      });
    }

    // Log da ação para auditoria
    console.log(`🗑️ Admin ${req.admin.username} deletou ${users.length} usuários:`, 
      users.map(u => `${u.name} (${u.email})`).join(', '));

    // Deletar usuários
    const result = await User.deleteMany({ _id: { $in: userIds } });

    res.json({
      success: true,
      message: `${result.deletedCount} usuário(s) deletado(s) com sucesso`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('❌ Erro ao deletar múltiplos usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao deletar usuários'
    });
  }
};

// Atualizar status de usuário
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Validar status
    const validStatuses = ['ativo', 'pendente', 'inativo', 'suspenso'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido. Use: ativo, pendente, inativo ou suspenso'
      });
    }

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Log da ação para auditoria
    console.log(`🔄 Admin ${req.admin.username} alterou status de ${user.email} de ${user.status} para ${status}`);

    // Atualizar status
    user.status = status;
    await user.save();

    res.json({
      success: true,
      message: `Status do usuário ${user.name} alterado para ${status}`,
      data: {
        userId: user._id,
        status: user.status
      }
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar status do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao atualizar status'
    });
  }
};

// Buscar usuário por ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar usuário'
    });
  }
};

module.exports = {
  checkAdminPermissions,
  listAllUsers,
  getUserStats,
  getMonthlyGrowthData,
  deleteUser,
  deleteMultipleUsers,
  updateUserStatus,
  getUserById
};
