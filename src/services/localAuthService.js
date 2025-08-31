import adminConfig from '../config/admins.json';

class LocalAuthService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api/admin';
    this.currentAdmin = null;
  }

  // Login via HTTP
  async login(username, password) {
    try {
      console.log('🔍 Tentando login para:', username);
      
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Login realizado com sucesso');
        
        // Salvar no localStorage
        this.saveAdminToStorage(data.data.admin, data.data.token);
        
        return {
          success: true,
          data: data.data
        };
      } else {
        console.log('❌ Erro no login:', data.message);
        throw new Error(data.message || 'Erro no login');
      }
    } catch (error) {
      console.log('❌ Erro na requisição:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Verificar token via HTTP
  async verifyToken(token) {
    try {
      if (!token) {
        throw new Error('Token não fornecido');
      }

      const response = await fetch(`${this.baseURL}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Token inválido');
      }
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Logout
  async logout() {
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      this.currentAdmin = null;
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Obter perfil do admin
  async getAdminProfile() {
    try {
      const adminData = localStorage.getItem('adminData');
      
      if (!adminData) {
        throw new Error('Admin não autenticado');
      }

      const admin = JSON.parse(adminData);
      
      return {
        success: true,
        data: {
          username: admin.username,
          name: admin.name || admin.username,
          email: admin.email || '',
          role: admin.role,
          permissions: admin.permissions
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Verificar se está autenticado
  isAuthenticated() {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    return !!(token && adminData);
  }

  // Obter admin atual
  getCurrentAdmin() {
    const adminData = localStorage.getItem('adminData');
    return adminData ? JSON.parse(adminData) : null;
  }

  // Salvar admin no localStorage
  saveAdminToStorage(admin, token) {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminData', JSON.stringify(admin));
  }
}

export default new LocalAuthService();
