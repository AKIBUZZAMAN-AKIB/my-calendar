import { useEffect, useState } from "react";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { formatTime } from "@/features/calendar/helpers";

/**
 * Current-time marker. The line (with its dot) lives in the day grid; the
 * time label lives in the sticky hour column, so it stays readable when the
 * grid is scrolled sideways.
 */
export function CalendarTimeline({ part = "line" }: { part?: "line" | "label" }) {
  const { use24HourFormat } = useCalendar();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const top = `${(minutes / 1440) * 100}%`;

  if (part === "label") {
    return (
      <div
        data-now-label
        className="pointer-events-none absolute inset-x-0 z-10 -translate-y-1/2 whitespace-nowrap bg-background pr-1 text-right text-[10px] font-medium leading-4 text-primary sm:pr-2 sm:text-xs"
        style={{ top }}
      >
        {formatTime(currentTime, use24HourFormat)}
      </div>
    );
  }

  return (
    <div
      data-now-line
      className="pointer-events-none absolute inset-x-0 z-10 border-t border-primary"
      style={{ top }}
    >
      <div className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-primary" />
    </div>
  );
}
