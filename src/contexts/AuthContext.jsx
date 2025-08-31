import React, { createContext, useContext, useState, useEffect } from 'react';
import localAuthService from '../services/localAuthService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar token ao inicializar
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await localAuthService.verifyToken(token);
          if (response.success) {
            setAdmin(response.data.admin);
            setError(null);
          } else {
            // Token inválido, limpar dados
            logout();
          }
        } catch (error) {
          console.error('❌ Erro ao verificar token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Login
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await localAuthService.login(username, password);
      
      if (response.success) {
        const { admin: adminData, token: newToken } = response.data;
        
        // Atualizar estado
        setToken(newToken);
        setAdmin(adminData);
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Erro no login');
      }
    } catch (error) {
      const errorMessage = error.message || 'Erro ao fazer login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await localAuthService.logout();
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      // Limpar dados locais
      setToken(null);
      setAdmin(null);
      setError(null);
    }
  };

  // Atualizar perfil do admin
  const updateProfile = async () => {
    try {
      const response = await localAuthService.getAdminProfile();
      if (response.success) {
        setAdmin(response.data);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
    }
  };

  // Verificar se está autenticado
  const isAuthenticated = () => {
    return localAuthService.isAuthenticated();
  };

  // Verificar permissões
  const hasPermission = (permission) => {
    return admin?.permissions?.[permission] || false;
  };

  // Verificar role
  const hasRole = (role) => {
    return admin?.role === role;
  };

  const value = {
    admin,
    token,
    loading,
    error,
    login,
    logout,
    updateProfile,
    isAuthenticated,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
