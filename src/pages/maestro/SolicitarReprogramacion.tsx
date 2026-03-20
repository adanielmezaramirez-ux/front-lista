import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Button,
  Alert,
  Row,
  Col,
  Badge
} from 'react-bootstrap';
import { classService } from '../../services/classService';
import { reprogramacionService } from '../../services/reprogramacionService';
import { Clase, getDiaSemanaNombre, DIAS_SEMANA } from '../../interfaces';
import { useMexicoDateTime } from '../../hooks/useMexicoDateTime';
import { Calendar, Clock, InfoCircle, CalendarPlus } from 'react-bootstrap-icons';

interface SolicitarReprogramacionProps {
  show: boolean;
  onHide: () => void;
  claseId: number;
  onSuccess: () => void;
}

const SolicitarReprogramacion: React.FC<SolicitarReprogramacionProps> = ({
  show,
  onHide,
  claseId,
  onSuccess
}) => {
  const [clase, setClase] = useState<Clase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    horarioOriginalId: '',
    fechaOriginal: '',
    fechaReprogramada: '',
    horaInicio: '',
    horaFin: '',
    diaSemana: '1',
    motivo: ''
  });

  const { getMexicoDateString } = useMexicoDateTime();
  const fechaMinima = getMexicoDateString();

  useEffect(() => {
    if (show && claseId) {
      cargarClase();
    }
  }, [show, claseId]);

  const cargarClase = async () => {
    try {
      setLoading(true);
      const data = await classService.getClaseById(claseId);
      setClase(data);
    } catch (error) {
      console.error('Error cargando clase:', error);
      setError('Error al cargar la información de la clase');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.horarioOriginalId || !formData.fechaOriginal || !formData.fechaReprogramada || !formData.motivo || !formData.horaInicio || !formData.horaFin) {
      setError('Todos los campos son requeridos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await reprogramacionService.solicitarReprogramacion({
        claseId,
        horarioOriginalId: Number(formData.horarioOriginalId),
        fechaOriginal: formData.fechaOriginal,
        fechaReprogramada: formData.fechaReprogramada,
        horaInicio: formData.horaInicio + ':00',
        horaFin: formData.horaFin + ':00',
        diaSemana: Number(formData.diaSemana),
        motivo: formData.motivo
      });
      onSuccess();
      onHide();
      setFormData({
        horarioOriginalId: '',
        fechaOriginal: '',
        fechaReprogramada: '',
        horaInicio: '',
        horaFin: '',
        diaSemana: '1',
        motivo: ''
      });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al solicitar reprogramación');
    } finally {
      setLoading(false);
    }
  };

  const handleHorarioChange = (horarioId: string) => {
    const horario = clase?.horarios?.find(h => h.id === Number(horarioId));
    if (horario) {
      setFormData({
        ...formData,
        horarioOriginalId: horarioId,
        horaInicio: horario.hora_inicio.substring(0,5),
        horaFin: horario.hora_fin.substring(0,5),
        diaSemana: horario.dia_semana.toString()
      });
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="d-flex align-items-center">
          <CalendarPlus className="me-2 text-primary" size={24} />
          Solicitar Reprogramación de Clase
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" className="d-flex align-items-center">
            <InfoCircle className="me-2" /> {error}
          </Alert>}

          {clase && (
            <div className="mb-4 p-3 bg-light rounded">
              <h6 className="mb-2">{clase.nombre}</h6>
              <div className="d-flex flex-wrap gap-2">
                {clase.horarios?.map((h, idx) => (
                  <Badge key={idx} bg="secondary" className="px-3 py-2">
                    {getDiaSemanaNombre(h.dia_semana)} {h.hora_inicio.substring(0,5)}-{h.hora_fin.substring(0,5)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <Clock className="me-2" />
                  Horario a reprogramar
                </Form.Label>
                <Form.Select
                  value={formData.horarioOriginalId}
                  onChange={(e) => handleHorarioChange(e.target.value)}
                  required
                >
                  <option value="">Selecciona un horario</option>
                  {clase?.horarios?.map(horario => (
                    <option key={horario.id} value={horario.id}>
                      {getDiaSemanaNombre(horario.dia_semana)} {horario.hora_inicio.substring(0,5)} - {horario.hora_fin.substring(0,5)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <Calendar className="me-2" />
                  Fecha original
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.fechaOriginal}
                  onChange={(e) => setFormData({...formData, fechaOriginal: e.target.value})}
                  min={fechaMinima}
                  required
                />
                <Form.Text className="text-muted">
                  Fecha de la clase que no podrás impartir
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <Calendar className="me-2" />
                  Fecha reprogramada
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.fechaReprogramada}
                  onChange={(e) => setFormData({...formData, fechaReprogramada: e.target.value})}
                  min={fechaMinima}
                  required
                />
                <Form.Text className="text-muted">
                  Nueva fecha para impartir la clase
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <Clock className="me-2" />
                  Día de la semana
                </Form.Label>
                <Form.Select
                  value={formData.diaSemana}
                  onChange={(e) => setFormData({...formData, diaSemana: e.target.value})}
                  required
                >
                  {DIAS_SEMANA.map(dia => (
                    <option key={dia.value} value={dia.value}>{dia.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Hora de inicio</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) => setFormData({...formData, horaInicio: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Hora de fin</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.horaFin}
                  onChange={(e) => setFormData({...formData, horaFin: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Motivo de la reprogramación</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.motivo}
                  onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                  placeholder="Ej: Enfermedad, compromiso personal, etc."
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Alert variant="info" className="mt-3">
            <InfoCircle className="me-2" />
            <small>
              Al solicitar una reprogramación:
              <ul className="mb-0 mt-1">
                <li>El sistema marcará automáticamente como "Ausente" a todos los alumnos en la fecha original</li>
                <li>La asistencia se registrará como "sistema" en el reporte</li>
                <li>Podrás marcar asistencia en la nueva fecha una vez aprobada</li>
              </ul>
            </small>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Solicitar Reprogramación'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SolicitarReprogramacion;