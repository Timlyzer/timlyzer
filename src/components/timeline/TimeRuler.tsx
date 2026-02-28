import { useMemo } from "react";
import { format } from "date-fns";

interface TimeRulerProps {
  visibleRange: [number, number];
}

export function TimeRuler({ visibleRange }: TimeRulerProps) {
  const hours = useMemo(() => {
    const result: { time: number; label: string; percent: number }[] = [];
    const rangeDuration = visibleRange[1] - visibleRange[0];

    // Start from the beginning of the first visible hour
    const startHour = new Date(visibleRange[0]);
    startHour.setMinutes(0, 0, 0);

    // Calculate visible hours
    const visibleHours = rangeDuration / (1000 * 60 * 60);

    // Determine step based on zoom level
    let step = 1;
    if (visibleHours > 12) step = 2;
    if (visibleHours > 20) step = 3;
    if (visibleHours < 4) step = 0.5;

    // Generate hour markers
    let current = new Date(startHour);
    while (current.getTime() <= visibleRange[1]) {
      if (current.getTime() >= visibleRange[0]) {
        const percent =
          ((current.getTime() - visibleRange[0]) / rangeDuration) * 100;
        result.push({
          time: current.getTime(),
          label: format(current, "HH:mm"),
          percent,
        });
      }
      current = new Date(current.getTime() + step * 60 * 60 * 1000);
    }

    return result;
  }, [visibleRange]);

  return (
    <div className="flex items-center h-6 gap-2">
      {/* Spacer for track label */}
      <div className="w-16 shrink-0" />

      {/* Ruler */}
      <div className="flex-1 relative h-full border-b border-slate-200 dark:border-slate-700">
        {hours.map(({ time, label, percent }) => (
          <div
            key={time}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${percent}%` }}
          >
            <div className="w-px h-2 bg-slate-300 dark:bg-slate-600" />
            <span className="text-xs text-slate-500 dark:text-slate-400 -translate-x-1/2">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
