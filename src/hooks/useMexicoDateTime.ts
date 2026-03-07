import { useState, useEffect } from 'react';

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

  // Verificar si es el día de la clase
  const esDiaDeClase = (diasClase: string | null): boolean => {
    if (!diasClase) return true; // Si no hay días especificados, permitir
    
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const hoy = getMexicoDate().getDay();
    const hoyNombre = diasSemana[hoy].toLowerCase();
    
    // Convertir string de días a array y verificar
    const diasArray = diasClase.toLowerCase().split(',').map(d => d.trim());
    return diasArray.some(dia => dia.includes(hoyNombre) || hoyNombre.includes(dia));
  };

  // Verificar si está dentro del horario de clase
  const estaEnHorario = (horario: string | null): boolean => {
    if (!horario) return true; // Si no hay horario, permitir
    
    const now = getMexicoDate();
    const horaActual = now.getHours();
    const minutosActual = now.getMinutes();
    
    // Parsear horario (ej: "08:00 - 10:00")
    const match = horario.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!match) return true;
    
    const horaInicio = parseInt(match[1]);
    const minInicio = parseInt(match[2]);
    const horaFin = parseInt(match[3]);
    const minFin = parseInt(match[4]);
    
    const tiempoActual = horaActual * 60 + minutosActual;
    const tiempoInicio = horaInicio * 60 + minInicio;
    const tiempoFin = horaFin * 60 + minFin;
    
    return tiempoActual >= tiempoInicio && tiempoActual <= tiempoFin;
  };

  // Verificar si se puede marcar asistencia
  const puedeMarcarAsistencia = (clase: { dias?: string | null; horario?: string | null }): boolean => {
    return esDiaDeClase(clase.dias || null) && estaEnHorario(clase.horario || null);
  };

  return {
    getMexicoDate,
    getMexicoDateString,
    esDiaDeClase,
    estaEnHorario,
    puedeMarcarAsistencia,
    mexicoTime
  };
};