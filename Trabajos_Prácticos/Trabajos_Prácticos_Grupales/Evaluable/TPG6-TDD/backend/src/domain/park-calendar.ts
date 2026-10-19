const MONDAY = 1;
const HOLIDAYS = ['12-25', '01-01'];

export function isOpenOn(visitDate: string): boolean {
  const weekday = new Date(`${visitDate}T00:00:00Z`).getUTCDay();
  const monthAndDay = visitDate.slice(5);

  return weekday !== MONDAY && !HOLIDAYS.includes(monthAndDay);
}
