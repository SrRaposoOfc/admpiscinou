const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Método genérico para fazer requisições
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Configurações padrão
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Adicionar token de autenticação se existir
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Se a resposta não for ok, tratar erro
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro na API:', error);
      throw error;
    }
  }

  // Métodos de autenticação
  async adminLogin(username, password) {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async adminLogout() {
    return this.request('/admin/logout', {
      method: 'POST',
    });
  }

  async verifyToken() {
    return this.request('/admin/verify-token');
  }

  async getAdminProfile() {
    return this.request('/admin/profile');
  }

  // Métodos do dashboard
  async getDashboardStats() {
    return this.request('/admin/dashboard/stats');
  }

  // Métodos de usuários
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/users?${queryString}`);
  }

  async getUserById(id) {
    return this.request(`/admin/users/${id}`);
  }

  async updateUser(id, userData) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async updateUserStatus(id, status) {
    return this.request(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Métodos de relatórios
  async generateUserReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/reports/users?${queryString}`);
  }
}

// Instância única do serviço
const apiService = new ApiService();

// ===== GERENCIAMENTO AVANÇADO DE USUÁRIOS =====

// Listar todos os usuários com filtros avançados
const listAllUsers = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.userType) queryParams.append('userType', params.userType);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await fetch(`${API_BASE_URL}/user-management/users?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    throw error;
  }
};

// Obter estatísticas detalhadas dos usuários
const getUserStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-management/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    throw error;
  }
};

// Obter dados de crescimento mensal para gráficos
const getMonthlyGrowthData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-management/monthly-growth`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao obter dados de crescimento mensal:', error);
    throw error;
  }
};

// Deletar usuário específico
const deleteUserById = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-management/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    throw error;
  }
};

// Deletar múltiplos usuários
const deleteMultipleUsers = async (userIds) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-management/users`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ userIds })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao deletar múltiplos usuários:', error);
    throw error;
  }
};

// Atualizar status de usuário
const updateUserStatusById = async (userId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-management/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao atualizar status do usuário:', error);
    throw error;
  }
};

// Buscar usuário por ID
const getUserById = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-management/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    throw error;
  }
};

export default {
  ...apiService,
  
  // Novas funcionalidades de gerenciamento
  listAllUsers,
  getUserStats,
  getMonthlyGrowthData,
  deleteUserById,
  deleteMultipleUsers,
  updateUserStatusById,
  getUserById
};
