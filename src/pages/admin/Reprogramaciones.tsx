import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Badge,
  Modal,
  Form,
  Alert,
  Row,
  Col,
  InputGroup,
  Spinner
} from 'react-bootstrap';
import { reprogramacionService } from '../../services/reprogramacionService';
import { adminService } from '../../services/adminService';
import { Reprogramacion, getEstadoReprogramacion, DIAS_SEMANA, Horario } from '../../interfaces';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  X,
  InfoCircle,
  Person,
  CalendarCheck,
  CalendarX
} from 'react-bootstrap-icons';

const AdminReprogramaciones: React.FC = () => {
  const [reprogramaciones, setReprogramaciones] = useState<Reprogramacion[]>([]);
  const [filteredReprogramaciones, setFilteredReprogramaciones] = useState<Reprogramacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedReprogramacion, setSelectedReprogramacion] = useState<Reprogramacion | null>(null);
  const [horariosClase, setHorariosClase] = useState<Horario[]>([]);
  const [selectedHorario, setSelectedHorario] = useState<number | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroClase, setFiltroClase] = useState<string>('todos');
  const [clases, setClases] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filtrarReprogramaciones();
  }, [reprogramaciones, searchTerm, filtroEstado, filtroClase]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reprogData, clasesData] = await Promise.all([
        reprogramacionService.getReprogramaciones(),
        adminService.getClasses()
      ]);
      setReprogramaciones(reprogData);
      setFilteredReprogramaciones(reprogData);
      setClases(clasesData);
    } catch (error) {
      console.error('Error fetching reprogramaciones:', error);
      setError('Error al cargar reprogramaciones');
    } finally {
      setLoading(false);
    }
  };

  const filtrarReprogramaciones = () => {
    let filtered = [...reprogramaciones];
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.clase_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.motivo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filtroEstado !== 'todos') {
      filtered = filtered.filter(r => r.estado === filtroEstado);
    }
    if (filtroClase !== 'todos') {
      filtered = filtered.filter(r => r.clase_id === Number(filtroClase));
    }
    setFilteredReprogramaciones(filtered);
  };

  const handleProcesar = async (estado: 'aprobada' | 'rechazada') => {
    if (!selectedReprogramacion) return;
    setProcesando(true);
    try {
      await reprogramacionService.procesarReprogramacion(selectedReprogramacion.id, {
        estado,
        horarioReprogramadoId: selectedHorario || undefined
      });
      await fetchData();
      setShowModal(false);
      setSelectedReprogramacion(null);
      setSelectedHorario(null);
    } catch (error) {
      console.error('Error procesando reprogramación:', error);
      setError('Error al procesar la solicitud');
    } finally {
      setProcesando(false);
    }
  };

  const abrirModal = async (reprog: Reprogramacion) => {
    setSelectedReprogramacion(reprog);
    if (reprog.clase_id) {
      try {
        const clase = await adminService.getClassById(reprog.clase_id);
        setHorariosClase(clase.horarios || []);
      } catch (error) {
        console.error('Error cargando horarios:', error);
      }
    }
    setShowModal(true);
  };

  const getEstadoBadge = (estado: string) => {
    const estadoInfo = getEstadoReprogramacion(estado);
    return <Badge bg={estadoInfo.bg}>{estadoInfo.label}</Badge>;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="d-flex align-items-center">
          <Calendar className="me-2 text-primary" />
          Reprogramaciones de Clases
        </h2>
        <Button variant="outline-primary" onClick={fetchData}>
          <Clock className="me-2" /> Actualizar
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <Search />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por clase o motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <Filter />
                </InputGroup.Text>
                <Form.Select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="aprobada">Aprobadas</option>
                  <option value="rechazada">Rechazadas</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <Filter />
                </InputGroup.Text>
                <Form.Select
                  value={filtroClase}
                  onChange={(e) => setFiltroClase(e.target.value)}
                >
                  <option value="todos">Todas las clases</option>
                  {clases.map(clase => (
                    <option key={clase.id} value={clase.id}>{clase.nombre}</option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header className="bg-light">
          <div className="d-flex align-items-center">
            <CalendarCheck className="me-2" />
            <span className="fw-bold">Solicitudes de Reprogramación</span>
            <Badge bg="primary" className="ms-2">
              {filteredReprogramaciones.length}
            </Badge>
          </div>
        </Card.Header>
        <div className="table-responsive">
          <Table hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Clase</th>
                <th>Fecha Original</th>
                <th>Fecha Reprogramada</th>
                <th>Motivo</th>
                <th>Solicitante</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReprogramaciones.map((reprog) => (
                <tr key={reprog.id}>
                  <td>
                    <strong>{reprog.clase_nombre}</strong>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <CalendarX className="text-danger me-2" size={14} />
                      {new Date(reprog.fecha_original).toLocaleDateString('es-MX')}
                    </div>
                    <small className="text-muted">
                      {DIAS_SEMANA.find(d => d.value === reprog.dia_original)?.label} {reprog.hora_inicio_original?.substring(0,5)}
                    </small>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <CalendarCheck className="text-success me-2" size={14} />
                      {new Date(reprog.fecha_reprogramada).toLocaleDateString('es-MX')}
                    </div>
                    {reprog.hora_inicio_reprogramado && (
                      <small className="text-muted">
                        {DIAS_SEMANA.find(d => d.value === reprog.dia_reprogramado)?.label} {reprog.hora_inicio_reprogramado.substring(0,5)}
                      </small>
                    )}
                  </td>
                  <td>
                    <small>{reprog.motivo}</small>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <Person className="me-1" size={12} />
                      <small>{reprog.solicitado_por_nombre}</small>
                    </div>
                  </td>
                  <td>{getEstadoBadge(reprog.estado)}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => abrirModal(reprog)}
                      disabled={reprog.estado !== 'pendiente'}
                    >
                      <Eye className="me-1" /> Ver
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredReprogramaciones.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <InfoCircle size={48} className="text-muted mb-3" />
                    <p className="text-muted">No hay solicitudes de reprogramación</p>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <Calendar className="me-2 text-primary" />
            Procesar Solicitud de Reprogramación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReprogramacion && (
            <>
              <Card className="mb-3 bg-light border-0">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6 className="text-muted mb-2">Fecha Original</h6>
                      <p className="mb-1">
                        <strong>{new Date(selectedReprogramacion.fecha_original).toLocaleDateString('es-MX', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</strong>
                      </p>
                      <small>
                        {DIAS_SEMANA.find(d => d.value === selectedReprogramacion.dia_original)?.label} {selectedReprogramacion.hora_inicio_original?.substring(0,5)} - {selectedReprogramacion.hora_fin_original?.substring(0,5)}
                      </small>
                    </Col>
                    <Col md={6}>
                      <h6 className="text-muted mb-2">Fecha Reprogramada</h6>
                      <p className="mb-1">
                        <strong>{new Date(selectedReprogramacion.fecha_reprogramada).toLocaleDateString('es-MX', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</strong>
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <div className="mb-3">
                <h6 className="text-muted mb-2">Motivo de la solicitud</h6>
                <p className="p-3 bg-light rounded">{selectedReprogramacion.motivo}</p>
              </div>

              <div className="mb-3">
                <h6 className="text-muted mb-2">Solicitante</h6>
                <p>{selectedReprogramacion.solicitado_por_nombre}</p>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Horario para la clase reprogramada (opcional)</Form.Label>
                <Form.Select
                  value={selectedHorario || ''}
                  onChange={(e) => setSelectedHorario(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Mantener mismo horario</option>
                  {horariosClase.map(horario => (
                    <option key={horario.id} value={horario.id}>
                      {DIAS_SEMANA.find(d => d.value === horario.dia_semana)?.label} {horario.hora_inicio.substring(0,5)} - {horario.hora_fin.substring(0,5)}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Si no seleccionas un horario, se mantendrá el horario original
                </Form.Text>
              </Form.Group>

              {procesando && (
                <div className="text-center py-3">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Procesando solicitud...</p>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={() => handleProcesar('aprobada')}
            disabled={procesando}
            className="d-flex align-items-center"
          >
            <Check className="me-2" /> Aprobar
          </Button>
          <Button
            variant="danger"
            onClick={() => handleProcesar('rechazada')}
            disabled={procesando}
            className="d-flex align-items-center"
          >
            <X className="me-2" /> Rechazar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminReprogramaciones;