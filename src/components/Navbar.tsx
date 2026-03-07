import React from 'react';
import { Navbar as BNavbar, Container } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Bell } from 'react-bootstrap-icons';

const Navbar: React.FC = () => {
  const { user, isAdmin, isMaestro } = useAuth();

  const getRoleText = () => {
    if (isAdmin) return 'Administrador';
    if (isMaestro) return 'Maestro';
    return 'Usuario';
  };

  return (
    <BNavbar bg="white" className="shadow-sm px-4">
      <Container fluid>
        <BNavbar.Brand>
          Bienvenido, {user?.firstname} {user?.lastname}
        </BNavbar.Brand>
        <div className="d-flex align-items-center">
          <Bell size={20} className="text-secondary me-3" />
          <span className="badge bg-primary">
            {getRoleText()}
          </span>
        </div>
      </Container>
    </BNavbar>
  );
};

export default Navbar;