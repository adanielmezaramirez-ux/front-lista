import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Badge, ListGroup, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../services/usersService';
import { classService } from '../services/classService';
import { adminService } from '../services/adminService';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Book, 
  People, 
  CalendarCheck, 
  Clock, 
  InfoCircle,
  PersonBadge,
  PersonVcard,
  GraphUp,
  Shield,
  ExclamationTriangle,
  Envelope,
  Person,
  ArrowUp,
  ArrowDown,
  Calendar
} from 'react-bootstrap-icons';
import { getDiaSemanaNombre } from '../interfaces';
import { useMexicoDateTime } from '../hooks/useMexicoDateTime';

interface DashboardData {
  totalUsuarios?: number;
  totalAdmins?: number;
  totalMaestros?: number;
  totalAlumnos?: number;
  usuariosSinRol?: number;
  usuariosActivos?: number;
  usuariosSuspendidos?: number;
  usuariosNoConfirmados?: number;
  totalClases?: number;
  clasesActivas?: number;
  clasesSinHorarios?: number;
  asistenciasHoy?: number;
  asistenciasSemana?: number;
  promedioAsistencia?: number;
  clases?: any[];
  ultimasClases?: any[];
  usuariosRecientes?: any[];
  estadisticasClases?: any[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({});
  const { mexicoTime, getDiaSemanaActual } = useMexicoDateTime();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'admin') {
          const [usuarios, clases, asistenciasHoy, asistenciasSemana] = await Promise.all([
            adminService.getUsers(),
            adminService.getClasses(),
            classService.getAsistenciasHoy ? classService.getAsistenciasHoy() : [],
            classService.getAsistenciasSemana ? classService.getAsistenciasSemana() : []
          ]);

          const totalAdmins = usuarios.filter((u: any) => u.role === 'admin').length;
          const totalMaestros = usuarios.filter((u: any) => u.role === 'maestro').length;
          const totalAlumnos = usuarios.filter((u: any) => u.role === 'alumno').length;
          const usuariosSinRol = usuarios.filter((u: any) => !u.role).length;
          const usuariosActivos = usuarios.filter((u: any) => !u.suspended && u.confirmed).length;
          const usuariosSuspendidos = usuarios.filter((u: any) => u.suspended).length;
          const usuariosNoConfirmados = usuarios.filter((u: any) => !u.confirmed).length;

          const clasesActivas = clases.filter((c: any) => c.horarios && c.horarios.length > 0).length;
          const clasesSinHorarios = clases.filter((c: any) => !c.horarios || c.horarios.length === 0).length;

          const asistenciasHoyCount = asistenciasHoy?.filter((a: any) => a.presente).length || 0;
          const asistenciasSemanaCount = asistenciasSemana?.length || 0;
          const promedioAsistencia = asistenciasSemanaCount > 0 
            ? Math.round((asistenciasHoyCount / asistenciasSemanaCount) * 100) 
            : 0;

          const estadisticasClases = await Promise.all(
            clases.slice(0, 5).map(async (clase: any) => {
              try {
                const asistencias = await classService.getAsistencias(clase.id);
                const presentes = asistencias.filter((a: any) => a.presente).length;
                return {
                  id: clase.id,
                  nombre: clase.nombre,
                  totalAlumnos: clase.alumnos?.length || 0,
                  porcentaje: asistencias.length > 0 ? Math.round((presentes / asistencias.length) * 100) : 0,
                  horarios: clase.horarios || []
                };
              } catch {
                return null;
              }
            })
          );

          // Ordenar clases por ID (asumiendo que IDs más altos son más recientes)
          const ultimasClases = [...clases]
            .sort((a, b) => b.id - a.id)
            .slice(0, 5);

          setData({
            totalUsuarios: usuarios.length,
            totalAdmins,
            totalMaestros,
            totalAlumnos,
            usuariosSinRol,
            usuariosActivos,
            usuariosSuspendidos,
            usuariosNoConfirmados,
            totalClases: clases.length,
            clasesActivas,
            clasesSinHorarios,
            asistenciasHoy: asistenciasHoyCount,
            asistenciasSemana: asistenciasSemanaCount,
            promedioAsistencia,
            clases,
            ultimasClases,
            usuariosRecientes: usuarios.slice(0, 5),
            estadisticasClases: estadisticasClases.filter(Boolean)
          });
        } else if (user?.role === 'maestro') {
          const [userData, clases] = await Promise.all([
            usersService.getUserData(),
            classService.getMisClases()
          ]);

          const totalAlumnos = clases.reduce((acc: number, clase: any) => 
            acc + (clase.total_alumnos || 0), 0);

          setData({
            totalClases: clases.length,
            totalAlumnos,
            clases
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-fluid px-0">
        <Card className="text-center py-5">
          <Card.Body>
            <InfoCircle className="text-muted mb-3" size={48} />
            <h5>No hay sesión activa</h5>
            <p className="text-muted">Por favor inicia sesión</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <div className="container-fluid px-0">
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="mb-2">Panel de Administración</h2>
            <div className="d-flex align-items-center text-muted">
              <Clock className="me-2" />
              {mexicoTime.toLocaleString('es-MX', { 
                timeZone: 'America/Mexico_City',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </Col>
          <Col md="auto">
            <Badge bg="primary" className="px-4 py-3">
              <GraphUp className="me-2" size={16} />
              Sistema activo
            </Badge>
          </Col>
        </Row>

        <Row className="mb-4 g-3">
          <Col md={3}>
            <Card className="h-100 border-primary">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="text-muted mb-2">Total Usuarios</h6>
                    <h2 className="mb-0">{data.totalUsuarios || 0}</h2>
                  </div>
                  <div className="bg-primary bg-opacity-10 p-3 rounded">
                    <People size={24} className="text-primary" />
                  </div>
                </div>
                <div className="mt-3 d-flex gap-2 flex-wrap">
                  <Badge bg="danger" className="px-2 py-1">
                    <Shield className="me-1" size={10} /> {data.totalAdmins || 0}
                  </Badge>
                  <Badge bg="warning" className="px-2 py-1">
                    <PersonVcard className="me-1" size={10} /> {data.totalMaestros || 0}
                  </Badge>
                  <Badge bg="success" className="px-2 py-1">
                    <PersonBadge className="me-1" size={10} /> {data.totalAlumnos || 0}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="h-100 border-success">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="text-muted mb-2">Clases</h6>
                    <h2 className="mb-0">{data.totalClases || 0}</h2>
                  </div>
                  <div className="bg-success bg-opacity-10 p-3 rounded">
                    <Book size={24} className="text-success" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Activas</span>
                    <span>{data.clasesActivas || 0}</span>
                  </div>
                  <ProgressBar 
                    now={((data.clasesActivas || 0) / (data.totalClases || 1)) * 100} 
                    variant="success" 
                    size="sm"
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="h-100 border-info">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="text-muted mb-2">Asistencias Hoy</h6>
                    <h2 className="mb-0">{data.asistenciasHoy || 0}</h2>
                  </div>
                  <div className="bg-info bg-opacity-10 p-3 rounded">
                    <CalendarCheck size={24} className="text-info" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Promedio</span>
                    <span>{data.promedioAsistencia || 0}%</span>
                  </div>
                  <ProgressBar 
                    now={data.promedioAsistencia || 0} 
                    variant="info" 
                    size="sm"
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="h-100 border-warning">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="text-muted mb-2">Estado Usuarios</h6>
                    <h2 className="mb-0">{data.usuariosActivos || 0}</h2>
                  </div>
                  <div className="bg-warning bg-opacity-10 p-3 rounded">
                    <Person size={24} className="text-warning" />
                  </div>
                </div>
                <div className="mt-3 small">
                  <div className="d-flex justify-content-between">
                    <span className="text-success">Activos</span>
                    <span>{data.usuariosActivos || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-danger">Suspendidos</span>
                    <span>{data.usuariosSuspendidos || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-warning">No confirmados</span>
                    <span>{data.usuariosNoConfirmados || 0}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4 g-3">
          <Col md={4}>
            <Card className="h-100">
              <Card.Header className="bg-light d-flex align-items-center">
                <People className="me-2 text-primary" />
                <h6 className="mb-0">Usuarios Recientes</h6>
              </Card.Header>
              <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {data.usuariosRecientes && data.usuariosRecientes.length > 0 ? (
                  data.usuariosRecientes.map((user: any) => (
                    <div key={user.id} className="d-flex align-items-center mb-2 p-2 border rounded">
                      <div className="bg-light rounded-circle p-2 me-3">
                        <Person size={16} className="text-primary" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold small">{user.firstname} {user.lastname}</div>
                        <div className="d-flex align-items-center small text-muted">
                          <Envelope className="me-1" size={10} />
                          {user.email}
                        </div>
                      </div>
                      <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'maestro' ? 'warning' : 'success'} className="px-2">
                        {user.role || 'sin rol'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center py-4">No hay usuarios recientes</p>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100">
              <Card.Header className="bg-light d-flex align-items-center">
                <Calendar className="me-2 text-primary" />
                <h6 className="mb-0">Últimas Clases Creadas</h6>
              </Card.Header>
              <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {data.ultimasClases && data.ultimasClases.length > 0 ? (
                  data.ultimasClases.map((clase: any) => (
                    <div key={clase.id} className="d-flex align-items-center mb-2 p-2 border rounded">
                      <div className="bg-light rounded-circle p-2 me-3">
                        <Book size={16} className="text-success" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold small">{clase.nombre}</div>
                        <div className="d-flex gap-2 mt-1">
                          <Badge bg="info" className="px-2" style={{ fontSize: '0.6rem' }}>
                            <People className="me-1" size={8} /> {clase.alumnos?.length || 0}
                          </Badge>
                          <Badge bg="secondary" className="px-2" style={{ fontSize: '0.6rem' }}>
                            <Clock className="me-1" size={8} /> {clase.horarios?.length || 0} horarios
                          </Badge>
                        </div>
                      </div>
                      <Badge bg="primary" className="px-2">
                        #{clase.id}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center py-4">No hay clases creadas</p>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100">
              <Card.Header className="bg-light d-flex align-items-center">
                <ExclamationTriangle className="me-2 text-primary" />
                <h6 className="mb-0">Resumen Rápido</h6>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>Usuarios sin rol</span>
                    <Badge bg="secondary" pill>{data.usuariosSinRol || 0}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>Clases sin horarios</span>
                    <Badge bg="warning" pill>{data.clasesSinHorarios || 0}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>Asistencias esta semana</span>
                    <Badge bg="info" pill>{data.asistenciasSemana || 0}</Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  if (user.role === 'maestro') {
    const diaActual = getDiaSemanaActual();
    const clasesHoy = data.clases?.filter((clase: any) => 
      clase.horarios?.some((h: any) => h.dia_semana === diaActual)
    ) || [];

    return (
      <div className="container-fluid px-0">
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="mb-2">Panel del Maestro</h2>
            <div className="d-flex align-items-center text-muted">
              <Clock className="me-2" />
              {mexicoTime.toLocaleString('es-MX', { 
                timeZone: 'America/Mexico_City',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </Col>
          <Col md="auto">
            <Badge bg={clasesHoy.length > 0 ? 'success' : 'secondary'} className="px-4 py-3">
              <CalendarCheck className="me-2" size={16} />
              {clasesHoy.length > 0 ? `${clasesHoy.length} clase(s) hoy` : 'Sin clases hoy'}
            </Badge>
          </Col>
        </Row>

        <Row className="mb-4 g-3">
          <Col md={4}>
            <Card className="h-100 border-primary">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="text-muted mb-2">Mis Clases</h6>
                    <h2 className="mb-0">{data.totalClases || 0}</h2>
                  </div>
                  <div className="bg-primary bg-opacity-10 p-3 rounded">
                    <Book size={24} className="text-primary" />
                  </div>
                </div>
                <div className="mt-3 small text-muted">
                  {clasesHoy.length > 0 ? (
                    <div className="text-success">
                      <ArrowUp className="me-1" size={12} />
                      {clasesHoy.length} clase(s) hoy
                    </div>
                  ) : (
                    <div className="text-secondary">
                      <ArrowDown className="me-1" size={12} />
                      No hay clases hoy
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 border-success">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="text-muted mb-2">Total Alumnos</h6>
                    <h2 className="mb-0">{data.totalAlumnos || 0}</h2>
                  </div>
                  <div className="bg-success bg-opacity-10 p-3 rounded">
                    <People size={24} className="text-success" />
                  </div>
                </div>
                <div className="mt-3 small">
                  En todas tus clases
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 border-info">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="text-muted mb-2">Asistencias Hoy</h6>
                    <h2 className="mb-0">{data.asistenciasHoy || 0}</h2>
                  </div>
                  <div className="bg-info bg-opacity-10 p-3 rounded">
                    <CalendarCheck size={24} className="text-info" />
                  </div>
                </div>
                <div className="mt-3 small text-muted">
                  Registradas en el sistema
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {data.clases && data.clases.length > 0 && (
          <>
            <h5 className="mb-3 d-flex align-items-center">
              <Book className="me-2 text-primary" />
              Mis Clases
            </h5>
            <Row xs={1} md={2} lg={3} className="g-3">
              {data.clases.map((clase: any) => {
                const horarioHoy = clase.horarios?.find((h: any) => h.dia_semana === diaActual);
                
                return (
                  <Col key={clase.id}>
                    <Card className={`h-100 ${horarioHoy ? 'border-success' : ''}`}>
                      <Card.Header className={`${horarioHoy ? 'bg-success text-white' : 'bg-light'}`}>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold">{clase.nombre}</span>
                          {horarioHoy && (
                            <Badge bg="light" text="dark" className="px-2">
                              <Clock className="me-1" size={10} />
                              Hoy
                            </Badge>
                          )}
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-2">
                          <small className="text-muted d-block mb-1">Horarios:</small>
                          <div className="d-flex flex-wrap gap-1">
                            {clase.horarios?.map((h: any, idx: number) => (
                              <Badge 
                                key={idx} 
                                bg={h.dia_semana === diaActual ? 'success' : 'secondary'}
                                className="px-2 py-1"
                                style={{ fontSize: '0.7rem' }}
                              >
                                {getDiaSemanaNombre(h.dia_semana).substring(0,3)} {h.hora_inicio.substring(0,5)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <span className="small">
                            <People className="me-1" size={12} />
                            Alumnos:
                          </span>
                          <Badge bg="info" className="px-2">
                            {clase.total_alumnos || 0}
                          </Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </>
        )}

        {(!data.clases || data.clases.length === 0) && (
          <Card className="text-center py-5">
            <Card.Body>
              <InfoCircle className="text-muted mb-3" size={48} />
              <h5>No tienes clases asignadas</h5>
              <p className="text-muted">Espera a que el administrador te asigne clases</p>
            </Card.Body>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <Card className="text-center py-5">
        <Card.Body>
          <InfoCircle className="text-muted mb-3" size={48} />
          <h5>Bienvenido al Sistema</h5>
          <p className="text-muted">Selecciona una opción del menú para comenzar</p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;