export interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role: 'admin' | 'maestro' | 'alumno';  // Cambiado de role_name a role
}

export interface Maestro {
  id: number;
  nombre: string;
  email: string;
}

export interface Alumno {
  id: number;
  nombre: string;
  email: string;
}

export interface Clase {
  id: number;
  nombre: string;
  horario: string | null;
  dias: string | null;
  maestros?: Maestro[];
  alumnos?: Alumno[];
  total_alumnos?: number;
  // Nuevos campos para estadísticas
  asistencias_hoy?: number;
  asistencias_semana?: number;
  ultima_asistencia?: string;
}

export interface Asistencia {
  id: number;
  clase_id: number;
  alumno_id: number;
  fecha: string;
  presente: boolean;
  firstname?: string;
  lastname?: string;
  // Nuevo campo
  registrado_por?: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
  clases?: Clase[];
}

export interface ApiError {
  error: string;
}

export interface EstadisticasClase {
  claseId: number;
  totalAlumnos: number;
  asistenciasHoy: number;
  asistenciasSemana: number;
  promedioAsistencia: number;
  ultimaActualizacion: string;
}