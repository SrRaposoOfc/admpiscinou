const express = require('express');
const router = express.Router();
const {
  checkAdminPermissions,
  listAllUsers,
  getUserStats,
  getMonthlyGrowthData,
  deleteUser,
  deleteMultipleUsers,
  updateUserStatus,
  getUserById
} = require('../controllers/userManagementController');

// Middleware para verificar autenticação de admin local
const { localAdminAuth } = require('../middleware/localAdminAuth');

// Aplicar autenticação em todas as rotas
router.use(localAdminAuth);

// Aplicar verificação de permissões em todas as rotas
router.use(checkAdminPermissions);

// Rota para listar todos os usuários com filtros avançados
// GET /api/user-management/users
// Query params: page, limit, search, status, userType, sortBy, sortOrder
router.get('/users', listAllUsers);

// Rota para obter estatísticas detalhadas dos usuários
// GET /api/user-management/stats
router.get('/stats', getUserStats);

// Rota para obter dados de crescimento mensal para gráficos
// GET /api/user-management/monthly-growth
router.get('/monthly-growth', getMonthlyGrowthData);

// Rota para buscar usuário específico por ID
// GET /api/user-management/users/:userId
router.get('/users/:userId', getUserById);

// Rota para deletar usuário específico
// DELETE /api/user-management/users/:userId
router.delete('/users/:userId', deleteUser);

// Rota para deletar múltiplos usuários
// DELETE /api/user-management/users
// Body: { userIds: ['id1', 'id2', 'id3'] }
router.delete('/users', deleteMultipleUsers);

// Rota para atualizar status de usuário
// PATCH /api/user-management/users/:userId/status
// Body: { status: 'ativo' | 'pendente' | 'inativo' | 'suspenso' }
router.patch('/users/:userId/status', updateUserStatus);

module.exports = router;
