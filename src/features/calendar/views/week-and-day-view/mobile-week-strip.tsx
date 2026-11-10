"use client";

import {
  addDays,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfWeek,
} from "date-fns";
import { useMemo } from "react";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import type { IEvent } from "@/features/calendar/interfaces";
import { cn } from "@/lib/utils";

const dot: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
};

/** Week strip shown above the day view on phones / tablets (Apple-Calendar style). */
export function MobileWeekStrip({ events }: { events: IEvent[] }) {
  const { selectedDate, setSelectedDate } = useCalendar();
  const weekStart = startOfWeek(selectedDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const colorsByDay = useMemo(
    () =>
      days.map((d) => {
        const colors = events
          .filter((e) => isSameDay(parseISO(e.startDate), d))
          .map((e) => e.color);
        return Array.from(new Set(colors)).slice(0, 3);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, weekStart.getTime()],
  );

  return (
    <div className="grid grid-cols-7 gap-0.5 border-b px-1 py-1.5 lg:hidden" data-week-strip>
      {days.map((d, i) => {
        const selected = isSameDay(d, selectedDate);
        const today = isToday(d);
        return (
          <button
            key={d.toISOString()}
            type="button"
            aria-label={format(d, "EEEE, MMMM d")}
            aria-pressed={selected}
            onClick={() => setSelectedDate(d)}
            className="flex flex-col items-center gap-0.5 rounded-lg py-1 active:bg-accent"
          >
            <span
              className={cn(
                "text-[11px] font-medium text-muted-foreground",
                today && "text-primary",
              )}
            >
              {format(d, "EEEEE")}
            </span>
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                selected && today && "bg-primary text-primary-foreground",
                selected && !today && "bg-foreground text-background",
                !selected && today && "text-primary",
              )}
            >
              {format(d, "d")}
            </span>
            <span className="flex h-1.5 items-center gap-0.5">
              {colorsByDay[i].map((c) => (
                <span key={c} className={cn("size-1.5 rounded-full", dot[c])} />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
