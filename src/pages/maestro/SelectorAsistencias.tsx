import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Alert, Badge, Form, InputGroup } from 'react-bootstrap';
import { classService } from '../../services/classService';
import { Clase, getDiaSemanaNombre } from '../../interfaces';
import { useMexicoDateTime } from '../../hooks/useMexicoDateTime';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  CalendarCheck, 
  Search, 
  Clock, 
  People, 
  Calendar,
  Filter
} from 'react-bootstrap-icons';

const SelectorAsistencias: React.FC = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [filteredClases, setFilteredClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [estadisticas, setEstadisticas] = useState<Map<number, any>>(new Map());
  const [filtroDia, setFiltroDia] = useState<number>(-1);
  
  const navigate = useNavigate();
  const { getMexicoDateString, mexicoTime, getDiaSemanaActual } = useMexicoDateTime();

  useEffect(() => {
    fetchClases();
  }, []);

  useEffect(() => {
    // Filtrar clases por búsqueda y día
    let filtered = clases;
    
    if (searchTerm) {
      filtered = filtered.filter(clase => 
        clase.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filtroDia !== -1) {
      filtered = filtered.filter(clase => 
        clase.horarios.some(h => h.dia_semana === filtroDia)
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
        
        stats.set(clase.id, {
          asistenciasHoy: presentesHoy,
          totalAlumnos: clase.total_alumnos || 0,
          porcentajeHoy: clase.total_alumnos ? Math.round((presentesHoy / clase.total_alumnos) * 100) : 0
        });
      } catch (error) {
        console.error(`Error cargando estadísticas para clase ${clase.id}:`, error);
      }
    }
    
    setEstadisticas(stats);
  };

  // Obtener días únicos de todas las clases
  const diasUnicos = () => {
    const diasSet = new Set<number>();
    clases.forEach(clase => {
      clase.horarios.forEach(h => diasSet.add(h.dia_semana));
    });
    return Array.from(diasSet).sort((a, b) => a - b);
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
                  onChange={(e) => setFiltroDia(Number(e.target.value))}
                >
                  <option value="-1">Todos los días</option>
                  {diasUnicos().map(dia => (
                    <option key={dia} value={dia}>{getDiaSemanaNombre(dia)}</option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {filteredClases.length === 0 ? (
        <Alert variant="info">
          {searchTerm || filtroDia !== -1 
            ? 'No hay clases que coincidan con los filtros' 
            : 'No tienes clases asignadas'}
        </Alert>
      ) : (
        <Row>
          {filteredClases.map((clase) => {
            const stats = estadisticas.get(clase.id) || {
              asistenciasHoy: 0,
              totalAlumnos: 0,
              porcentajeHoy: 0
            };

            // Verificar si hoy es día de clase
            const diaActual = getDiaSemanaActual();
            const esDiaClaseHoy = clase.horarios.some(h => h.dia_semana === diaActual);

            return (
              <Col md={6} lg={4} key={clase.id}>
                <Card className={`mb-4 h-100 ${esDiaClaseHoy ? 'border-success' : ''}`}>
                  <Card.Header className={`${esDiaClaseHoy ? 'bg-success' : 'bg-primary'} text-white`}>
                    <h5 className="mb-0">{clase.nombre}</h5>
                  </Card.Header>
                  
                  <Card.Body>
                    {/* Horarios */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <Clock className="text-secondary me-2" size={16} />
                        <div>
                          {clase.horarios.map((h, idx) => (
                            <Badge 
                              key={idx} 
                              bg={h.dia_semana === diaActual ? 'success' : 'secondary'}
                              className="me-1 mb-1"
                            >
                              {getDiaSemanaNombre(h.dia_semana)} {h.hora_inicio.substring(0,5)}-{h.hora_fin.substring(0,5)}
                            </Badge>
                          ))}
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
                      
                      {esDiaClaseHoy && (
                        <div className="d-flex justify-content-between align-items-center">
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
                      )}
                    </div>
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
    </div>
  );
};

export default SelectorAsistencias;