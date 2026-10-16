import type { ReactNode } from 'react';

interface SectionProps {
  step: number;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}

export function Section({ step, title, aside, children }: SectionProps) {
  const titleId = `section-${step}`;

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-full bg-forest text-sm font-bold text-white"
          >
            {step}
          </span>
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
