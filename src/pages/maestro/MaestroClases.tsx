import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { classService } from '../../services/classService';
import { Clase, getDiaSemanaNombre } from '../../interfaces';
import { useMexicoDateTime } from '../../hooks/useMexicoDateTime';
import LoadingSpinner from '../../components/LoadingSpinner';
import { People, Clock, Calendar, CheckCircle, XCircle, InfoCircle } from 'react-bootstrap-icons';

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
    <div className="container-fluid px-0">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-2">Mis Clases</h2>
          <div className="d-flex align-items-center text-muted">
            <Clock className="me-2" />
            <span>Hora México: {mexicoTime.toLocaleString('es-MX', { 
              timeZone: 'America/Mexico_City',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
        </Col>
        {cargandoEstadisticas && (
          <Col md="auto">
            <div className="d-flex align-items-center text-primary">
              <Spinner size="sm" animation="border" className="me-2" />
              <span>Actualizando...</span>
            </div>
          </Col>
        )}
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {clases.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <InfoCircle className="text-muted mb-3" size={48} />
            <h5>No tienes clases asignadas</h5>
            <p className="text-muted">Contacta al administrador para asignarte clases</p>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {clases.map((clase) => {
            const stats = estadisticas.get(clase.id) || {
              asistenciasHoy: 0,
              totalAlumnos: clase.total_alumnos || 0,
              porcentajeHoy: 0,
              puedeMarcar: false,
              horarioHoy: null
            };

            return (
              <Col key={clase.id}>
                <Card className={`h-100 ${stats.puedeMarcar ? 'border-primary' : ''}`}>
                  <Card.Header className={`${stats.puedeMarcar ? 'bg-primary' : 'bg-light'} d-flex justify-content-between align-items-center`}>
                    <h6 className={`mb-0 ${stats.puedeMarcar ? 'text-white' : ''}`}>
                      {clase.nombre}
                    </h6>
                    {stats.puedeMarcar && (
                      <Badge bg="light" text="dark" className="px-3 py-2">
                        <Clock className="me-2" size={12} />
                        En horario
                      </Badge>
                    )}
                  </Card.Header>
                  
                  <Card.Body>
                    <div className="mb-3">
                      <div className="d-flex align-items-start">
                        <Clock className="text-primary me-2 mt-1" />
                        <div>
                          <small className="text-muted d-block mb-2">Horarios:</small>
                          <div className="d-flex flex-wrap gap-2">
                            {clase.horarios && clase.horarios.length > 0 ? (
                              clase.horarios.map((h, idx) => (
                                <Badge 
                                  key={idx} 
                                  bg={h.dia_semana === stats.horarioHoy?.dia_semana ? 'success' : 'secondary'}
                                  className="px-3 py-2"
                                >
                                  {getDiaSemanaNombre(h.dia_semana)} {h.hora_inicio.substring(0,5)}-{h.hora_fin.substring(0,5)}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted">Sin horarios definidos</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-light p-3 rounded">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="d-flex align-items-center">
                          <People className="me-2" />
                          Alumnos inscritos:
                        </span>
                        <Badge bg="info" className="px-3 py-2">
                          {stats.totalAlumnos}
                        </Badge>
                      </div>
                      
                      {stats.puedeMarcar ? (
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="d-flex align-items-center text-success">
                            <CheckCircle className="me-2" />
                            Asistencia hoy:
                          </span>
                          <div className="d-flex align-items-center gap-2">
                            <strong>{stats.asistenciasHoy}/{stats.totalAlumnos}</strong>
                            {stats.totalAlumnos > 0 && (
                              <Badge 
                                bg={stats.porcentajeHoy >= 80 ? 'success' : stats.porcentajeHoy >= 60 ? 'warning' : 'danger'}
                                className="px-3 py-2"
                              >
                                {stats.porcentajeHoy}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="d-flex justify-content-between align-items-center text-muted mb-2">
                            <span className="d-flex align-items-center">
                              <XCircle className="me-2" />
                              Estado:
                            </span>
                            <span>Fuera de horario</span>
                          </div>
                          {stats.horarioHoy && (
                            <div className="d-flex justify-content-between align-items-center text-muted small">
                              <span className="d-flex align-items-center">
                                <Clock className="me-2" />
                                Próxima clase:
                              </span>
                              <span>
                                {getDiaSemanaNombre(stats.horarioHoy.dia_semana)} {stats.horarioHoy.hora_inicio.substring(0,5)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card.Body>

                  <Card.Footer className="bg-white">
                    <Row className="g-2">
                      <Col xs={12}>
                        <Button
                          as={Link as any}
                          to={`/maestro/asistencias/${clase.id}`}
                          variant={stats.puedeMarcar ? 'success' : 'outline-success'}
                          size="sm"
                          className="w-100 d-inline-flex align-items-center justify-content-center"
                        >
                          <CheckCircle className="me-2" /> 
                          {stats.puedeMarcar ? 'Asistencia' : 'Ver asistencias'}
                        </Button>
                      </Col>
                    </Row>
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