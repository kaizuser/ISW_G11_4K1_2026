import { DomainError } from './errors';
import type { ParkNow } from './types';

const MONDAY = 1;
const HOLIDAYS = ['12-25', '01-01'];
const SAME_DAY_CUTOFF = '17:30';

function weekdayOf(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay();
}

function isHoliday(isoDate: string): boolean {
  const monthAndDay = isoDate.slice(5);
  return HOLIDAYS.includes(monthAndDay);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nextDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return toIsoDate(date);
}

// Same day of the next month, or that month's last day when it doesn't exist (Jan 31 -> Feb 28).
function oneMonthAfter(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const lastDayOfNextMonth = new Date(
    Date.UTC(year, month + 1, 0),
  ).getUTCDate();
  return toIsoDate(
    new Date(Date.UTC(year, month, Math.min(day, lastDayOfNextMonth))),
  );
}

function isPastCutoff(now: ParkNow): boolean {
  return now.time > SAME_DAY_CUTOFF;
}

export function isOpenOn(visitDate: string): boolean {
  return weekdayOf(visitDate) !== MONDAY && !isHoliday(visitDate);
}

export function validateVisitDate(visitDate: string, now: ParkNow): void {
  if (visitDate < now.date) throw new DomainError('VISIT_DATE_IN_PAST');
  if (visitDate > oneMonthAfter(now.date))
    throw new DomainError('VISIT_DATE_BEYOND_HORIZON');
  if (visitDate === now.date && isPastCutoff(now))
    throw new DomainError('SAME_DAY_CUTOFF_EXCEEDED');
  if (!isOpenOn(visitDate)) throw new DomainError('PARK_CLOSED');
}

export function availableDates(now: ParkNow): string[] {
  const horizon = oneMonthAfter(now.date);
  const first = isPastCutoff(now) ? nextDay(now.date) : now.date;
  const dates: string[] = [];

  for (let date = first; date <= horizon; date = nextDay(date)) {
    if (isOpenOn(date)) dates.push(date);
  }
  return dates;
}
