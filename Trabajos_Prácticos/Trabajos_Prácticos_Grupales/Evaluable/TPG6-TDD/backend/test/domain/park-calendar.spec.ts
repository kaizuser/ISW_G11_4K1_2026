import { describe, expect, it } from 'vitest';
import {
  availableDates,
  isOpenOn,
  validateVisitDate,
} from '../../src/domain/park-calendar';

describe('CA-04 días en los que el parque está abierto', () => {
  it('debería estar cerrado cuando la fecha de visita es un Lunes', () => {
    const aMonday = '2026-10-19';

    expect(isOpenOn(aMonday)).toBe(false);
  });

  it('debería estar cerrado cuando la fecha de visita es el 25 de diciembre', () => {
    expect(isOpenOn('2026-12-25')).toBe(false);
  });

  it('debería estar cerrado cuando la fecha de visita es el 1 de enero', () => {
    expect(isOpenOn('2027-01-01')).toBe(false);
  });

  it.each([
    { day: 'Martes', date: '2026-10-20' },
    { day: 'Miércoles', date: '2026-10-21' },
    { day: 'Jueves', date: '2026-10-22' },
    { day: 'Viernes', date: '2026-10-23' },
    { day: 'Sábado', date: '2026-10-17' },
    { day: 'Domingo', date: '2026-10-18' },
  ])('debería estar abierto cuando la fecha de visita es un $day', ({ date }) => {
    expect(isOpenOn(date)).toBe(true);
  });

  it('debería estar abierto el 24 de diciembre cuando no es un lunes', () => {
    expect(isOpenOn('2026-12-24')).toBe(true);
  });
});

const aFridayMorning = { date: '2026-10-16', time: '10:00' };

function validationOf(visitDate: string, now = aFridayMorning) {
  return () => validateVisitDate(visitDate, now);
}

describe('CA-03 fecha de visita actual o futura', () => {
  it('debería rechazar la fecha cuando es pasada', () => {
    expect(validationOf('2026-10-15')).toThrow(
      expect.objectContaining({ code: 'VISIT_DATE_IN_PAST' }),
    );
  });

  it('debería aceptar la fecha cuando es de hoy', () => {
    expect(validationOf('2026-10-16')).not.toThrow();
  });
});

describe('CA-13 horizonte de un mes', () => {
  const aWednesday = { date: '2026-10-14', time: '10:00' };

  it('debería aceptar la fecha cuando es exactamente un mes a futuro', () => {
    expect(validationOf('2026-11-14', aWednesday)).not.toThrow();
  });

  it('debería rechazar la fecha cuando es más de un mes a futuro', () => {
    expect(validationOf('2026-11-15', aWednesday)).toThrow(
      expect.objectContaining({ code: 'VISIT_DATE_BEYOND_HORIZON' }),
    );
  });

  it('debería terminar el horizonte en el último día del próximo mes cuando el día no existe', () => {
    const january31 = { date: '2027-01-31', time: '10:00' };

    expect(validationOf('2027-02-28', january31)).not.toThrow();
    expect(validationOf('2027-03-02', january31)).toThrow(
      expect.objectContaining({ code: 'VISIT_DATE_BEYOND_HORIZON' }),
    );
  });
});

describe('CA-14 horario limite de corte para compras del mismo día', () => {
  const aSaturday = '2026-10-17';

  it('debería aceptar una compra del mismo día a las 17:30', () => {
    expect(
      validationOf(aSaturday, { date: aSaturday, time: '17:30' }),
    ).not.toThrow();
  });

  it('debería rechazar una compra del mismo día después de las 17:30', () => {
    expect(validationOf(aSaturday, { date: aSaturday, time: '17:31' })).toThrow(
      expect.objectContaining({ code: 'SAME_DAY_CUTOFF_EXCEEDED' }),
    );
  });

  it('debería aceptar una fecha futura de otro día después de las 17:30', () => {
    expect(
      validationOf('2026-10-18', { date: aSaturday, time: '17:31' }),
    ).not.toThrow();
  });
});

describe('CA-04 validación de días cerrados', () => {
  it('debería rechazar la fecha cuando el parque está cerrado', () => {
    const aMonday = '2026-10-19';

    expect(validationOf(aMonday)).toThrow(
      expect.objectContaining({ code: 'PARK_CLOSED' }),
    );
  });
});

describe('fechas disponibles', () => {
  it('debería listar desde hoy hacia el horizonte futuro, omitiendo días cerrados', () => {
    const dates = availableDates(aFridayMorning);

    expect(dates.at(0)).toBe('2026-10-16');
    expect(dates).not.toContain('2026-10-19');
    expect(dates.at(-1)).toBe('2026-11-15');
  });

  it('debería comenzar el día siguiente cuando se pasó la hora de corte para ese día', () => {
    const dates = availableDates({ date: '2026-10-16', time: '17:31' });

    expect(dates.at(0)).toBe('2026-10-17');
  });
});
