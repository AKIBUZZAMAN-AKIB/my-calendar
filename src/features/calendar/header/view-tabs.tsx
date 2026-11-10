"use client";

import {
  CalendarRange,
  Columns3,
  Grid2X2,
  Grid3X3,
  List,
} from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "../contexts/calendar-context";
import type { TCalendarView } from "../types";

const tabs: { name: string; value: TCalendarView; Icon: typeof List }[] = [
  { name: "Day", value: "day", Icon: List },
  { name: "Week", value: "week", Icon: Columns3 },
  { name: "Month", value: "month", Icon: Grid3X3 },
  { name: "Year", value: "year", Icon: Grid2X2 },
  { name: "Agenda", value: "agenda", Icon: CalendarRange },
];

/**
 * Segmented control. On phones the active view shows icon + label and the
 * others show just an icon, so all five fit in one line next to the filter
 * and settings buttons.
 */
function Views({ className }: { className?: string }) {
  const { view, setView } = useCalendar();

  return (
    <div
      role="tablist"
      aria-label="Calendar view"
      className={cn(
        "flex h-10 min-w-0 items-center gap-0.5 rounded-lg bg-muted p-1",
        className,
      )}
    >
      {tabs.map(({ Icon, name, value }) => {
        const isActive = view === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={name}
            title={name}
            data-view-btn={value}
            onClick={() => setView(value)}
            className={cn(
              "flex h-8 min-w-9 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "flex-[1_0_auto] bg-background text-foreground shadow-sm lg:flex-none lg:px-3"
                : "flex-1 text-muted-foreground hover:text-foreground lg:flex-none",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span
              className={cn(
                "whitespace-nowrap",
                isActive ? "inline" : "hidden sm:inline",
              )}
            >
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default memo(Views);
