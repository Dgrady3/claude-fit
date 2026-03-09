import { useMemo } from 'react';
import { parseISO, eachDayOfInterval, subDays, format, isSameDay } from 'date-fns';

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

export default function WorkoutFrequencyDots({ sessions = [], range = '30d' }) {
  const { days, trainedCount } = useMemo(() => {
    const numDays = RANGE_DAYS[range] || 30;
    const today = new Date();
    const start = subDays(today, numDays - 1);
    const allDays = eachDayOfInterval({ start, end: today });

    const sessionDates = sessions.map((s) => parseISO(s.date));

    const mapped = allDays.map((day) => ({
      date: day,
      trained: sessionDates.some((sd) => isSameDay(sd, day)),
    }));

    return {
      days: mapped,
      trainedCount: mapped.filter((d) => d.trained).length,
    };
  }, [sessions, range]);

  if (!sessions.length) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No data</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {days.map((d, i) => (
          <div
            key={i}
            title={format(d.date, 'MMM d')}
            className={`w-3 h-3 rounded-full ${
              d.trained
                ? 'bg-cyan-400'
                : 'bg-dark-600'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">
        <span className="text-cyan-400 font-mono font-medium">{trainedCount}</span>/{days.length} days trained
      </p>
    </div>
  );
}
