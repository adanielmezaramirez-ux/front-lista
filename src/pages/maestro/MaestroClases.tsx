import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { classService } from '../../services/classService';
import { Clase } from '../../interfaces';
import { useMexicoDateTime } from '../../hooks/useMexicoDateTime';
import LoadingSpinner from '../../components/LoadingSpinner';
import { People, CalendarCheck, Clock, Calendar, CheckCircle, XCircle } from 'react-bootstrap-icons';

const MaestroClases: React.FC = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estadisticas, setEstadisticas] = useState<Map<number, any>>(new Map());
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false);
  
  const { getMexicoDateString, puedeMarcarAsistencia, mexicoTime } = useMexicoDateTime();

  useEffect(() => {
    fetchClases();
  }, []);

  useEffect(() => {
    if (clases.length > 0) {
      fetchEstadisticas();
    }
  }, [clases]);

  const fetchClases = async () => {
    try {
      const data = await classService.getMisClases();
      setClases(data);
    } catch (error) {
      setError('Error al cargar clases');
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    setCargandoEstadisticas(true);
    const stats = new Map();
    
    for (const clase of clases) {
      try {
        // Obtener asistencias de hoy
        const asistenciasHoy = await classService.getAsistencias(clase.id, getMexicoDateString());
        const presentesHoy = asistenciasHoy.filter(a => a.presente).length;
        
        // Calcular estadísticas
        stats.set(clase.id, {
          asistenciasHoy: presentesHoy,
          totalAlumnos: clase.total_alumnos || 0,
          porcentajeHoy: clase.total_alumnos ? Math.round((presentesHoy / clase.total_alumnos) * 100) : 0,
          puedeMarcar: puedeMarcarAsistencia(clase)
        });
      } catch (error) {
        console.error(`Error cargando estadísticas para clase ${clase.id}:`, error);
      }
    }
    
    setEstadisticas(stats);
    setCargandoEstadisticas(false);
  };

  const getDiasClase = (dias: string | null): string[] => {
    if (!dias) return [];
    return dias.split(',').map(d => d.trim());
  };

  const esDiaActual = (dias: string | null): boolean => {
    if (!dias) return true;
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const hoy = new Date(mexicoTime).getDay();
    const hoyNombre = diasSemana[hoy];
    
    const diasArray = dias.toLowerCase().split(',').map(d => d.trim());
    return diasArray.some(dia => dia.includes(hoyNombre) || hoyNombre.includes(dia));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Mis Clases</h2>
          <p className="text-muted">
            <Clock className="me-1" />
            Hora México: {mexicoTime.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
          </p>
        </div>
        {cargandoEstadisticas && (
          <div className="d-flex align-items-center">
            <Spinner size="sm" animation="border" className="me-2" />
            <span>Actualizando estadísticas...</span>
          </div>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {clases.length === 0 ? (
        <Alert variant="info">No tienes clases asignadas</Alert>
      ) : (
        <Row>
          {clases.map((clase) => {
            const stats = estadisticas.get(clase.id) || {
              asistenciasHoy: 0,
              totalAlumnos: clase.total_alumnos || 0,
              porcentajeHoy: 0,
              puedeMarcar: false
            };
            
            const hoyEsDiaClase = esDiaActual(clase.dias);
            const puedeMarcar = stats.puedeMarcar && hoyEsDiaClase;

            return (
              <Col md={6} lg={4} key={clase.id}>
                <Card className={`mb-4 h-100 ${puedeMarcar ? 'border-primary' : ''}`}>
                  <Card.Header className={`${puedeMarcar ? 'bg-primary' : 'bg-secondary'} text-white d-flex justify-content-between align-items-center`}>
                    <h5 className="mb-0">{clase.nombre}</h5>
                    {puedeMarcar && (
                      <Badge bg="light" text="dark" className="ms-2">
                        <Clock className="me-1" size={12} />
                        Ahora
                      </Badge>
                    )}
                  </Card.Header>
                  
                  <Card.Body>
                    {/* Horario y días */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <Clock className="text-primary me-2" />
                        <span>{clase.horario || 'Horario no especificado'}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <Calendar className="text-success me-2" />
                        <div>
                          {getDiasClase(clase.dias).map((dia, idx) => (
                            <Badge 
                              key={idx} 
                              bg={dia.toLowerCase().includes(new Date(mexicoTime).toLocaleDateString('es-MX', { weekday: 'long' })) ? 'info' : 'secondary'}
                              className="me-1 mb-1"
                            >
                              {dia}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas rápidas */}
                    <div className="bg-light p-3 rounded mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>
                          <People className="me-1" />
                          Alumnos:
                        </span>
                        <strong>{stats.totalAlumnos}</strong>
                      </div>
                      
                      {hoyEsDiaClase ? (
                        <div className="d-flex justify-content-between align-items-center">
                          <span>
                            <CheckCircle className="me-1 text-success" />
                            Asistencia hoy:
                          </span>
                          <strong>
                            {stats.asistenciasHoy}/{stats.totalAlumnos}
                            {stats.totalAlumnos > 0 && (
                              <Badge 
                                bg={stats.porcentajeHoy >= 80 ? 'success' : stats.porcentajeHoy >= 60 ? 'warning' : 'danger'}
                                className="ms-2"
                              >
                                {stats.porcentajeHoy}%
                              </Badge>
                            )}
                          </strong>
                        </div>
                      ) : (
                        <div className="d-flex justify-content-between align-items-center text-muted">
                          <span>
                            <XCircle className="me-1" />
                            No es día de clase
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Lista de alumnos (primeros 3) */}
                    {clase.alumnos && clase.alumnos.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted">Alumnos inscritos:</small>
                        <div className="mt-1">
                          {clase.alumnos.slice(0, 3).map((alumno) => (
                            <div key={alumno.id} className="d-flex align-items-center mb-1">
                              <div className="bg-light rounded-circle p-1 me-2" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <small>{alumno.nombre.charAt(0)}</small>
                              </div>
                              <small>{alumno.nombre}</small>
                            </div>
                          ))}
                          {clase.alumnos.length > 3 && (
                            <small className="text-muted d-block mt-1">
                              y {clase.alumnos.length - 3} más...
                            </small>
                          )}
                        </div>
                      </div>
                    )}
                  </Card.Body>

                  <Card.Footer className="bg-white">
                    <div className="d-grid gap-2">
                      <Button
                        as={Link as any}
                        to={`/maestro/clases/${clase.id}`}
                        variant="outline-primary"
                        size="sm"
                      >
                        <Calendar className="me-2" /> Ver Detalle
                      </Button>
                      <Button
                        as={Link as any}
                        to={`/maestro/asistencias/${clase.id}`}
                        variant={puedeMarcar ? 'success' : 'outline-success'}
                        size="sm"
                        disabled={!puedeMarcar}
                        title={!puedeMarcar ? 'Solo puedes marcar asistencia en el horario de la clase' : ''}
                      >
                        <CheckCircle className="me-2" /> 
                        {puedeMarcar ? 'Marcar Asistencia Ahora' : 'Gestionar Asistencias'}
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Información adicional */}
      <Card className="mt-4 bg-light">
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6><Clock className="me-2" /> Horario de México (UTC-6)</h6>
              <p className="text-muted small mb-0">
                Solo puedes marcar asistencia durante el horario de clase y en los días correspondientes.
                La hora actual en México es: {mexicoTime.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City' })}
              </p>
            </Col>
            <Col md={6}>
              <h6><CheckCircle className="me-2" /> Estado de Clases</h6>
              <p className="text-muted small mb-0">
                <Badge bg="primary" className="me-2">Azul</Badge> Clase activa ahora - Puedes marcar asistencia
                <br />
                <Badge bg="secondary" className="me-2">Gris</Badge> Fuera de horario - Solo ver historial
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MaestroClases;