// src/hooks/useMexicoDateTime.ts
import { useState, useEffect } from 'react';
import { Horario } from '../interfaces';

export const useMexicoDateTime = () => {
  const [mexicoTime, setMexicoTime] = useState<Date>(new Date());

  useEffect(() => {
    // Actualizar cada minuto para mantener la hora precisa
    const interval = setInterval(() => {
      setMexicoTime(new Date());
    }, 60000); // Cada minuto

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
    const horas = mexicoDate.getHours().toString().padStart(2, '0');
    const minutos = mexicoDate.getMinutes().toString().padStart(2, '0');
    const segundos = mexicoDate.getSeconds().toString().padStart(2, '0');
    return `${horas}:${minutos}:${segundos}`;
  };

  // Verificar si hoy es día de clase según los horarios
  const esDiaDeClase = (horarios: Horario[]): boolean => {
    if (!horarios || horarios.length === 0) return false;
    
    const diaActual = getDiaSemanaActual();
    return horarios.some(h => h.dia_semana === diaActual);
  };

  // Obtener el horario específico de hoy si existe
  const getHorarioHoy = (horarios: Horario[]): Horario | null => {
    if (!horarios || horarios.length === 0) return null;
    
    const diaActual = getDiaSemanaActual();
    return horarios.find(h => h.dia_semana === diaActual) || null;
  };

  // Verificar si la hora actual está dentro del horario de clase
  const estaEnHorario = (horario: Horario | null): boolean => {
    if (!horario) return false;
    
    const horaActual = getHoraActual();
    return horaActual >= horario.hora_inicio && horaActual <= horario.hora_fin;
  };

  // Verificar si se puede marcar asistencia ahora (día correcto Y hora correcta)
  const puedeMarcarAsistencia = (clase: { horarios: Horario[] }): boolean => {
    const horarioHoy = getHorarioHoy(clase.horarios);
    if (!horarioHoy) return false;
    
    return estaEnHorario(horarioHoy);
  };

  // Obtener el estado actual de la clase (para mostrar mensajes)
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