"use client";

import { isSameDay, parseISO } from "date-fns";
import { useMemo } from "react";
import type { IEvent } from "@/features/calendar/interfaces";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { AgendaEvents } from "@/features/calendar/views/agenda-view/agenda-events";
import { CalendarMonthView } from "@/features/calendar/views/month-view/calendar-month-view";
import { CalendarDayView } from "@/features/calendar/views/week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "@/features/calendar/views/week-and-day-view/calendar-week-view";
import { CalendarYearView } from "@/features/calendar/views/year-view/calendar-year-view";

export function CalendarBody() {
  const { view, events } = useCalendar();

  // Split once per events change, not on every render of the body.
  const { singleDayEvents, multiDayEvents } = useMemo(() => {
    const single: IEvent[] = [];
    const multi: IEvent[] = [];
    for (const event of events) {
      if (isSameDay(parseISO(event.startDate), parseISO(event.endDate))) single.push(event);
      else multi.push(event);
    }
    return { singleDayEvents: single, multiDayEvents: multi };
  }, [events]);

  return (
    <div
      data-calendar-body
      className="relative h-full w-full overflow-x-hidden overflow-y-auto overscroll-contain transition-opacity duration-150 data-[pending=true]:opacity-60"
    >
      {/* keyed by view: a short CSS fade (GPU, no JS animation) when the view changes */}
      <div key={view} data-view={view} className="h-full animate-view-in">
        {view === "month" && (
          <CalendarMonthView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
        )}
        {view === "week" && (
          <CalendarWeekView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
        )}
        {view === "day" && (
          <CalendarDayView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
        )}
        {view === "year" && (
          <CalendarYearView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
        )}
        {view === "agenda" && <AgendaEvents />}
      </div>
    </div>
  );
}
