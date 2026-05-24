import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CalendarEntry {
  id: string;
  title: string;
  date: string;
}

export function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState<CalendarEntry[]>([]);

  useEffect(() => {
    api
      .get<CalendarEntry[]>(`/diaries/calendar?year=${year}&month=${month}`)
      .then((res) => setEntries(res.data))
      .catch(console.error);
  }, [year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const entryMap = new Map(entries.map((e) => [e.date, e]));

  const prevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">日历</h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="px-3 py-1 rounded hover:bg-slate-100">‹</button>
          <span className="font-medium min-w-[120px] text-center">
            {year} 年 {month} 月
          </span>
          <button onClick={nextMonth} className="px-3 py-1 rounded hover:bg-slate-100">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const entry = entryMap.get(dateStr);
          return (
            <div
              key={day}
              className={cn(
                'aspect-square rounded-lg border flex flex-col items-center justify-center text-sm p-1',
                entry ? 'bg-primary/10 border-primary/30' : 'bg-white'
              )}
            >
              <span className={entry ? 'font-semibold text-primary' : ''}>{day}</span>
              {entry && (
                <Link
                  to={`/editor/${entry.id}`}
                  className="text-[10px] text-primary truncate w-full text-center mt-0.5"
                  title={entry.title}
                >
                  ●
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
