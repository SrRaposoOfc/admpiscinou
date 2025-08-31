const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

// Login do admin
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validação dos campos
    if (!username || !password) {
      return res.status(400).json({
        error: 'Campos obrigatórios',
        message: 'Usuário e senha são obrigatórios'
      });
    }

    // Buscar admin pelo username
    const admin = await Admin.findOne({ username });
    
    if (!admin) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Usuário ou senha incorretos'
      });
    }

    // Verificar se o admin está ativo
    if (!admin.isActive) {
      return res.status(401).json({
        error: 'Conta desativada',
        message: 'Sua conta foi desativada'
      });
    }

    // Verificar senha
    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Usuário ou senha incorretos'
      });
    }

    // Atualizar último login
    admin.lastLogin = new Date();
    await admin.save();

    // Gerar token JWT
    const token = jwt.sign(
      { 
        adminId: admin._id,
        username: admin.username,
        role: admin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Retornar dados do admin e token
    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        admin: admin.toPublicJSON(),
        token,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('❌ Erro no login admin:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao realizar login'
    });
  }
};

// Obter perfil do admin logado
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    
    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('❌ Erro ao buscar perfil admin:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao buscar perfil'
    });
  }
};

// Logout do admin
const adminLogout = async (req, res) => {
  try {
    // Em uma implementação mais robusta, você pode adicionar o token a uma blacklist
    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no logout admin:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao realizar logout'
    });
  }
};

// Obter estatísticas do dashboard
const getDashboardStats = async (req, res) => {
  try {
    // Contar usuários por status
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Contar usuários por tipo
    const userTypeStats = await User.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Usuários dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Usuários verificados
    const verifiedUsers = await User.countDocuments({
      'isVerified.email': true,
      'isVerified.phone': true
    });

    // Formatar estatísticas
    const stats = {
      totalUsers: await User.countDocuments(),
      recentUsers,
      verifiedUsers,
      statusBreakdown: userStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      userTypeBreakdown: userTypeStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao buscar estatísticas'
    });
  }
};

// Verificar token
const verifyToken = async (req, res) => {
  try {
    // Se chegou até aqui, o token é válido (middleware já verificou)
    res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        admin: req.admin,
        isValid: true
      }
    });
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao verificar token'
    });
  }
};

module.exports = {
  adminLogin,
  getAdminProfile,
  adminLogout,
  getDashboardStats,
  verifyToken
};
