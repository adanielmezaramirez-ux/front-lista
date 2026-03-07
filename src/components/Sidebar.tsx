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
  DoorOpen
} from 'react-bootstrap-icons';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout, isAdmin, isMaestro } = useAuth();

  return (
    <div className="sidebar text-white p-3">
      <div className="text-center mb-4">
        <div className="mb-3">
          <Image 
            src="/vite.svg" 
            alt="Logo" 
            width="60" 
            height="60"
            className="bg-white p-2 rounded-circle"
          />
        </div>
        <h5 className="mb-1">{user?.firstname} {user?.lastname}</h5>
        <small className="text-white-50 d-block mb-2">@{user?.username}</small>
        <span className="badge bg-info">
          {isAdmin ? 'Administrador' : isMaestro ? 'Maestro' : 'Usuario'}
        </span>
      </div>

      <Nav className="flex-column">
        <Nav.Link 
          as={Link} 
          to="/dashboard" 
          className={location.pathname === '/dashboard' ? 'active' : ''}
        >
          <HouseDoor className="me-2" /> Dashboard
        </Nav.Link>

        {isAdmin && (
          <>
            <Nav.Link 
              as={Link} 
              to="/admin/users" 
              className={location.pathname.includes('/admin/users') ? 'active' : ''}
            >
              <People className="me-2" /> Usuarios
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/admin/classes" 
              className={location.pathname.includes('/admin/classes') ? 'active' : ''}
            >
              <Book className="me-2" /> Clases
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/admin/reportes" 
              className={location.pathname.includes('/admin/reportes') ? 'active' : ''}
            >
              <BarChartLine className="me-2" /> Reportes
            </Nav.Link>
          </>
        )}

        {isMaestro && (
          <>
            <Nav.Link 
              as={Link} 
              to="/maestro/clases" 
              className={location.pathname.includes('/maestro/clases') ? 'active' : ''}
            >
              <Book className="me-2" /> Mis Clases
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/maestro/asistencias" 
              className={location.pathname.includes('/maestro/asistencias') ? 'active' : ''}
            >
              <CalendarCheck className="me-2" /> Asistencias
            </Nav.Link>
          </>
        )}

        <Nav.Link 
          as={Link} 
          to="/perfil" 
          className={location.pathname === '/perfil' ? 'active' : ''}
        >
          <PersonBadge className="me-2" /> Perfil
        </Nav.Link>

        <Nav.Link onClick={logout} className="text-danger mt-3">
          <DoorOpen className="me-2" /> Salir
        </Nav.Link>
      </Nav>

      <div className="text-center mt-4 pt-3 border-top border-white-50">
        <small className="text-white-50">
          © 2026 Hanxue School
        </small>
      </div>
    </div>
  );
};

export default Sidebar;