import React from 'react';
import { Card, Row, Col, Badge, ListGroup, Image } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { 
  Person, 
  Envelope, 
  Key, 
  ShieldCheck,
  Calendar,
  Clock,
  Gear,
  Bell,
  Shield,
  Star,
  CheckCircle,
  XCircle
} from 'react-bootstrap-icons';

const Perfil: React.FC = () => {
  const { user, isAdmin, isMaestro } = useAuth();

  const getRoleBadge = () => {
    if (isAdmin) return <Badge bg="danger" className="px-3 py-2"><Shield className="me-2" />Administrador</Badge>;
    if (isMaestro) return <Badge bg="warning" className="px-3 py-2"><Star className="me-2" />Maestro</Badge>;
    return <Badge bg="success" className="px-3 py-2"><CheckCircle className="me-2" />Alumno</Badge>;
  };

  const getStatusBadge = () => {
    if (user?.suspended) {
      return <Badge bg="danger" className="px-3 py-2"><XCircle className="me-2" />Suspendido</Badge>;
    }
    if (!user?.confirmed) {
      return <Badge bg="warning" className="px-3 py-2"><Clock className="me-2" />No confirmado</Badge>;
    }
    return <Badge bg="success" className="px-3 py-2"><CheckCircle className="me-2" />Activo</Badge>;
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-2">Mi Perfil</h2>
          <div className="text-muted d-flex align-items-center">
            <Clock className="me-2" />
            {new Date().toLocaleString('es-MX', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Columna izquierda - Avatar */}
        <Col lg={4}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
              {/* Avatar con imagen de Vite */}
              <div className="position-relative d-inline-block mb-4">
                <div className="bg-light rounded-circle d-inline-flex p-3 border" 
                     style={{ 
                       width: '120px',
                       height: '120px'
                     }}>
                  <Image 
                    src="/vite.svg" 
                    alt="Avatar" 
                    className="w-100 h-100"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>

              <h3 className="mb-1">{user?.firstname} {user?.lastname}</h3>
              <p className="text-muted mb-3">@{user?.username}</p>
              
              <div className="d-flex justify-content-center gap-2 mb-4">
                {getRoleBadge()}
                {getStatusBadge()}
              </div>

              <div className="bg-light p-3 rounded">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Miembro desde:</span>
                  <strong>{new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Último acceso:</span>
                  <strong>Hoy</strong>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Columna derecha - Información detallada */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <Person className="text-primary" size={24} />
                </div>
                <div>
                  <h5 className="mb-1">Información Personal</h5>
                  <p className="text-muted small mb-0">Detalles de tu cuenta</p>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="pt-0">
              <ListGroup variant="flush">
                <ListGroup.Item className="px-0 d-flex align-items-center">
                  <div className="bg-light p-2 rounded-circle me-3" style={{ width: '40px', height: '40px' }}>
                    <Person className="text-primary" size={20} />
                  </div>
                  <div className="flex-grow-1">
                    <small className="text-muted d-block">Nombre completo</small>
                    <strong>{user?.firstname} {user?.lastname}</strong>
                  </div>
                </ListGroup.Item>

                <ListGroup.Item className="px-0 d-flex align-items-center">
                  <div className="bg-light p-2 rounded-circle me-3" style={{ width: '40px', height: '40px' }}>
                    <Envelope className="text-primary" size={20} />
                  </div>
                  <div className="flex-grow-1">
                    <small className="text-muted d-block">Correo electrónico</small>
                    <strong>{user?.email}</strong>
                  </div>
                </ListGroup.Item>

                <ListGroup.Item className="px-0 d-flex align-items-center">
                  <div className="bg-light p-2 rounded-circle me-3" style={{ width: '40px', height: '40px' }}>
                    <Key className="text-primary" size={20} />
                  </div>
                  <div className="flex-grow-1">
                    <small className="text-muted d-block">Nombre de usuario</small>
                    <strong>{user?.username}</strong>
                  </div>
                </ListGroup.Item>

                <ListGroup.Item className="px-0 d-flex align-items-center">
                  <div className="bg-light p-2 rounded-circle me-3" style={{ width: '40px', height: '40px' }}>
                    <ShieldCheck className="text-primary" size={20} />
                  </div>
                  <div className="flex-grow-1">
                    <small className="text-muted d-block">Rol en el sistema</small>
                    <div>{getRoleBadge()}</div>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          <Row className="g-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white border-0 pt-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 p-2 rounded-circle me-2">
                      <Gear className="text-info" size={18} />
                    </div>
                    <h6 className="mb-0">Configuración</h6>
                  </div>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="px-0 d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <Bell className="text-muted me-2" size={16} />
                        <span>Notificaciones</span>
                      </div>
                      <Badge bg="success" pill>Activas</Badge>
                    </ListGroup.Item>
                    <ListGroup.Item className="px-0 d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <Calendar className="text-muted me-2" size={16} />
                        <span>Idioma</span>
                      </div>
                      <span>Español</span>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white border-0 pt-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-2">
                      <Star className="text-warning" size={18} />
                    </div>
                    <h6 className="mb-0">Estadísticas</h6>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="text-center mb-3">
                    <div className="display-4 text-primary">{user?.id}</div>
                    <small className="text-muted">ID de usuario</small>
                  </div>
                  <div className="d-flex justify-content-around">
                    <div className="text-center">
                      <div className="fw-bold">0</div>
                      <small className="text-muted">Clases</small>
                    </div>
                    <div className="text-center">
                      <div className="fw-bold">0</div>
                      <small className="text-muted">Asistencias</small>
                    </div>
                    <div className="text-center">
                      <div className="fw-bold">0</div>
                      <small className="text-muted">Días</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Información del sistema */}
          <Card className="border-0 shadow-sm mt-4 bg-light">
            <Card.Body className="py-2">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <Shield className="text-primary me-2" size={16} />
                  <small className="text-muted">Información del sistema</small>
                </div>
                <div className="d-flex gap-3">
                  <small className="text-muted">
                    <strong>ID:</strong> {user?.id}
                  </small>
                  <small className="text-muted">
                    <strong>Versión:</strong> 1.0.0
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Perfil;