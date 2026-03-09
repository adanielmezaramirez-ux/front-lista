import api from './api';
import { Reprogramacion } from '../interfaces';

export const reprogramacionService = {
  // Obtener reprogramaciones (con filtros)
  getReprogramaciones: async (params?: {
    estado?: string;
    claseId?: number;
  }): Promise<Reprogramacion[]> => {
    const response = await api.get('/reprogramaciones', { params });
    return response.data;
  },

  // Solicitar reprogramación (maestro)
  solicitarReprogramacion: async (data: {
    claseId: number;
    horarioOriginalId: number;
    fechaOriginal: string;
    fechaReprogramada: string;
    motivo: string;
  }): Promise<any> => {
    const response = await api.post('/reprogramaciones/solicitar', data);
    return response.data;
  },

  // Procesar reprogramación (admin)
  procesarReprogramacion: async (
    id: number,
    data: {
      estado: 'aprobada' | 'rechazada';
      horarioReprogramadoId?: number;
    }
  ): Promise<any> => {
    const response = await api.put(`/reprogramaciones/${id}/procesar`, data);
    return response.data;
  },

  // Marcar asistencia en clase reprogramada (maestro)
  marcarAsistenciaReprogramada: async (data: {
    reprogramacionId: number;
    alumnoId: number;
    presente: boolean;
  }): Promise<any> => {
    const response = await api.post('/reprogramaciones/marcar-reprogramada', data);
    return response.data;
  },
};