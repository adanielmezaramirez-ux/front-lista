import React, { useState, useEffect } from 'react';
import { Navbar as BNavbar, Container, Badge, Dropdown } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Shield, PersonVcard, ArrowRepeat, Person, List } from 'react-bootstrap-icons';

interface NavbarProps {
  toggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, currentView, availableViews, setCurrentView } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getRoleText = () => {
    if (currentView === 'admin') return isMobile ? 'Admin' : 'Administrador';
    if (currentView === 'maestro') return isMobile ? 'Maestro' : 'Maestro';
    return 'Usuario';
  };

  const getRoleIcon = () => {
    if (currentView === 'admin') return <Shield className="me-1" size={isMobile ? 12 : 14} />;
    if (currentView === 'maestro') return <PersonVcard className="me-1" size={isMobile ? 12 : 14} />;
    return null;
  };

  const handleViewChange = (view: 'admin' | 'maestro') => {
    setCurrentView(view);
    window.location.href = '/dashboard';
    setShowMobileMenu(false);
  };

  return (
    <BNavbar bg="white" className="shadow-sm px-2 px-md-4 py-2" fixed={isMobile ? "top" : undefined}>
      <Container fluid className="px-0 px-md-2">
        <div className="d-flex align-items-center">
          {isMobile && toggleSidebar && (
            <button
              onClick={toggleSidebar}
              className="btn btn-link text-primary p-0 me-2 d-flex align-items-center"
              style={{ background: 'none', border: 'none' }}
            >
              <List size={24} />
            </button>
          )}
          
          <BNavbar.Brand className="d-flex align-items-center fs-6 fs-md-5">
            <Person className="me-1 me-md-2 text-primary" size={isMobile ? 16 : 20} />
            <span className="d-none d-sm-inline">
              Bienvenido, {user?.firstname} {user?.lastname}
            </span>
            <span className="d-sm-none">
              {user?.firstname}
            </span>
          </BNavbar.Brand>
        </div>

        <div className="d-flex align-items-center gap-1 gap-md-2">
          <button 
            className="btn btn-link text-secondary p-1 p-md-2 position-relative"
            style={{ background: 'none', border: 'none' }}
          >
            <Bell size={isMobile ? 18 : 20} />
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                  style={{ fontSize: '0.5rem', padding: '0.2rem 0.4rem' }}>
              3
              <span className="visually-hidden">notificaciones</span>
            </span>
          </button>
          
          {availableViews.length > 1 && (
            <>
              {isMobile ? (
                <Dropdown show={showMobileMenu} onToggle={setShowMobileMenu} align="end">
                  <Dropdown.Toggle 
                    variant={currentView === 'admin' ? 'danger' : 'warning'} 
                    size="sm"
                    className="d-flex align-items-center px-2 py-1"
                  >
                    {getRoleIcon()}
                    <span className="d-none d-sm-inline">{getRoleText()}</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="dropdown-menu-end">
                    <Dropdown.Header className="text-center small">
                      Cambiar vista
                    </Dropdown.Header>
                    {availableViews.includes('admin') && currentView !== 'admin' && (
                      <Dropdown.Item 
                        onClick={() => handleViewChange('admin')}
                        className="d-flex align-items-center"
                      >
                        <Shield className="me-2 text-danger" size={14} />
                        <span className="flex-grow-1">Administrador</span>
                      </Dropdown.Item>
                    )}
                    {availableViews.includes('maestro') && currentView !== 'maestro' && (
                      <Dropdown.Item 
                        onClick={() => handleViewChange('maestro')}
                        className="d-flex align-items-center"
                      >
                        <PersonVcard className="me-2 text-warning" size={14} />
                        <span className="flex-grow-1">Maestro</span>
                      </Dropdown.Item>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.ItemText className="text-muted small text-center">
                      <ArrowRepeat className="me-1" size={10} />
                      Cambia entre tus roles
                    </Dropdown.ItemText>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <Dropdown className="me-2">
                  <Dropdown.Toggle 
                    variant={currentView === 'admin' ? 'danger' : 'warning'} 
                    size="sm"
                    className="d-flex align-items-center"
                  >
                    {getRoleIcon()}
                    {getRoleText()}
                    <ArrowRepeat className="ms-2" size={12} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Header className="text-center small">
                      Cambiar vista
                    </Dropdown.Header>
                    {availableViews.includes('admin') && currentView !== 'admin' && (
                      <Dropdown.Item onClick={() => handleViewChange('admin')}>
                        <Shield className="me-2 text-danger" size={14} />
                        Vista Admin
                      </Dropdown.Item>
                    )}
                    {availableViews.includes('maestro') && currentView !== 'maestro' && (
                      <Dropdown.Item onClick={() => handleViewChange('maestro')}>
                        <PersonVcard className="me-2 text-warning" size={14} />
                        Vista Maestro
                      </Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </>
          )}

          {availableViews.length === 1 && (
            <Badge 
              bg={currentView === 'admin' ? 'danger' : 'warning'} 
              className={`d-flex align-items-center ${isMobile ? 'px-2 py-1' : 'px-3 py-2'}`}
              style={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}
            >
              {getRoleIcon()}
              {getRoleText()}
            </Badge>
          )}
        </div>
      </Container>

      {/* Barra de información móvil */}
      {isMobile && (
        <div className="bg-light py-1 px-3 border-top w-100" style={{ fontSize: '0.75rem' }}>
          <span className="text-muted">
            {user?.firstname} {user?.lastname} • @{user?.username}
          </span>
        </div>
      )}
    </BNavbar>
  );
};

export default Navbar;