import { format, isWithinInterval, parseISO } from "date-fns";
import { Calendar, Clock, Tag } from "lucide-react";
import { useMemo } from "react";
import { DayPicker } from "@/components/ui/day-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";

import { useMediaQuery } from "@/features/calendar/hooks";
import type { IEvent } from "@/features/calendar/interfaces";
import { DayViewMultiDayEventsRow } from "@/features/calendar/views/week-and-day-view/day-view-multi-day-events-row";
import { MobileWeekStrip } from "@/features/calendar/views/week-and-day-view/mobile-week-strip";
import { TimeGrid, useTimeGridColumns } from "@/features/calendar/views/week-and-day-view/time-grid";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
}

export function CalendarDayView({ singleDayEvents, multiDayEvents }: IProps) {
  const { selectedDate, setSelectedDate, use24HourFormat } = useCalendar();
  const isSm = useMediaQuery("(min-width: 640px)");

  const dayKey = selectedDate.toDateString();
  // biome-ignore lint/correctness/useExhaustiveDependencies: one array per day
  const days = useMemo(() => [selectedDate], [dayKey]);

  // Overlapping events sit side by side. On a phone each gets at least 120px,
  // so a busy day scrolls sideways instead of squeezing the titles away.
  const columns = useTimeGridColumns(days, singleDayEvents, {
    baseMin: 0,
    perGroupMin: isSm ? 140 : 120,
  });

  const currentEvents = useMemo(() => {
    const now = new Date();
    return singleDayEvents.filter((event) =>
      isWithinInterval(now, {
        start: parseISO(event.startDate),
        end: parseISO(event.endDate),
      }),
    );
  }, [singleDayEvents]);

  return (
    <div data-view="day" className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileWeekStrip events={singleDayEvents} />
        <TimeGrid
          columns={columns}
          renderHeader={() => (
            <>
              <DayViewMultiDayEventsRow
                selectedDate={selectedDate}
                multiDayEvents={multiDayEvents}
              />
              {/* Day header (desktop) */}
              <div className="hidden border-b lg:flex">
                <div className="sticky left-0 z-20 w-11 shrink-0 border-r bg-background sm:w-18" />
                <span className="flex-1 py-2 text-center text-xs font-medium text-t-quaternary">
                  {format(selectedDate, "EE")}{" "}
                  <span className="font-semibold text-t-secondary">
                    {format(selectedDate, "d")}
                  </span>
                </span>
              </div>
            </>
          )}
        />
      </div>

      <div className="hidden w-72 flex-col divide-y border-l lg:flex">
        <DayPicker
          className="mx-auto w-fit"
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          initialFocus
        />

        <div className="flex-1 space-y-3">
          {currentEvents.length > 0 ? (
            <div className="flex items-start gap-2 px-4 pt-4">
              <span className="relative mt-[5px] flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex size-2.5 rounded-full bg-green-600"></span>
              </span>

              <p className="text-sm font-semibold text-t-secondary">
                Happening now
              </p>
            </div>
          ) : (
            <p className="p-4 text-center text-sm italic text-t-tertiary">
              No appointments or consultations at the moment
            </p>
          )}

          {currentEvents.length > 0 && (
            <ScrollArea className="h-[422px] px-4" type="auto">
              <div className="space-y-6 pb-4">
                {currentEvents.map((event) => {
                  const subject = event.subject;

                  return (
                    <div key={event.id} className="space-y-1.5">
                      <p className="line-clamp-2 text-sm font-semibold [overflow-wrap:anywhere]" title={event.title}>
                        {event.title}
                      </p>

                      {subject && (
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Tag className="size-4 shrink-0 text-t-quinary" />
                          <span className="min-w-0 truncate text-sm text-t-tertiary" title={subject.name}>
                            {subject.name}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-4 text-t-quinary" />
                        <span className="text-sm text-t-tertiary">
                          {format(new Date(event.startDate), "MMM d, yyyy")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="size-4 text-t-quinary" />
                        <span className="text-sm text-t-tertiary">
                          {format(
                            parseISO(event.startDate),
                            use24HourFormat ? "HH:mm" : "hh:mm a",
                          )}{" "}
                          -
                          {format(
                            parseISO(event.endDate),
                            use24HourFormat ? "HH:mm" : "hh:mm a",
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
