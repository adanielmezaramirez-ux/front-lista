import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Alert, Badge, Card, Row, Col } from 'react-bootstrap';
import { adminService } from '../../services/adminService';
import { usersService } from '../../services/usersService';
import { Clase, User, Maestro, Alumno } from '../../interfaces';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PersonPlus, PersonDash, People, Book } from 'react-bootstrap-icons';

const AdminClasses: React.FC = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignMaestrosModal, setShowAssignMaestrosModal] = useState(false);
  const [showAssignAlumnosModal, setShowAssignAlumnosModal] = useState(false);
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    horario: '',
    dias: '',
    maestrosIds: [] as number[]
  });
  const [selectedMaestros, setSelectedMaestros] = useState<number[]>([]);
  const [selectedAlumnos, setSelectedAlumnos] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clasesData, usersData] = await Promise.all([
        adminService.getUsers().then(() => {
          // Nota: Necesitarías un endpoint para obtener clases como admin
          // Por ahora usamos el mismo usuario admin
          return [];
        }),
        adminService.getUsers()
      ]);
      
      // Filtrar usuarios por rol
      setUsers(usersData);
      setClases([]); // Temporal hasta tener endpoint de clases
    } catch (error) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!formData.nombre) return;

    setUpdating(true);
    try {
      await adminService.createClass(formData);
      await fetchData();
      setShowCreateModal(false);
      setFormData({ nombre: '', horario: '', dias: '', maestrosIds: [] });
    } catch (error) {
      setError('Error al crear clase');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignMaestros = async () => {
    if (!selectedClase) return;

    setUpdating(true);
    try {
      await adminService.asignarMaestros(selectedClase.id, selectedMaestros);
      await fetchData();
      setShowAssignMaestrosModal(false);
      setSelectedClase(null);
      setSelectedMaestros([]);
    } catch (error) {
      setError('Error al asignar maestros');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignAlumnos = async () => {
    if (!selectedClase) return;

    setUpdating(true);
    try {
      await adminService.asignarAlumnos(selectedClase.id, selectedAlumnos);
      await fetchData();
      setShowAssignAlumnosModal(false);
      setSelectedClase(null);
      setSelectedAlumnos([]);
    } catch (error) {
      setError('Error al asignar alumnos');
    } finally {
      setUpdating(false);
    }
  };

  const getMaestros = () => users.filter(u => u.role_name === 'maestro');
  const getAlumnos = () => users.filter(u => u.role_name === 'alumno');

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Clases</h2>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Book className="me-2" /> Nueva Clase
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        {clases.map((clase) => (
          <Col md={6} lg={4} key={clase.id}>
            <Card className="mb-4">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">{clase.nombre}</h5>
              </Card.Header>
              <Card.Body>
                <p className="mb-2">
                  <strong>Horario:</strong> {clase.horario || 'No especificado'}
                </p>
                <p className="mb-2">
                  <strong>Días:</strong> {clase.dias || 'No especificado'}
                </p>
                
                <div className="mb-3">
                  <strong>Maestros:</strong>
                  <div className="mt-1">
                    {clase.maestros?.map((m) => (
                      <Badge bg="info" className="me-1 mb-1" key={m.id}>
                        {m.nombre}
                      </Badge>
                    )) || <span className="text-muted">Sin maestros</span>}
                  </div>
                </div>

                <div className="mb-3">
                  <strong>Alumnos ({clase.total_alumnos || 0}):</strong>
                </div>

                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      setSelectedClase(clase);
                      setShowAssignMaestrosModal(true);
                    }}
                  >
                    <PersonPlus /> Asignar Maestros
                  </Button>
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => {
                      setSelectedClase(clase);
                      setShowAssignAlumnosModal(true);
                    }}
                  >
                    <People /> Asignar Alumnos
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal Crear Clase */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Crear Nueva Clase</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de la Clase</Form.Label>
              <Form.Control
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Horario</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: 08:00 - 10:00"
                value={formData.horario}
                onChange={(e) => setFormData({...formData, horario: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Días</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Lunes, Miércoles, Viernes"
                value={formData.dias}
                onChange={(e) => setFormData({...formData, dias: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Maestros</Form.Label>
              <Form.Select
                multiple
                value={formData.maestrosIds.map(String)}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                  setFormData({...formData, maestrosIds: selected});
                }}
              >
                {getMaestros().map((maestro) => (
                  <option key={maestro.id} value={maestro.id}>
                    {maestro.firstname} {maestro.lastname}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Mantén presionado Ctrl para seleccionar múltiples maestros
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateClass}
            disabled={updating || !formData.nombre}
          >
            {updating ? 'Creando...' : 'Crear Clase'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Asignar Maestros */}
      <Modal show={showAssignMaestrosModal} onHide={() => setShowAssignMaestrosModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Asignar Maestros a {selectedClase?.nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Seleccionar Maestros</Form.Label>
            <Form.Select
              multiple
              value={selectedMaestros.map(String)}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                setSelectedMaestros(selected);
              }}
              style={{ minHeight: '200px' }}
            >
              {getMaestros().map((maestro) => (
                <option key={maestro.id} value={maestro.id}>
                  {maestro.firstname} {maestro.lastname} - {maestro.email}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Mantén presionado Ctrl para seleccionar múltiples maestros
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignMaestrosModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAssignMaestros}
            disabled={updating || selectedMaestros.length === 0}
          >
            {updating ? 'Asignando...' : 'Asignar Maestros'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Asignar Alumnos */}
      <Modal show={showAssignAlumnosModal} onHide={() => setShowAssignAlumnosModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Asignar Alumnos a {selectedClase?.nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Seleccionar Alumnos</Form.Label>
            <Form.Select
              multiple
              value={selectedAlumnos.map(String)}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                setSelectedAlumnos(selected);
              }}
              style={{ minHeight: '200px' }}
            >
              {getAlumnos().map((alumno) => (
                <option key={alumno.id} value={alumno.id}>
                  {alumno.firstname} {alumno.lastname} - {alumno.email}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Mantén presionado Ctrl para seleccionar múltiples alumnos
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignAlumnosModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAssignAlumnos}
            disabled={updating || selectedAlumnos.length === 0}
          >
            {updating ? 'Asignando...' : 'Asignar Alumnos'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminClasses;