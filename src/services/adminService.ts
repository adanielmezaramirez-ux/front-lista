import api from './api';
import { User, Clase } from '../interfaces';

export const adminService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  assignRole: async (userId: number, roleName: string): Promise<any> => {
    const response = await api.post('/admin/assign-role', { userId, roleName });
    return response.data;
  },

  createClass: async (data: { 
    nombre: string; 
    horario?: string; 
    dias?: string; 
    maestrosIds?: number[] 
  }): Promise<any> => {
    const response = await api.post('/admin/classes', data);
    return response.data;
  },

  asignarMaestros: async (claseId: number, maestrosIds: number[]): Promise<any> => {
    const response = await api.post(`/admin/classes/${claseId}/maestros`, { maestrosIds });
    return response.data;
  },

  removerMaestro: async (claseId: number, maestroId: number): Promise<any> => {
    const response = await api.delete(`/admin/classes/${claseId}/maestros/${maestroId}`);
    return response.data;
  },

  asignarAlumnos: async (claseId: number, alumnosIds: number[]): Promise<any> => {
    const response = await api.post(`/admin/classes/${claseId}/alumnos`, { alumnosIds });
    return response.data;
  },

  descargarReporteExcel: async (params?: { 
    claseId?: number; 
    fechaInicio?: string; 
    fechaFin?: string 
  }): Promise<Blob> => {
    const response = await api.get('/admin/reportes/excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  descargarReportePDF: async (params?: { 
    claseId?: number; 
    fechaInicio?: string; 
    fechaFin?: string 
  }): Promise<Blob> => {
    const response = await api.get('/admin/reportes/pdf', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};