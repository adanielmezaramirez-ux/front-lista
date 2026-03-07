import React, { useEffect, useState } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../services/usersService';
import { classService } from '../services/classService';
import LoadingSpinner from '../components/LoadingSpinner';
import { Book, People, CalendarCheck, Clock } from 'react-bootstrap-icons';
import { getDiaSemanaNombre } from '../interfaces';
import { useMexicoDateTime } from '../hooks/useMexicoDateTime';

interface DashboardData {
  totalClases?: number;
  totalAlumnos?: number;
  totalAsistencias?: number;
  clases?: any[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({});
  const { mexicoTime, getDiaSemanaActual } = useMexicoDateTime();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await usersService.getUserData();
        
        // Si es maestro, obtener clases con sus horarios
        if (user?.role === 'maestro') {
          const clases = await classService.getMisClases();
          setData({ ...userData, clases });
        } else {
          setData(userData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
        <div className="text-muted">
          <Clock className="me-1" />
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
      </div>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center p-3">
            <Card.Body>
              <Book size={40} className="text-primary mb-3" />
              <h3>{data?.clases?.length || 0}</h3>
              <Card.Text className="text-muted">Clases Asignadas</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="text-center p-3">
            <Card.Body>
              <People size={40} className="text-success mb-3" />
              <h3>{data?.totalAlumnos || 0}</h3>
              <Card.Text className="text-muted">Alumnos</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="text-center p-3">
            <Card.Body>
              <CalendarCheck size={40} className="text-info mb-3" />
              <h3>{data?.totalAsistencias || 0}</h3>
              <Card.Text className="text-muted">Asistencias Hoy</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {data?.clases && data.clases.length > 0 && (
        <>
          <h4 className="mb-3">Mis Clases</h4>
          <Row>
            {data.clases.map((clase: any) => {
              const diaActual = getDiaSemanaActual();
              const horarioHoy = clase.horarios?.find((h: any) => h.dia_semana === diaActual);
              
              return (
                <Col md={4} key={clase.id}>
                  <Card className={`mb-3 ${horarioHoy ? 'border-success' : ''}`}>
                    <Card.Body>
                      <Card.Title>{clase.nombre}</Card.Title>
                      <Card.Text>
                        <small className="text-muted d-block">
                          <Clock className="me-1" size={12} />
                          Horarios:
                        </small>
                        {clase.horarios?.map((h: any, idx: number) => (
                          <small key={idx} className="d-block ms-3">
                            {getDiaSemanaNombre(h.dia_semana)} {h.hora_inicio.substring(0,5)} - {h.hora_fin.substring(0,5)}
                          </small>
                        ))}
                        <strong className="d-block mt-2">
                          Alumnos: {clase.total_alumnos || 0}
                        </strong>
                        {horarioHoy && (
                          <Badge bg="success" className="mt-2">
                            Clase hoy: {horarioHoy.hora_inicio.substring(0,5)} - {horarioHoy.hora_fin.substring(0,5)}
                          </Badge>
                        )}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;