import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Form, Button, Card, Alert, Badge, Spinner, Tabs, Tab, Row, Col, Modal } from 'react-bootstrap';
import { classService } from '../../services/classService';
import { reprogramacionService } from '../../services/reprogramacionService';
import { Asistencia, Clase, getDiaSemanaNombre } from '../../interfaces';
import { useMexicoDateTime } from '../../hooks/useMexicoDateTime';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Check, X, ArrowLeft, Clock, Calendar, BarChart, InfoCircle, Person, CalendarPlus, Eye } from 'react-bootstrap-icons';

const MaestroAsistencias: React.FC = () => {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();
  const [clase, setClase] = useState<Clase | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [asistenciasReprogramadas, setAsistenciasReprogramadas] = useState<Record<number, Asistencia[]>>({});
  const [historialAsistencias, setHistorialAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('hoy');
  const [estaBloqueada, setEstaBloqueada] = useState(false);
  const [esReprogramada, setEsReprogramada] = useState(false);
  const [puedeNombrarLista, setPuedeNombrarLista] = useState(true);
  const [reprogramacionInfo, setReprogramacionInfo] = useState<any>(null);
  const [showReprogramacionModal, setShowReprogramacionModal] = useState(false);
  const [reprogramaciones, setReprogramaciones] = useState<any[]>([]);
  const [selectedReprogramacion, setSelectedReprogramacion] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState({
    presentes: 0,
    ausentes: 0,
    porcentaje: 0,
    totalClases: 0,
    promedioAsistencia: 0,
    asistenciasSistema: 0,
    asistenciasMaestro: 0,
    asistenciasReprogramadas: 0
  });

  const { getMexicoDateString, mexicoTime, getDiaSemanaActual, getEstadoClase } = useMexicoDateTime();
  const fechaActual = getMexicoDateString();
  const diaSemanaActual = getDiaSemanaActual();

  const formatearFechaMexico = (fechaStr: string) => {
    const fecha = new Date(fechaStr + 'T12:00:00-06:00');
    return fecha.toLocaleDateString('es-MX', { 
      timeZone: 'America/Mexico_City',
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  useEffect(() => {
    const verificarEstadoClase = async () => {
      if (claseId) {
        try {
          const verificado = await classService.verificarClaseReprogramada(Number(claseId), fechaActual);
          setEstaBloqueada(verificado.estaBloqueada);
          setEsReprogramada(verificado.esReprogramada);
          setPuedeNombrarLista(verificado.puedeNombrarLista);
          setReprogramacionInfo(verificado.reprogramacion);
          
          if (verificado.esReprogramada && verificado.reprogramacion && !verificado.yaTomada) {
            setSelectedReprogramacion(verificado.reprogramacion);
            await fetchAsistenciasReprogramada(verificado.reprogramacion.id);
          }
        } catch (error) {
          console.error('Error verificando reprogramación:', error);
        }
      }
    };

    verificarEstadoClase();
  }, [claseId, fechaActual]);

  const fetchAsistenciasReprogramada = async (reprogId: number) => {
    if (!claseId) return;
    try {
      const asistencias = await classService.getAsistencias(Number(claseId), fechaActual);
      const filtradas = asistencias.filter(a => a.reprogramacion_id === reprogId);
      setAsistenciasReprogramadas(prev => ({ ...prev, [reprogId]: filtradas }));
    } catch (error) {
      console.error('Error fetching asistencias reprogramadas:', error);
    }
  };

  const fetchReprogramaciones = async () => {
    if (!claseId) return;
    try {
      const data = await reprogramacionService.getReprogramaciones({ claseId: Number(claseId) });
      setReprogramaciones(data);
      
      for (const reprog of data) {
        if (reprog.estado === 'aprobada') {
          await fetchAsistenciasReprogramada(reprog.id);
        }
      }
    } catch (error) {
      console.error('Error fetching reprogramaciones:', error);
    }
  };

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
        classService.getAsistencias(Number(claseId), fechaActual)
      ]);
      
      if (!claseData) {
        setError('Clase no encontrada');
      } else {
        setClase(claseData);
        setAsistencias(asistenciasData);
        
        if (activeTab === 'historial') {
          await fetchHistorial();
        }
        if (activeTab === 'reprogramaciones') {
          await fetchReprogramaciones();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [claseId, fechaActual, activeTab]);

  const fetchHistorial = async () => {
    if (!claseId) return;
    
    try {
      const allAsistencias = await classService.getAsistencias(Number(claseId));
      setHistorialAsistencias(allAsistencias);
      
      const totalClases = new Set(allAsistencias.map(a => a.fecha)).size;
      const totalAsistencias = allAsistencias.filter(a => a.presente).length;
      const totalRegistros = allAsistencias.length;
      const asistenciasSistema = allAsistencias.filter(a => a.registrado_por === 'sistema').length;
      const asistenciasMaestro = allAsistencias.filter(a => a.registrado_por === 'maestro').length;
      const asistenciasReprogramadas = allAsistencias.filter(a => a.reprogramacion_id).length;
      
      setEstadisticas({
        presentes: allAsistencias.filter(a => a.presente).length,
        ausentes: allAsistencias.filter(a => !a.presente).length,
        porcentaje: totalRegistros > 0 ? Math.round((totalAsistencias / totalRegistros) * 100) : 0,
        totalClases,
        promedioAsistencia: totalClases > 0 ? Math.round(totalAsistencias / totalClases) : 0,
        asistenciasSistema,
        asistenciasMaestro,
        asistenciasReprogramadas
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
    } else if (activeTab === 'reprogramaciones' && claseId) {
      fetchReprogramaciones();
    }
  }, [activeTab, claseId]);

  const handleMarcarAsistencia = async (alumnoId: number, presente: boolean, horarioId?: number) => {
    if (!claseId) return;
    
    setUpdating(true);
    try {
      await classService.marcarAsistencia({
        claseId: Number(claseId),
        alumnoId,
        fecha: fechaActual,
        presente,
        horarioId
      });
      await fetchData();
      
      if (selectedReprogramacion) {
        await fetchAsistenciasReprogramada(selectedReprogramacion.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al marcar asistencia');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarcarAsistenciaReprogramada = async (reprogramacionId: number, alumnoId: number, presente: boolean) => {
    if (!claseId) return;
    
    setUpdating(true);
    try {
      await reprogramacionService.marcarAsistenciaReprogramada({
        reprogramacionId,
        alumnoId,
        presente
      });
      
      await fetchAsistenciasReprogramada(reprogramacionId);
      await fetchReprogramaciones();
      
      const verificado = await classService.verificarClaseReprogramada(Number(claseId), fechaActual);
      setReprogramacionInfo(verificado.reprogramacion);
      setPuedeNombrarLista(verificado.puedeNombrarLista);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al marcar asistencia en clase reprogramada');
    } finally {
      setUpdating(false);
    }
  };

  const getAsistenciaAlumno = (alumnoId: number) => {
    return asistencias.find(a => a.alumno_id === alumnoId);
  };

  const getAsistenciaAlumnoReprogramada = (reprogramacionId: number, alumnoId: number) => {
    const asistenciasRepro = asistenciasReprogramadas[reprogramacionId] || [];
    return asistenciasRepro.find(a => a.alumno_id === alumnoId);
  };

  const estadoClase = clase ? getEstadoClase(clase) : { 
    puedeMarcar: false, 
    mensaje: '', 
    horarioHoy: null 
  };
  
  const puedeMarcar = estadoClase.puedeMarcar;
  const horarioHoy = estadoClase.horarioHoy;
  const mensajeEstado = estadoClase.mensaje;
  
  const puedeMarcarHoy = (puedeMarcar && !estaBloqueada) || (esReprogramada && !reprogramacionInfo?.yaTomada);

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
                    const esHoy = h.dia_semana === diaSemanaActual;
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
              bg={puedeMarcarHoy ? 'success' : horarioHoy ? 'warning' : 'secondary'} 
              className="p-3"
            >
              <InfoCircle className="me-2" />
              {esReprogramada ? 'Clase reprogramada - Puede marcar asistencia' : mensajeEstado}
            </Badge>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      {estaBloqueada && (
        <Alert variant="warning" className="mt-3">
          <InfoCircle className="me-2" />
          Esta fecha está bloqueada porque se solicitó una reprogramación.
          {reprogramacionInfo && reprogramacionInfo.fechaReprogramada && (
            <span> La clase se impartirá el {formatearFechaMexico(reprogramacionInfo.fechaReprogramada)}</span>
          )}
        </Alert>
      )}

      {esReprogramada && !reprogramacionInfo?.yaTomada && (
        <Alert variant="success" className="mt-3">
          <InfoCircle className="me-2" />
          Esta es una clase reprogramada. Puedes marcar asistencia normalmente.
        </Alert>
      )}

      {esReprogramada && reprogramacionInfo?.yaTomada && (
        <Alert variant="info" className="mt-3">
          <InfoCircle className="me-2" />
          Esta clase reprogramada ya ha sido tomada.
        </Alert>
      )}

      <div className="mb-3">
        <h5 className="d-inline-block me-3">Fecha de hoy:</h5>
        <Badge bg="primary" className="p-3">
          <Calendar className="me-2" />
          {formatearFechaMexico(fechaActual)}
        </Badge>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'hoy')} className="mb-4">
        <Tab eventKey="hoy" title={
          <span><Calendar className="me-2" />Asistencia Hoy</span>
        }>
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-end">
                <Col md={8}>
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
                      <th>Registrado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clase.alumnos && clase.alumnos.length > 0 ? (
                      clase.alumnos.map((alumno, index) => {
                        const asistencia = getAsistenciaAlumno(alumno.id);
                        
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
                            </td>
                            <td>
                              {asistencia && (
                                <div>
                                  <Badge bg={asistencia.presente ? 'success' : 'danger'}>
                                    {asistencia.presente ? 'Presente' : 'Ausente'}
                                  </Badge>
                                  <br />
                                  <small className="text-muted d-flex align-items-center mt-1">
                                    <Person size={12} className="me-1" />
                                    {asistencia.registrado_por === 'sistema' ? 'Sistema' : 'Maestro'}
                                  </small>
                                  {asistencia.reprogramacion_id && (
                                    <small className="text-info d-block mt-1">
                                      <InfoCircle size={10} className="me-1" />
                                      Reprogramada
                                    </small>
                                  )}
                                  {asistencia.observacion && (
                                    <small className="text-muted d-block mt-1">
                                      <InfoCircle size={10} className="me-1" />
                                      {asistencia.observacion}
                                    </small>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-5">
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
                    <Col xs={6}>
                      <div className="text-center p-3 bg-light rounded">
                        <div className="text-muted small">Sistema</div>
                        <h3 className="mb-0 text-info">{estadisticas.asistenciasSistema}</h3>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-center p-3 bg-light rounded">
                        <div className="text-muted small">Maestro</div>
                        <h3 className="mb-0 text-warning">{estadisticas.asistenciasMaestro}</h3>
                      </div>
                    </Col>
                    <Col xs={12}>
                      <div className="text-center p-3 bg-light rounded">
                        <div className="text-muted small">Reprogramadas</div>
                        <h3 className="mb-0 text-info">{estadisticas.asistenciasReprogramadas}</h3>
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
                      const sistema = asistenciasFecha.filter(a => a.registrado_por === 'sistema').length;
                      const reprogramadas = asistenciasFecha.filter(a => a.reprogramacion_id).length;
                      
                      return (
                        <Card key={fecha} className="mb-3 border">
                          <Card.Body>
                            <Row className="align-items-center">
                              <Col>
                                <h6 className="mb-2">
                                  {formatearFechaMexico(fecha)}
                                </h6>
                                <div className="d-flex gap-2 flex-wrap">
                                  <Badge bg="success">Presentes: {presentes}</Badge>
                                  <Badge bg="danger">Ausentes: {total - presentes}</Badge>
                                  <Badge bg="info">Sistema: {sistema}</Badge>
                                  {reprogramadas > 0 && (
                                    <Badge bg="warning">Reprogramadas: {reprogramadas}</Badge>
                                  )}
                                  <Badge bg={porcentaje >= 80 ? 'success' : porcentaje >= 60 ? 'warning' : 'danger'}>
                                    {porcentaje}%
                                  </Badge>
                                </div>
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

        <Tab eventKey="reprogramaciones" title={
          <span><CalendarPlus className="me-2" />Reprogramaciones</span>
        }>
          <Card>
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <span><CalendarPlus className="me-2" /> Solicitudes de Reprogramación</span>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  setSelectedReprogramacion(null);
                  setShowReprogramacionModal(true);
                }}
              >
                <CalendarPlus className="me-2" /> Nueva Solicitud
              </Button>
            </Card.Header>
            <Card.Body>
              {reprogramaciones.length === 0 ? (
                <p className="text-muted text-center py-4">No hay solicitudes de reprogramación</p>
              ) : (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Fecha Original</th>
                        <th>Fecha Reprogramada</th>
                        <th>Nuevo Horario</th>
                        <th>Motivo</th>
                        <th>Estado</th>
                        <th>Tomada</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reprogramaciones.map((r) => (
                        <tr key={r.id}>
                          <td>{formatearFechaMexico(r.fecha_original)}</td>
                          <td>{formatearFechaMexico(r.fecha_reprogramada)}</td>
                          <td>
                            {getDiaSemanaNombre(r.dia_semana)} {r.hora_inicio?.substring(0,5)} - {r.hora_fin?.substring(0,5)}
                          </td>
                          <td>{r.motivo}</td>
                          <td>
                            <Badge bg={r.estado === 'aprobada' ? 'success' : r.estado === 'rechazada' ? 'danger' : 'warning'}>
                              {r.estado}
                            </Badge>
                          </td>
                          <td>
                            {r.ya_tomada ? (
                              <Badge bg="success">Sí</Badge>
                            ) : (
                              <Badge bg="secondary">No</Badge>
                            )}
                          </td>
                          <td>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => {
                                setSelectedReprogramacion(r);
                                setShowReprogramacionModal(true);
                              }}
                            >
                              <Eye size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      <Modal show={showReprogramacionModal} onHide={() => setShowReprogramacionModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <CalendarPlus className="me-2 text-primary" />
            {selectedReprogramacion ? 'Detalle de Reprogramación' : 'Nueva Solicitud de Reprogramación'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReprogramacion ? (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="bg-light border-0">
                    <Card.Body>
                      <h6 className="text-danger mb-3">Clase Original</h6>
                      <p className="mb-1"><strong>Fecha:</strong> {formatearFechaMexico(selectedReprogramacion.fecha_original)}</p>
                      <p className="mb-0"><strong>Horario:</strong> {getDiaSemanaNombre(selectedReprogramacion.dia_original || 0)} {selectedReprogramacion.hora_inicio_original?.substring(0,5)} - {selectedReprogramacion.hora_fin_original?.substring(0,5)}</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light border-0">
                    <Card.Body>
                      <h6 className="text-success mb-3">Clase Reprogramada</h6>
                      <p className="mb-1"><strong>Fecha:</strong> {formatearFechaMexico(selectedReprogramacion.fecha_reprogramada)}</p>
                      <p className="mb-1"><strong>Horario:</strong> {getDiaSemanaNombre(selectedReprogramacion.dia_semana)} {selectedReprogramacion.hora_inicio?.substring(0,5)} - {selectedReprogramacion.hora_fin?.substring(0,5)}</p>
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
                  <p><strong>Estado:</strong> <Badge bg={selectedReprogramacion.estado === 'aprobada' ? 'success' : selectedReprogramacion.estado === 'rechazada' ? 'danger' : 'warning'}>{selectedReprogramacion.estado}</Badge></p>
                </Col>
              </Row>

              {selectedReprogramacion.aprobado_por_nombre && (
                <p><strong>Aprobado por:</strong> {selectedReprogramacion.aprobado_por_nombre}</p>
              )}

              {selectedReprogramacion.estado === 'aprobada' && selectedReprogramacion.fecha_reprogramada === fechaActual && !selectedReprogramacion.ya_tomada && (
                <Alert variant="success" className="mt-3">
                  <InfoCircle className="me-2" />
                  Esta clase reprogramada está programada para hoy. Puedes marcar la asistencia a continuación.
                </Alert>
              )}
            </>
          ) : (
            <p className="text-center text-muted py-4">
              Para crear una nueva solicitud, ve a la sección "Mis Clases" y haz clic en "Reprogramar" en la clase deseada.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowReprogramacionModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {esReprogramada && reprogramacionInfo && reprogramacionInfo.fechaReprogramada === fechaActual && !reprogramacionInfo.yaTomada && (
        <Card className="mt-4 border-success">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">Clase Reprogramada - Marcar Asistencia</h5>
            <small>Esta clase está reprogramada para hoy. Por favor, marca la asistencia.</small>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="bg-light">
                  <tr>
                    <th>#</th>
                    <th>Nombre Completo</th>
                    <th>Email</th>
                    <th className="text-center">Asistencia en Clase Reprogramada</th>
                    <th>Registrado por</th>
                  </tr>
                </thead>
                <tbody>
                  {clase.alumnos && clase.alumnos.length > 0 ? (
                    clase.alumnos.map((alumno, index) => {
                      const asistencia = getAsistenciaAlumnoReprogramada(reprogramacionInfo.id, alumno.id);
                      
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
                                onClick={() => handleMarcarAsistenciaReprogramada(
                                  reprogramacionInfo.id,
                                  alumno.id, 
                                  true
                                )}
                                disabled={updating || asistencia?.presente === true}
                              >
                                <Check className="me-2" /> Presente
                              </Button>
                              <Button
                                variant={asistencia?.presente === false ? 'danger' : 'outline-danger'}
                                size="sm"
                                className="d-inline-flex align-items-center"
                                onClick={() => handleMarcarAsistenciaReprogramada(
                                  reprogramacionInfo.id,
                                  alumno.id, 
                                  false
                                )}
                                disabled={updating || asistencia?.presente === false}
                              >
                                <X className="me-2" /> Ausente
                              </Button>
                            </div>
                          </td>
                          <td>
                            {asistencia && (
                              <div>
                                <Badge bg={asistencia.presente ? 'success' : 'danger'}>
                                  {asistencia.presente ? 'Presente' : 'Ausente'}
                                </Badge>
                                <br />
                                <small className="text-muted d-flex align-items-center mt-1">
                                  <Person size={12} className="me-1" />
                                  {asistencia.registrado_por === 'sistema' ? 'Sistema' : 'Maestro'}
                                </small>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-5">
                        <InfoCircle className="text-muted mb-3" size={32} />
                        <p className="text-muted mb-3">No hay alumnos inscritos en esta clase</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default MaestroAsistencias;