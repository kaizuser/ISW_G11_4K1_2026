export function formatMoney(pesos: number): string {
  return `$ ${pesos.toLocaleString('es-AR')}`;
}

// Visit dates travel as 'YYYY-MM-DD' and are built as local dates,
// because new Date('YYYY-MM-DD') is UTC and can shift the weekday.
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatVisitDate(isoDate: string): string {
  const date = fromIsoDate(isoDate);
  const weekday = date.toLocaleDateString('es-AR', { weekday: 'long' });
  const numeric = date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${numeric}`;
}

export function isValidAge(age: string): boolean {
  return /^\d+$/.test(age);
}

export function ticketsLabel(count: number): string {
  return count === 1 ? '1 entrada' : `${count} entradas`;
}
