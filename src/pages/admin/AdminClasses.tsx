import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Alert, Badge, Card, Row, Col } from 'react-bootstrap';
import { adminService } from '../../services/adminService';
import { Clase, User, Horario, DIAS_SEMANA, getDiaSemanaNombre } from '../../interfaces';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PersonPlus, People, Book, Clock, Trash } from 'react-bootstrap-icons';

const AdminClasses: React.FC = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignMaestrosModal, setShowAssignMaestrosModal] = useState(false);
  const [showAssignAlumnosModal, setShowAssignAlumnosModal] = useState(false);
  const [showEditHorariosModal, setShowEditHorariosModal] = useState(false);
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    horarios: [] as Horario[],
    maestrosIds: [] as number[]
  });

  const [nuevoHorario, setNuevoHorario] = useState<Horario>({
    dia_semana: 1,
    hora_inicio: '08:00:00',
    hora_fin: '10:00:00'
  });

  const [selectedMaestros, setSelectedMaestros] = useState<number[]>([]);
  const [selectedAlumnos, setSelectedAlumnos] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clasesData, usersData] = await Promise.all([
        adminService.getClasses(),
        adminService.getUsers()
      ]);
      
      console.log('Usuarios cargados:', usersData); // Debug
      console.log('Maestros filtrados:', usersData.filter(u => u.role === 'maestro')); // Debug
      
      setUsers(usersData);
      setClases(clasesData);
      setError('');
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const agregarHorario = () => {
    if (formData.horarios.some(h => h.dia_semana === nuevoHorario.dia_semana)) {
      setError('Ya existe un horario para ese día');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (nuevoHorario.hora_fin <= nuevoHorario.hora_inicio) {
      setError('La hora de fin debe ser mayor a la hora de inicio');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setFormData({
      ...formData,
      horarios: [...formData.horarios, { ...nuevoHorario }]
    });
  };

  const eliminarHorario = (index: number) => {
    setFormData({
      ...formData,
      horarios: formData.horarios.filter((_, i) => i !== index)
    });
  };

  const handleCreateClass = async () => {
    if (!formData.nombre) {
      setError('El nombre de la clase es requerido');
      return;
    }

    if (formData.horarios.length === 0) {
      setError('Debes agregar al menos un horario');
      return;
    }

    setUpdating(true);
    try {
      await adminService.createClass(formData);
      await fetchData();
      setShowCreateModal(false);
      setFormData({ 
        nombre: '', 
        horarios: [], 
        maestrosIds: [] 
      });
    } catch (error) {
      console.error('Error creating class:', error);
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
      console.error('Error assigning maestros:', error);
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
      console.error('Error assigning alumnos:', error);
      setError('Error al asignar alumnos');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateHorarios = async () => {
    if (!selectedClase) return;

    setUpdating(true);
    try {
      await adminService.updateHorarios(selectedClase.id, selectedClase.horarios);
      await fetchData();
      setShowEditHorariosModal(false);
      setSelectedClase(null);
    } catch (error) {
      console.error('Error updating horarios:', error);
      setError('Error al actualizar horarios');
    } finally {
      setUpdating(false);
    }
  };

  // CORREGIDO: Usar 'role' en lugar de 'role_name'
  const getMaestros = () => users.filter(u => u.role === 'maestro');
  const getAlumnos = () => users.filter(u => u.role === 'alumno');

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Clases</h2>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Book className="me-2" /> Nueva Clase
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Debug info - eliminar en producción */}
      <div className="mb-3 text-muted small">
        Total usuarios: {users.length} | Maestros: {getMaestros().length} | Alumnos: {getAlumnos().length}
      </div>

      <Row>
        {clases.map((clase) => (
          <Col md={6} lg={4} key={clase.id}>
            <Card className="mb-4">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{clase.nombre}</h5>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => {
                    setSelectedClase(clase);
                    setShowEditHorariosModal(true);
                  }}
                >
                  <Clock className="me-1" /> Editar Horarios
                </Button>
              </Card.Header>
              <Card.Body>
                {/* Horarios */}
                <div className="mb-3">
                  <strong className="d-flex align-items-center">
                    <Clock className="me-2" /> Horarios:
                  </strong>
                  <div className="mt-2">
                    {clase.horarios && clase.horarios.length > 0 ? (
                      clase.horarios.map((h, idx) => (
                        <Badge bg="info" className="me-2 mb-2 p-2" key={idx}>
                          {getDiaSemanaNombre(h.dia_semana)} {h.hora_inicio.substring(0,5)} - {h.hora_fin.substring(0,5)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted">Sin horarios definidos</span>
                    )}
                  </div>
                </div>
                
                {/* Maestros */}
                <div className="mb-3">
                  <strong>Maestros:</strong>
                  <div className="mt-1">
                    {clase.maestros && clase.maestros.length > 0 ? (
                      clase.maestros.map((m) => (
                        <Badge bg="info" className="me-1 mb-1" key={m.id}>
                          {m.nombre}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted">Sin maestros</span>
                    )}
                  </div>
                </div>

                {/* Alumnos */}
                <div className="mb-3">
                  <strong>Alumnos ({clase.total_alumnos || 0}):</strong>
                </div>

                {/* Botones de acción */}
                <div className="d-flex gap-2 flex-wrap">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      setSelectedClase(clase);
                      setSelectedMaestros(clase.maestros?.map(m => m.id) || []);
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
                      setSelectedAlumnos([]);
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
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
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

            {/* Sección de Horarios */}
            <Form.Group className="mb-3">
              <Form.Label className="d-flex align-items-center">
                <Clock className="me-2" /> Horarios de la Clase
              </Form.Label>
              
              <div className="mb-3">
                {formData.horarios.map((horario, index) => (
                  <div key={index} className="d-flex align-items-center mb-2 p-2 border rounded">
                    <div className="flex-grow-1">
                      <Badge bg="secondary" className="me-2">
                        {getDiaSemanaNombre(horario.dia_semana)}
                      </Badge>
                      {horario.hora_inicio.substring(0,5)} - {horario.hora_fin.substring(0,5)}
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => eliminarHorario(index)}
                    >
                      <Trash />
                    </Button>
                  </div>
                ))}
                {formData.horarios.length === 0 && (
                  <div className="text-muted fst-italic mb-2">
                    No hay horarios agregados
                  </div>
                )}
              </div>

              <Card className="bg-light">
                <Card.Body>
                  <h6>Agregar nuevo horario</h6>
                  <Row>
                    <Col md={3}>
                      <Form.Select
                        value={nuevoHorario.dia_semana}
                        onChange={(e) => setNuevoHorario({
                          ...nuevoHorario,
                          dia_semana: Number(e.target.value)
                        })}
                      >
                        {DIAS_SEMANA.map(dia => (
                          <option key={dia.value} value={dia.value}>
                            {dia.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Control
                        type="time"
                        value={nuevoHorario.hora_inicio.substring(0,5)}
                        onChange={(e) => setNuevoHorario({
                          ...nuevoHorario,
                          hora_inicio: e.target.value + ':00'
                        })}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Control
                        type="time"
                        value={nuevoHorario.hora_fin.substring(0,5)}
                        onChange={(e) => setNuevoHorario({
                          ...nuevoHorario,
                          hora_fin: e.target.value + ':00'
                        })}
                      />
                    </Col>
                    <Col md={3}>
                      <Button 
                        variant="success" 
                        onClick={agregarHorario}
                        className="w-100"
                      >
                        Agregar
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Maestros</Form.Label>
              {getMaestros().length === 0 ? (
                <Alert variant="warning" className="mt-2">
                  No hay maestros disponibles. Debes crear usuarios con rol de maestro primero.
                </Alert>
              ) : (
                <>
                  <Form.Select
                    multiple
                    value={formData.maestrosIds.map(String)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                      setFormData({...formData, maestrosIds: selected});
                    }}
                    style={{ minHeight: '150px' }}
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
                </>
              )}
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
            disabled={updating || !formData.nombre || formData.horarios.length === 0}
          >
            {updating ? 'Creando...' : 'Crear Clase'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Editar Horarios */}
      <Modal show={showEditHorariosModal} onHide={() => setShowEditHorariosModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Editar Horarios de {selectedClase?.nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClase && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center">
                  <Clock className="me-2" /> Horarios
                </Form.Label>
                
                {selectedClase.horarios?.map((horario, index) => (
                  <div key={index} className="d-flex align-items-center mb-2 p-2 border rounded">
                    <div className="flex-grow-1">
                      <Form.Select
                        className="d-inline-block w-auto me-2"
                        value={horario.dia_semana}
                        onChange={(e) => {
                          const nuevosHorarios = [...selectedClase.horarios];
                          nuevosHorarios[index] = {
                            ...nuevosHorarios[index],
                            dia_semana: Number(e.target.value)
                          };
                          setSelectedClase({
                            ...selectedClase,
                            horarios: nuevosHorarios
                          });
                        }}
                      >
                        {DIAS_SEMANA.map(dia => (
                          <option key={dia.value} value={dia.value}>
                            {dia.label}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control
                        type="time"
                        className="d-inline-block w-auto me-2"
                        value={horario.hora_inicio.substring(0,5)}
                        onChange={(e) => {
                          const nuevosHorarios = [...selectedClase.horarios];
                          nuevosHorarios[index] = {
                            ...nuevosHorarios[index],
                            hora_inicio: e.target.value + ':00'
                          };
                          setSelectedClase({
                            ...selectedClase,
                            horarios: nuevosHorarios
                          });
                        }}
                      />
                      <Form.Control
                        type="time"
                        className="d-inline-block w-auto"
                        value={horario.hora_fin.substring(0,5)}
                        onChange={(e) => {
                          const nuevosHorarios = [...selectedClase.horarios];
                          nuevosHorarios[index] = {
                            ...nuevosHorarios[index],
                            hora_fin: e.target.value + ':00'
                          };
                          setSelectedClase({
                            ...selectedClase,
                            horarios: nuevosHorarios
                          });
                        }}
                      />
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="ms-2"
                      onClick={() => {
                        const nuevosHorarios = selectedClase.horarios.filter((_, i) => i !== index);
                        setSelectedClase({
                          ...selectedClase,
                          horarios: nuevosHorarios
                        });
                      }}
                    >
                      <Trash />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline-success"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    const nuevosHorarios = [...selectedClase.horarios, {
                      dia_semana: 1,
                      hora_inicio: '08:00:00',
                      hora_fin: '10:00:00'
                    }];
                    setSelectedClase({
                      ...selectedClase,
                      horarios: nuevosHorarios
                    });
                  }}
                >
                  + Agregar horario
                </Button>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditHorariosModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateHorarios}
            disabled={updating || !selectedClase?.horarios?.length}
          >
            {updating ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Asignar Maestros */}
      <Modal show={showAssignMaestrosModal} onHide={() => setShowAssignMaestrosModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Asignar Maestros a {selectedClase?.nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Seleccionar Maestros</Form.Label>
            {getMaestros().length === 0 ? (
              <Alert variant="warning">No hay maestros disponibles</Alert>
            ) : (
              <>
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
              </>
            )}
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
      <Modal show={showAssignAlumnosModal} onHide={() => setShowAssignAlumnosModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Asignar Alumnos a {selectedClase?.nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Seleccionar Alumnos</Form.Label>
            {getAlumnos().length === 0 ? (
              <Alert variant="warning">No hay alumnos disponibles</Alert>
            ) : (
              <>
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
              </>
            )}
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