import api from './api';
import { Clase, Asistencia } from '../interfaces';

export const classService = {
  getMisClases: async (): Promise<Clase[]> => {
    const response = await api.get('/classes/mis-clases');
    return response.data;
  },

  getClaseById: async (id: number): Promise<Clase> => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  marcarAsistencia: async (data: { 
    claseId: number; 
    alumnoId: number; 
    fecha: string; 
    presente: boolean;
    horarioId?: number;
    observacion?: string;
  }): Promise<any> => {
    const response = await api.post('/classes/asistencia', data);
    return response.data;
  },

  getAsistencias: async (claseId: number, fecha?: string): Promise<Asistencia[]> => {
    const response = await api.get(`/classes/${claseId}/asistencias`, {
      params: { fecha },
    });
    return response.data;
  },

  verificarClaseReprogramada: async (claseId: number, fecha: string): Promise<{
    claseId: number;
    fecha: string;
    estaBloqueada: boolean;
    esReprogramada: boolean;
    reprogramacion: any | null;
  }> => {
    const response = await api.get('/reprogramaciones/verificar', {
      params: { claseId, fecha }
    });
    return response.data;
  },
};