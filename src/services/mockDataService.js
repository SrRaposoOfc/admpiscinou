// Dados mockados para o dashboard (em produção viriam do MongoDB)
const mockUsers = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    cpf: '123.456.789-00',
    userType: 'cliente',
    status: 'ativo',
    isVerified: { email: true, phone: true },
    profile: {
      avatar: '👤',
      bio: 'Cliente interessado em serviços de piscina',
      address: {
        street: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      }
    },
    createdAt: '2024-01-15T10:00:00.000Z',
    lastActivity: '2024-01-20T14:30:00.000Z'
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@email.com',
    phone: '(11) 88888-8888',
    cpf: '987.654.321-00',
    userType: 'piscineiro',
    status: 'ativo',
    isVerified: { email: true, phone: true },
    profile: {
      avatar: '👷‍♀️',
      bio: 'Profissional especializado em limpeza de piscinas',
      address: {
        street: 'Av. Principal, 456',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04567-890'
      }
    },
    createdAt: '2024-01-10T09:00:00.000Z',
    lastActivity: '2024-01-20T16:45:00.000Z'
  },
  {
    id: '3',
    name: 'Pedro Costa',
    email: 'pedro@email.com',
    phone: '(11) 77777-7777',
    cpf: '111.222.333-44',
    userType: 'cliente',
    status: 'pendente',
    isVerified: { email: false, phone: false },
    profile: {
      avatar: '👤',
      bio: 'Novo cliente',
      address: {
        street: 'Rua Nova, 789',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '07890-123'
      }
    },
    createdAt: '2024-01-18T11:00:00.000Z',
    lastActivity: '2024-01-18T11:00:00.000Z'
  },
  {
    id: '4',
    name: 'Ana Oliveira',
    email: 'ana@email.com',
    phone: '(11) 66666-6666',
    cpf: '555.666.777-88',
    userType: 'piscineiro',
    status: 'inativo',
    isVerified: { email: true, phone: true },
    profile: {
      avatar: '👷‍♀️',
      bio: 'Profissional inativo',
      address: {
        street: 'Rua Antiga, 321',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '03210-987'
      }
    },
    createdAt: '2024-01-05T08:00:00.000Z',
    lastActivity: '2024-01-15T12:00:00.000Z'
  }
];

class MockDataService {
  constructor() {
    this.users = [...mockUsers];
  }

  // Simular delay de rede
  async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Obter estatísticas do dashboard
  async getDashboardStats() {
    await this.delay();
    
    const totalUsers = this.users.length;
    const activeUsers = this.users.filter(u => u.status === 'ativo').length;
    const pendingUsers = this.users.filter(u => u.status === 'pendente').length;
    const clients = this.users.filter(u => u.userType === 'cliente').length;
    const professionals = this.users.filter(u => u.userType === 'piscineiro').length;
    
    return {
      success: true,
      data: {
        totalUsers,
        activeUsers,
        pendingUsers,
        inactiveUsers: totalUsers - activeUsers - pendingUsers,
        clients,
        professionals,
        verifiedUsers: this.users.filter(u => u.isVerified.email && u.isVerified.phone).length,
        recentActivity: this.users
          .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
          .slice(0, 5)
      }
    };
  }

  // Obter usuários com paginação e filtros
  async getUsers(params = {}) {
    await this.delay();
    
    let filteredUsers = [...this.users];
    const { search, status, userType, page = 1, limit = 10 } = params;
    
    // Aplicar filtros
    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.phone.includes(search) ||
        user.cpf.includes(search)
      );
    }
    
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    
    if (userType) {
      filteredUsers = filteredUsers.filter(user => user.userType === userType);
    }
    
    // Calcular paginação
    const totalUsers = filteredUsers.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          limit
        }
      }
    };
  }

  // Obter usuário por ID
  async getUserById(id) {
    await this.delay();
    
    const user = this.users.find(u => u.id === id);
    
    if (!user) {
      return {
        success: false,
        message: 'Usuário não encontrado'
      };
    }
    
    return {
      success: true,
      data: user
    };
  }

  // Atualizar usuário
  async updateUser(id, userData) {
    await this.delay();
    
    const userIndex = this.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return {
        success: false,
        message: 'Usuário não encontrado'
      };
    }
    
    this.users[userIndex] = { ...this.users[userIndex], ...userData };
    
    return {
      success: true,
      data: this.users[userIndex]
    };
  }

  // Deletar usuário
  async deleteUser(id) {
    await this.delay();
    
    const userIndex = this.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return {
        success: false,
        message: 'Usuário não encontrado'
      };
    }
    
    this.users.splice(userIndex, 1);
    
    return {
      success: true,
      message: 'Usuário deletado com sucesso'
    };
  }

  // Atualizar status do usuário
  async updateUserStatus(id, status) {
    await this.delay();
    
    const user = this.users.find(u => u.id === id);
    
    if (!user) {
      return {
        success: false,
        message: 'Usuário não encontrado'
      };
    }
    
    user.status = status;
    
    return {
      success: true,
      data: user
    };
  }

  // Gerar relatório de usuários
  async generateUserReport(params = {}) {
    await this.delay();
    
    const { startDate, endDate, userType, status } = params;
    
    let filteredUsers = [...this.users];
    
    if (startDate && endDate) {
      filteredUsers = filteredUsers.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate >= new Date(startDate) && userDate <= new Date(endDate);
      });
    }
    
    if (userType) {
      filteredUsers = filteredUsers.filter(user => user.userType === userType);
    }
    
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    
    return {
      success: true,
      data: {
        users: filteredUsers,
        total: filteredUsers.length,
        summary: {
          clients: filteredUsers.filter(u => u.userType === 'cliente').length,
          professionals: filteredUsers.filter(u => u.userType === 'piscineiro').length,
          active: filteredUsers.filter(u => u.status === 'ativo').length,
          pending: filteredUsers.filter(u => u.status === 'pendente').length,
          inactive: filteredUsers.filter(u => u.status === 'inativo').length
        }
      }
    };
  }
}

export default new MockDataService();
