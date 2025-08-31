const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const adminAuth = async (req, res, next) => {
  try {
    // Verificar se o token está presente no header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Acesso negado',
        message: 'Token de autenticação não fornecido'
      });
    }

    // Extrair o token
    const token = authHeader.substring(7); // Remove "Bearer "

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar o admin no banco
    const admin = await Admin.findById(decoded.adminId).select('-password');
    
    if (!admin) {
      return res.status(401).json({
        error: 'Acesso negado',
        message: 'Admin não encontrado'
      });
    }

    // Verificar se o admin está ativo
    if (!admin.isActive) {
      return res.status(401).json({
        error: 'Acesso negado',
        message: 'Conta de admin desativada'
      });
    }

    // Adicionar informações do admin ao request
    req.admin = admin;
    req.adminId = admin._id;
    req.adminRole = admin.role;
    req.adminPermissions = admin.permissions;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'Token de autenticação inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Token de autenticação expirado'
      });
    }

    console.error('❌ Erro na autenticação admin:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao verificar autenticação'
    });
  }
};

// Middleware para verificar permissões específicas
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.adminPermissions || !req.adminPermissions[permission]) {
      return res.status(403).json({
        error: 'Permissão negada',
        message: `Você não tem permissão para acessar ${permission}`
      });
    }
    next();
  };
};

// Middleware para verificar role específica
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!allowedRoles.includes(req.adminRole)) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar este recurso'
      });
    }
    next();
  };
};

module.exports = {
  adminAuth,
  requirePermission,
  requireRole
};
