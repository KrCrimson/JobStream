import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TurnosPage } from './pages/TurnosPage';
import { AreasPage } from './pages/AreasPage';
import { TrabajadoresPage } from './pages/TrabajadoresPage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';
import { DisplayPage } from './pages/DisplayPage';
import { KioscoPage } from './pages/KioscoPage';
import { WorkerDashboardPage } from './pages/WorkerDashboardPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/display" element={<DisplayPage />} />
            <Route path="/kiosco" element={<KioscoPage />} />
            <Route path="/trabajador" element={
              <ProtectedRoute>
                <WorkerDashboardPage />
              </ProtectedRoute>
            } />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="turnos" element={<TurnosPage />} />
              <Route path="areas" element={<AreasPage />} />
              <Route path="trabajadores" element={<TrabajadoresPage />} />
              <Route path="configuracion" element={<ConfiguracionPage />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
