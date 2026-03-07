export interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role: 'admin' | 'maestro' | 'alumno';
  role_name?: 'admin' | 'maestro' | 'alumno';
  suspended?: number;
  deleted?: number;
  confirmed?: number;
}

export interface Maestro {
  id: number;
  nombre: string;
  email: string;
  firstname?: string;
  lastname?: string;
}

export interface Alumno {
  id: number;
  nombre: string;
  email: string;
  firstname?: string;
  lastname?: string;
}

export interface Horario {
  id?: number;
  dia_semana: number; // 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo
  hora_inicio: string; // Formato: HH:MM:SS
  hora_fin: string;    // Formato: HH:MM:SS
}

export interface Clase {
  id: number;
  nombre: string;
  horarios: Horario[];
  maestros?: Maestro[];
  alumnos?: Alumno[];
  total_alumnos?: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Asistencia {
  id: number;
  clase_id: number;
  alumno_id: number;
  fecha: string;
  presente: boolean;
  firstname?: string;
  lastname?: string;
  alumno_nombre?: string;
  alumno_apellido?: string;
  clase_nombre?: string;
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

// Días de la semana en español
export const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' }
];

// Función helper para obtener nombre del día
export const getDiaSemanaNombre = (dia: number): string => {
  return DIAS_SEMANA.find(d => d.value === dia)?.label || 'Desconocido';
};

// Función helper para formatear horario
export const formatearHorario = (horario: Horario): string => {
  const inicio = horario.hora_inicio.substring(0, 5);
  const fin = horario.hora_fin.substring(0, 5);
  return `${getDiaSemanaNombre(horario.dia_semana)} ${inicio} - ${fin}`;
};

// Función helper para obtener todos los horarios formateados
export const formatearHorarios = (horarios: Horario[]): string[] => {
  return horarios.map(formatearHorario);
};