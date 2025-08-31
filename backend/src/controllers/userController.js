const User = require('../models/User');

// Listar usuários com paginação e filtros
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      userType = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (status) filters.status = status;
    if (userType) filters.userType = userType;
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { cpf: { $regex: search, $options: 'i' } }
      ];
    }

    // Configurar ordenação
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calcular skip para paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Buscar usuários
    const users = await User.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Contar total de usuários com os filtros
    const totalUsers = await User.countDocuments(filters);

    // Calcular informações de paginação
    const totalPages = Math.ceil(totalUsers / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao buscar usuários'
    });
  }
};

// Obter usuário específico
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'ID de usuário inválido'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao buscar usuário'
    });
  }
};

// Atualizar usuário
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Campos permitidos para atualização
    const allowedFields = [
      'name', 'email', 'phone', 'cpf', 'userType', 'status',
      'isVerified', 'profile', 'preferences'
    ];

    // Filtrar apenas campos permitidos
    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      id,
      filteredData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'ID de usuário inválido'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: user
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Dados duplicados',
        message: 'Email, telefone ou CPF já existe no sistema'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao atualizar usuário'
    });
  }
};

// Deletar usuário
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'ID de usuário inválido'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao deletar usuário'
    });
  }
};

// Atualizar status do usuário
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validar status
    const validStatuses = ['ativo', 'pendente', 'inativo', 'suspenso'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Status inválido',
        message: 'Status deve ser: ativo, pendente, inativo ou suspenso'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'ID de usuário inválido'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status do usuário atualizado com sucesso',
      data: user
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar status do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao atualizar status do usuário'
    });
  }
};

// Gerar relatório de usuários
const generateUserReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    // Construir filtros de data
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Buscar usuários com filtros
    const users = await User.find(dateFilter).select('-__v');

    // Estatísticas do relatório
    const stats = {
      totalUsers: users.length,
      byStatus: {},
      byType: {},
      byVerification: {
        fullyVerified: 0,
        partiallyVerified: 0,
        notVerified: 0
      },
      dateRange: {
        start: startDate || 'início',
        end: endDate || 'atual'
      }
    };

    // Calcular estatísticas
    users.forEach(user => {
      // Por status
      stats.byStatus[user.status] = (stats.byStatus[user.status] || 0) + 1;
      
      // Por tipo
      stats.byType[user.userType] = (stats.byType[user.userType] || 0) + 1;
      
      // Por verificação
      if (user.isVerified.email && user.isVerified.phone) {
        stats.byVerification.fullyVerified++;
      } else if (user.isVerified.email || user.isVerified.phone) {
        stats.byVerification.partiallyVerified++;
      } else {
        stats.byVerification.notVerified++;
      }
    });

    const report = {
      generatedAt: new Date().toISOString(),
      stats,
      users: format === 'detailed' ? users : users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        status: u.status,
        userType: u.userType,
        createdAt: u.createdAt
      }))
    };

    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao gerar relatório'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  generateUserReport
};
