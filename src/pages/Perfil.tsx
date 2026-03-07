import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Person, Envelope, Key, ShieldCheck } from 'react-bootstrap-icons';

const Perfil: React.FC = () => {
  const { user, isAdmin, isMaestro } = useAuth();

  const getRoleBadge = () => {
    if (isAdmin) return <Badge bg="danger">Administrador</Badge>;
    if (isMaestro) return <Badge bg="warning">Maestro</Badge>;
    return <Badge bg="success">Alumno</Badge>;
  };

  return (
    <div>
      <h2 className="mb-4">Mi Perfil</h2>

      <Row>
        <Col md={4}>
          <Card className="text-center mb-4">
            <Card.Body>
              <div className="bg-primary text-white rounded-circle d-inline-flex p-4 mb-3">
                <Person size={48} />
              </div>
              <h4>{user?.firstname} {user?.lastname}</h4>
              <p className="text-muted">@{user?.username}</p>
              <div>{getRoleBadge()}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Información Personal</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col sm={3}>
                  <strong>
                    <Person className="me-2" /> Nombre:
                  </strong>
                </Col>
                <Col sm={9}>
                  {user?.firstname} {user?.lastname}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3}>
                  <strong>
                    <Envelope className="me-2" /> Email:
                  </strong>
                </Col>
                <Col sm={9}>
                  {user?.email}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3}>
                  <strong>
                    <Key className="me-2" /> Usuario:
                  </strong>
                </Col>
                <Col sm={9}>
                  {user?.username}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3}>
                  <strong>
                    <ShieldCheck className="me-2" /> Rol:
                  </strong>
                </Col>
                <Col sm={9}>
                  {getRoleBadge()}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Información del Sistema</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-0">
                <strong>ID de Usuario:</strong> {user?.id}
              </p>
              <p className="text-muted mb-0 mt-2">
                <strong>Último acceso:</strong> {new Date().toLocaleString()}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Perfil;