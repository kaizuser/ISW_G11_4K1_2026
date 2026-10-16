import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import { fromIsoDate, toIsoDate } from '../helpers';

interface VisitDateCalendarProps {
  availableDates: string[];
  selected?: string;
  onSelect: (isoDate: string) => void;
}

export function VisitDateCalendar({ availableDates, selected, onSelect }: VisitDateCalendarProps) {
  const available = new Set(availableDates);
  const firstDate = availableDates.at(0);
  const lastDate = availableDates.at(-1);

  return (
    <DayPicker
      mode="single"
      required
      locale={es}
      selected={selected ? fromIsoDate(selected) : undefined}
      onSelect={(date) => onSelect(toIsoDate(date))}
      disabled={(date) => !available.has(toIsoDate(date))}
      startMonth={firstDate ? fromIsoDate(firstDate) : undefined}
      endMonth={lastDate ? fromIsoDate(lastDate) : undefined}
      classNames={{
        root: 'relative',
        month: 'flex flex-col gap-3',
        month_caption: 'flex h-11 items-center justify-center',
        caption_label: 'text-lg font-bold capitalize',
        nav: 'absolute inset-x-0 top-0 flex justify-between',
        button_previous:
          'flex size-11 items-center justify-center rounded-lg border border-line bg-white text-forest disabled:opacity-40',
        button_next:
          'flex size-11 items-center justify-center rounded-lg border border-line bg-white text-forest disabled:opacity-40',
        chevron: 'size-5 fill-current',
        month_grid: 'w-full border-separate border-spacing-1.5',
        weekday: 'text-sm font-bold capitalize text-muted',
        day: 'p-0 text-center',
        day_button:
          'h-11 w-full cursor-pointer rounded-lg border border-line bg-white text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest',
        selected: '[&>button]:border-forest [&>button]:bg-forest [&>button]:font-bold [&>button]:text-white',
        disabled:
          '[&>button]:cursor-not-allowed [&>button]:border-transparent [&>button]:bg-transparent [&>button]:text-muted/50',
        outside: 'invisible',
      }}
    />
  );
}
