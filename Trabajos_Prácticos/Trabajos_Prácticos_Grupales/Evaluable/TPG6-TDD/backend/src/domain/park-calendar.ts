const MONDAY = 1;
const HOLIDAYS = ['12-25', '01-01'];

// Parsed as UTC midnight so the weekday doesn't shift with the server's timezone.
function weekdayOf(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay();
}

function isHoliday(isoDate: string): boolean {
  const monthAndDay = isoDate.slice(5);
  return HOLIDAYS.includes(monthAndDay);
}

export function isOpenOn(visitDate: string): boolean {
  return weekdayOf(visitDate) !== MONDAY && !isHoliday(visitDate);
}
