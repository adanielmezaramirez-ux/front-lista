import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Form, Button, Card, Alert, Badge, Spinner, Tabs, Tab, Row, Col } from 'react-bootstrap';
import { classService } from '../../services/classService';
import { Asistencia, Clase, getDiaSemanaNombre } from '../../interfaces';
import { useMexicoDateTime } from '../../hooks/useMexicoDateTime';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Check, X, ArrowLeft, Clock, Calendar, BarChart, InfoCircle } from 'react-bootstrap-icons';

const MaestroAsistencias: React.FC = () => {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();
  const [clase, setClase] = useState<Clase | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [historialAsistencias, setHistorialAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fecha, setFecha] = useState('');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('hoy');
  const [estadisticas, setEstadisticas] = useState({
    presentes: 0,
    ausentes: 0,
    porcentaje: 0,
    totalClases: 0,
    promedioAsistencia: 0
  });

  const { 
    getMexicoDateString, 
    mexicoTime, 
    getDiaSemanaActual,
    getEstadoClase 
  } = useMexicoDateTime();

  useEffect(() => {
    setFecha(getMexicoDateString());
  }, [getMexicoDateString]);

  const fetchData = useCallback(async () => {
    if (!claseId) {
      setError('ID de clase no proporcionado');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const [claseData, asistenciasData] = await Promise.all([
        classService.getClaseById(Number(claseId)),
        classService.getAsistencias(Number(claseId), fecha)
      ]);
      
      if (!claseData) {
        setError('Clase no encontrada');
      } else {
        setClase(claseData);
        setAsistencias(asistenciasData);
        
        if (activeTab === 'historial') {
          await fetchHistorial();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [claseId, fecha, activeTab]);

  const fetchHistorial = async () => {
    if (!claseId) return;
    
    try {
      const allAsistencias = await classService.getAsistencias(Number(claseId));
      setHistorialAsistencias(allAsistencias);
      
      const totalClases = new Set(allAsistencias.map(a => a.fecha)).size;
      const totalAsistencias = allAsistencias.filter(a => a.presente).length;
      const totalRegistros = allAsistencias.length;
      
      setEstadisticas({
        presentes: allAsistencias.filter(a => a.presente).length,
        ausentes: allAsistencias.filter(a => !a.presente).length,
        porcentaje: totalRegistros > 0 ? Math.round((totalAsistencias / totalRegistros) * 100) : 0,
        totalClases,
        promedioAsistencia: totalClases > 0 ? Math.round(totalAsistencias / totalClases) : 0
      });
    } catch (error) {
      console.error('Error fetching historial:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'historial' && claseId) {
      fetchHistorial();
    }
  }, [activeTab, claseId]);

  const handleMarcarAsistencia = async (alumnoId: number, presente: boolean, horarioId?: number) => {
    if (!claseId) return;
    
    setUpdating(true);
    try {
      await classService.marcarAsistencia({
        claseId: Number(claseId),
        alumnoId,
        fecha,
        presente,
        horarioId
      });
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al marcar asistencia');
    } finally {
      setUpdating(false);
    }
  };

  const getAsistenciaAlumno = (alumnoId: number) => {
    return asistencias.find(a => a.alumno_id === alumnoId);
  };

  const estadoClase = clase ? getEstadoClase(clase) : { 
    puedeMarcar: false, 
    mensaje: '', 
    horarioHoy: null 
  };
  
  const puedeMarcar = estadoClase.puedeMarcar;
  const horarioHoy = estadoClase.horarioHoy;
  const mensajeEstado = estadoClase.mensaje;

  const historialPorFecha = historialAsistencias.reduce((acc, asis) => {
    if (!acc[asis.fecha]) {
      acc[asis.fecha] = [];
    }
    acc[asis.fecha].push(asis);
    return acc;
  }, {} as Record<string, Asistencia[]>);

  const fechasHistorial = Object.keys(historialPorFecha).sort().reverse();

  if (loading) return <LoadingSpinner />;

  if (!claseId || !clase) {
    return (
      <Alert variant="danger">
        <InfoCircle className="me-2" />
        Clase no encontrada
        <div className="mt-3">
          <Button variant="primary" onClick={() => navigate('/maestro/clases')}>
            <ArrowLeft className="me-2" /> Volver a Mis Clases
          </Button>
        </div>
      </Alert>
    );
  }

  const totalAlumnos = clase?.alumnos?.length || 0;
  const asistenciasHoy = asistencias.filter(a => a.presente).length;
  const porcentajeAsistencia = totalAlumnos > 0 
    ? Math.round((asistenciasHoy / totalAlumnos) * 100) 
    : 0;

  return (
    <div className="container-fluid px-0">
      <Button
        variant="link"
        className="text-primary mb-3 p-0 d-inline-flex align-items-center"
        onClick={() => navigate('/maestro/clases')}
      >
        <ArrowLeft className="me-2" /> Volver a Mis Clases
      </Button>

      <Row className="mb-4">
        <Col>
          <h2 className="mb-3">{clase.nombre}</h2>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div className="d-flex align-items-center text-muted">
              <Clock className="me-2" />
              <span className="fw-bold me-2">Horarios:</span>
              <div className="d-flex flex-wrap gap-2">
                {clase.horarios && clase.horarios.length > 0 ? (
                  clase.horarios.map((h, idx) => {
                    const esHoy = h.dia_semana === getDiaSemanaActual();
                    return (
                      <Badge 
                        key={idx} 
                        bg={esHoy ? 'success' : 'secondary'} 
                        className="px-3 py-2"
                      >
                        {getDiaSemanaNombre(h.dia_semana)} {h.hora_inicio.substring(0,5)}-{h.hora_fin.substring(0,5)}
                        {esHoy && ' (Hoy)'}
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-muted">No hay horarios definidos</span>
                )}
              </div>
            </div>
          </div>
        </Col>
        <Col md="auto">
          <div className="d-flex flex-column gap-2">
            <Badge bg="info" className="p-3">
              <Clock className="me-2" /> Hora México: {mexicoTime.toLocaleString('es-MX', { 
                timeZone: 'America/Mexico_City',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Badge>
            <Badge 
              bg={puedeMarcar ? 'success' : horarioHoy ? 'warning' : 'secondary'} 
              className="p-3"
            >
              <InfoCircle className="me-2" />
              {mensajeEstado}
            </Badge>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'hoy')} className="mb-4">
        <Tab eventKey="hoy" title={
          <span><Calendar className="me-2" />Asistencia Hoy</span>
        }>
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-end">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Fecha</Form.Label>
                    <Form.Control
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      max={getMexicoDateString()}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  {updating && (
                    <div className="d-flex align-items-center text-primary">
                      <Spinner size="sm" animation="border" className="me-2" />
                      <span>Guardando...</span>
                    </div>
                  )}
                </Col>
                <Col md={4}>
                  <div className="d-flex justify-content-end">
                    <Badge bg="light" text="dark" className="p-3">
                      <strong>Total alumnos:</strong> {totalAlumnos}
                    </Badge>
                    <Badge bg={porcentajeAsistencia >= 80 ? 'success' : porcentajeAsistencia >= 60 ? 'warning' : 'danger'} className="p-3 ms-2">
                      <strong>Hoy:</strong> {asistenciasHoy}/{totalAlumnos} ({porcentajeAsistencia}%)
                    </Badge>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h5 className="mb-3">Lista de Alumnos</h5>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="bg-light">
                    <tr>
                      <th>#</th>
                      <th>Nombre Completo</th>
                      <th>Email</th>
                      <th className="text-center">Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clase.alumnos && clase.alumnos.length > 0 ? (
                      clase.alumnos.map((alumno, index) => {
                        const asistencia = getAsistenciaAlumno(alumno.id);
                        const puedeMarcarHoy = puedeMarcar && fecha === getMexicoDateString();
                        
                        return (
                          <tr key={alumno.id}>
                            <td>{index + 1}</td>
                            <td>
                              <strong>{alumno.nombre}</strong>
                            </td>
                            <td>
                              <small className="text-muted">{alumno.email}</small>
                            </td>
                            <td className="text-center">
                              <div className="d-flex gap-2 justify-content-center">
                                <Button
                                  variant={asistencia?.presente ? 'success' : 'outline-success'}
                                  size="sm"
                                  className="d-inline-flex align-items-center"
                                  onClick={() => handleMarcarAsistencia(
                                    alumno.id, 
                                    true, 
                                    horarioHoy?.id
                                  )}
                                  disabled={updating || asistencia?.presente === true || !puedeMarcarHoy}
                                >
                                  <Check className="me-2" /> Presente
                                </Button>
                                <Button
                                  variant={asistencia?.presente === false ? 'danger' : 'outline-danger'}
                                  size="sm"
                                  className="d-inline-flex align-items-center"
                                  onClick={() => handleMarcarAsistencia(
                                    alumno.id, 
                                    false,
                                    horarioHoy?.id
                                  )}
                                  disabled={updating || asistencia?.presente === false || !puedeMarcarHoy}
                                >
                                  <X className="me-2" /> Ausente
                                </Button>
                              </div>
                              {asistencia && (
                                <div className="mt-2">
                                  <Badge bg={asistencia.presente ? 'success' : 'danger'}>
                                    {asistencia.presente ? 'Presente' : 'Ausente'}
                                  </Badge>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-5">
                          <InfoCircle className="text-muted mb-3" size={32} />
                          <p className="text-muted mb-3">No hay alumnos inscritos en esta clase</p>
                          <Button 
                            variant="primary" 
                            onClick={() => navigate('/maestro/clases')}
                          >
                            <ArrowLeft className="me-2" /> Volver a Mis Clases
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {clase.alumnos && clase.alumnos.length > 0 && (
                <div className="mt-4 p-3 bg-light rounded d-flex justify-content-between align-items-center">
                  <span className="fw-bold">
                    Resumen hoy: {asistenciasHoy} presentes, {totalAlumnos - asistenciasHoy} ausentes
                  </span>
                  <Badge bg={porcentajeAsistencia >= 80 ? 'success' : porcentajeAsistencia >= 60 ? 'warning' : 'danger'} className="p-3">
                    {porcentajeAsistencia}% asistencia
                  </Badge>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="historial" title={
          <span><BarChart className="me-2" />Historial</span>
        }>
          <Row>
            <Col lg={4}>
              <Card className="mb-4">
                <Card.Header className="bg-light">
                  <BarChart className="me-2" /> Estadísticas
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col xs={6}>
                      <div className="text-center p-3 bg-light rounded">
                        <div className="text-muted small">Total clases</div>
                        <h3 className="mb-0">{estadisticas.totalClases}</h3>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-center p-3 bg-light rounded">
                        <div className="text-muted small">Promedio</div>
                        <h3 className="mb-0 text-success">{estadisticas.porcentaje}%</h3>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-center p-3 bg-light rounded">
                        <div className="text-muted small">Presentes</div>
                        <h3 className="mb-0 text-success">{estadisticas.presentes}</h3>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-center p-3 bg-light rounded">
                        <div className="text-muted small">Ausentes</div>
                        <h3 className="mb-0 text-danger">{estadisticas.ausentes}</h3>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={8}>
              <Card>
                <Card.Header className="bg-light">
                  <Calendar className="me-2" /> Historial por fecha
                </Card.Header>
                <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {fechasHistorial.length === 0 ? (
                    <p className="text-muted text-center py-5">No hay asistencias registradas</p>
                  ) : (
                    fechasHistorial.map(fecha => {
                      const asistenciasFecha = historialPorFecha[fecha];
                      const presentes = asistenciasFecha.filter(a => a.presente).length;
                      const total = asistenciasFecha.length;
                      const porcentaje = Math.round((presentes / total) * 100);
                      
                      return (
                        <Card key={fecha} className="mb-3 border">
                          <Card.Body>
                            <Row className="align-items-center">
                              <Col>
                                <h6 className="mb-2">
                                  {new Date(fecha).toLocaleDateString('es-MX', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </h6>
                                <div className="d-flex gap-2">
                                  <Badge bg="success">Presentes: {presentes}</Badge>
                                  <Badge bg="danger">Ausentes: {total - presentes}</Badge>
                                  <Badge bg={porcentaje >= 80 ? 'success' : porcentaje >= 60 ? 'warning' : 'danger'}>
                                    {porcentaje}%
                                  </Badge>
                                </div>
                              </Col>
                              <Col md="auto">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="d-inline-flex align-items-center"
                                  onClick={() => {
                                    setFecha(fecha);
                                    setActiveTab('hoy');
                                  }}
                                >
                                  <Calendar className="me-2" /> Ver detalle
                                </Button>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      );
                    })
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </div>
  );
};

export default MaestroAsistencias;