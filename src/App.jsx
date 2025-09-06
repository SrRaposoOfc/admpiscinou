import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Footer from './components/Footer';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen flex flex-col">
          <main className="flex-1">
            <Routes>
              {/* Rota padrão - redirecionar para login admin */}
              <Route path="/" element={<Navigate to="/admin/login" replace />} />
              
              {/* Rota de login admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Rota do dashboard admin (protegida) */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                } 
              />
              
              {/* Rota 404 - redirecionar para login */}
              <Route path="*" element={<Navigate to="/admin/login" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
