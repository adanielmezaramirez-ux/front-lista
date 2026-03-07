import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { adminService } from '../../services/adminService';
import { 
  FileEarmarkExcel, 
  FileEarmarkPdf, 
  Filter,
  Calendar,
  Info,
  Download,
  Clock,
  Search
} from 'react-bootstrap-icons';

const Reportes: React.FC = () => {
  const [filtros, setFiltros] = useState({
    claseId: '',
    fechaInicio: '',
    fechaFin: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDescargarExcel = async () => {
    setLoading(true);
    setError('');
    try {
      const blob = await adminService.descargarReporteExcel({
        claseId: filtros.claseId ? Number(filtros.claseId) : undefined,
        fechaInicio: filtros.fechaInicio || undefined,
        fechaFin: filtros.fechaFin || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_asistencias_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Error al descargar reporte Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPDF = async () => {
    setLoading(true);
    setError('');
    try {
      const blob = await adminService.descargarReportePDF({
        claseId: filtros.claseId ? Number(filtros.claseId) : undefined,
        fechaInicio: filtros.fechaInicio || undefined,
        fechaFin: filtros.fechaFin || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_asistencias_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Error al descargar reporte PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h2 className="mb-4 text-gradient d-flex align-items-center">
        <FileEarmarkExcel className="me-2 text-success" size={28} />
        <FileEarmarkPdf className="me-3 text-danger" size={28} />
        Reportes de Asistencia
      </h2>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="fade-in">
          <span className="d-flex align-items-center">
            <Info className="me-2" size={20} />
            {error}
          </span>
        </Alert>
      )}

      <Card className="mb-4 shadow-hover">
        <Card.Header className="bg-gradient-primary text-white d-flex align-items-center">
          <Filter className="me-2" size={20} />
          <h5 className="mb-0">Filtros de Búsqueda</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center">
                  <Search className="me-2 text-primary" size={16} />
                  ID de Clase
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Ej: 1"
                  value={filtros.claseId}
                  onChange={(e) => setFiltros({...filtros, claseId: e.target.value})}
                />
                <Form.Text className="text-muted d-flex align-items-center mt-1">
                  <Info className="me-1" size={12} />
                  Deja en blanco para todas las clases
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center">
                  <Calendar className="me-2 text-primary" size={16} />
                  Fecha Inicio
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
                  max={new Date().toISOString().split('T')[0]}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center">
                  <Calendar className="me-2 text-primary" size={16} />
                  Fecha Fin
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
                  max={new Date().toISOString().split('T')[0]}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex gap-3 flex-wrap">
            <Button
              variant="success"
              onClick={handleDescargarExcel}
              disabled={loading}
              className="d-flex align-items-center"
              size="lg"
            >
              <FileEarmarkExcel className="me-2" size={20} />
              {loading ? 'Generando...' : 'Descargar Excel'}
              {!loading && <Download className="ms-2" size={16} />}
            </Button>
            <Button
              variant="danger"
              onClick={handleDescargarPDF}
              disabled={loading}
              className="d-flex align-items-center"
              size="lg"
            >
              <FileEarmarkPdf className="me-2" size={20} />
              {loading ? 'Generando...' : 'Descargar PDF'}
              {!loading && <Download className="ms-2" size={16} />}
            </Button>
          </div>

          {loading && (
            <div className="mt-3 text-primary d-flex align-items-center">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <span>Generando reporte, por favor espere...</span>
            </div>
          )}
        </Card.Body>
      </Card>

      <Row>
        <Col md={6}>
          <Card className="shadow-hover h-100">
            <Card.Header className="bg-gradient-primary text-white d-flex align-items-center">
              <Info className="me-2" size={20} />
              <h5 className="mb-0">Información del Reporte</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted d-flex align-items-center mb-3">
                <FileEarmarkExcel className="text-success me-2" size={16} />
                <FileEarmarkPdf className="text-danger me-2" size={16} />
                Los reportes incluyen información detallada de asistencias:
              </p>
              <ul className="list-unstyled">
                <li className="mb-2 d-flex align-items-center">
                  <span className="badge bg-primary me-2">•</span>
                  <strong>Nombre de la clase</strong>
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <span className="badge bg-success me-2">•</span>
                  <strong>Nombre completo del alumno</strong>
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <span className="badge bg-info me-2">•</span>
                  <strong>Fecha de la clase</strong>
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <span className="badge bg-warning me-2">•</span>
                  <strong>Estado de asistencia (Presente/Ausente)</strong>
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <span className="badge bg-danger me-2">•</span>
                  <strong>Nombre del maestro que registró</strong>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-hover h-100">
            <Card.Header className="bg-gradient-primary text-white d-flex align-items-center">
              <Info className="me-2" size={20} />
              <h5 className="mb-0">Notas Importantes</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6 className="text-primary d-flex align-items-center">
                  <FileEarmarkExcel className="me-2 text-success" size={18} />
                  <FileEarmarkPdf className="me-2 text-danger" size={18} />
                  Formatos disponibles:
                </h6>
                <p className="text-muted ms-4">
                  Puedes descargar los reportes en formato Excel (.xlsx) o PDF para análisis y presentaciones.
                </p>
              </div>
              <div className="mb-3">
                <h6 className="text-primary d-flex align-items-center">
                  <Filter className="me-2" size={18} />
                  Filtros disponibles:
                </h6>
                <p className="text-muted ms-4">
                  Filtra por clase específica y/o rango de fechas. 
                  Sin filtros, se incluirán todos los registros.
                </p>
              </div>
              <div>
                <h6 className="text-primary d-flex align-items-center">
                  <Clock className="me-2" size={18} />
                  Tiempo de generación:
                </h6>
                <p className="text-muted ms-4">
                  La generación puede tomar algunos segundos dependiendo del volumen de datos.
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mt-4 bg-light border-0">
        <Card.Body>
          <div className="d-flex align-items-center">
            <div className="d-flex me-3">
              <FileEarmarkExcel size={30} className="text-success me-2" />
              <FileEarmarkPdf size={30} className="text-danger" />
            </div>
            <p className="text-muted mb-0 small">
              <Info className="me-1 text-primary" size={14} />
              Reportes generados con datos en tiempo real. Para períodos extensos, se recomienda el formato Excel.
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Reportes;