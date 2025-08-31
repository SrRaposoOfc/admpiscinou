const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rotas públicas de usuários (se necessário no futuro)
router.get('/public', (req, res) => {
  res.json({
    message: 'API de usuários pública',
    timestamp: new Date().toISOString()
  });
});

// Rotas protegidas de usuários (requerem autenticação)
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/status', userController.updateUserStatus);
router.get('/reports/users', userController.generateUserReport);

module.exports = router;
