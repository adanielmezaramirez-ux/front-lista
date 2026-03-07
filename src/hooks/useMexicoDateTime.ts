import { useState, useEffect } from 'react';
import { Horario } from '../interfaces';

export const useMexicoDateTime = () => {
  const [mexicoTime, setMexicoTime] = useState<Date>(new Date());

  useEffect(() => {
    // Actualizar cada minuto
    const interval = setInterval(() => {
      setMexicoTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Obtener fecha actual en México (UTC-6)
  const getMexicoDate = (): Date => {
    const now = new Date();
    // Ajustar a UTC-6 (México)
    const mexicoOffset = -6;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * mexicoOffset));
  };

  // Formatear fecha para input date (YYYY-MM-DD)
  const getMexicoDateString = (): string => {
    const mexicoDate = getMexicoDate();
    return mexicoDate.toISOString().split('T')[0];
  };

  // Obtener día de la semana actual en México (1=Lunes, 7=Domingo)
  const getDiaSemanaActual = (): number => {
    const mexicoDate = getMexicoDate();
    const dia = mexicoDate.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    return dia === 0 ? 7 : dia; // Convertir a nuestro formato (1=Lunes, 7=Domingo)
  };

  // Obtener hora actual en México (formato HH:MM:SS)
  const getHoraActual = (): string => {
    const mexicoDate = getMexicoDate();
    return mexicoDate.toTimeString().split(' ')[0];
  };

  // Verificar si hoy es día de clase según los horarios
  const esDiaDeClase = (horarios: Horario[]): boolean => {
    if (!horarios || horarios.length === 0) return false;
    
    const diaActual = getDiaSemanaActual();
    return horarios.some(h => h.dia_semana === diaActual);
  };

  // Verificar si está dentro del horario de clase actual
  const estaEnHorario = (horarios: Horario[]): boolean => {
    if (!horarios || horarios.length === 0) return false;
    
    const diaActual = getDiaSemanaActual();
    const horaActual = getHoraActual();
    
    const horarioHoy = horarios.find(h => h.dia_semana === diaActual);
    if (!horarioHoy) return false;
    
    return horaActual >= horarioHoy.hora_inicio && horaActual <= horarioHoy.hora_fin;
  };

  // Verificar si se puede marcar asistencia ahora
  const puedeMarcarAsistencia = (clase: { horarios: Horario[] }): boolean => {
    return getHorarioHoy(clase.horarios) !== null;
  };

  // Obtener el horario de hoy si existe
  const getHorarioHoy = (horarios: Horario[]): Horario | null => {
    const diaActual = getDiaSemanaActual();
    const horaActual = getHoraActual();
    
    // Buscar el horario que corresponde al día y hora actual
    return horarios.find(h => 
      h.dia_semana === diaActual && 
      horaActual >= h.hora_inicio && 
      horaActual <= h.hora_fin
    ) || null;
  };


  return {
    getMexicoDate,
    getMexicoDateString,
    getDiaSemanaActual,
    getHoraActual,
    esDiaDeClase,
    estaEnHorario,
    puedeMarcarAsistencia,
    getHorarioHoy,
    mexicoTime
  };
};