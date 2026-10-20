import type { ParkNow } from '../domain/types';
import type { Clock } from '../services/dependencies';

export class SystemClock implements Clock {
  private readonly format: Intl.DateTimeFormat;

  constructor(timeZone: string) {
    this.format = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
  }

  parkNow(): ParkNow {
    const parts = Object.fromEntries(
      this.format
        .formatToParts(new Date())
        .map((part) => [part.type, part.value]),
    );
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      time: `${parts.hour}:${parts.minute}`,
    };
  }
}
