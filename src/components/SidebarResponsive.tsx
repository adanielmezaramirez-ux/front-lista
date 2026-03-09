import React from 'react';
import { Nav, Image } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HouseDoor, 
  People, 
  Book, 
  CalendarCheck, 
  BarChartLine,
  PersonBadge,
  DoorOpen,
  X,
  Shield,
  PersonVcard,
  Calendar
} from 'react-bootstrap-icons';

interface SidebarResponsiveProps {
  isOpen: boolean;
  onClose: () => void;
}

const SidebarResponsive: React.FC<SidebarResponsiveProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout, currentView } = useAuth();

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    handleLinkClick();
  };

  const isActiveRoute = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const getRoleText = () => {
    if (currentView === 'admin') return 'Administrador';
    if (currentView === 'maestro') return 'Maestro';
    return 'Usuario';
  };

  const getRoleIcon = () => {
    if (currentView === 'admin') return <Shield className="me-1" size={14} />;
    if (currentView === 'maestro') return <PersonVcard className="me-1" size={14} />;
    return null;
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`} 
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <button 
          className="sidebar-close-btn d-md-none"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X size={24} />
        </button>

        <div className="text-white p-3">
          <div className="text-center mb-4">
            <div className="mb-3">
              <Image 
                src="/vite.svg" 
                alt="Logo" 
                width="80" 
                height="80"
                className="bg-white p-3 rounded-circle"
              />
            </div>
            <h5 className="mb-1">{user?.firstname} {user?.lastname}</h5>
            <small className="text-white-50 d-block mb-2">@{user?.username}</small>
            <span className={`badge bg-${currentView === 'admin' ? 'danger' : 'warning'} d-inline-flex align-items-center`}>
              {getRoleIcon()}
              {getRoleText()}
            </span>
          </div>

          <Nav className="flex-column">
            <Nav.Link 
              as={Link} 
              to="/dashboard" 
              className={isActiveRoute('/dashboard') ? 'active' : ''}
              onClick={handleLinkClick}
            >
              <HouseDoor className="me-2" /> Dashboard
            </Nav.Link>

            {currentView === 'admin' && (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/admin/users" 
                  className={isActiveRoute('/admin/users') ? 'active' : ''}
                  onClick={handleLinkClick}
                >
                  <People className="me-2" /> Usuarios
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/admin/classes" 
                  className={isActiveRoute('/admin/classes') ? 'active' : ''}
                  onClick={handleLinkClick}
                >
                  <Book className="me-2" /> Clases
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/admin/reportes" 
                  className={isActiveRoute('/admin/reportes') ? 'active' : ''}
                  onClick={handleLinkClick}
                >
                  <BarChartLine className="me-2" /> Reportes
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/admin/reprogramaciones" 
                  className={isActiveRoute('/admin/reprogramaciones') ? 'active' : ''}
                  onClick={handleLinkClick}
                >
                  <Calendar className="me-2" /> Reprogramaciones
                </Nav.Link>
              </>
            )}

            {currentView === 'maestro' && (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/maestro/clases" 
                  className={isActiveRoute('/maestro/clases') ? 'active' : ''}
                  onClick={handleLinkClick}
                >
                  <Book className="me-2" /> Mis Clases
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/maestro/asistencias"
                  className={isActiveRoute('/maestro/asistencias') ? 'active' : ''}
                  onClick={handleLinkClick}
                >
                  <CalendarCheck className="me-2" /> Gestionar Asistencias
                </Nav.Link>
              </>
            )}

            <Nav.Link 
              as={Link} 
              to="/perfil" 
              className={isActiveRoute('/perfil') ? 'active' : ''}
              onClick={handleLinkClick}
            >
              <PersonBadge className="me-2" /> Mi Perfil
            </Nav.Link>

            <Nav.Link 
              onClick={handleLogout} 
              className="text-danger mt-3"
            >
              <DoorOpen className="me-2" /> Cerrar Sesión
            </Nav.Link>
          </Nav>

          <div className="text-center mt-4 pt-3 border-top border-white-50">
            <small className="text-white-50">
              © 2026 Hanxue School Educación Intercultural
            </small>
            <br />
            <small className="text-white-50">
              Listas Hanxue - Versión 1.0.0
            </small>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarResponsive;