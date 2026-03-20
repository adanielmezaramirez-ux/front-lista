export interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role?: 'admin' | 'maestro' | 'alumno';
  roles?: string[];
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
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
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
  registrado_por: 'sistema' | 'maestro';
  observacion?: string;
  horario_id?: number;
  dia_semana?: number;
  hora_inicio?: string;
  hora_fin?: string;
  reprogramacion_id?: number;
}

export interface Reprogramacion {
  id: number;
  clase_id: number;
  clase_nombre: string;
  horario_original_id: number;
  fecha_original: string;
  fecha_reprogramada: string;
  horario_reprogramado_id?: number;
  hora_inicio: string;
  hora_fin: string;
  dia_semana: number;
  motivo: string;
  solicitado_por: number;
  solicitado_por_nombre: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  ya_tomada: boolean;
  dia_original?: number;
  hora_inicio_original?: string;
  hora_fin_original?: string;
  created_at: string;
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
  asistenciasSistema: number;
  asistenciasMaestro: number;
}

export const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' }
];

export const ESTADOS_REPROGRAMACION = [
  { value: 'pendiente', label: 'Pendiente', bg: 'warning' },
  { value: 'aprobada', label: 'Aprobada', bg: 'success' },
  { value: 'rechazada', label: 'Rechazada', bg: 'danger' },
  { value: 'cancelada', label: 'Cancelada', bg: 'secondary' }
];

export const getDiaSemanaNombre = (dia: number): string => {
  return DIAS_SEMANA.find(d => d.value === dia)?.label || 'Desconocido';
};

export const formatearHorario = (horario: Horario): string => {
  const inicio = horario.hora_inicio.substring(0, 5);
  const fin = horario.hora_fin.substring(0, 5);
  return `${getDiaSemanaNombre(horario.dia_semana)} ${inicio} - ${fin}`;
};

export const formatearHorarios = (horarios: Horario[]): string[] => {
  return horarios.map(formatearHorario);
};

export const getEstadoReprogramacion = (estado: string) => {
  return ESTADOS_REPROGRAMACION.find(e => e.value === estado) || { label: estado, bg: 'secondary' };
};