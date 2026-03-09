import { useState, useEffect } from 'react';
import { Horario } from '../interfaces';

export const useMexicoDateTime = () => {
  const [mexicoTime, setMexicoTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setMexicoTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const getMexicoDate = (): Date => {
    const now = new Date();
    
    const mexicoTimeString = now.toLocaleString('en-US', { 
      timeZone: 'America/Mexico_City' 
    });
    
    return new Date(mexicoTimeString);
  };

  const getMexicoDateString = (): string => {
    const mexicoDate = getMexicoDate();
    const year = mexicoDate.getFullYear();
    const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
    const day = String(mexicoDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDiaSemanaActual = (): number => {
    const mexicoDate = getMexicoDate();
    const dia = mexicoDate.getDay();
    return dia === 0 ? 7 : dia;
  };

  const getHoraActual = (): string => {
    const mexicoDate = getMexicoDate();
    const horas = mexicoDate.getHours().toString().padStart(2, '0');
    const minutos = mexicoDate.getMinutes().toString().padStart(2, '0');
    const segundos = mexicoDate.getSeconds().toString().padStart(2, '0');
    return `${horas}:${minutos}:${segundos}`;
  };

  const esDiaDeClase = (horarios: Horario[]): boolean => {
    if (!horarios || horarios.length === 0) return false;
    const diaActual = getDiaSemanaActual();
    return horarios.some(h => h.dia_semana === diaActual);
  };

  const getHorarioHoy = (horarios: Horario[]): Horario | null => {
    if (!horarios || horarios.length === 0) return null;
    const diaActual = getDiaSemanaActual();
    return horarios.find(h => h.dia_semana === diaActual) || null;
  };

  const estaEnHorario = (horario: Horario | null): boolean => {
    if (!horario) return false;
    const horaActual = getHoraActual();
    return horaActual >= horario.hora_inicio && horaActual <= horario.hora_fin;
  };

  const puedeMarcarAsistencia = (clase: { horarios: Horario[] }): boolean => {
    const horarioHoy = getHorarioHoy(clase.horarios);
    if (!horarioHoy) return false;
    return estaEnHorario(horarioHoy);
  };

  const getEstadoClase = (clase: { horarios: Horario[] }): {
    puedeMarcar: boolean;
    mensaje: string;
    horarioHoy: Horario | null;
  } => {
    const horarioHoy = getHorarioHoy(clase.horarios);
    
    if (!horarioHoy) {
      return {
        puedeMarcar: false,
        mensaje: 'Hoy no hay clase programada',
        horarioHoy: null
      };
    }

    const horaActual = getHoraActual();
    const enHorario = horaActual >= horarioHoy.hora_inicio && horaActual <= horarioHoy.hora_fin;

    if (enHorario) {
      return {
        puedeMarcar: true,
        mensaje: 'Clase en curso - Puedes marcar asistencia',
        horarioHoy
      };
    } else if (horaActual < horarioHoy.hora_inicio) {
      return {
        puedeMarcar: false,
        mensaje: `La clase comenzará a las ${horarioHoy.hora_inicio.substring(0,5)}`,
        horarioHoy
      };
    } else {
      return {
        puedeMarcar: false,
        mensaje: `La clase terminó a las ${horarioHoy.hora_fin.substring(0,5)}`,
        horarioHoy
      };
    }
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
    getEstadoClase,
    mexicoTime
  };
};