import { useState } from 'react';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sameDay(a: Date | null, b: Date) {
  return !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function BookingCalendar({ value, onChange }: { value: Date | null; onChange: (date: Date) => void }) {
  const currentMonth = startOfMonth(new Date());
  const [viewDate, setViewDate] = useState(currentMonth);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const label = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function goPrev() {
    const prev = new Date(year, month - 1, 1);
    setViewDate(prev < currentMonth ? currentMonth : prev);
  }

  function goNext() {
    setViewDate(new Date(year, month + 1, 1));
  }

  return (
    <div className="liquid-glass rounded-[20px] p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous month"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div className="text-[13px] font-semibold text-white">{label}</div>
        <button
          type="button"
          onClick={goNext}
          aria-label="Next month"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-center text-[9.5px] font-semibold text-white/35">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => (
          <div key={i} className="flex aspect-square items-center justify-center">
            {day !== null && (
              <button
                type="button"
                onClick={() => onChange(new Date(year, month, day))}
                className={`flex h-[78%] w-[78%] items-center justify-center rounded-full text-xs font-medium transition active:scale-[.88] ${
                  sameDay(value, new Date(year, month, day))
                    ? 'text-white gradient-brand'
                    : 'text-white/80 hover:bg-white/[0.06]'
                }`}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
