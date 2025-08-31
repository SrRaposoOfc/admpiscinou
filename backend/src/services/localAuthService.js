const fs = require('fs');
const path = require('path');

// Carregar configuração de admins
const loadAdminConfig = () => {
  try {
    const configPath = path.join(__dirname, '../../../src/config/admins.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('❌ Erro ao carregar config de admins:', error);
    return [];
  }
};

class LocalAuthService {
  constructor() {
    this.admins = loadAdminConfig();
  }

  // Verificar senha
  verifyPassword(inputPassword, storedPassword) {
    // Comparar diretamente as senhas (em produção usar bcrypt.compare)
    return inputPassword === storedPassword;
  }

  // Verificar token
  async verifyToken(token) {
    try {
      if (!token) {
        throw new Error('Token não fornecido');
      }

      // Decodificar token
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Verificar se o admin ainda existe
      const admin = this.admins.find(a => a.username === payload.username);
      
      if (!admin) {
        throw new Error('Admin não encontrado');
      }

      // Verificar se o token não expirou (24 horas)
      const tokenAge = Date.now() - payload.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      
      if (tokenAge > maxAge) {
        throw new Error('Token expirado');
      }

      return {
        success: true,
        data: {
          admin: {
            username: admin.username,
            name: admin.profile?.fullName || admin.username,
            email: admin.profile?.email || '',
            role: admin.role,
            permissions: admin.permissions
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Login local
  async login(username, password) {
    try {
      const admin = this.admins.find(admin => admin.username === username);
      
      if (!admin) {
        throw new Error('Usuário não encontrado');
      }
      
      if (!this.verifyPassword(password, admin.password)) {
        throw new Error('Senha incorreta');
      }

      // Criar token simples
      const token = this.generateToken(admin);
      
      return {
        success: true,
        data: {
          admin: {
            username: admin.username,
            name: admin.profile?.fullName || admin.username,
            email: admin.profile?.email || '',
            role: admin.role,
            permissions: admin.permissions
          },
          token
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Gerar token simples
  generateToken(admin) {
    const payload = {
      username: admin.username,
      role: admin.role,
      timestamp: Date.now()
    };
    
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
}

module.exports = new LocalAuthService();
