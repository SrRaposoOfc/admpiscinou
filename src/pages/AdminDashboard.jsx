import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [monthlyGrowthData, setMonthlyGrowthData] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    userType: ''
  });

  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  // Carregar estatísticas do dashboard
  useEffect(() => {
    loadDashboardStats();
  }, []);

  // Carregar usuários apenas quando estiver na aba de usuários
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, filters, pagination.currentPage]);

  // Carregar dados de crescimento mensal quando stats mudarem
  useEffect(() => {
    if (stats && stats.totalUsers > 0) {
      loadMonthlyGrowthData();
    }
  }, [stats]);

  const loadDashboardStats = async () => {
    try {
      const response = await apiService.getUserStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        pendingUsers: 0,
        inactiveUsers: 0,
        suspendedUsers: 0,
        piscineiros: 0,
        clientes: 0,
        emailVerified: 0,
        recentUsers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados de crescimento mensal do MongoDB
  const loadMonthlyGrowthData = async () => {
    try {
      console.log('📊 Carregando dados de crescimento mensal...');
      
      // Usar a nova API específica para dados de crescimento mensal
      const response = await apiService.getMonthlyGrowthData();

      if (response.success && response.data.monthlyData) {
        const monthlyData = formatMonthlyDataForChart(response.data.monthlyData);
        setMonthlyGrowthData(monthlyData);
        console.log('✅ Dados de crescimento mensal carregados:', monthlyData);
      } else {
        console.log('⚠️ Nenhum dado de crescimento mensal encontrado');
        setMonthlyGrowthData(generateDefaultMonthlyData());
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados de crescimento mensal:', error);
      setMonthlyGrowthData(generateDefaultMonthlyData());
    }
  };

  // Formatar dados da API para o formato do gráfico
  const formatMonthlyDataForChart = (apiData) => {
    return {
      labels: apiData.map(item => item.month),
      datasets: [{
        label: 'Novos Usuários',
        data: apiData.map(item => item.count),
        backgroundColor: 'rgba(20, 181, 230, 0.8)',
        borderColor: 'rgba(20, 181, 230, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false
      }]
    };
  };

  // Gerar dados padrão quando não há dados reais
  const generateDefaultMonthlyData = () => {
    const now = new Date();
    const months = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
    }

    return {
      labels: months,
      datasets: [{
        label: 'Novos Usuários',
        data: months.map(() => 0), // Todos zero quando não há dados
        backgroundColor: 'rgba(20, 181, 230, 0.8)',
        borderColor: 'rgba(20, 181, 230, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false
      }]
    };
  };

  const loadUsers = async () => {
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      };

      const response = await apiService.listAllUsers(params);
      if (response.success) {
        setUsers(response.data.users);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar usuários do MongoDB:', error);
      setUsers([]);
      setPagination(prev => ({
        ...prev,
        totalUsers: 0,
        totalPages: 1
      }));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleUserStatusChange = async (userId, newStatus) => {
    try {
      await apiService.updateUserStatusById(userId, newStatus);
      loadUsers();
      loadDashboardStats();
    } catch (error) {
      console.error('❌ Erro ao atualizar status do usuário:', error);
      alert('Erro ao atualizar status do usuário');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (confirm('Tem certeza que deseja deletar este usuário?')) {
      try {
        await apiService.deleteUserById(userId);
        loadUsers();
        loadDashboardStats();
      } catch (error) {
        console.error('❌ Erro ao deletar usuário:', error);
        alert('Erro ao deletar usuário');
      }
    }
  };

  // Dados para os gráficos
  const getChartData = () => {
    if (!stats) return null;

    const statusData = {
      labels: ['Ativos', 'Pendentes', 'Inativos', 'Suspensos'],
      datasets: [{
        data: [stats.activeUsers, stats.pendingUsers, stats.inactiveUsers, stats.suspendedUsers],
        backgroundColor: ['#14b5e6', '#f59e0b', '#dc2626', '#6b7280'],
        borderWidth: 2,
        borderColor: '#fffdf6'
      }]
    };

    const userTypeData = {
      labels: ['Piscineiros', 'Clientes'],
      datasets: [{
        data: [stats.piscineiros, stats.clientes],
        backgroundColor: ['#14b5e6', '#063e71'],
        borderWidth: 2,
        borderColor: '#fffdf6'
      }]
    };

    const verificationData = {
      labels: ['Emails Verificados', 'Emails Não Verificados'],
      datasets: [{
        data: [stats.emailVerified, stats.totalUsers - stats.emailVerified],
        backgroundColor: ['#14b5e6', '#dc2626'],
        borderWidth: 2,
        borderColor: '#fffdf6'
      }]
    };

    // Usar dados reais de crescimento mensal se disponíveis, senão usar dados padrão
    const monthlyData = monthlyGrowthData || generateDefaultMonthlyData();

    return { statusData, userTypeData, verificationData, monthlyData };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffdf6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#14b5e6] mx-auto mb-4"></div>
          <p className="text-[#063e71] text-lg font-medium">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const chartData = getChartData();

  return (
    <div className="min-h-screen bg-[#fffdf6]">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/20 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">🏊‍♂️</div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#063e71] to-[#14b5e6] bg-clip-text text-transparent">
                  Piscinou
                </h1>
                <p className="text-[#063e71] text-sm font-medium">Painel Administrativo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-[#063e71]">Bem-vindo,</p>
                <p className="font-semibold text-[#063e71]">{admin?.username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegação por Abas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-border/20 overflow-hidden">
          <div className="bg-gradient-to-r from-[#063e71] to-[#14b5e6] px-8 py-2">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'overview'
                    ? 'border-white text-white'
                    : 'border-transparent text-white/80 hover:text-white hover:border-white/60'
                }`}
              >
                📊 Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'users'
                    ? 'border-white text-white'
                    : 'border-transparent text-white/80 hover:text-white hover:border-white/60'
                }`}
              >
                👥 Gerenciar Usuários
              </button>
            </nav>
          </div>

          {/* Conteúdo das Abas */}
          <div className="p-8">
            {/* Aba Visão Geral */}
            {activeTab === 'overview' && (
              <div className="space-y-10">
                {/* Estatísticas Principais */}
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/20 hover:scale-[1.02] transition-all duration-300">
                      <div className="flex items-center">
                        <div className="text-3xl">👥</div>
                        <div className="ml-4">
                          <p className="text-sm text-[#063e71] font-medium">Total de Usuários</p>
                          <p className="text-3xl font-bold text-[#063e71]">{stats.totalUsers}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/20 hover:scale-[1.02] transition-all duration-300">
                      <div className="flex items-center">
                        <div className="text-3xl">📈</div>
                        <div className="ml-4">
                          <p className="text-sm text-[#063e71] font-medium">Novos (30 dias)</p>
                          <p className="text-3xl font-bold text-[#14b5e6]">{stats.recentUsers}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/20 hover:scale-[1.02] transition-all duration-300">
                      <div className="flex items-center">
                        <div className="text-3xl">✅</div>
                        <div className="ml-4">
                          <p className="text-sm text-[#063e71] font-medium">Emails Verificados</p>
                          <p className="text-3xl font-bold text-[#14b5e6]">{stats.emailVerified}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/20 hover:scale-[1.02] transition-all duration-300">
                      <div className="flex items-center">
                        <div className="text-3xl">🏊‍♂️</div>
                        <div className="ml-4">
                          <p className="text-sm text-[#063e71] font-medium">Piscineiros</p>
                          <p className="text-3xl font-bold text-[#14b5e6]">{stats.piscineiros}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gráficos */}
                {chartData && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Gráfico de Status */}
                    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border/20">
                      <h3 className="text-xl font-bold text-[#063e71] mb-6">Status dos Usuários</h3>
                      <div className="h-80 flex items-center justify-center">
                        <Pie data={chartData.statusData} options={{ maintainAspectRatio: false }} />
                      </div>
                    </div>

                    {/* Gráfico de Tipos */}
                    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border/20">
                      <h3 className="text-xl font-bold text-[#063e71] mb-6">Distribuição por Tipo</h3>
                      <div className="h-80 flex items-center justify-center">
                        <Doughnut data={chartData.userTypeData} options={{ maintainAspectRatio: false }} />
                      </div>
                    </div>

                    {/* Gráfico de Verificação */}
                    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border/20">
                      <h3 className="text-xl font-bold text-[#063e71] mb-6">Verificação de Email</h3>
                      <div className="h-80 flex items-center justify-center">
                        <Pie data={chartData.verificationData} options={{ maintainAspectRatio: false }} />
                      </div>
                    </div>

                    {/* Gráfico de Barras - Crescimento Mensal */}
                    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border/20">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-[#063e71]">Crescimento Mensal</h3>
                        {monthlyGrowthData && (
                          <div className="text-sm text-[#063e71]/70">
                            📊 Dados reais do MongoDB
                          </div>
                        )}
                      </div>
                      
                      {monthlyGrowthData ? (
                        <div className="h-80">
                          <Bar 
                            data={monthlyGrowthData} 
                            options={{ 
                              maintainAspectRatio: false,
                              responsive: true,
                              plugins: {
                                legend: {
                                  display: true,
                                  position: 'top',
                                  labels: {
                                    color: '#063e71',
                                    font: {
                                      size: 12,
                                      weight: 'bold'
                                    }
                                  }
                                },
                                tooltip: {
                                  backgroundColor: 'rgba(6, 62, 113, 0.9)',
                                  titleColor: '#fff',
                                  bodyColor: '#fff',
                                  borderColor: '#14b5e6',
                                  borderWidth: 1,
                                  cornerRadius: 8,
                                  displayColors: false,
                                  callbacks: {
                                    title: function(context) {
                                      return `Mês: ${context[0].label}`;
                                    },
                                    label: function(context) {
                                      const count = context.parsed.y;
                                      return `${count} novo${count !== 1 ? 's' : ''} usuário${count !== 1 ? 's' : ''}`;
                                    }
                                  }
                                }
                              },
                              scales: {
                                x: {
                                  grid: {
                                    color: 'rgba(6, 62, 113, 0.1)',
                                    drawBorder: false
                                  },
                                  ticks: {
                                    color: '#063e71',
                                    font: {
                                      size: 11,
                                      weight: '500'
                                    }
                                  }
                                },
                                y: {
                                  beginAtZero: true,
                                  grid: {
                                    color: 'rgba(6, 62, 113, 0.1)',
                                    drawBorder: false
                                  },
                                  ticks: {
                                    color: '#063e71',
                                    font: {
                                      size: 11,
                                      weight: '500'
                                    },
                                    callback: function(value) {
                                      return value === 0 ? '0' : value;
                                    }
                                  }
                                }
                              }
                            }} 
                          />
                        </div>
                      ) : (
                        <div className="h-80 flex items-center justify-center">
                          <div className="text-center text-[#063e71]/60">
                            <div className="text-4xl mb-2">📊</div>
                            <p className="text-sm">Carregando dados de crescimento...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Estatísticas do crescimento */}
                      {monthlyGrowthData && (
                        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                          <div className="bg-[#f5f4f0] rounded-lg p-3">
                            <p className="text-xs text-[#063e71]/70">Total 12 meses</p>
                            <p className="text-lg font-bold text-[#063e71]">
                              {monthlyGrowthData.datasets[0].data.reduce((a, b) => a + b, 0)}
                            </p>
                          </div>
                          <div className="bg-[#f5f4f0] rounded-lg p-3">
                            <p className="text-xs text-[#063e71]/70">Média mensal</p>
                            <p className="text-lg font-bold text-[#14b5e6]">
                              {Math.round(monthlyGrowthData.datasets[0].data.reduce((a, b) => a + b, 0) / 12 * 10) / 10}
                            </p>
                          </div>
                          <div className="bg-[#f5f4f0] rounded-lg p-3">
                            <p className="text-xs text-[#063e71]/70">Mês atual</p>
                            <p className="text-lg font-bold text-[#14b5e6]">
                              {monthlyGrowthData.datasets[0].data[monthlyGrowthData.datasets[0].data.length - 1] || 0}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Aba Usuários */}
            {activeTab === 'users' && (
              <div className="space-y-8">
                {/* Filtros */}
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border/20">
                  <h2 className="text-2xl font-bold text-[#063e71] mb-6">Filtros de Busca</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <input
                      type="text"
                      placeholder="Buscar por nome, email, telefone ou CPF..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="px-6 py-4 border border-border/20 rounded-xl focus:ring-2 focus:ring-[#14b5e6] focus:border-transparent text-[#063e71] placeholder-[#063e71]/60 font-medium bg-white/50 backdrop-blur-sm"
                    />
                    
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="px-6 py-4 border border-border/20 rounded-xl focus:ring-2 focus:ring-[#14b5e6] focus:border-transparent text-[#063e71] font-medium bg-white/50 backdrop-blur-sm"
                    >
                      <option value="">Todos os status</option>
                      <option value="active">Ativo</option>
                      <option value="pending">Pendente</option>
                      <option value="inactive">Inativo</option>
                      <option value="suspended">Suspenso</option>
                    </select>

                    <select
                      value={filters.userType}
                      onChange={(e) => handleFilterChange('userType', e.target.value)}
                      className="px-6 py-4 border border-border/20 rounded-xl focus:ring-2 focus:ring-[#14b5e6] focus:border-transparent text-[#063e71] font-medium bg-white/50 backdrop-blur-sm"
                    >
                      <option value="">Todos os tipos</option>
                      <option value="cliente">Cliente</option>
                      <option value="piscineiro">Piscineiro</option>
                    </select>
                  </div>
                </div>

                {/* Lista de Usuários */}
                <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-border/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#063e71] to-[#14b5e6] px-8 py-6">
                    <h2 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#f5f4f0]">
                        <tr>
                          <th className="px-8 py-4 text-left text-sm font-bold text-[#063e71] uppercase tracking-wider">Usuário</th>
                          <th className="px-8 py-4 text-left text-sm font-bold text-[#063e71] uppercase tracking-wider">Tipo</th>
                          <th className="px-8 py-4 text-left text-sm font-bold text-[#063e71] uppercase tracking-wider">Status</th>
                          <th className="px-8 py-4 text-left text-sm font-bold text-[#063e71] uppercase tracking-wider">Verificação</th>
                          <th className="px-8 py-4 text-left text-sm font-bold text-[#063e71] uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/50 divide-y divide-border/20">
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-8 py-16 text-center">
                              <div className="text-[#063e71]">
                                <div className="text-6xl mb-6">👥</div>
                                <p className="text-xl font-bold mb-3">Nenhum usuário encontrado</p>
                                <p className="text-lg">
                                  {loading ? 'Carregando usuários...' : 'Conecte ao MongoDB para gerenciar usuários reais'}
                                </p>
                                {!loading && (
                                  <div className="mt-6 p-4 bg-[#f5f4f0] rounded-xl border border-border/20">
                                    <p className="text-[#063e71]">
                                      💡 <strong>Dica:</strong> Execute o backend com MongoDB para ver usuários reais
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr key={user._id} className="hover:bg-[#f5f4f0] transition-colors duration-200">
                              <td className="px-8 py-6 whitespace-nowrap">
                                <div>
                                  <div className="text-lg font-bold text-[#063e71]">{user.name}</div>
                                  <div className="text-[#14b5e6]">{user.email}</div>
                                  <div className="text-sm text-[#063e71]/70">
                                    CPF: {user.cpf}
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${
                                  user.userType === 'cliente' 
                                    ? 'bg-[#063e71] text-white' 
                                    : 'bg-[#14b5e6] text-white'
                                }`}>
                                  {user.userType === 'piscineiro' ? '🏊 Piscineiro' : '👤 Cliente'}
                                </span>
                                {user.userType === 'piscineiro' && user.isAvailable !== undefined && (
                                  <div className="text-sm text-[#063e71] mt-2">
                                    {user.isAvailable === true ? '🟢 Disponível' : '🔴 Indisponível'}
                                  </div>
                                )}
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                <select
                                  value={user.status}
                                  onChange={(e) => handleUserStatusChange(user._id, e.target.value)}
                                  className="text-sm border border-border/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#14b5e6] focus:border-transparent bg-white/50"
                                >
                                  <option value="active">Ativo</option>
                                  <option value="pending">Pendente</option>
                                  <option value="inactive">Inativo</option>
                                  <option value="suspended">Suspenso</option>
                                </select>
                                {user.kycStatus && (
                                  <div className="text-sm text-[#063e71] mt-2">
                                    KYC: <span className={user.kycStatus === 'approved' ? 'text-[#14b5e6]' : 'text-[#f59e0b]'}>
                                      {user.kycStatus === 'approved' ? '✅ Aprovado' : '⏳ Pendente'}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                <div className="flex space-x-3">
                                  <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-bold ${
                                    user.isVerified?.email 
                                      ? 'bg-[#14b5e6] text-white' 
                                      : 'bg-[#dc2626] text-white'
                                  }`}>
                                    {user.isVerified?.email ? '✅' : '❌'} Email
                                  </span>
                                </div>
                                {user.loginAttempts > 0 && (
                                  <div className="text-sm text-[#f59e0b] mt-2 font-medium">
                                    Tentativas: {user.loginAttempts}
                                  </div>
                                )}
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleDeleteUser(user._id)}
                                  className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium hover:scale-[1.02]"
                                >
                                  Deletar
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação */}
                  {pagination.totalPages > 1 && (
                    <div className="px-8 py-6 border-t border-border/20 bg-[#f5f4f0]">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-[#063e71] font-medium">
                          Mostrando {((pagination.currentPage - 1) * pagination.limit) + 1} a{' '}
                          {Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)} de{' '}
                          {pagination.totalUsers} usuários
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={!pagination.hasPrevPage}
                            className="px-4 py-2 border border-border/20 rounded-lg text-sm font-medium text-[#063e71] hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            Anterior
                          </button>
                          <span className="px-4 py-2 text-sm font-bold text-[#063e71]">
                            Página {pagination.currentPage} de {pagination.totalPages}
                          </span>
                          <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            className="px-4 py-2 border border-border/20 rounded-lg text-sm font-medium text-[#063e71] hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            Próxima
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
