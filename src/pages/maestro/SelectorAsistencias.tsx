import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Alert, Badge, Form, InputGroup } from 'react-bootstrap';
import { classService } from '../../services/classService';
import { Clase } from '../../interfaces';
import { useMexicoDateTime } from '../../hooks/useMexicoDateTime';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  CalendarCheck, 
  Search, 
  Clock, 
  People, 
  Calendar,
  ArrowLeft,
  Filter
} from 'react-bootstrap-icons';

const SelectorAsistencias: React.FC = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [filteredClases, setFilteredClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [estadisticas, setEstadisticas] = useState<Map<number, any>>(new Map());
  const [filtroDia, setFiltroDia] = useState<string>('todos');
  
  const navigate = useNavigate();
  const { getMexicoDateString, mexicoTime } = useMexicoDateTime();

  useEffect(() => {
    fetchClases();
  }, []);

  useEffect(() => {
    // Filtrar clases por búsqueda
    let filtered = clases;
    
    if (searchTerm) {
      filtered = filtered.filter(clase => 
        clase.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filtroDia !== 'todos') {
      filtered = filtered.filter(clase => 
        clase.dias?.toLowerCase().includes(filtroDia.toLowerCase())
      );
    }

    setFilteredClases(filtered);
  }, [clases, searchTerm, filtroDia]);

  useEffect(() => {
    if (clases.length > 0) {
      fetchEstadisticas();
    }
  }, [clases]);

  const fetchClases = async () => {
    try {
      const data = await classService.getMisClases();
      setClases(data);
      setFilteredClases(data);
    } catch (error) {
      setError('Error al cargar clases');
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    const stats = new Map();
    const fechaHoy = getMexicoDateString();
    
    for (const clase of clases) {
      try {
        const asistenciasHoy = await classService.getAsistencias(clase.id, fechaHoy);
        const presentesHoy = asistenciasHoy.filter(a => a.presente).length;
        
        // Obtener últimas 5 asistencias para estadísticas
        const historial = await classService.getAsistencias(clase.id);
        const asistenciasRecientes = historial.slice(-5);
        const promedioReciente = asistenciasRecientes.length > 0
          ? Math.round((asistenciasRecientes.filter(a => a.presente).length / asistenciasRecientes.length) * 100)
          : 0;

        stats.set(clase.id, {
          asistenciasHoy: presentesHoy,
          totalAlumnos: clase.total_alumnos || 0,
          porcentajeHoy: clase.total_alumnos ? Math.round((presentesHoy / clase.total_alumnos) * 100) : 0,
          promedioReciente,
          ultimaAsistencia: historial.length > 0 ? historial[historial.length - 1].fecha : null
        });
      } catch (error) {
        console.error(`Error cargando estadísticas para clase ${clase.id}:`, error);
      }
    }
    
    setEstadisticas(stats);
  };

  const getDiasUnicos = (): string[] => {
    const diasSet = new Set<string>();
    clases.forEach(clase => {
      if (clase.dias) {
        clase.dias.split(',').map(d => d.trim()).forEach(dia => diasSet.add(dia));
      }
    });
    return Array.from(diasSet);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Gestionar Asistencias</h2>
          <p className="text-muted">
            <Clock className="me-1" />
            Selecciona una clase para registrar asistencias
          </p>
          <p className="text-muted small">
            Hora México: {mexicoTime.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
          </p>
        </div>
        <Badge bg="info" className="p-3">
          Total Clases: {clases.length}
        </Badge>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <Search />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar clase por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <Filter />
                </InputGroup.Text>
                <Form.Select
                  value={filtroDia}
                  onChange={(e) => setFiltroDia(e.target.value)}
                >
                  <option value="todos">Todos los días</option>
                  {getDiasUnicos().map(dia => (
                    <option key={dia} value={dia}>{dia}</option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {filteredClases.length === 0 ? (
        <Alert variant="info">
          {searchTerm || filtroDia !== 'todos' 
            ? 'No hay clases que coincidan con los filtros' 
            : 'No tienes clases asignadas'}
        </Alert>
      ) : (
        <Row>
          {filteredClases.map((clase) => {
            const stats = estadisticas.get(clase.id) || {
              asistenciasHoy: 0,
              totalAlumnos: 0,
              porcentajeHoy: 0,
              promedioReciente: 0
            };

            return (
              <Col md={6} lg={4} key={clase.id}>
                <Card className="mb-4 h-100">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">{clase.nombre}</h5>
                  </Card.Header>
                  
                  <Card.Body>
                    {/* Información básica */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <Clock className="text-secondary me-2" size={16} />
                        <span>{clase.horario || 'Horario no especificado'}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <Calendar className="text-secondary me-2" size={16} />
                        <div>
                          {clase.dias ? (
                            clase.dias.split(',').map((dia, idx) => (
                              <Badge key={idx} bg="secondary" className="me-1">
                                {dia.trim()}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted">Días no especificados</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="bg-light p-3 rounded mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>
                          <People className="me-1" />
                          Alumnos:
                        </span>
                        <strong>{stats.totalAlumnos}</strong>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>
                          <CalendarCheck className="me-1" />
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

                      {stats.promedioReciente > 0 && (
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted">
                            Promedio reciente:
                          </span>
                          <small>
                            <Badge bg={stats.promedioReciente >= 80 ? 'success' : stats.promedioReciente >= 60 ? 'warning' : 'danger'}>
                              {stats.promedioReciente}%
                            </Badge>
                          </small>
                        </div>
                      )}
                    </div>

                    {/* Última actividad */}
                    {stats.ultimaAsistencia && (
                      <div className="text-muted small mb-3">
                        <Clock className="me-1" size={12} />
                        Última asistencia: {new Date(stats.ultimaAsistencia).toLocaleDateString()}
                      </div>
                    )}
                  </Card.Body>

                  <Card.Footer className="bg-white">
                    <div className="d-grid gap-2">
                      <Button
                        variant="success"
                        size="lg"
                        onClick={() => navigate(`/maestro/asistencias/${clase.id}`)}
                      >
                        <CalendarCheck className="me-2" size={20} />
                        Gestionar Asistencias
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/maestro/clases/${clase.id}`)}
                      >
                        Ver Detalle de Clase
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
                La hora actual en México es: {mexicoTime.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City' })}
                <br />
                Solo puedes marcar asistencia durante el horario de clase.
              </p>
            </Col>
            <Col md={6}>
              <h6><CalendarCheck className="me-2" /> Estadísticas</h6>
              <p className="text-muted small mb-0">
                <Badge bg="success" className="me-2">Verde</Badge> 80%+ asistencia
                <Badge bg="warning" className="me-2 ms-3">Amarillo</Badge> 60-79% asistencia
                <Badge bg="danger" className="me-2 ms-3">Rojo</Badge> Menos de 60% asistencia
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SelectorAsistencias;