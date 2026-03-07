import React from 'react';
import { Nav } from 'react-bootstrap';
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
        <h4>Listas Hanxue</h4>
        <small className="text-white-50">{user?.firstname} {user?.lastname}</small>
        <div className="mt-2">
          <span className="badge bg-info">
            {isAdmin ? 'Administrador' : isMaestro ? 'Maestro' : 'Usuario'}
          </span>
        </div>
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

        <Nav.Link onClick={logout} className="text-danger">
          <DoorOpen className="me-2" /> Salir
        </Nav.Link>
      </Nav>
    </div>
  );
};

export default Sidebar;