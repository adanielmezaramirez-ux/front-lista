import api from './api';
import { User, Clase, Horario } from '../interfaces';

export const adminService = {
  // Usuarios
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/admin/users');
    // Mapear role_name a role para consistencia en el frontend
    return response.data.map((user: any) => ({
      ...user,
      role: user.role_name || user.role // Asegurar que role esté presente
    }));
  },
  assignRole: async (userId: number, roleName: string): Promise<any> => {
    const response = await api.post('/admin/assign-role', { userId, roleName });
    return response.data;
  },

  // Clases - Gestión
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

  updateClass: async (claseId: number, data: { 
    nombre?: string; 
  }): Promise<any> => {
    const response = await api.put(`/admin/classes/${claseId}`, data);
    return response.data;
  },

  deleteClass: async (claseId: number): Promise<any> => {
    const response = await api.delete(`/admin/classes/${claseId}`);
    return response.data;
  },

  // Horarios
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

  // Maestros
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

  // Alumnos
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

  // Reportes
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

  // Reportes con filtros avanzados
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

  // Estadísticas
  getEstadisticasClase: async (claseId: number): Promise<any> => {
    const response = await api.get(`/admin/classes/${claseId}/estadisticas`);
    return response.data;
  },

  getEstadisticasGenerales: async (): Promise<any> => {
    const response = await api.get('/admin/estadisticas');
    return response.data;
  },

  // Dashboard
  getDashboardData: async (): Promise<any> => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Exportar datos
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

  // Respaldo de datos
  backupDatabase: async (): Promise<Blob> => {
    const response = await api.get('/admin/backup', {
      responseType: 'blob',
    });
    return response.data;
  },
};