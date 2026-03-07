import api from './api';
import { Alumno } from '../interfaces';

export const usersService = {
  getUserData: async (): Promise<any> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  getAlumnosDisponibles: async (claseId: number): Promise<Alumno[]> => {
    const response = await api.get(`/users/alumnos-disponibles/${claseId}`);
    return response.data;
  },
};