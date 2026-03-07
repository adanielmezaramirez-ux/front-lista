import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/admin/Users';
import AdminClasses from './pages/admin/AdminClasses';
import Reportes from './pages/admin/Reportes';
import MaestroClases from './pages/maestro/MaestroClases';
import MaestroAsistencias from './pages/maestro/MaestroAsistencias';
import SelectorAsistencias from './pages/maestro/SelectorAsistencias';
import Perfil from './pages/Perfil';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const MaestroRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMaestro } = useAuth();
  
  if (!isMaestro) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />

      <Route path="/perfil" element={
        <PrivateRoute>
          <Perfil />
        </PrivateRoute>
      } />

      {/* Rutas de Admin */}
      <Route path="/admin/users" element={
        <PrivateRoute>
          <AdminRoute>
            <Users />
          </AdminRoute>
        </PrivateRoute>
      } />

      <Route path="/admin/classes" element={
        <PrivateRoute>
          <AdminRoute>
            <AdminClasses />
          </AdminRoute>
        </PrivateRoute>
      } />

      <Route path="/admin/reportes" element={
        <PrivateRoute>
          <AdminRoute>
            <Reportes />
          </AdminRoute>
        </PrivateRoute>
      } />

      {/* Rutas de Maestro */}
      <Route path="/maestro/clases" element={
        <PrivateRoute>
          <MaestroRoute>
            <MaestroClases />
          </MaestroRoute>
        </PrivateRoute>
      } />

      <Route path="/maestro/clases/:claseId" element={
        <PrivateRoute>
          <MaestroRoute>
            <MaestroAsistencias />
          </MaestroRoute>
        </PrivateRoute>
      } />

      {/* Ruta para el selector de asistencias (NUEVA) */}
      <Route path="/maestro/asistencias" element={
        <PrivateRoute>
          <MaestroRoute>
            <SelectorAsistencias />
          </MaestroRoute>
        </PrivateRoute>
      } />

      <Route path="/maestro/asistencias/:claseId" element={
        <PrivateRoute>
          <MaestroRoute>
            <MaestroAsistencias />
          </MaestroRoute>
        </PrivateRoute>
      } />

      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;