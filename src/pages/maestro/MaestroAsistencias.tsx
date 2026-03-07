import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Form, Button, Card, Alert, Badge, Spinner, Tabs, Tab, Row, Col } from 'react-bootstrap';
import { classService } from '../../services/classService';
import { Asistencia, Clase, getDiaSemanaNombre } from '../../interfaces';
import { useMexicoDateTime } from '../../hooks/useMexicoDateTime';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Check, X, ArrowLeft, Clock, Calendar, BarChart } from 'react-bootstrap-icons';

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

  const { getMexicoDateString, puedeMarcarAsistencia, mexicoTime, getHorarioHoy } = useMexicoDateTime();

  useEffect(() => {
    setFecha(getMexicoDateString());
  }, []);

  const fetchData = useCallback(async () => {
    if (!claseId) {
      setError('ID de clase no proporcionado');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
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
        
        setError('');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Error al cargar datos');
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

  // CORREGIDO: Ahora acepta 3 parámetros
  const handleMarcarAsistencia = async (alumnoId: number, presente: boolean, horarioId?: number) => {
    if (!claseId) return;
    
    setUpdating(true);
    try {
      await classService.marcarAsistencia({
        claseId: Number(claseId),
        alumnoId,
        fecha,
        presente,
        horarioId // Incluir el horarioId si existe
      });
      await fetchData();
    } catch (err: any) {
      console.error('Error marking attendance:', err);
      setError(err.response?.data?.error || 'Error al marcar asistencia');
    } finally {
      setUpdating(false);
    }
  };

  const getAsistenciaAlumno = (alumnoId: number) => {
    return asistencias.find(a => a.alumno_id === alumnoId);
  };

  const puedeMarcar = clase ? puedeMarcarAsistencia(clase) : false;
  const horarioHoy = clase ? getHorarioHoy(clase.horarios) : null;

  // Agrupar historial por fecha
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
        Clase no encontrada
        <div className="mt-3">
          <Button variant="primary" onClick={() => navigate('/maestro/clases')}>
            Volver a Mis Clases
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
    <div>
      <Button
        variant="link"
        className="text-primary mb-3 p-0"
        onClick={() => navigate('/maestro/clases')}
      >
        <ArrowLeft className="me-1" /> Volver a Mis Clases
      </Button>

      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="mb-1">{clase.nombre}</h2>
          <div className="text-muted mb-2">
            <Clock className="me-1" />
            Horarios:
            <div className="mt-1">
              {clase.horarios.map((h, idx) => (
                <Badge key={idx} bg="info" className="me-2">
                  {getDiaSemanaNombre(h.dia_semana)} {h.hora_inicio.substring(0,5)}-{h.hora_fin.substring(0,5)}
                </Badge>
              ))}
            </div>
          </div>
          <p className="text-muted small">
            Hora México: {mexicoTime.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
          </p>
          {horarioHoy && (
            <p className="text-success small">
              <Check className="me-1" />
              Horario de hoy: {getDiaSemanaNombre(horarioHoy.dia_semana)} {horarioHoy.hora_inicio.substring(0,5)} - {horarioHoy.hora_fin.substring(0,5)}
            </p>
          )}
        </div>
        <div className="text-end">
          <Badge bg="info" className="p-3 mb-2 d-block">
            Total Alumnos: {totalAlumnos}
          </Badge>
          {activeTab === 'hoy' && (
            <Badge bg={porcentajeAsistencia >= 80 ? 'success' : porcentajeAsistencia >= 60 ? 'warning' : 'danger'} className="p-3">
              Hoy: {asistenciasHoy}/{totalAlumnos} ({porcentajeAsistencia}%)
            </Badge>
          )}
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'hoy')} className="mb-4">
        <Tab eventKey="hoy" title="Asistencia Hoy">
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex align-items-center gap-4 flex-wrap">
                <Form.Group style={{ minWidth: '250px' }}>
                  <Form.Label>Seleccionar Fecha</Form.Label>
                  <Form.Control
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    max={getMexicoDateString()}
                  />
                </Form.Group>
                
                {updating && (
                  <div className="d-flex align-items-center text-primary">
                    <Spinner size="sm" animation="border" className="me-2" />
                    <span>Guardando...</span>
                  </div>
                )}

                {!puedeMarcar && fecha === getMexicoDateString() && (
                  <div className="text-warning">
                    <Clock className="me-1" />
                    Solo puedes marcar asistencia en horario de clase
                  </div>
                )}
              </div>
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
                      <th className="text-center" style={{ minWidth: '250px' }}>Asistencia</th>
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
                                  onClick={() => handleMarcarAsistencia(
                                    alumno.id, 
                                    true, 
                                    horarioHoy?.id
                                  )}
                                  disabled={updating || asistencia?.presente === true || !puedeMarcarHoy}
                                  title={!puedeMarcarHoy ? 'Fuera de horario de clase' : 'Marcar como presente'}
                                >
                                  <Check /> Presente
                                </Button>
                                <Button
                                  variant={asistencia?.presente === false ? 'danger' : 'outline-danger'}
                                  size="sm"
                                  onClick={() => handleMarcarAsistencia(
                                    alumno.id, 
                                    false,
                                    horarioHoy?.id
                                  )}
                                  disabled={updating || asistencia?.presente === false || !puedeMarcarHoy}
                                  title={!puedeMarcarHoy ? 'Fuera de horario de clase' : 'Marcar como ausente'}
                                >
                                  <X /> Ausente
                                </Button>
                              </div>
                              {asistencia && (
                                <small className="text-muted d-block mt-2">
                                  <Badge bg={asistencia.presente ? 'success' : 'danger'} className="me-1">
                                    {asistencia.presente ? '✓' : '✗'}
                                  </Badge>
                                  {asistencia.horario_id ? (
                                    <>Registrado en horario específico</>
                                  ) : (
                                    <>Registrado</>
                                  )}
                                </small>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-4">
                          <p className="text-muted mb-2">No hay alumnos inscritos en esta clase</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {clase.alumnos && clase.alumnos.length > 0 && (
                <div className="mt-3 p-3 bg-light rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>
                      <strong>Resumen hoy:</strong> {asistenciasHoy} presentes, {totalAlumnos - asistenciasHoy} ausentes
                    </span>
                    <Badge bg={porcentajeAsistencia >= 80 ? 'success' : porcentajeAsistencia >= 60 ? 'warning' : 'danger'}>
                      {porcentajeAsistencia}% asistencia
                    </Badge>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="historial" title="Historial">
          <Row>
            <Col md={4}>
              <Card className="mb-4">
                <Card.Header>
                  <BarChart className="me-2" /> Estadísticas Generales
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <h6>Total de clases:</h6>
                    <h3>{estadisticas.totalClases}</h3>
                  </div>
                  <div className="mb-3">
                    <h6>Asistencias totales:</h6>
                    <h3 className="text-success">{estadisticas.presentes}</h3>
                  </div>
                  <div className="mb-3">
                    <h6>Ausencias totales:</h6>
                    <h3 className="text-danger">{estadisticas.ausentes}</h3>
                  </div>
                  <div>
                    <h6>Promedio de asistencia:</h6>
                    <h3>
                      <Badge bg={estadisticas.porcentaje >= 80 ? 'success' : estadisticas.porcentaje >= 60 ? 'warning' : 'danger'}>
                        {estadisticas.porcentaje}%
                      </Badge>
                    </h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={8}>
              <Card>
                <Card.Header>
                  <Calendar className="me-2" /> Historial por Fecha
                </Card.Header>
                <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {fechasHistorial.length === 0 ? (
                    <p className="text-muted text-center">No hay asistencias registradas</p>
                  ) : (
                    fechasHistorial.map(fecha => {
                      const asistenciasFecha = historialPorFecha[fecha];
                      const presentes = asistenciasFecha.filter(a => a.presente).length;
                      const total = asistenciasFecha.length;
                      const porcentaje = Math.round((presentes / total) * 100);
                      
                      return (
                        <Card key={fecha} className="mb-3">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6>{new Date(fecha).toLocaleDateString('es-MX', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}</h6>
                                <div>
                                  <Badge bg="success" className="me-2">
                                    Presentes: {presentes}
                                  </Badge>
                                  <Badge bg="danger" className="me-2">
                                    Ausentes: {total - presentes}
                                  </Badge>
                                  <Badge bg={porcentaje >= 80 ? 'success' : porcentaje >= 60 ? 'warning' : 'danger'}>
                                    {porcentaje}%
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  setFecha(fecha);
                                  setActiveTab('hoy');
                                }}
                              >
                                Ver Detalle
                              </Button>
                            </div>
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