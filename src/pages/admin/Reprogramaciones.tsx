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
import { Reprogramacion, getEstadoReprogramacion, DIAS_SEMANA, Horario, getDiaSemanaNombre } from '../../interfaces';
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
  CalendarX,
  CheckCircle,
  XCircle
} from 'react-bootstrap-icons';

const AdminReprogramaciones: React.FC = () => {
  const [reprogramaciones, setReprogramaciones] = useState<Reprogramacion[]>([]);
  const [filteredReprogramaciones, setFilteredReprogramaciones] = useState<Reprogramacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedReprogramacion, setSelectedReprogramacion] = useState<Reprogramacion | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroClase, setFiltroClase] = useState<string>('todos');
  const [clases, setClases] = useState<any[]>([]);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

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
      
      const processedReprogs = reprogData.map(r => ({
        ...r,
        reprogramacion_detalle: r.reprogramacion_detalle ? JSON.parse(r.reprogramacion_detalle as any) : null
      }));
      
      setReprogramaciones(processedReprogs);
      setFilteredReprogramaciones(processedReprogs);
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
      await reprogramacionService.procesarReprogramacion(selectedReprogramacion.id, { estado });
      await fetchData();
      setShowModal(false);
      setSelectedReprogramacion(null);
    } catch (error) {
      console.error('Error procesando reprogramación:', error);
      setError('Error al procesar la solicitud');
    } finally {
      setProcesando(false);
    }
  };

  const abrirModal = (reprog: Reprogramacion) => {
    setSelectedReprogramacion(reprog);
    setShowModal(true);
  };

  const verDetalle = (reprog: Reprogramacion) => {
    setSelectedReprogramacion(reprog);
    setShowDetalleModal(true);
  };

  const getEstadoBadge = (estado: string) => {
    const estadoInfo = getEstadoReprogramacion(estado);
    return <Badge bg={estadoInfo.bg}>{estadoInfo.label}</Badge>;
  };

  const formatHora = (hora: string) => {
    return hora ? hora.substring(0,5) : '';
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
                <th>Nuevo Horario</th>
                <th>Motivo</th>
                <th>Solicitante</th>
                <th>Estado</th>
                <th>Tomada</th>
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
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <CalendarCheck className="text-success me-2" size={14} />
                      {new Date(reprog.fecha_reprogramada).toLocaleDateString('es-MX')}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <Clock className="text-info me-2" size={14} />
                      <div>
                        <div>{getDiaSemanaNombre(reprog.dia_semana)}</div>
                        <small className="text-muted">
                          {formatHora(reprog.hora_inicio)} - {formatHora(reprog.hora_fin)}
                        </small>
                      </div>
                    </div>
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
                    {reprog.ya_tomada ? (
                      <Badge bg="success">
                        <CheckCircle className="me-1" size={12} /> Sí
                      </Badge>
                    ) : (
                      <Badge bg="secondary">
                        <XCircle className="me-1" size={12} /> No
                      </Badge>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => verDetalle(reprog)}
                      >
                        <Eye className="me-1" /> Ver
                      </Button>
                      {reprog.estado === 'pendiente' && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => abrirModal(reprog)}
                        >
                          <Filter className="me-1" /> Procesar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReprogramaciones.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    <InfoCircle size={48} className="text-muted mb-3" />
                    <p className="text-muted">No hay solicitudes de reprogramación</p>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      <Modal show={showDetalleModal} onHide={() => setShowDetalleModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <Calendar className="me-2 text-primary" />
            Detalle de Reprogramación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReprogramacion && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="bg-light border-0">
                    <Card.Body>
                      <h6 className="text-danger mb-3">Clase Original</h6>
                      <p className="mb-1"><strong>Clase:</strong> {selectedReprogramacion.clase_nombre}</p>
                      <p className="mb-1"><strong>Fecha:</strong> {new Date(selectedReprogramacion.fecha_original).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="mb-0"><strong>Horario:</strong> {getDiaSemanaNombre(selectedReprogramacion.dia_original || 0)} {formatHora(selectedReprogramacion.hora_inicio_original || '')} - {formatHora(selectedReprogramacion.hora_fin_original || '')}</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light border-0">
                    <Card.Body>
                      <h6 className="text-success mb-3">Clase Reprogramada</h6>
                      <p className="mb-1"><strong>Fecha:</strong> {new Date(selectedReprogramacion.fecha_reprogramada).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="mb-1"><strong>Horario:</strong> {getDiaSemanaNombre(selectedReprogramacion.dia_semana)} {formatHora(selectedReprogramacion.hora_inicio)} - {formatHora(selectedReprogramacion.hora_fin)}</p>
                      <p className="mb-0"><strong>Motivo:</strong> {selectedReprogramacion.motivo}</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <p><strong>Solicitante:</strong> {selectedReprogramacion.solicitado_por_nombre}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Estado:</strong> {getEstadoBadge(selectedReprogramacion.estado)}</p>
                </Col>
              </Row>

              {selectedReprogramacion.aprobado_por_nombre && (
                <p><strong>Aprobado por:</strong> {selectedReprogramacion.aprobado_por_nombre}</p>
              )}

              {selectedReprogramacion.estado === 'aprobada' && (
                <Alert variant={selectedReprogramacion.ya_tomada ? 'success' : 'info'} className="mt-3">
                  {selectedReprogramacion.ya_tomada ? (
                    <>Esta clase reprogramada ya ha sido impartida y tomada</>
                  ) : (
                    <>Esta clase reprogramada está aprobada pero aún no se ha impartido</>
                  )}
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowDetalleModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

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
                        {getDiaSemanaNombre(selectedReprogramacion.dia_original || 0)} {selectedReprogramacion.hora_inicio_original?.substring(0,5)} - {selectedReprogramacion.hora_fin_original?.substring(0,5)}
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
                      <small>
                        {getDiaSemanaNombre(selectedReprogramacion.dia_semana)} {selectedReprogramacion.hora_inicio.substring(0,5)} - {selectedReprogramacion.hora_fin.substring(0,5)}
                      </small>
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