import { describe, expect, it } from 'vitest';
import { isOpenOn } from '../../src/domain/park-calendar';

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
