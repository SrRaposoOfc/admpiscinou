import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
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
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
