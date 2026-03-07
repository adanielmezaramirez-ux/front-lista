import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Person, 
  Lock, 
  ShieldLock, 
  Info,
  ArrowRight,
  Eye,
  EyeSlash
} from 'react-bootstrap-icons';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Cargar usuario guardado si existe
  useEffect(() => {
    const savedUsername = localStorage.getItem('savedUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      
      // Guardar usuario si "recordarme" está activado
      if (rememberMe) {
        localStorage.setItem('savedUsername', username);
      } else {
        localStorage.removeItem('savedUsername');
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container 
      fluid 
      className="vh-100 d-flex align-items-center justify-content-center p-0"
      style={{ 
        background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Elementos decorativos de fondo */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '80%',
        height: '80%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-10%',
        width: '60%',
        height: '60%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <Row className="w-100 mx-0">
        <Col md={6} lg={5} xl={4} className="mx-auto">
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden animate__animated animate__fadeIn">
            {/* Header con logo */}
            <Card.Header className="bg-white border-0 pt-4 pb-0 text-center">
              <div className="d-flex justify-content-center mb-3">
                <div 
                  className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '80px', 
                    height: '80px',
                    background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)'
                  }}
                >
                  <img 
                    src="/vite.svg" 
                    alt="Logo" 
                    style={{ width: '50px', height: '50px', filter: 'brightness(0) invert(1)' }}
                  />
                </div>
              </div>
              <h3 className="text-dark mb-1 fw-bold">Listas Hanxue</h3>
              <p className="text-muted mb-0">Sistema de Gestión de Asistencia</p>
            </Card.Header>

            <Card.Body className="p-4">
              {error && (
                <Alert 
                  variant="danger" 
                  className="d-flex align-items-center animate__animated animate__shakeX"
                  dismissible
                  onClose={() => setError('')}
                >
                  <Info className="me-2" size={18} />
                  <span>{error}</span>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Campo Usuario */}
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted fw-semibold d-flex align-items-center">
                    <Person className="me-2 text-primary" size={18} />
                    Usuario
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      placeholder="Ingresa tu usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoFocus
                      className="py-2 ps-4 border-2 rounded-3"
                      style={{ borderColor: '#e9ecef' }}
                      disabled={loading}
                    />
                  </div>
                </Form.Group>

                {/* Campo Contraseña */}
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted fw-semibold d-flex align-items-center">
                    <Lock className="me-2 text-primary" size={18} />
                    Contraseña
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="py-2 ps-4 border-2 rounded-3"
                      style={{ borderColor: '#e9ecef', paddingRight: '40px' }}
                      disabled={loading}
                    />
                    <Button
                      variant="link"
                      className="position-absolute end-0 top-50 translate-middle-y text-muted"
                      style={{ border: 'none', background: 'none', padding: '8px' }}
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      type="button"
                    >
                      {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                </Form.Group>

                {/* Opciones adicionales */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <Form.Check
                    type="checkbox"
                    id="rememberMe"
                    label="Recordar usuario"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="text-muted"
                  />
                </div>

                {/* Botón de inicio de sesión */}
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 py-3 mb-3 d-flex align-items-center justify-content-center"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                    border: 'none',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      Iniciar Sesión
                      <ArrowRight className="ms-2" size={18} />
                    </>
                  )}
                </Button>

                {/* Mensaje de acceso */}
                <div className="text-center">
                  <small className="text-muted d-flex align-items-center justify-content-center">
                    <ShieldLock className="me-1" size={14} />
                    Acceso solo para administradores y maestros
                  </small>
                </div>
              </Form>
            </Card.Body>

            {/* Footer con versión */}
            <Card.Footer className="bg-white border-0 pb-4 text-center">
              <small className="text-muted">
                  © 2026 Hanxue School Educación Intercultural
              </small>
              <br />
              <small className="text-muted">
                Listas Hanxue - Versión 1.0.0
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Estilos globales para animaciones */}
      <style>{`
        .animate__animated {
          animation-duration: 0.5s;
          animation-fill-mode: both;
        }
        
        .animate__fadeIn {
          animation-name: fadeIn;
        }
        
        .animate__shakeX {
          animation-name: shakeX;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shakeX {
          from, to {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }
        
        /* Estilos personalizados para inputs */
        .form-control:focus {
          border-color: #3498db !important;
          box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25) !important;
        }
        
        /* Efecto hover para el botón de recordar */
        .form-check:hover {
          cursor: pointer;
        }
        
        /* Transición suave para todos los elementos */
        * {
          transition: all 0.2s ease-in-out;
        }
      `}</style>
    </Container>
  );
};

export default Login;