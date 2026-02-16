import { TimeEntry, Project } from "../types";
import {
  getMonthDays,
  formatDate,
  DAY_NAMES,
  isWeekend,
  getWeekNumber,
  today,
} from "../dateUtils";

interface CalendarViewProps {
  year: number;
  month: number;
  entries: TimeEntry[];
  projects: Project[];
  onDayClick: (date: string) => void;
  onEntryClick: (entry: TimeEntry) => void;
}

export default function CalendarView({
  year,
  month,
  entries,
  projects,
  onDayClick,
  onEntryClick,
}: CalendarViewProps) {
  const days = getMonthDays(year, month);
  const todayStr = today();

  // Build a map: dateStr -> entries[]
  const entryMap = new Map<string, TimeEntry[]>();
  for (const e of entries) {
    const key = e.date.split("T")[0];
    if (!entryMap.has(key)) entryMap.set(key, []);
    entryMap.get(key)!.push(e);
  }

  // Figure out what day of week the month starts on (Mon=0)
  const firstDay = days[0].getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Monday-indexed

  // Group days by week
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = Array(startOffset).fill(null);

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-800">
        <div className="p-2 text-center text-[10px] font-medium text-gray-400 uppercase">
          Wk
        </div>
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="p-2 text-center text-[10px] font-medium text-gray-400 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => {
        const weekDay = week.find((d) => d !== null);
        const weekNum = weekDay ? getWeekNumber(weekDay) : "";
        const weekTotal = week.reduce((sum, day) => {
          if (!day) return sum;
          const dayEntries = entryMap.get(formatDate(day)) || [];
          return sum + dayEntries.reduce((s, e) => s + Number(e.hours), 0);
        }, 0);

        return (
          <div
            key={wi}
            className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-gray-100 dark:border-gray-800/50 last:border-b-0"
          >
            {/* Week number */}
            <div className="p-1 flex flex-col items-center justify-start pt-2 border-r border-gray-100 dark:border-gray-800/50">
              <span className="text-[10px] font-medium text-gray-400">{weekNum}</span>
              {weekTotal > 0 && (
                <span className="text-[10px] font-semibold text-brand-500 mt-0.5">
                  {weekTotal.toFixed(1)}h
                </span>
              )}
            </div>

            {/* Day cells */}
            {week.map((day, di) => {
              if (!day) {
                return (
                  <div
                    key={di}
                    className="min-h-[90px] border-r border-gray-50 dark:border-gray-800/30 last:border-r-0 bg-gray-50/50 dark:bg-gray-950/30"
                  />
                );
              }

              const dateStr = formatDate(day);
              const dayEntries = entryMap.get(dateStr) || [];
              const isToday = dateStr === todayStr;
              const isWkend = isWeekend(day);
              const dayTotal = dayEntries.reduce((s, e) => s + Number(e.hours), 0);

              return (
                <div
                  key={di}
                  onClick={() => onDayClick(dateStr)}
                  className={`min-h-[90px] p-1.5 border-r border-gray-50 dark:border-gray-800/30 last:border-r-0 cursor-pointer
                    transition-colors hover:bg-brand-50/50 dark:hover:bg-brand-950/20
                    ${isWkend ? "bg-gray-50/80 dark:bg-gray-950/20" : ""}
                    ${isToday ? "ring-2 ring-inset ring-brand-500/30" : ""}
                  `}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium leading-none ${
                        isToday
                          ? "bg-brand-500 text-white w-5 h-5 rounded-full flex items-center justify-center"
                          : isWkend
                          ? "text-gray-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {dayTotal > 0 && (
                      <span className="text-[10px] font-semibold text-gray-400">
                        {dayTotal.toFixed(1)}h
                      </span>
                    )}
                  </div>

                  {/* Entry chips */}
                  <div className="space-y-0.5">
                    {dayEntries.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEntryClick(entry);
                        }}
                        className="w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: entry.project.color + "22",
                          color: entry.project.color,
                          borderLeft: `2px solid ${entry.project.color}`,
                        }}
                      >
                        {Number(entry.hours).toFixed(1)}h {entry.project.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
