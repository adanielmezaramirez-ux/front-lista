import api from './api';
import { Reprogramacion } from '../interfaces';

export const reprogramacionService = {
  getReprogramaciones: async (params?: {
    estado?: string;
    claseId?: number;
  }): Promise<Reprogramacion[]> => {
    const response = await api.get('/reprogramaciones', { params });
    return response.data;
  },

  solicitarReprogramacion: async (data: {
    claseId: number;
    horarioOriginalId: number;
    fechaOriginal: string;
    fechaReprogramada: string;
    horaInicio: string;
    horaFin: string;
    diaSemana: number;
    motivo: string;
  }): Promise<any> => {
    const response = await api.post('/reprogramaciones/solicitar', data);
    return response.data;
  },

  procesarReprogramacion: async (
    id: number,
    data: {
      estado: 'aprobada' | 'rechazada';
    }
  ): Promise<any> => {
    const response = await api.put(`/reprogramaciones/${id}/procesar`, data);
    return response.data;
  },

  marcarAsistenciaReprogramada: async (data: {
    reprogramacionId: number;
    alumnoId: number;
    presente: boolean;
  }): Promise<any> => {
    const response = await api.post('/reprogramaciones/marcar-reprogramada', data);
    return response.data;
  },

  marcarReprogramacionTomada: async (id: number): Promise<any> => {
    const response = await api.put(`/reprogramaciones/${id}/marcar-tomada`);
    return response.data;
  },
};