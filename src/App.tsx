import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/admin/Users';
import AdminClasses from './pages/admin/AdminClasses';
import Reportes from './pages/admin/Reportes';
import AdminReprogramaciones from './pages/admin/Reprogramaciones';
import MaestroClases from './pages/maestro/MaestroClases';
import MaestroAsistencias from './pages/maestro/MaestroAsistencias';
import SelectorAsistencias from './pages/maestro/SelectorAsistencias';
import Perfil from './pages/Perfil';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ViewSelector from './components/ViewSelector';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, currentView } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!currentView) {
    return <ViewSelector />;
  }

  return <Layout>{children}</Layout>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentView, isAdmin } = useAuth();
  
  if (currentView !== 'admin' || !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const MaestroRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentView, isMaestro } = useAuth();
  
  if (currentView !== 'maestro' || !isMaestro) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { currentView, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {currentView && <ViewSelector />}
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

        {currentView === 'admin' && (
          <>
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

            <Route path="/admin/reprogramaciones" element={
              <PrivateRoute>
                <AdminRoute>
                  <AdminReprogramaciones />
                </AdminRoute>
              </PrivateRoute>
            } />
          </>
        )}

        {currentView === 'maestro' && (
          <>
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
          </>
        )}

        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
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