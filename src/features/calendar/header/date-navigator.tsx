"use client";

import {
  endOfWeek,
  formatDate,
  isSameMonth,
  isSameYear,
  startOfWeek,
} from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DayPicker } from "@/components/ui/day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { getEventsCount, navigateDate } from "@/features/calendar/helpers";
import type { IEvent } from "@/features/calendar/interfaces";
import type { TCalendarView } from "@/features/calendar/types";

interface IProps {
  view: TCalendarView;
  events: IEvent[];
}

function titleFor(view: TCalendarView, date: Date) {
  switch (view) {
    case "year":
      return formatDate(date, "yyyy");
    case "day":
      return formatDate(date, "EEE, MMM d");
    default:
      return formatDate(date, "MMMM yyyy");
  }
}

function subtitleFor(view: TCalendarView, date: Date) {
  if (view === "week") {
    const s = startOfWeek(date);
    const e = endOfWeek(date);
    if (isSameMonth(s, e)) return `${formatDate(s, "MMM d")}–${formatDate(e, "d")}`;
    if (isSameYear(s, e)) return `${formatDate(s, "MMM d")} – ${formatDate(e, "MMM d")}`;
    return `${formatDate(s, "MMM d, yyyy")} – ${formatDate(e, "MMM d, yyyy")}`;
  }
  if (view === "day") return formatDate(date, "yyyy");
  return null;
}

export function DateNavigator({ view, events }: IProps) {
  const { selectedDate, setSelectedDate } = useCalendar();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(selectedDate);

  const eventCount = useMemo(
    () => getEventsCount(events, selectedDate, view),
    [events, selectedDate, view],
  );

  const subtitle = subtitleFor(view, selectedDate);

  return (
    <div className="flex min-w-0 items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0"
        aria-label="Previous"
        data-nav="prev"
        onClick={() => setSelectedDate(navigateDate(selectedDate, view, "previous"))}
      >
        <ChevronLeft className="size-5" />
      </Button>

      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) setMonth(selectedDate);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            data-nav="title"
            aria-label="Pick a date"
            className="flex min-w-0 flex-col items-start rounded-md px-1.5 py-0.5 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex max-w-full items-center gap-1 text-base font-semibold leading-tight lg:text-lg">
              <span className="truncate">{titleFor(view, selectedDate)}</span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </span>
            <span className="max-w-full truncate text-xs leading-tight text-muted-foreground">
              {subtitle ? `${subtitle} · ` : ""}
              {eventCount} {eventCount === 1 ? "event" : "events"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <DayPicker
            mode="single"
            selected={selectedDate}
            month={month}
            onMonthChange={setMonth}
            onSelect={(d) => {
              if (d) setSelectedDate(d);
              setOpen(false);
            }}
          />
          <div className="flex justify-end border-t p-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedDate(new Date());
                setOpen(false);
              }}
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0"
        aria-label="Next"
        data-nav="next"
        onClick={() => setSelectedDate(navigateDate(selectedDate, view, "next"))}
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
