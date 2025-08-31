const localAuthService = require('../../src/services/localAuthService');

const localAdminAuth = async (req, res, next) => {
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

    // Verificar o token local
    const response = await localAuthService.verifyToken(token);
    
    if (!response.success) {
      return res.status(401).json({
        error: 'Acesso negado',
        message: 'Token de autenticação inválido'
      });
    }

    // Adicionar informações do admin ao request
    req.admin = response.data.admin;
    req.adminId = response.data.admin.username; // Usar username como ID
    req.adminRole = response.data.admin.role;
    req.adminPermissions = response.data.admin.permissions;

    next();
  } catch (error) {
    console.error('❌ Erro na autenticação admin local:', error);
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
  localAdminAuth,
  requirePermission,
  requireRole
};
