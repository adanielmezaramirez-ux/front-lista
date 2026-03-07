import React, { useEffect, useState } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../services/usersService';
import LoadingSpinner from '../components/LoadingSpinner';
import { Book, People, CalendarCheck } from 'react-bootstrap-icons';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await usersService.getUserData();
        setData(userData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>
      
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
            {data.clases.map((clase: any) => (
              <Col md={4} key={clase.id}>
                <Card className="mb-3">
                  <Card.Body>
                    <Card.Title>{clase.nombre}</Card.Title>
                    <Card.Text>
                      <small className="text-muted d-block">
                        Horario: {clase.horario || 'No especificado'}
                      </small>
                      <small className="text-muted d-block">
                        Días: {clase.dias || 'No especificado'}
                      </small>
                      <strong className="d-block mt-2">
                        Alumnos: {clase.total_alumnos || 0}
                      </strong>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;