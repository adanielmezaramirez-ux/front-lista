import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Alert, Badge, Card, Row, Col, ButtonGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
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
  Person,
  Pencil,
  PersonDash,
  PeopleFill,
  CalendarCheck,
  CalendarPlus,
  Eye,
  GearFill,
  ChevronDown,
  ChevronUp
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
  const [showEditNombreModal, setShowEditNombreModal] = useState(false);
  const [showRemoveMaestroModal, setShowRemoveMaestroModal] = useState(false);
  const [showRemoveAlumnoModal, setShowRemoveAlumnoModal] = useState(false);
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null);
  const [selectedMaestro, setSelectedMaestro] = useState<User | null>(null);
  const [selectedAlumno, setSelectedAlumno] = useState<User | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [activeViewTab, setActiveViewTab] = useState<'alumnos' | 'maestros'>('alumnos');
  
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

  const toggleCardExpansion = (claseId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(claseId)) {
      newExpanded.delete(claseId);
    } else {
      newExpanded.add(claseId);
    }
    setExpandedCards(newExpanded);
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

  const handleUpdateNombre = async () => {
    if (!selectedClase) return;
    if (!nuevoNombre.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }

    setUpdating(true);
    try {
      await adminService.updateClassName(selectedClase.id, nuevoNombre);
      await fetchData();
      setShowEditNombreModal(false);
      setSelectedClase(null);
      setNuevoNombre('');
    } catch (error) {
      console.error('Error updating class name:', error);
      setError('Error al actualizar el nombre');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMaestro = async () => {
    if (!selectedClase || !selectedMaestro) return;

    setUpdating(true);
    try {
      await adminService.removerMaestro(selectedClase.id, selectedMaestro.id);
      await fetchData();
      setShowRemoveMaestroModal(false);
      setSelectedClase(null);
      setSelectedMaestro(null);
    } catch (error) {
      console.error('Error removing maestro:', error);
      setError('Error al eliminar maestro');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveAlumno = async () => {
    if (!selectedClase || !selectedAlumno) return;

    setUpdating(true);
    try {
      await adminService.removerAlumno(selectedClase.id, selectedAlumno.id);
      await fetchData();
      setShowRemoveAlumnoModal(false);
      setSelectedClase(null);
      setSelectedAlumno(null);
    } catch (error) {
      console.error('Error removing alumno:', error);
      setError('Error al eliminar alumno');
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

  const getInitials = (nombre: string) => {
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-0 py-3">
      {/* Header con diseño mejorado */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="mb-2 d-flex align-items-center">
            <Book className="text-primary me-3" size={32} />
            Gestión de Clases
          </h2>
          <div className="d-flex align-items-center text-muted small flex-wrap gap-2">
            <PeopleFill className="me-1" size={14} />
            <span>Total clases: <strong>{clases.length}</strong></span>
            <span className="badge bg-light text-dark ms-2">
              <CalendarCheck className="me-1" size={12} />
              Con horarios: {clases.filter(c => c.horarios?.length > 0).length}
            </span>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            onClick={fetchData}
            className="d-flex align-items-center"
            size="sm"
          >
            <Clock className="me-2" /> Actualizar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
            className="d-flex align-items-center shadow-sm"
          >
            <Plus className="me-2" size={18} /> Nueva Clase
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-4">
          <Info className="me-2" /> {error}
        </Alert>
      )}

      {/* Grid de clases con diseño mejorado */}
      <Row xs={1} md={2} lg={3} className="g-4">
        {clases.map((clase) => {
          const alumnosInscritos = clase.alumnos?.length || 0;
          const maestrosAsignados = clase.maestros?.length || 0;
          const isExpanded = expandedCards.has(clase.id);
          const horariosCount = clase.horarios?.length || 0;
          const primerosAlumnos = clase.alumnos?.slice(0, 3) || [];
          const alumnosRestantes = (clase.alumnos?.length || 0) - 3;
          
          return (
            <Col key={clase.id}>
              <Card className="h-100 border-0 shadow-sm hover-shadow transition-all">
                {/* Header con gradiente */}
                <Card.Header className="bg-gradient-primary text-white border-0 py-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-center">
                      <div>
                        <h6 className="mb-0 fw-bold">{clase.nombre}</h6>
                        <small className="text-white-50">
                          ID: #{clase.id}
                        </small>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Editar nombre</Tooltip>}
                      >
                        <Button
                          variant="light"
                          size="sm"
                          className="rounded-circle p-1"
                          style={{ width: '28px', height: '28px' }}
                          onClick={() => {
                            setSelectedClase(clase);
                            setNuevoNombre(clase.nombre);
                            setShowEditNombreModal(true);
                          }}
                        >
                          <Pencil size={14} />
                        </Button>
                      </OverlayTrigger>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Gestionar horarios</Tooltip>}
                      >
                        <Button
                          variant="light"
                          size="sm"
                          className="rounded-circle p-1"
                          style={{ width: '28px', height: '28px' }}
                          onClick={() => {
                            setSelectedClase(clase);
                            setShowEditHorariosModal(true);
                          }}
                        >
                          <Clock size={14} />
                        </Button>
                      </OverlayTrigger>
                    </div>
                  </div>
                </Card.Header>

                <Card.Body className="p-3">
                  {/* Estadísticas rápidas */}
                  <div className="d-flex justify-content-around mb-3">
                    <div className="text-center">
                      <div className="bg-light rounded-circle p-2 mx-auto mb-1" style={{ width: '40px', height: '40px' }}>
                        <CalendarCheck className="text-primary" size={20} />
                      </div>
                      <small className="d-block fw-bold">{horariosCount}</small>
                      <small className="text-muted">Horarios</small>
                    </div>
                    <div className="text-center">
                      <div className="bg-light rounded-circle p-2 mx-auto mb-1" style={{ width: '40px', height: '40px' }}>
                        <Person className="text-info" size={20} />
                      </div>
                      <small className="d-block fw-bold">{maestrosAsignados}</small>
                      <small className="text-muted">Maestros</small>
                    </div>
                    <div className="text-center">
                      <div className="bg-light rounded-circle p-2 mx-auto mb-1" style={{ width: '40px', height: '40px' }}>
                        <People className="text-success" size={20} />
                      </div>
                      <small className="d-block fw-bold">{alumnosInscritos}</small>
                      <small className="text-muted">Alumnos</small>
                    </div>
                  </div>

                  {/* Horarios */}
                  <div className="mb-3">
                    <small className="text-muted d-block mb-2 fw-semibold">
                      <Clock className="me-1" size={12} /> Horarios:
                    </small>
                    <div className="d-flex flex-wrap gap-1">
                      {clase.horarios && clase.horarios.length > 0 ? (
                        clase.horarios.slice(0, isExpanded ? undefined : 2).map((h, idx) => (
                          <Badge 
                            bg="light" 
                            text="dark" 
                            className="px-2 py-1 border"
                            key={idx}
                          >
                            {getDiaSemanaNombre(h.dia_semana).substring(0,3)} {h.hora_inicio.substring(0,5)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted small fst-italic">Sin horarios</span>
                      )}
                      {!isExpanded && clase.horarios && clase.horarios.length > 2 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-primary"
                          onClick={() => toggleCardExpansion(clase.id)}
                        >
                          +{clase.horarios.length - 2} más
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Maestros */}
                  <div className="mb-3">
                    <small className="text-muted d-block mb-2 fw-semibold">
                      <Person className="me-1" size={12} /> Maestros:
                    </small>
                    <div className="d-flex flex-wrap gap-1">
                      {clase.maestros && clase.maestros.length > 0 ? (
                        clase.maestros.slice(0, 2).map((m) => (
                          <Badge 
                            bg="info" 
                            className="px-2 py-1 d-inline-flex align-items-center"
                            key={m.id}
                          >
                            {m.nombre.split(' ')[0]}
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 ms-2 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClase(clase);
                                setSelectedMaestro({
                                  id: m.id,
                                  username: m.email?.split('@')[0] || '',
                                  firstname: m.nombre.split(' ')[0],
                                  lastname: m.nombre.split(' ').slice(1).join(' ') || '',
                                  email: m.email || '',
                                  roles: ['maestro']
                                });
                                setShowRemoveMaestroModal(true);
                              }}
                            >
                              <X size={10} />
                            </Button>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted small fst-italic">Sin maestros</span>
                      )}
                      {clase.maestros && clase.maestros.length > 2 && (
                        <small className="text-muted ms-1">
                          +{clase.maestros.length - 2}
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Alumnos - Versión compacta */}
                  <div>
                    <small className="text-muted d-block mb-2 fw-semibold">
                      <People className="me-1" size={12} /> Alumnos:
                    </small>
                    {primerosAlumnos.length > 0 ? (
                      <div className="d-flex flex-column gap-1">
                        {primerosAlumnos.map((alumno) => (
                          <div key={alumno.id} className="d-flex align-items-center justify-content-between bg-light p-2 rounded">
                            <div className="d-flex align-items-center">
                              <div className="bg-success bg-opacity-10 rounded-circle p-1 me-2">
                                <PersonCheck className="text-success" size={12} />
                              </div>
                              <small className="fw-semibold">{alumno.nombre}</small>
                            </div>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-danger"
                              onClick={() => {
                                setSelectedClase(clase);
                                setSelectedAlumno({
                                  id: alumno.id,
                                  username: alumno.email?.split('@')[0] || '',
                                  firstname: alumno.nombre.split(' ')[0],
                                  lastname: alumno.nombre.split(' ').slice(1).join(' ') || '',
                                  email: alumno.email || '',
                                  roles: ['alumno']
                                });
                                setShowRemoveAlumnoModal(true);
                              }}
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        ))}
                        {alumnosRestantes > 0 && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-primary text-start"
                            onClick={() => {
                              setSelectedClase(clase);
                              setShowViewAlumnosModal(true);
                            }}
                          >
                            <small>+ {alumnosRestantes} alumnos más</small>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted small fst-italic">Sin alumnos</span>
                    )}
                  </div>

                  {/* Botón para ver más/expandir */}
                  {clase.horarios && clase.horarios.length > 2 && !isExpanded && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 mt-2 text-primary w-100"
                      onClick={() => toggleCardExpansion(clase.id)}
                    >
                      <ChevronDown className="me-1" /> Ver más horarios
                    </Button>
                  )}
                  {isExpanded && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 mt-2 text-primary w-100"
                      onClick={() => toggleCardExpansion(clase.id)}
                    >
                      <ChevronUp className="me-1" /> Ver menos
                    </Button>
                  )}
                </Card.Body>

                <Card.Footer className="bg-white border-top-0 p-3">
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="flex-fill d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setSelectedClase(clase);
                        setShowViewAlumnosModal(true);
                      }}
                    >
                      <Eye className="me-2" size={14} /> Ver
                    </Button>
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="flex-fill d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setSelectedClase(clase);
                        setSelectedMaestros(clase.maestros?.map(m => m.id) || []);
                        setShowAssignMaestrosModal(true);
                      }}
                    >
                      <PersonPlus className="me-2" size={14} /> Maestros
                    </Button>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="flex-fill d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setSelectedClase(clase);
                        setSelectedAlumnos([]);
                        setShowAssignAlumnosModal(true);
                      }}
                    >
                      <People className="me-2" size={14} /> Alumnos
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          );
        })}

        {/* Card para crear nueva clase (vacía) */}
        {clases.length === 0 && (
          <Col>
            <Card className="h-100 border-2 border-dashed bg-light">
              <Card.Body className="d-flex flex-column align-items-center justify-content-center p-5">
                <div className="bg-primary bg-opacity-10 rounded-circle p-4 mb-3">
                  <Book size={48} className="text-primary" />
                </div>
                <h6 className="text-center mb-2">No hay clases creadas</h6>
                <p className="text-muted text-center small mb-3">
                  Comienza creando una nueva clase para gestionar horarios, maestros y alumnos
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => setShowCreateModal(true)}
                  className="d-flex align-items-center"
                >
                  <Plus className="me-2" /> Crear primera clase
                </Button>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Modal Crear Clase (mejorado) */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            Crear Nueva Clase
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold d-flex align-items-center">
                <Book className="me-2 text-primary" size={16} />
                Nombre de la clase
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ej: Matemáticas Avanzadas"
                className="py-2"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold d-flex align-items-center">
                <Clock className="me-2 text-primary" size={16} />
                Horarios
              </Form.Label>
              
              <div className="mb-3">
                {formData.horarios.map((horario, index) => (
                  <div key={index} className="d-flex align-items-center mb-2 p-2 border rounded bg-light">
                    <div className="flex-grow-1 d-flex align-items-center">
                      <Badge bg="primary" className="me-3 px-3 py-2">
                        {getDiaSemanaNombre(horario.dia_semana).substring(0,3)}
                      </Badge>
                      <span className="text-muted">
                        {horario.hora_inicio.substring(0,5)} - {horario.hora_fin.substring(0,5)}
                      </span>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => eliminarHorario(index)}
                      className="rounded-circle p-1"
                      style={{ width: '30px', height: '30px' }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>

              <Card className="bg-light border-0">
                <Card.Body>
                  <h6 className="mb-3">Agregar nuevo horario</h6>
                  <Row className="g-2 align-items-end">
                    <Col md={4}>
                      <Form.Select
                        value={nuevoHorario.dia_semana}
                        onChange={(e) => setNuevoHorario({
                          ...nuevoHorario,
                          dia_semana: Number(e.target.value)
                        })}
                        size="sm"
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
                        size="sm"
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
                        size="sm"
                      />
                    </Col>
                    <Col md={2}>
                      <Button 
                        variant="success" 
                        onClick={agregarHorario}
                        className="w-100 d-flex align-items-center justify-content-center"
                        size="sm"
                      >
                        <Plus className="me-1" size={14} /> Agregar
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Form.Group>

            <Form.Group>
              <Form.Label className="fw-semibold d-flex align-items-center">
                <Person className="me-2 text-primary" size={16} />
                Maestros
              </Form.Label>
              {getMaestros().length === 0 ? (
                <Alert variant="warning" className="d-flex align-items-center">
                  <Info className="me-2" size={18} />
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
                    className="mb-2"
                  >
                    {getMaestros().map((maestro) => (
                      <option key={maestro.id} value={maestro.id}>
                        {maestro.firstname} {maestro.lastname} - {maestro.email}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    <small>⌘/Ctrl + clic para seleccionar múltiples</small>
                  </Form.Text>
                </>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light border-0">
          <Button variant="light" onClick={() => setShowCreateModal(false)} className="px-4">
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateClass}
            disabled={updating || !formData.nombre || formData.horarios.length === 0}
            className="px-4 d-flex align-items-center"
          >
            {updating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Creando...
              </>
            ) : (
              <>
                <Save className="me-2" size={16} />
                Crear Clase
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Editar Nombre */}
      <Modal show={showEditNombreModal} onHide={() => setShowEditNombreModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <Pencil className="me-2 text-primary" size={20} />
            Editar Nombre de Clase
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nuevo nombre</Form.Label>
            <Form.Control
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Ingrese el nuevo nombre"
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="light" onClick={() => setShowEditNombreModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateNombre}
            disabled={updating || !nuevoNombre.trim()}
            className="d-flex align-items-center"
          >
            {updating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="me-2" size={14} />
                Guardar Cambios
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Eliminar Maestro */}
      <Modal show={showRemoveMaestroModal} onHide={() => setShowRemoveMaestroModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center text-danger">
            <PersonDash className="me-2" size={20} />
            Confirmar Eliminación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          {selectedClase && selectedMaestro && (
            <>
              <div className="bg-danger bg-opacity-10 rounded-circle p-3 mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <PersonDash size={40} className="text-danger" />
              </div>
              <p className="mb-2">
                ¿Estás seguro de eliminar al maestro?
              </p>
              <h6 className="fw-bold mb-1">{selectedMaestro.firstname} {selectedMaestro.lastname}</h6>
              <p className="text-muted small mb-3">@{selectedMaestro.username}</p>
              <p className="mb-0">
                de la clase <strong className="text-primary">{selectedClase.nombre}</strong>
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light border-0">
          <Button variant="light" onClick={() => setShowRemoveMaestroModal(false)} className="px-4">
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRemoveMaestro}
            disabled={updating}
            className="px-4 d-flex align-items-center"
          >
            {updating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash className="me-2" size={14} />
                Eliminar
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Eliminar Alumno */}
      <Modal show={showRemoveAlumnoModal} onHide={() => setShowRemoveAlumnoModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center text-danger">
            <PersonDash className="me-2" size={20} />
            Confirmar Eliminación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          {selectedClase && selectedAlumno && (
            <>
              <div className="bg-danger bg-opacity-10 rounded-circle p-3 mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <People size={40} className="text-danger" />
              </div>
              <p className="mb-2">
                ¿Estás seguro de eliminar al alumno?
              </p>
              <h6 className="fw-bold mb-1">{selectedAlumno.firstname} {selectedAlumno.lastname}</h6>
              <p className="text-muted small mb-3">{selectedAlumno.email}</p>
              <p className="mb-0">
                de la clase <strong className="text-primary">{selectedClase.nombre}</strong>
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light border-0">
          <Button variant="light" onClick={() => setShowRemoveAlumnoModal(false)} className="px-4">
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRemoveAlumno}
            disabled={updating}
            className="px-4 d-flex align-items-center"
          >
            {updating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash className="me-2" size={14} />
                Eliminar
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Ver Alumnos y Maestros con Tabs */}
      <Modal show={showViewAlumnosModal} onHide={() => setShowViewAlumnosModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <div className="bg-white bg-opacity-20 p-2 rounded-circle me-3">
              <People size={18} className="text-white" />
            </div>
            Detalles - {selectedClase?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedClase && (
            <>
              {/* Tabs de navegación */}
              <div className="border-bottom">
                <div className="d-flex px-3 pt-2">
                  <Button
                    variant="link"
                    className={`text-decoration-none px-3 py-2 border-bottom border-3 ${activeViewTab === 'alumnos' ? 'border-primary text-primary fw-semibold' : 'border-transparent text-muted'}`}
                    onClick={() => setActiveViewTab('alumnos')}
                  >
                    <People className="me-2" size={16} />
                    Alumnos ({selectedClase.alumnos?.length || 0})
                  </Button>
                  <Button
                    variant="link"
                    className={`text-decoration-none px-3 py-2 border-bottom border-3 ${activeViewTab === 'maestros' ? 'border-primary text-primary fw-semibold' : 'border-transparent text-muted'}`}
                    onClick={() => setActiveViewTab('maestros')}
                  >
                    <Person className="me-2" size={16} />
                    Maestros ({selectedClase.maestros?.length || 0})
                  </Button>
                </div>
              </div>

              {/* Contenido de los tabs */}
              <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                {/* Tab Alumnos */}
                {activeViewTab === 'alumnos' && (
                  <>
                    {selectedClase.alumnos && selectedClase.alumnos.length > 0 ? (
                      <>
                        <div className="bg-light p-3 border-bottom">
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="fw-semibold">
                              <People className="me-2 text-primary" size={16} />
                              Lista de Alumnos
                            </span>
                            <Badge bg="info" className="px-3 py-2">
                              <PersonCheck className="me-1" size={12} />
                              Total: {selectedClase.alumnos.length}
                            </Badge>
                          </div>
                        </div>
                        <Table hover className="mb-0">
                          <thead className="bg-light sticky-top">
                            <tr>
                              <th width="50">#</th>
                              <th>Nombre</th>
                              <th>Email</th>
                              <th width="100">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedClase.alumnos.map((alumno, index) => (
                              <tr key={alumno.id}>
                                <td className="fw-semibold">{index + 1}</td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="bg-success bg-opacity-10 rounded-circle p-1 me-2">
                                      <PersonCheck className="text-success" size={12} />
                                    </div>
                                    <span className="fw-semibold">{alumno.nombre}</span>
                                  </div>
                                </td>
                                <td>
                                  <small className="text-muted">
                                    <Envelope className="me-1" size={12} />
                                    {alumno.email}
                                  </small>
                                </td>
                                <td>
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip>Eliminar alumno</Tooltip>}
                                  >
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="rounded-circle p-1"
                                      style={{ width: '30px', height: '30px' }}
                                      onClick={() => {
                                        setSelectedAlumno({
                                          id: alumno.id,
                                          username: alumno.email?.split('@')[0] || '',
                                          firstname: alumno.nombre.split(' ')[0],
                                          lastname: alumno.nombre.split(' ').slice(1).join(' ') || '',
                                          email: alumno.email || '',
                                          roles: ['alumno']
                                        });
                                        setShowViewAlumnosModal(false);
                                        setShowRemoveAlumnoModal(true);
                                      }}
                                    >
                                      <X size={14} />
                                    </Button>
                                  </OverlayTrigger>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </>
                    ) : (
                      <div className="text-center py-5">
                        <div className="bg-light rounded-circle p-4 mx-auto mb-3" style={{ width: '100px', height: '100px' }}>
                          <People size={48} className="text-muted" />
                        </div>
                        <h6 className="text-muted mb-2">No hay alumnos inscritos</h6>
                        <p className="text-muted small mb-3">
                          Esta clase aún no tiene alumnos asignados
                        </p>
                        <Button 
                          variant="primary" 
                          onClick={() => {
                            setShowViewAlumnosModal(false);
                            setShowAssignAlumnosModal(true);
                          }}
                          className="d-inline-flex align-items-center"
                        >
                          <PersonPlus className="me-2" size={16} />
                          Agregar Alumnos
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {/* Tab Maestros */}
                {activeViewTab === 'maestros' && (
                  <>
                    {selectedClase.maestros && selectedClase.maestros.length > 0 ? (
                      <>
                        <div className="bg-light p-3 border-bottom">
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="fw-semibold">
                              <Person className="me-2 text-primary" size={16} />
                              Lista de Maestros
                            </span>
                            <Badge bg="info" className="px-3 py-2">
                              <PersonCheck className="me-1" size={12} />
                              Total: {selectedClase.maestros.length}
                            </Badge>
                          </div>
                        </div>
                        <Table hover className="mb-0">
                          <thead className="bg-light sticky-top">
                            <tr>
                              <th width="50">#</th>
                              <th>Nombre</th>
                              <th>Email</th>
                              <th width="100">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedClase.maestros.map((maestro, index) => (
                              <tr key={maestro.id}>
                                <td className="fw-semibold">{index + 1}</td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="bg-info bg-opacity-10 rounded-circle p-1 me-2">
                                      <Person className="text-info" size={12} />
                                    </div>
                                    <span className="fw-semibold">{maestro.nombre}</span>
                                  </div>
                                </td>
                                <td>
                                  <small className="text-muted">
                                    <Envelope className="me-1" size={12} />
                                    {maestro.email}
                                  </small>
                                </td>
                                <td>
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip>Eliminar maestro</Tooltip>}
                                  >
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="rounded-circle p-1"
                                      style={{ width: '30px', height: '30px' }}
                                      onClick={() => {
                                        setSelectedMaestro({
                                          id: maestro.id,
                                          username: maestro.email?.split('@')[0] || '',
                                          firstname: maestro.nombre.split(' ')[0],
                                          lastname: maestro.nombre.split(' ').slice(1).join(' ') || '',
                                          email: maestro.email || '',
                                          roles: ['maestro']
                                        });
                                        setShowViewAlumnosModal(false);
                                        setShowRemoveMaestroModal(true);
                                      }}
                                    >
                                      <X size={14} />
                                    </Button>
                                  </OverlayTrigger>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </>
                    ) : (
                      <div className="text-center py-5">
                        <div className="bg-light rounded-circle p-4 mx-auto mb-3" style={{ width: '100px', height: '100px' }}>
                          <Person size={48} className="text-muted" />
                        </div>
                        <h6 className="text-muted mb-2">No hay maestros asignados</h6>
                        <p className="text-muted small mb-3">
                          Esta clase aún no tiene maestros asignados
                        </p>
                        <Button 
                          variant="primary" 
                          onClick={() => {
                            setShowViewAlumnosModal(false);
                            setShowAssignMaestrosModal(true);
                          }}
                          className="d-inline-flex align-items-center"
                        >
                          <PersonPlus className="me-2" size={16} />
                          Asignar Maestros
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light border-0">
          <Button variant="light" onClick={() => setShowViewAlumnosModal(false)}>
            Cerrar
          </Button>
          {activeViewTab === 'alumnos' && selectedClase?.alumnos && selectedClase.alumnos.length > 0 && (
            <Button 
              variant="success" 
              onClick={() => {
                setShowViewAlumnosModal(false);
                setShowAssignAlumnosModal(true);
              }}
              className="d-inline-flex align-items-center"
            >
              <PersonPlus className="me-2" size={16} />
              Agregar Alumnos
            </Button>
          )}
          {activeViewTab === 'maestros' && selectedClase?.maestros && selectedClase.maestros.length > 0 && (
            <Button 
              variant="info" 
              onClick={() => {
                setShowViewAlumnosModal(false);
                setShowAssignMaestrosModal(true);
              }}
              className="d-inline-flex align-items-center text-white"
            >
              <PersonPlus className="me-2" size={16} />
              Asignar Maestros
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Modal Editar Horarios (mejorado) */}
      <Modal show={showEditHorariosModal} onHide={() => setShowEditHorariosModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            Horarios - {selectedClase?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedClase && (
            <Form>
              {selectedClase.horarios?.map((horario, index) => (
                <div key={index} className="d-flex align-items-center mb-3 p-3 border rounded bg-light">
                  <div className="flex-grow-1">
                    <Row className="g-2">
                      <Col md={5}>
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
                          size="sm"
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
                          size="sm"
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
                          size="sm"
                        />
                      </Col>
                    </Row>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="ms-2 rounded-circle p-1"
                    style={{ width: '32px', height: '32px' }}
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
                className="mt-2 w-100 d-flex align-items-center justify-content-center"
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
                <Plus className="me-2" size={16} /> Agregar horario
              </Button>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light border-0">
          <Button variant="light" onClick={() => setShowEditHorariosModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateHorarios}
            disabled={updating || !selectedClase?.horarios?.length}
            className="d-flex align-items-center"
          >
            {updating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="me-2" size={14} />
                Guardar Cambios
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Asignar Maestros (mejorado) */}
      <Modal show={showAssignMaestrosModal} onHide={() => setShowAssignMaestrosModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            Asignar Maestros - {selectedClase?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedClase && (
            <>
              {selectedClase.maestros && selectedClase.maestros.length > 0 && (
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-2">
                    <div className="bg-success bg-opacity-10 p-2 rounded-circle me-2">
                      <PersonCheck className="text-success" size={16} />
                    </div>
                    <h6 className="mb-0">Maestros actuales ({selectedClase.maestros.length})</h6>
                  </div>
                  <div className="border rounded p-3 bg-light" style={{ maxHeight: '100px', overflowY: 'auto' }}>
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
                  <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                    <PersonPlus className="text-primary" size={16} />
                  </div>
                  <Form.Label className="fw-semibold mb-0">Maestros disponibles</Form.Label>
                </div>
                {getMaestrosDisponibles(selectedClase).length === 0 ? (
                  <Alert variant="info" className="d-flex align-items-center">
                    <Info className="me-2" size={18} />
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
                      className="mb-2"
                    >
                      {getMaestrosDisponibles(selectedClase).map((maestro) => (
                        <option key={maestro.id} value={maestro.id}>
                          {maestro.firstname} {maestro.lastname} - {maestro.email}
                        </option>
                      ))}
                    </Form.Select>
                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Text className="text-muted">
                        <small>⌘/Ctrl + clic para seleccionar múltiples</small>
                      </Form.Text>
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
        <Modal.Footer className="bg-light border-0">
          <Button variant="light" onClick={() => setShowAssignMaestrosModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAssignMaestros}
            disabled={updating || selectedMaestros.length === 0}
            className="d-flex align-items-center"
          >
            {updating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Asignando...
              </>
            ) : (
              <>
                <Save className="me-2" size={14} />
                Asignar ({selectedMaestros.length})
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Asignar Alumnos (mejorado) */}
      <Modal show={showAssignAlumnosModal} onHide={() => setShowAssignAlumnosModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            Agregar Alumnos - {selectedClase?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedClase && (
            <>
              {selectedClase.alumnos && selectedClase.alumnos.length > 0 && (
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-2">
                    <div className="bg-success bg-opacity-10 p-2 rounded-circle me-2">
                      <PersonCheck className="text-success" size={16} />
                    </div>
                    <h6 className="mb-0">Alumnos actuales ({selectedClase.alumnos.length})</h6>
                  </div>
                  <div className="border rounded p-3 bg-light" style={{ maxHeight: '100px', overflowY: 'auto' }}>
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
                  <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                    <PersonPlus className="text-primary" size={16} />
                  </div>
                  <Form.Label className="fw-semibold mb-0">Alumnos disponibles</Form.Label>
                </div>
                {getAlumnosDisponibles(selectedClase).length === 0 ? (
                  <Alert variant="info" className="d-flex align-items-center">
                    <Info className="me-2" size={18} />
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
                      className="mb-2"
                    >
                      {getAlumnosDisponibles(selectedClase).map((alumno) => (
                        <option key={alumno.id} value={alumno.id}>
                          {alumno.firstname} {alumno.lastname} - {alumno.email}
                        </option>
                      ))}
                    </Form.Select>
                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Text className="text-muted">
                        <small>⌘/Ctrl + clic para seleccionar múltiples</small>
                      </Form.Text>
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
        <Modal.Footer className="bg-light border-0">
          <Button variant="light" onClick={() => setShowAssignAlumnosModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="success" 
            onClick={handleAssignAlumnos}
            disabled={updating || selectedAlumnos.length === 0}
            className="d-flex align-items-center"
          >
            {updating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Agregando...
              </>
            ) : (
              <>
                <Save className="me-2" size={14} />
                Agregar ({selectedAlumnos.length})
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminClasses;