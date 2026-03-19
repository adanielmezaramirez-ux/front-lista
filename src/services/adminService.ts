import api from './api';
import { User, Clase, Horario } from '../interfaces';

export const adminService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  
  assignRole: async (userId: number, roleName: string): Promise<any> => {
    const response = await api.post('/admin/assign-role', { userId, roleName });
    return response.data;
  },

  assignMultipleRoles: async (userId: number, roleNames: string[]): Promise<any> => {
    const response = await api.post('/admin/assign-multiple-roles', { userId, roleNames });
    return response.data;
  },

  removeRoles: async (userId: number, roleNames: string[]): Promise<any> => {
    const response = await api.post('/admin/remove-roles', { userId, roleNames });
    return response.data;
  },

  getClasses: async (): Promise<Clase[]> => {
    const response = await api.get('/admin/classes');
    return response.data;
  },

  getClassById: async (claseId: number): Promise<Clase> => {
    const response = await api.get(`/admin/classes/${claseId}`);
    return response.data;
  },

  createClass: async (data: { 
    nombre: string; 
    horarios: Horario[];
    maestrosIds?: number[] 
  }): Promise<any> => {
    const response = await api.post('/admin/classes', data);
    return response.data;
  },

  updateClassName: async (claseId: number, nombre: string): Promise<any> => {
    const response = await api.put(`/admin/classes/${claseId}/nombre`, { nombre });
    return response.data;
  },

  deleteClass: async (claseId: number): Promise<any> => {
    const response = await api.delete(`/admin/classes/${claseId}`);
    return response.data;
  },

  updateHorarios: async (claseId: number, horarios: Horario[]): Promise<any> => {
    const response = await api.put(`/admin/classes/${claseId}/horarios`, { horarios });
    return response.data;
  },

  addHorario: async (claseId: number, horario: Horario): Promise<any> => {
    const response = await api.post(`/admin/classes/${claseId}/horarios`, horario);
    return response.data;
  },

  removeHorario: async (claseId: number, horarioId: number): Promise<any> => {
    const response = await api.delete(`/admin/classes/${claseId}/horarios/${horarioId}`);
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

  getMaestrosDisponibles: async (claseId: number): Promise<User[]> => {
    const response = await api.get(`/admin/classes/${claseId}/maestros-disponibles`);
    return response.data;
  },

  asignarAlumnos: async (claseId: number, alumnosIds: number[]): Promise<any> => {
    const response = await api.post(`/admin/classes/${claseId}/alumnos`, { alumnosIds });
    return response.data;
  },

  removerAlumno: async (claseId: number, alumnoId: number): Promise<any> => {
    const response = await api.delete(`/admin/classes/${claseId}/alumnos/${alumnoId}`);
    return response.data;
  },

  getAlumnosDisponibles: async (claseId: number): Promise<User[]> => {
    const response = await api.get(`/admin/classes/${claseId}/alumnos-disponibles`);
    return response.data;
  },

  getAlumnosInscritos: async (claseId: number): Promise<User[]> => {
    const response = await api.get(`/admin/classes/${claseId}/alumnos`);
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

  getReporteAsistencias: async (params: {
    claseId?: number;
    alumnoId?: number;
    fechaInicio?: string;
    fechaFin?: string;
    maestroId?: number;
  }): Promise<any> => {
    const response = await api.get('/admin/reportes/asistencias', { params });
    return response.data;
  },

  getEstadisticasClase: async (claseId: number): Promise<any> => {
    const response = await api.get(`/admin/classes/${claseId}/estadisticas`);
    return response.data;
  },

  getEstadisticasGenerales: async (): Promise<any> => {
    const response = await api.get('/admin/estadisticas');
    return response.data;
  },

  getDashboardData: async (): Promise<any> => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  exportarUsuarios: async (formato: 'excel' | 'pdf' | 'csv'): Promise<Blob> => {
    const response = await api.get(`/admin/export/usuarios/${formato}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportarClases: async (formato: 'excel' | 'pdf' | 'csv'): Promise<Blob> => {
    const response = await api.get(`/admin/export/clases/${formato}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  backupDatabase: async (): Promise<Blob> => {
    const response = await api.get('/admin/backup', {
      responseType: 'blob',
    });
    return response.data;
  },
};