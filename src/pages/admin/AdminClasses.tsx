import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Alert, Badge, Card, Row, Col } from 'react-bootstrap';
import { adminService } from '../../services/adminService';
import { Clase, User, Horario, DIAS_SEMANA, getDiaSemanaNombre } from '../../interfaces';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  PersonPlus, 
  People, 
  Book, 
  Clock, 
  Trash, 
  PersonCheck, 
  Info,
  Envelope,
  Plus,
  Save,
  X,
  Person
} from 'react-bootstrap-icons';

const AdminClasses: React.FC = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignMaestrosModal, setShowAssignMaestrosModal] = useState(false);
  const [showAssignAlumnosModal, setShowAssignAlumnosModal] = useState(false);
  const [showEditHorariosModal, setShowEditHorariosModal] = useState(false);
  const [showViewAlumnosModal, setShowViewAlumnosModal] = useState(false);
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
      
      const processedUsers = usersData.map(user => {
        if (user.roles && Array.isArray(user.roles)) {
          return user;
        }
        if (user.role_name) {
          return {
            ...user,
            roles: [user.role_name]
          };
        }
        return {
          ...user,
          roles: []
        };
      });

      setUsers(processedUsers);
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

  const getMaestros = () => {
    return users.filter(u => u.roles?.includes('maestro'));
  };

  const getAlumnos = () => {
    return users.filter(u => u.roles?.includes('alumno'));
  };

  const getAlumnosDisponibles = (clase: Clase | null) => {
    if (!clase) return [];
    const alumnosInscritosIds = new Set(clase.alumnos?.map(a => a.id) || []);
    return getAlumnos().filter(alumno => !alumnosInscritosIds.has(alumno.id));
  };

  const getMaestrosDisponibles = (clase: Clase | null) => {
    if (!clase) return getMaestros();
    const maestrosAsignadosIds = new Set(clase.maestros?.map(m => m.id) || []);
    return getMaestros().filter(maestro => !maestrosAsignadosIds.has(maestro.id));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-0">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-0">Gestión de Clases</h2>
        </Col>
        <Col md="auto">
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Book className="me-2" /> Nueva Clase
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Row xs={1} md={2} lg={3} className="g-4">
        {clases.map((clase) => {
          const alumnosInscritos = clase.alumnos?.length || 0;
          
          return (
            <Col key={clase.id}>
              <Card className="h-100">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 d-flex align-items-center">
                    <Book className="text-primary me-2" size={16} />
                    {clase.nombre}
                  </h6>
                  <div className="d-flex gap-2">
                    <Badge bg="info" className="px-3 py-2">
                      <People className="me-2" size={12} />
                      {alumnosInscritos}
                    </Badge>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="p-1 px-2"
                      onClick={() => {
                        setSelectedClase(clase);
                        setShowEditHorariosModal(true);
                      }}
                    >
                      <Clock size={14} />
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <small className="text-muted d-block mb-2">Horarios:</small>
                    <div className="d-flex flex-wrap gap-2">
                      {clase.horarios && clase.horarios.length > 0 ? (
                        clase.horarios.map((h, idx) => (
                          <Badge bg="secondary" className="px-3 py-2" key={idx}>
                            {getDiaSemanaNombre(h.dia_semana)} {h.hora_inicio.substring(0,5)}-{h.hora_fin.substring(0,5)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted small">Sin horarios</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <small className="text-muted d-block mb-2">Maestros:</small>
                    <div className="d-flex flex-wrap gap-2">
                      {clase.maestros && clase.maestros.length > 0 ? (
                        clase.maestros.map((m) => (
                          <Badge bg="info" className="px-3 py-2 d-inline-flex align-items-center" key={m.id}>
                            <Person className="me-2" size={12} />
                            {m.nombre}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted small">Sin maestros</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted d-block mb-2">Alumnos inscritos:</small>
                    {clase.alumnos && clase.alumnos.length > 0 ? (
                      <div className="border rounded bg-light p-2">
                        {clase.alumnos.slice(0, 2).map((alumno) => (
                          <div key={alumno.id} className="d-flex align-items-center mb-1">
                            <PersonCheck className="text-success me-2" size={12} />
                            <small>{alumno.nombre}</small>
                          </div>
                        ))}
                        {clase.alumnos.length > 2 && (
                          <div className="text-muted small">
                            <Info className="me-1" size={12} />
                            +{clase.alumnos.length - 2} alumnos más
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted small">Sin alumnos</span>
                    )}
                  </div>

                  <div className="d-flex gap-2 mt-3">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="flex-fill d-inline-flex align-items-center justify-content-center"
                      onClick={() => {
                        setSelectedClase(clase);
                        setShowViewAlumnosModal(true);
                      }}
                    >
                      <People className="me-2" /> Ver
                    </Button>
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="flex-fill d-inline-flex align-items-center justify-content-center"
                      onClick={() => {
                        setSelectedClase(clase);
                        setSelectedMaestros(clase.maestros?.map(m => m.id) || []);
                        setShowAssignMaestrosModal(true);
                      }}
                    >
                      <PersonPlus className="me-2" /> Maestros
                    </Button>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="flex-fill d-inline-flex align-items-center justify-content-center"
                      onClick={() => {
                        setSelectedClase(clase);
                        setSelectedAlumnos([]);
                        setShowAssignAlumnosModal(true);
                      }}
                    >
                      <People className="me-2" /> Alumnos
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <Book className="me-2 text-primary" /> Crear Nueva Clase
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Nombre de la clase</Form.Label>
              <Form.Control
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ej: Matemáticas, Español, etc."
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold d-flex align-items-center">
                <Clock className="me-2" /> Horarios
              </Form.Label>
              
              <div className="mb-3">
                {formData.horarios.map((horario, index) => (
                  <div key={index} className="d-flex align-items-center mb-2 p-2 border rounded">
                    <div className="flex-grow-1 d-flex align-items-center">
                      <Badge bg="secondary" className="me-3 px-3 py-2">
                        {getDiaSemanaNombre(horario.dia_semana)}
                      </Badge>
                      <span className="text-muted">
                        {horario.hora_inicio.substring(0,5)} - {horario.hora_fin.substring(0,5)}
                      </span>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => eliminarHorario(index)}
                      className="d-inline-flex align-items-center"
                    >
                      <Trash size={14} />
                    </Button>
                  </div>
                ))}
                {formData.horarios.length === 0 && (
                  <Alert variant="info" className="text-center py-3">
                    <Clock className="me-2" />
                    No hay horarios agregados
                  </Alert>
                )}
              </div>

              <Card className="bg-light border-0">
                <Card.Body>
                  <h6 className="mb-3">Agregar nuevo horario</h6>
                  <Row className="g-2">
                    <Col md={4}>
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
                    <Col md={2}>
                      <Button 
                        variant="success" 
                        onClick={agregarHorario}
                        className="w-100 d-inline-flex align-items-center justify-content-center"
                      >
                        <Plus className="me-2" /> Agregar
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Form.Group>

            <Form.Group>
              <Form.Label className="fw-bold d-flex align-items-center">
                <Person className="me-2" /> Maestros
              </Form.Label>
              {getMaestros().length === 0 ? (
                <Alert variant="warning">
                  No hay maestros disponibles. Crea usuarios con rol de maestro primero.
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
                    style={{ minHeight: '120px' }}
                  >
                    {getMaestros().map((maestro) => (
                      <option key={maestro.id} value={maestro.id}>
                        {maestro.firstname} {maestro.lastname} - {maestro.email}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    <small>Ctrl + clic para seleccionar múltiples</small>
                  </Form.Text>
                </>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="d-inline-flex align-items-center">
            <X className="me-2" /> Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateClass}
            disabled={updating || !formData.nombre || formData.horarios.length === 0}
            className="d-inline-flex align-items-center"
          >
            <Save className="me-2" />
            {updating ? 'Creando...' : 'Crear Clase'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showViewAlumnosModal} onHide={() => setShowViewAlumnosModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <People className="me-2 text-primary" />
            Alumnos - {selectedClase?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClase && (
            <>
              {selectedClase.alumnos && selectedClase.alumnos.length > 0 ? (
                <>
                  <div className="mb-3">
                    <Badge bg="info" className="px-3 py-2">
                      <People className="me-2" />
                      Total: {selectedClase.alumnos.length} alumnos
                    </Badge>
                  </div>
                  <Table striped hover responsive size="sm">
                    <thead className="bg-light">
                      <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClase.alumnos.map((alumno, index) => (
                        <tr key={alumno.id}>
                          <td>{index + 1}</td>
                          <td className="fw-bold">{alumno.nombre}</td>
                          <td>
                            <Envelope className="me-1 text-muted" size={12} />
                            {alumno.email}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              ) : (
                <Alert variant="info" className="text-center py-4">
                  <Info className="me-2" />
                  No hay alumnos inscritos en esta clase
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowViewAlumnosModal(false)}>
            Cerrar
          </Button>
          <Button 
            variant="success" 
            onClick={() => {
              setShowViewAlumnosModal(false);
              setShowAssignAlumnosModal(true);
            }}
            className="d-inline-flex align-items-center"
          >
            <PersonPlus className="me-2" /> Agregar Alumnos
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditHorariosModal} onHide={() => setShowEditHorariosModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <Clock className="me-2 text-primary" />
            Horarios - {selectedClase?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClase && (
            <Form>
              {selectedClase.horarios?.map((horario, index) => (
                <div key={index} className="d-flex align-items-center mb-3 p-3 border rounded bg-light">
                  <div className="flex-grow-1">
                    <Row className="g-2">
                      <Col md={4}>
                        <Form.Select
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
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          type="time"
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
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          type="time"
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
                      </Col>
                    </Row>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="ms-2 d-inline-flex align-items-center"
                    onClick={() => {
                      const nuevosHorarios = selectedClase.horarios.filter((_, i) => i !== index);
                      setSelectedClase({
                        ...selectedClase,
                        horarios: nuevosHorarios
                      });
                    }}
                  >
                    <Trash size={14} />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline-success"
                className="mt-2 d-inline-flex align-items-center"
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
                <Plus className="me-2" /> Agregar horario
              </Button>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowEditHorariosModal(false)} className="d-inline-flex align-items-center">
            <X className="me-2" /> Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateHorarios}
            disabled={updating || !selectedClase?.horarios?.length}
            className="d-inline-flex align-items-center"
          >
            <Save className="me-2" />
            {updating ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAssignMaestrosModal} onHide={() => setShowAssignMaestrosModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <Person className="me-2 text-primary" />
            Asignar Maestros - {selectedClase?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClase && (
            <>
              {selectedClase.maestros && selectedClase.maestros.length > 0 && (
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-2">
                    <PersonCheck className="text-success me-2" />
                    <h6 className="mb-0">Maestros actuales ({selectedClase.maestros.length})</h6>
                  </div>
                  <div className="border rounded p-2 bg-light" style={{ maxHeight: '80px', overflowY: 'auto' }}>
                    {selectedClase.maestros.map(maestro => (
                      <Badge bg="info" className="me-2 mb-1 px-3 py-2" key={maestro.id}>
                        {maestro.nombre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Form.Group>
                <div className="d-flex align-items-center mb-2">
                  <PersonPlus className="text-primary me-2" />
                  <Form.Label className="fw-bold mb-0">Maestros disponibles</Form.Label>
                </div>
                {getMaestrosDisponibles(selectedClase).length === 0 ? (
                  <Alert variant="info">
                    <Info className="me-2" />
                    No hay maestros disponibles para agregar
                  </Alert>
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
                      {getMaestrosDisponibles(selectedClase).map((maestro) => (
                        <option key={maestro.id} value={maestro.id}>
                          {maestro.firstname} {maestro.lastname} - {maestro.email}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted d-block mb-2">
                      <small>Ctrl + clic para seleccionar múltiples</small>
                    </Form.Text>
                    <div className="d-flex gap-2">
                      <Badge bg="info" className="px-3 py-2">
                        Disponibles: {getMaestrosDisponibles(selectedClase).length}
                      </Badge>
                      {selectedMaestros.length > 0 && (
                        <Badge bg="success" className="px-3 py-2">
                          Seleccionados: {selectedMaestros.length}
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowAssignMaestrosModal(false)} className="d-inline-flex align-items-center">
            <X className="me-2" /> Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAssignMaestros}
            disabled={updating || selectedMaestros.length === 0}
            className="d-inline-flex align-items-center"
          >
            <Save className="me-2" />
            {updating ? 'Asignando...' : `Asignar (${selectedMaestros.length})`}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAssignAlumnosModal} onHide={() => setShowAssignAlumnosModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <People className="me-2 text-primary" />
            Agregar Alumnos - {selectedClase?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClase && (
            <>
              {selectedClase.alumnos && selectedClase.alumnos.length > 0 && (
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-2">
                    <PersonCheck className="text-success me-2" />
                    <h6 className="mb-0">Alumnos actuales ({selectedClase.alumnos.length})</h6>
                  </div>
                  <div className="border rounded p-2 bg-light" style={{ maxHeight: '80px', overflowY: 'auto' }}>
                    {selectedClase.alumnos.map(alumno => (
                      <Badge bg="success" className="me-2 mb-1 px-3 py-2" key={alumno.id}>
                        {alumno.nombre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Form.Group>
                <div className="d-flex align-items-center mb-2">
                  <PersonPlus className="text-primary me-2" />
                  <Form.Label className="fw-bold mb-0">Alumnos disponibles</Form.Label>
                </div>
                {getAlumnosDisponibles(selectedClase).length === 0 ? (
                  <Alert variant="info">
                    <Info className="me-2" />
                    No hay alumnos disponibles para agregar
                  </Alert>
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
                      {getAlumnosDisponibles(selectedClase).map((alumno) => (
                        <option key={alumno.id} value={alumno.id}>
                          {alumno.firstname} {alumno.lastname} - {alumno.email}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted d-block mb-2">
                      <small>Ctrl + clic para seleccionar múltiples</small>
                    </Form.Text>
                    <div className="d-flex gap-2">
                      <Badge bg="info" className="px-3 py-2">
                        Disponibles: {getAlumnosDisponibles(selectedClase).length}
                      </Badge>
                      {selectedAlumnos.length > 0 && (
                        <Badge bg="success" className="px-3 py-2">
                          Seleccionados: {selectedAlumnos.length}
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowAssignAlumnosModal(false)} className="d-inline-flex align-items-center">
            <X className="me-2" /> Cancelar
          </Button>
          <Button 
            variant="success" 
            onClick={handleAssignAlumnos}
            disabled={updating || selectedAlumnos.length === 0}
            className="d-inline-flex align-items-center"
          >
            <Save className="me-2" />
            {updating ? 'Agregando...' : `Agregar (${selectedAlumnos.length})`}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminClasses;