import { describe, expect, it } from 'vitest';
import {
  availableDates,
  isOpenOn,
  validateVisitDate,
} from '../../src/domain/park-calendar';

describe('CA-04 park opening days', () => {
  it('should be closed when the visit date is a Monday', () => {
    const aMonday = '2026-10-19';

    expect(isOpenOn(aMonday)).toBe(false);
  });

  it('should be closed when the visit date is December 25', () => {
    expect(isOpenOn('2026-12-25')).toBe(false);
  });

  it('should be closed when the visit date is January 1', () => {
    expect(isOpenOn('2027-01-01')).toBe(false);
  });

  it.each([
    { day: 'Tuesday', date: '2026-10-20' },
    { day: 'Saturday', date: '2026-10-17' },
    { day: 'Sunday', date: '2026-10-18' },
  ])('should be open when the visit date is a $day', ({ date }) => {
    expect(isOpenOn(date)).toBe(true);
  });

  it('should be open on December 24 when it is not a Monday', () => {
    expect(isOpenOn('2026-12-24')).toBe(true);
  });
});

const aFridayMorning = { date: '2026-10-16', time: '10:00' };

function validationOf(visitDate: string, now = aFridayMorning) {
  return () => validateVisitDate(visitDate, now);
}

describe('CA-03 visit date today or later', () => {
  it('should reject the date when it is in the past', () => {
    expect(validationOf('2026-10-15')).toThrow(
      expect.objectContaining({ code: 'VISIT_DATE_IN_PAST' }),
    );
  });

  it('should accept the date when it is today', () => {
    expect(validationOf('2026-10-16')).not.toThrow();
  });
});

describe('CA-13 one-month horizon', () => {
  const aWednesday = { date: '2026-10-14', time: '10:00' };

  it('should accept the date when it is exactly one month ahead', () => {
    expect(validationOf('2026-11-14', aWednesday)).not.toThrow();
  });

  it('should reject the date when it is more than one month ahead', () => {
    expect(validationOf('2026-11-15', aWednesday)).toThrow(
      expect.objectContaining({ code: 'VISIT_DATE_BEYOND_HORIZON' }),
    );
  });

  it('should end the horizon on the last day of next month when the day does not exist', () => {
    const january31 = { date: '2027-01-31', time: '10:00' };

    expect(validationOf('2027-02-28', january31)).not.toThrow();
    expect(validationOf('2027-03-02', january31)).toThrow(
      expect.objectContaining({ code: 'VISIT_DATE_BEYOND_HORIZON' }),
    );
  });
});

describe('CA-14 same-day cutoff', () => {
  const aSaturday = '2026-10-17';

  it('should accept a same-day purchase at 17:30', () => {
    expect(
      validationOf(aSaturday, { date: aSaturday, time: '17:30' }),
    ).not.toThrow();
  });

  it('should reject a same-day purchase after 17:30', () => {
    expect(validationOf(aSaturday, { date: aSaturday, time: '17:31' })).toThrow(
      expect.objectContaining({ code: 'SAME_DAY_CUTOFF_EXCEEDED' }),
    );
  });

  it('should accept a future date after 17:30', () => {
    expect(
      validationOf('2026-10-18', { date: aSaturday, time: '17:31' }),
    ).not.toThrow();
  });
});

describe('CA-04 closed day validation', () => {
  it('should reject the date when the park is closed', () => {
    const aMonday = '2026-10-19';

    expect(validationOf(aMonday)).toThrow(
      expect.objectContaining({ code: 'PARK_CLOSED' }),
    );
  });
});

describe('available dates', () => {
  it('should list from today to the horizon, skipping closed days', () => {
    const dates = availableDates(aFridayMorning);

    expect(dates.at(0)).toBe('2026-10-16');
    expect(dates).not.toContain('2026-10-19');
    expect(dates.at(-1)).toBe('2026-11-15');
  });

  it('should start tomorrow when it is after the same-day cutoff', () => {
    const dates = availableDates({ date: '2026-10-16', time: '17:31' });

    expect(dates.at(0)).toBe('2026-10-17');
  });
});
