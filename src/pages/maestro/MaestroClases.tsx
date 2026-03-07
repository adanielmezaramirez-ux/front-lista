import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { classService } from '../../services/classService';
import { Clase, getDiaSemanaNombre, formatearHorarios } from '../../interfaces';
import { useMexicoDateTime } from '../../hooks/useMexicoDateTime';
import LoadingSpinner from '../../components/LoadingSpinner';
import { People, CalendarCheck, Clock, Calendar, CheckCircle, XCircle } from 'react-bootstrap-icons';

const MaestroClases: React.FC = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estadisticas, setEstadisticas] = useState<Map<number, any>>(new Map());
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false);
  
  const { getMexicoDateString, puedeMarcarAsistencia, mexicoTime, getHorarioHoy } = useMexicoDateTime();

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
    const fechaHoy = getMexicoDateString();
    
    for (const clase of clases) {
      try {
        const asistenciasHoy = await classService.getAsistencias(clase.id, fechaHoy);
        const presentesHoy = asistenciasHoy.filter(a => a.presente).length;
        
        stats.set(clase.id, {
          asistenciasHoy: presentesHoy,
          totalAlumnos: clase.total_alumnos || 0,
          porcentajeHoy: clase.total_alumnos ? Math.round((presentesHoy / clase.total_alumnos) * 100) : 0,
          puedeMarcar: puedeMarcarAsistencia(clase),
          horarioHoy: getHorarioHoy(clase.horarios)
        });
      } catch (error) {
        console.error(`Error cargando estadísticas para clase ${clase.id}:`, error);
      }
    }
    
    setEstadisticas(stats);
    setCargandoEstadisticas(false);
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
              puedeMarcar: false,
              horarioHoy: null
            };

            return (
              <Col md={6} lg={4} key={clase.id}>
                <Card className={`mb-4 h-100 ${stats.puedeMarcar ? 'border-primary' : ''}`}>
                  <Card.Header className={`${stats.puedeMarcar ? 'bg-primary' : 'bg-secondary'} text-white d-flex justify-content-between align-items-center`}>
                    <h5 className="mb-0">{clase.nombre}</h5>
                    {stats.puedeMarcar && (
                      <Badge bg="light" text="dark" className="ms-2">
                        <Clock className="me-1" size={12} />
                        Ahora
                      </Badge>
                    )}
                  </Card.Header>
                  
                  <Card.Body>
                    {/* Horarios */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <Clock className="text-primary me-2" />
                        <div>
                          {clase.horarios && clase.horarios.length > 0 ? (
                            clase.horarios.map((h, idx) => (
                              <Badge 
                                key={idx} 
                                bg={h.dia_semana === stats.horarioHoy?.dia_semana ? 'success' : 'secondary'}
                                className="me-1 mb-1"
                              >
                                {getDiaSemanaNombre(h.dia_semana)} {h.hora_inicio.substring(0,5)}-{h.hora_fin.substring(0,5)}
                              </Badge>
                            ))
                          ) : (
                            <span>Sin horarios</span>
                          )}
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
                      
                      {stats.puedeMarcar ? (
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
                            No es horario de clase
                          </span>
                          {stats.horarioHoy && (
                            <small>
                              Próximo: {getDiaSemanaNombre(stats.horarioHoy.dia_semana)} {stats.horarioHoy.hora_inicio.substring(0,5)}
                            </small>
                          )}
                        </div>
                      )}
                    </div>
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
                        variant={stats.puedeMarcar ? 'success' : 'outline-success'}
                        size="sm"
                      >
                        <CheckCircle className="me-2" /> 
                        {stats.puedeMarcar ? 'Marcar Asistencia' : 'Gestionar Asistencias'}
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default MaestroClases;