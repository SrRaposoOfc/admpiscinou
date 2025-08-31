import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(null);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const showErrorAlert = (message, isBlockedError = false, remainingTime = null) => {
    setErrorMessage(message);
    setShowError(true);
    
    if (isBlockedError) {
      setIsBlocked(true);
      setBlockedUntil(remainingTime);
    }
    
    // Auto-hide após 5 segundos (exceto para bloqueios)
    if (!isBlockedError) {
      setTimeout(() => {
        setShowError(false);
        setErrorMessage('');
      }, 5000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      showErrorAlert('Por favor, preencha todos os campos');
      return;
    }

    if (isBlocked) {
      showErrorAlert('Seu IP está bloqueado. Aguarde o tempo de bloqueio expirar.');
      return;
    }

    setIsLoading(true);
    console.log('🚀 Iniciando login via HTTP...');
    
    try {
      const result = await login(username, password);
      
      if (result.success) {
        console.log('✅ Login HTTP realizado com sucesso!');
        navigate('/admin/dashboard');
      } else {
        console.log('❌ Erro no login HTTP:', result.error);
        
        // Verificar se é um erro de bloqueio
        if (result.blocked) {
          showErrorAlert(result.error, true, result.remainingTime);
        } else {
          // Atualizar tentativas restantes
          if (result.remainingAttempts !== undefined) {
            setRemainingAttempts(result.remainingAttempts);
          }
          showErrorAlert(result.error || 'Usuário ou senha incorretos');
        }
      }
    } catch (error) {
      console.log('❌ Erro na requisição HTTP:', error);
      showErrorAlert('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏊‍♂️</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#063e71] to-[#14b5e6] bg-clip-text text-transparent mb-2">
            Piscinou
          </h1>
          <p className="text-[#063e71] text-lg font-medium">
            Painel Administrativo
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-border/20">
          {/* Alerta de Erro */}
          {showError && (
            <div className={`mb-6 p-4 rounded-xl shadow-sm ${
              isBlocked 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className={`text-lg ${isBlocked ? 'text-red-500' : 'text-red-500'}`}>
                    {isBlocked ? '🚫' : '⚠️'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    isBlocked ? 'text-red-700' : 'text-red-700'
                  }`}>
                    {errorMessage}
                  </p>
                  {isBlocked && blockedUntil && (
                    <p className="text-xs text-red-600 mt-1">
                      ⏰ Bloqueado até: {new Date(blockedUntil * 1000).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
                {!isBlocked && (
                  <div className="ml-auto pl-3">
                    <button
                      onClick={() => setShowError(false)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <span className="text-lg">×</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status de Tentativas */}
          {!isBlocked && remainingAttempts < 3 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center">
                <span className="text-amber-500 text-lg mr-2">⚠️</span>
                <p className="text-sm text-amber-700">
                  <strong>Tentativas restantes:</strong> {remainingAttempts}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#063e71] mb-2">
                Usuário
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-border/20 rounded-xl focus:ring-2 focus:ring-[#14b5e6] focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm text-[#063e71] placeholder-[#063e71]/60"
                  placeholder="Digite seu usuário"
                  required
                  disabled={isBlocked}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-[#063e71]/60">👤</span>
                </div>
              </div>
            </div>

            {/* Campo Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#063e71] mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-border/20 rounded-xl focus:ring-2 focus:ring-[#14b5e6] focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm pr-12 text-[#063e71] placeholder-[#063e71]/60"
                  placeholder="Digite sua senha"
                  required
                  disabled={isBlocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#063e71]/60 hover:text-[#063e71] transition-colors duration-200"
                  disabled={isBlocked}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={isLoading || isBlocked}
              className="w-full bg-gradient-to-r from-[#063e71] to-[#14b5e6] hover:from-[#14b5e6] hover:to-[#063e71] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Entrando...
                </div>
              ) : isBlocked ? (
                'IP Bloqueado'
              ) : (
                'Entrar no Painel'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-8 text-[#063e71]/60 text-sm">
            <p>© 2024 Piscinou. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
