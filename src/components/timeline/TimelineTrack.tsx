import { useMemo } from "react";
import type { TrackItem } from "@/types";
import { stringToColor, formatDuration } from "@/lib/utils";

interface TimelineTrackProps {
  items: TrackItem[];
  visibleRange: [number, number];
  label: string;
  onItemClick?: (item: TrackItem) => void;
  selectedItemId?: number | null;
}

export function TimelineTrack({
  items,
  visibleRange,
  label,
  onItemClick,
  selectedItemId,
}: TimelineTrackProps) {
  const rangeDuration = visibleRange[1] - visibleRange[0];

  // Filter and position visible items
  const visibleItems = useMemo(() => {
    return items
      .filter(
        (item) =>
          item.endDate > visibleRange[0] && item.beginDate < visibleRange[1]
      )
      .map((item) => {
        const start = Math.max(item.beginDate, visibleRange[0]);
        const end = Math.min(item.endDate, visibleRange[1]);
        const leftPercent =
          ((start - visibleRange[0]) / rangeDuration) * 100;
        const widthPercent = ((end - start) / rangeDuration) * 100;

        return {
          ...item,
          leftPercent,
          widthPercent,
        };
      });
  }, [items, visibleRange, rangeDuration]);

  return (
    <div className="flex items-center h-10 gap-2">
      {/* Track Label */}
      <div className="w-16 text-xs font-medium text-slate-500 dark:text-slate-400 text-right shrink-0">
        {label}
      </div>

      {/* Track Content */}
      <div className="flex-1 relative h-8 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className={`absolute top-0 h-full cursor-pointer transition-all hover:opacity-80 hover:z-10 ${
              selectedItemId === item.id
                ? "ring-2 ring-primary-500 z-20"
                : ""
            }`}
            style={{
              left: `${item.leftPercent}%`,
              width: `${Math.max(item.widthPercent, 0.5)}%`,
              backgroundColor: item.color || stringToColor(item.app),
            }}
            onClick={() => onItemClick?.(item)}
            title={`${item.app}\n${item.title}\n${formatDuration(
              item.endDate - item.beginDate
            )}`}
          />
        ))}

        {/* Empty state */}
        {visibleItems.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            No data
          </div>
        )}
      </div>
    </div>
  );
}
