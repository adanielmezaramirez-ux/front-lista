import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Alert, Badge, Card, Row, Col, Tabs, Tab, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { adminService } from '../../services/adminService';
import { usersService } from '../../services/usersService';
import { Clase, User, Maestro, Alumno, Horario } from '../../interfaces';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  PersonPlus, 
  PersonDash, 
  People, 
  Book, 
  Clock, 
  Calendar, 
  Trash,
  PencilSquare,
  PlusCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search
} from 'react-bootstrap-icons';

const AdminClasses: React.FC = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignMaestrosModal, setShowAssignMaestrosModal] = useState(false);
  const [showAssignAlumnosModal, setShowAssignAlumnosModal] = useState(false);
  const [showEditHorariosModal, setShowEditHorariosModal] = useState(false);
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el formulario de creación
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    horarios: [] as Horario[],
    maestrosIds: [] as number[],
    capacidad_maxima: 30
  });

  // Estado para horarios temporales
  const [nuevoHorario, setNuevoHorario] = useState({
    dia_semana: 1,
    hora_inicio: '08:00:00',
    hora_fin: '10:00:00'
  });

  const [selectedMaestros, setSelectedMaestros] = useState<number[]>([]);
  const [selectedAlumnos, setSelectedAlumnos] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);

  // Días de la semana en español
  const diasSemana = [
    { value: 1, label: 'Lunes', abbr: 'Lun' },
    { value: 2, label: 'Martes', abbr: 'Mar' },
    { value: 3, label: 'Miércoles', abbr: 'Mié' },
    { value: 4, label: 'Jueves', abbr: 'Jue' },
    { value: 5, label: 'Viernes', abbr: 'Vie' },
    { value: 6, label: 'Sábado', abbr: 'Sáb' },
    { value: 7, label: 'Domingo', abbr: 'Dom' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clasesData, usersData] = await Promise.all([
        adminService.getClasses(),
        adminService.getUsers()
      ]);
      
      setUsers(usersData);
      setClases(clasesData);
    } catch (error) {
      setError('Error al cargar datos');
      console.error(error);
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
        descripcion: '',
        horarios: [], 
        maestrosIds: [],
        capacidad_maxima: 30
      });
      setSuccess('Clase creada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error al crear clase');
      console.error(error);
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
      setSuccess('Maestros asignados exitosamente');
      setTimeout(() => setSuccess(''), 3000);
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
      setSuccess('Alumnos asignados exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error al asignar alumnos');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditHorarios = async () => {
    if (!selectedClase) return;

    setUpdating(true);
    try {
      await adminService.updateHorarios(selectedClase.id, selectedClase.horarios);
      await fetchData();
      setShowEditHorariosModal(false);
      setSelectedClase(null);
      setSuccess('Horarios actualizados exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error al actualizar horarios');
    } finally {
      setUpdating(false);
    }
  };

  const toggleCard = (claseId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(claseId)) {
      newExpanded.delete(claseId);
    } else {
      newExpanded.add(claseId);
    }
    setExpandedCards(newExpanded);
  };

  const getMaestros = () => users.filter(u => u.role_name === 'maestro');
  const getAlumnos = () => users.filter(u => u.role_name === 'alumno');

  const getDiaSemanaNombre = (dia: number) => {
    return diasSemana.find(d => d.value === dia)?.abbr || 'Desconocido';
  };

  const formatearHorario = (horario: Horario) => {
    return `${getDiaSemanaNombre(horario.dia_semana)} ${horario.hora_inicio.substring(0,5)}-${horario.hora_fin.substring(0,5)}`;
  };

  const filtrarClases = () => {
    return clases.filter(clase => 
      clase.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clase.maestros?.some(m => m.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getCapacidadColor = (actual: number, maxima: number = 30) => {
    const porcentaje = (actual / maxima) * 100;
    if (porcentaje >= 90) return 'danger';
    if (porcentaje >= 70) return 'warning';
    return 'success';
  };

  if (loading) return <LoadingSpinner />;

  const clasesFiltradas = filtrarClases();

  return (
    <div className="container-fluid py-4">
      {/* Header con estadísticas */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <Book size={40} className="me-3" />
              <div>
                <h6 className="mb-0">Total Clases</h6>
                <h2 className="mb-0">{clases.length}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <People size={40} className="me-3" />
              <div>
                <h6 className="mb-0">Total Alumnos</h6>
                <h2 className="mb-0">
                  {clases.reduce((acc, clase) => acc + (clase.total_alumnos || 0), 0)}
                </h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-info text-white">
            <Card.Body className="d-flex align-items-center">
              <PersonPlus size={40} className="me-3" />
              <div>
                <h6 className="mb-0">Maestros</h6>
                <h2 className="mb-0">{getMaestros().length}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-warning text-white">
            <Card.Body className="d-flex align-items-center">
              <Clock size={40} className="me-3" />
              <div>
                <h6 className="mb-0">Horas Semanales</h6>
                <h2 className="mb-0">
                  {clases.reduce((acc, clase) => acc + (clase.horarios?.length || 0) * 2, 0)}
                </h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Barra de búsqueda y acciones */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6}>
              <div className="d-flex align-items-center">
                <Search className="text-muted me-2" />
                <Form.Control
                  type="text"
                  placeholder="Buscar clases por nombre o maestro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </Col>
            <Col md={6} className="text-end">
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <PlusCircle className="me-2" /> Nueva Clase
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Alertas */}
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      {/* Grid de Clases */}
      {clasesFiltradas.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <Book size={50} className="text-muted mb-3" />
            <h4>No hay clases disponibles</h4>
            <p className="text-muted">Comienza creando una nueva clase</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <PlusCircle className="me-2" /> Crear Primera Clase
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {clasesFiltradas.map((clase) => (
            <Col lg={6} xl={4} key={clase.id}>
              <Card className="mb-4 h-100 shadow-sm hover-shadow">
                <Card.Header className={`bg-${getCapacidadColor(clase.total_alumnos || 0, clase.capacidad_maxima)} text-white d-flex justify-content-between align-items-center`}>
                  <h5 className="mb-0">{clase.nombre}</h5>
                  <Badge bg="light" text="dark">
                    {clase.total_alumnos || 0}/{clase.capacidad_maxima || 30} alumnos
                  </Badge>
                </Card.Header>
                <Card.Body>
                  {/* Horarios en formato compacto */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <Clock className="text-primary me-2" />
                      <strong>Horarios:</strong>
                      <Button
                        variant="link"
                        size="sm"
                        className="ms-auto p-0"
                        onClick={() => {
                          setSelectedClase(clase);
                          setShowEditHorariosModal(true);
                        }}
                      >
                        <PencilSquare size={14} />
                      </Button>
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {clase.horarios && clase.horarios.length > 0 ? (
                        clase.horarios.map((h, idx) => (
                          <OverlayTrigger
                            key={idx}
                            placement="top"
                            overlay={
                              <Tooltip>
                                {diasSemana.find(d => d.value === h.dia_semana)?.label}:{' '}
                                {h.hora_inicio.substring(0,5)} - {h.hora_fin.substring(0,5)}
                              </Tooltip>
                            }
                          >
                            <Badge bg="info" pill className="p-2">
                              {formatearHorario(h)}
                            </Badge>
                          </OverlayTrigger>
                        ))
                      ) : (
                        <span className="text-muted small">Sin horarios</span>
                      )}
                    </div>
                  </div>

                  {/* Vista previa de maestros */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <PersonPlus className="text-success me-2" />
                      <strong>Maestros:</strong>
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {clase.maestros && clase.maestros.length > 0 ? (
                        clase.maestros.slice(0, 2).map((m) => (
                          <Badge bg="secondary" pill key={m.id}>
                            {m.nombre}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted small">Sin maestros</span>
                      )}
                      {clase.maestros && clase.maestros.length > 2 && (
                        <Badge bg="light" text="dark" pill>
                          +{clase.maestros.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Contenido expandible */}
                  {expandedCards.has(clase.id) && (
                    <div className="mt-3 pt-3 border-top">
                      {/* Lista completa de maestros */}
                      {clase.maestros && clase.maestros.length > 0 && (
                        <div className="mb-3">
                          <strong className="small">Todos los maestros:</strong>
                          <ul className="list-unstyled mt-2">
                            {clase.maestros.map((m) => (
                              <li key={m.id} className="small mb-1">
                                • {m.nombre}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Descripción de la clase */}
                      {clase.descripcion && (
                        <div className="mb-3">
                          <strong className="small">Descripción:</strong>
                          <p className="small text-muted mt-1">{clase.descripcion}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="flex-grow-1"
                      onClick={() => {
                        setSelectedClase(clase);
                        setSelectedMaestros(clase.maestros?.map(m => m.id) || []);
                        setShowAssignMaestrosModal(true);
                      }}
                    >
                      <PersonPlus className="me-1" /> Maestros
                    </Button>
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="flex-grow-1"
                      onClick={() => {
                        setSelectedClase(clase);
                        setSelectedAlumnos([]);
                        setShowAssignAlumnosModal(true);
                      }}
                    >
                      <People className="me-1" /> Alumnos
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => toggleCard(clase.id)}
                    >
                      {expandedCards.has(clase.id) ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                  </div>
                </Card.Body>
                <Card.Footer className="bg-white text-muted small">
                  <Calendar className="me-1" size={12} />
                  Creada: {new Date(clase.created_at).toLocaleDateString()}
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Modal Crear Clase - Mejorado */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <Book className="me-2" /> Crear Nueva Clase
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de la Clase *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej: Ingles"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Breve descripción de la clase..."
              />
            </Form.Group>

            {/* Sección de Horarios - Mejorada */}
            <Form.Group className="mb-3">
              <Form.Label className="d-flex align-items-center">
                <Clock className="me-2" /> Horarios de la Clase *
              </Form.Label>
              
              {/* Lista de horarios con diseño mejorado */}
              <div className="mb-3">
                {formData.horarios.map((horario, index) => (
                  <div key={index} className="d-flex align-items-center mb-2 p-2 bg-light rounded">
                    <div className="flex-grow-1">
                      <Badge bg="primary" className="me-2">
                        {diasSemana.find(d => d.value === horario.dia_semana)?.label}
                      </Badge>
                      <span className="fw-bold">
                        {horario.hora_inicio.substring(0,5)} - {horario.hora_fin.substring(0,5)}
                      </span>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => eliminarHorario(index)}
                    >
                      <Trash size={14} />
                    </Button>
                  </div>
                ))}
                {formData.horarios.length === 0 && (
                  <div className="text-center p-3 bg-light rounded text-muted">
                    No hay horarios agregados
                  </div>
                )}
              </div>

              {/* Formulario mejorado para agregar horario */}
              <Card className="bg-light border">
                <Card.Body>
                  <h6 className="mb-3">Agregar nuevo horario</h6>
                  <Row className="g-2">
                    <Col md={3}>
                      <Form.Select
                        size="sm"
                        value={nuevoHorario.dia_semana}
                        onChange={(e) => setNuevoHorario({
                          ...nuevoHorario,
                          dia_semana: Number(e.target.value)
                        })}
                      >
                        {diasSemana.map(dia => (
                          <option key={dia.value} value={dia.value}>
                            {dia.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Control
                        size="sm"
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
                        size="sm"
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
                        size="sm"
                        onClick={agregarHorario}
                        className="w-100"
                      >
                        <PlusCircle className="me-1" /> Agregar
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Maestros (opcional)</Form.Label>
              <Form.Select
                multiple
                value={formData.maestrosIds.map(String)}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                  setFormData({...formData, maestrosIds: selected});
                }}
                style={{ minHeight: '120px' }}
                size="sm"
              >
                {getMaestros().map((maestro) => (
                  <option key={maestro.id} value={maestro.id}>
                    {maestro.firstname} {maestro.lastname}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted small">
                Ctrl + clic para seleccionar múltiples
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
            disabled={updating || !formData.nombre || formData.horarios.length === 0}
          >
            {updating ? 'Creando...' : 'Crear Clase'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Editar Horarios - Mejorado */}
      <Modal show={showEditHorariosModal} onHide={() => setShowEditHorariosModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <Clock className="me-2" /> Editar Horarios - {selectedClase?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClase && (
            <Form>
              <div className="mb-3">
                {selectedClase.horarios?.map((horario, index) => (
                  <div key={index} className="d-flex align-items-center mb-3 p-3 bg-light rounded">
                    <Row className="w-100 g-2">
                      <Col md={4}>
                        <Form.Select
                          size="sm"
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
                          {diasSemana.map(dia => (
                            <option key={dia.value} value={dia.value}>
                              {dia.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          size="sm"
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
                          size="sm"
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
                      <Col md={2}>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="w-100"
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
                      </Col>
                    </Row>
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
                  <PlusCircle className="me-1" /> Agregar horario
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditHorariosModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEditHorarios}
            disabled={updating || !selectedClase?.horarios?.length}
          >
            {updating ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Asignar Maestros - Mejorado */}
      <Modal show={showAssignMaestrosModal} onHide={() => setShowAssignMaestrosModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <PersonPlus className="me-2" /> Asignar Maestros - {selectedClase?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="disponibles" className="mb-3">
            <Tab eventKey="disponibles" title="Maestros Disponibles">
              <Form.Group>
                <Form.Select
                  multiple
                  value={selectedMaestros.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                    setSelectedMaestros(selected);
                  }}
                  style={{ minHeight: '250px' }}
                >
                  {getMaestros().map((maestro) => (
                    <option key={maestro.id} value={maestro.id}>
                      {maestro.firstname} {maestro.lastname} - {maestro.email}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Tab>
            <Tab eventKey="seleccionados" title={`Seleccionados (${selectedMaestros.length})`}>
              {selectedMaestros.length > 0 ? (
                <ul className="list-unstyled">
                  {getMaestros()
                    .filter(m => selectedMaestros.includes(m.id))
                    .map(m => (
                      <li key={m.id} className="mb-2 p-2 bg-light rounded">
                        <strong>{m.firstname} {m.lastname}</strong>
                        <br />
                        <small className="text-muted">{m.email}</small>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-muted text-center py-4">No hay maestros seleccionados</p>
              )}
            </Tab>
          </Tabs>
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
            {updating ? 'Asignando...' : `Asignar ${selectedMaestros.length} Maestro(s)`}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Asignar Alumnos - Mejorado */}
      <Modal show={showAssignAlumnosModal} onHide={() => setShowAssignAlumnosModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <People className="me-2" /> Asignar Alumnos - {selectedClase?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="disponibles" className="mb-3">
            <Tab eventKey="disponibles" title="Alumnos Disponibles">
              <Form.Group>
                <Form.Select
                  multiple
                  value={selectedAlumnos.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                    setSelectedAlumnos(selected);
                  }}
                  style={{ minHeight: '250px' }}
                >
                  {getAlumnos().map((alumno) => (
                    <option key={alumno.id} value={alumno.id}>
                      {alumno.firstname} {alumno.lastname} - {alumno.email}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Tab>
            <Tab eventKey="seleccionados" title={`Seleccionados (${selectedAlumnos.length})`}>
              {selectedAlumnos.length > 0 ? (
                <ul className="list-unstyled">
                  {getAlumnos()
                    .filter(a => selectedAlumnos.includes(a.id))
                    .map(a => (
                      <li key={a.id} className="mb-2 p-2 bg-light rounded">
                        <strong>{a.firstname} {a.lastname}</strong>
                        <br />
                        <small className="text-muted">{a.email}</small>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-muted text-center py-4">No hay alumnos seleccionados</p>
              )}
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignAlumnosModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="success" 
            onClick={handleAssignAlumnos}
            disabled={updating || selectedAlumnos.length === 0}
          >
            {updating ? 'Asignando...' : `Asignar ${selectedAlumnos.length} Alumno(s)`}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .hover-shadow:hover {
          transform: translateY(-2px);
          box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default AdminClasses;