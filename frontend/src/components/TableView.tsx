import { TimeEntry, Project } from "../types";
import { getMonthDays, formatDate, isWeekend, today } from "../dateUtils";

interface TableViewProps {
  year: number;
  month: number;
  entries: TimeEntry[];
  projects: Project[];
  onCellClick: (date: string) => void;
  onEntryClick: (entry: TimeEntry) => void;
}

export default function TableView({
  year,
  month,
  entries,
  projects,
  onCellClick,
  onEntryClick,
}: TableViewProps) {
  const days = getMonthDays(year, month);
  const todayStr = today();

  // Build map: dateStr -> Map<projectId, TimeEntry[]>
  const entryMap = new Map<string, Map<string, TimeEntry[]>>();
  for (const e of entries) {
    const dateKey = e.date.split("T")[0];
    if (!entryMap.has(dateKey)) entryMap.set(dateKey, new Map());
    const dayMap = entryMap.get(dateKey)!;
    if (!dayMap.has(e.projectId)) dayMap.set(e.projectId, []);
    dayMap.get(e.projectId)!.push(e);
  }

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="sticky left-0 bg-white dark:bg-gray-900 z-10 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
              Date
            </th>
            {projects.map((p) => (
              <th
                key={p.id}
                className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider min-w-[100px]"
                style={{ color: p.color }}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.name}
                </div>
              </th>
            ))}
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const dateStr = formatDate(day);
            const isToday = dateStr === todayStr;
            const isWkend = isWeekend(day);
            const dayMap = entryMap.get(dateStr);

            let dayTotal = 0;

            return (
              <tr
                key={dateStr}
                className={`border-b border-gray-50 dark:border-gray-800/30 transition-colors
                  ${isToday ? "bg-brand-50/40 dark:bg-brand-950/10" : ""}
                  ${isWkend && !isToday ? "bg-gray-50/60 dark:bg-gray-950/20" : ""}
                  hover:bg-brand-50/30 dark:hover:bg-brand-950/10
                `}
              >
                {/* Date column */}
                <td className="sticky left-0 bg-inherit px-3 py-1.5 text-xs font-medium whitespace-nowrap">
                  <span className={isWkend ? "text-gray-400" : "text-gray-600 dark:text-gray-400"}>
                    {DAY_LABELS[day.getDay()]}
                  </span>{" "}
                  <span
                    className={`${
                      isToday
                        ? "bg-brand-500 text-white px-1.5 py-0.5 rounded-full"
                        : isWkend
                        ? "text-gray-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </td>

                {/* Project columns */}
                {projects.map((p) => {
                  const cellEntries = dayMap?.get(p.id) || [];
                  const cellTotal = cellEntries.reduce(
                    (s, e) => s + Number(e.hours),
                    0
                  );
                  dayTotal += cellTotal;

                  return (
                    <td
                      key={p.id}
                      onClick={() =>
                        cellEntries.length > 0
                          ? onEntryClick(cellEntries[0])
                          : onCellClick(dateStr)
                      }
                      className="px-3 py-1.5 text-center cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                    >
                      {cellTotal > 0 ? (
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: p.color + "18",
                            color: p.color,
                          }}
                        >
                          {cellTotal.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-700 text-xs">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}

                {/* Day total */}
                <td className="px-3 py-1.5 text-center text-xs font-semibold">
                  {dayTotal > 0 ? (
                    <span className="text-gray-700 dark:text-gray-300">
                      {dayTotal.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-700">—</span>
                  )}
                </td>
              </tr>
            );
          })}

          {/* Totals row */}
          <tr className="bg-gray-50 dark:bg-gray-800/50 font-semibold">
            <td className="sticky left-0 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-xs text-gray-500 uppercase">
              Total
            </td>
            {projects.map((p) => {
              const projectTotal = entries
                .filter((e) => e.projectId === p.id)
                .reduce((s, e) => s + Number(e.hours), 0);
              return (
                <td key={p.id} className="px-3 py-2 text-center text-xs" style={{ color: p.color }}>
                  {projectTotal > 0 ? projectTotal.toFixed(1) : "—"}
                </td>
              );
            })}
            <td className="px-3 py-2 text-center text-xs text-brand-600 dark:text-brand-400">
              {entries.reduce((s, e) => s + Number(e.hours), 0).toFixed(1)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
