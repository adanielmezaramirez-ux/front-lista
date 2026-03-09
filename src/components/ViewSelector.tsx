import React, { useState, useEffect } from 'react';
import { Modal, Button, Dropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  PersonVcard, 
  Shield, 
  ArrowRepeat,
  PersonBadge,
  X
} from 'react-bootstrap-icons';

const ViewSelector: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    isAdmin, 
    isMaestro,
    canSwitchView,
    availableViews,
    user
  } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (canSwitchView && !currentView) {
      setShowModal(true);
    }
  }, [canSwitchView, currentView]);

  const handleViewChange = (view: 'admin' | 'maestro') => {
    setCurrentView(view);
    setShowModal(false);
    window.location.href = '/dashboard';
  };

  const getCurrentViewLabel = () => {
    if (currentView === 'admin') return 'Vista Admin';
    if (currentView === 'maestro') return 'Vista Maestro';
    return '';
  };

  const getCurrentViewIcon = () => {
    if (currentView === 'admin') return <Shield className="me-2" size={16} />;
    if (currentView === 'maestro') return <PersonVcard className="me-2" size={16} />;
    return null;
  };

  if (!canSwitchView || !currentView) {
    return (
      <Modal show={showModal} centered backdrop="static" keyboard={false}>
        <Modal.Header className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <PersonBadge className="me-2" size={24} />
            Selecciona tu vista
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <p className="mb-4">Tienes múltiples roles. ¿Qué vista deseas utilizar?</p>
          <div className="d-flex gap-3 justify-content-center">
            {availableViews.includes('admin') && (
              <Button
                variant="danger"
                size="lg"
                className="d-flex align-items-center px-4 py-3"
                onClick={() => handleViewChange('admin')}
              >
                <Shield className="me-2" size={20} />
                Vista Admin
              </Button>
            )}
            {availableViews.includes('maestro') && (
              <Button
                variant="warning"
                size="lg"
                className="d-flex align-items-center px-4 py-3 text-dark"
                onClick={() => handleViewChange('maestro')}
              >
                <PersonVcard className="me-2" size={20} />
                Vista Maestro
              </Button>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <small className="text-muted">
            Puedes cambiar de vista en cualquier momento desde el selector
          </small>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <div className="position-fixed top-0 end-0 m-3" style={{ zIndex: 1100 }}>
      <Dropdown align="end">
        <Dropdown.Toggle 
          variant={currentView === 'admin' ? 'danger' : 'warning'} 
          id="dropdown-view-selector"
          className="d-flex align-items-center shadow"
        >
          {getCurrentViewIcon()}
          {getCurrentViewLabel()}
          <ArrowRepeat className="ms-2" size={14} />
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Header className="text-center">
            <Badge bg="secondary">Cambiar vista</Badge>
          </Dropdown.Header>
          {availableViews.includes('admin') && currentView !== 'admin' && (
            <Dropdown.Item 
              onClick={() => handleViewChange('admin')}
              className="d-flex align-items-center"
            >
              <Shield className="me-2 text-danger" size={16} />
              <span className="flex-grow-1">Vista Admin</span>
              <Badge bg="danger" pill>Admin</Badge>
            </Dropdown.Item>
          )}
          {availableViews.includes('maestro') && currentView !== 'maestro' && (
            <Dropdown.Item 
              onClick={() => handleViewChange('maestro')}
              className="d-flex align-items-center"
            >
              <PersonVcard className="me-2 text-warning" size={16} />
              <span className="flex-grow-1">Vista Maestro</span>
              <Badge bg="warning" pill>Maestro</Badge>
            </Dropdown.Item>
          )}
          {availableViews.length > 1 && (
            <>
              <Dropdown.Divider />
              <Dropdown.ItemText className="text-muted small text-center">
                <PersonBadge className="me-1" size={12} />
                Tienes {availableViews.length} roles: {availableViews.map(v => v === 'admin' ? 'Admin' : 'Maestro').join(' y ')}
              </Dropdown.ItemText>
            </>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default ViewSelector;