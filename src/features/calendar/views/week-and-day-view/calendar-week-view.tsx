import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { useMemo, startTransition } from "react";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { useMediaQuery } from "@/features/calendar/hooks";
import type { IEvent } from "@/features/calendar/interfaces";
import { TimeGrid, useTimeGridColumns } from "@/features/calendar/views/week-and-day-view/time-grid";
import { WeekViewMultiDayEventsRow } from "@/features/calendar/views/week-and-day-view/week-view-multi-day-events-row";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
}

export function CalendarWeekView({ singleDayEvents, multiDayEvents }: IProps) {
  const { selectedDate, setSelectedDate, setView } = useCalendar();
  const isSm = useMediaQuery("(min-width: 640px)");

  const weekKey = startOfWeek(selectedDate).toDateString();
  // biome-ignore lint/correctness/useExhaustiveDependencies: one array per week
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekKey]);

  // Phones: each day gets at least 84px, so a week is wider than the screen
  // and scrolls sideways. Days with overlapping events get more room.
  const columns = useTimeGridColumns(weekDays, singleDayEvents, {
    baseMin: isSm ? 0 : 84,
    perGroupMin: isSm ? 72 : 64,
  });

  return (
    <div data-view="week" className="flex h-full flex-col">
      <TimeGrid
        columns={columns}
        focusDay={selectedDate}
        renderHeader={(gridStyle, gutter) => (
          <>
            <WeekViewMultiDayEventsRow
              selectedDate={selectedDate}
              multiDayEvents={multiDayEvents}
              gridStyle={gridStyle}
            />
            <div className="flex border-b">
              {gutter}
              <div className="grid min-w-0 flex-1" style={gridStyle}>
                {weekDays.map((day) => {
                  const today = isSameDay(day, new Date());
                  const selected = isSameDay(day, selectedDate);
                  return (
                    <button
                      type="button"
                      key={day.toISOString()}
                      data-week-day-header={format(day, "yyyy-MM-dd")}
                      className={`min-w-0 py-1 text-center text-xs font-medium text-t-quaternary sm:py-2 ${today ? "text-primary" : ""}`}
                      onClick={() => {
                        startTransition(() => {
                          setSelectedDate(day);
                          setView("day");
                        });
                      }}
                    >
                      {/* Phones: day letter and number */}
                      <span className="block sm:hidden">
                        {format(day, "EEE")}
                        <span
                          className={`mx-auto mt-0.5 flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                            today
                              ? "bg-primary text-primary-foreground"
                              : selected
                                ? "bg-muted text-t-secondary"
                                : "text-t-secondary"
                          }`}
                        >
                          {format(day, "d")}
                        </span>
                      </span>
                      <span className="hidden sm:inline">
                        {format(day, "EE")}{" "}
                        <span className="ml-1 font-semibold text-t-secondary">{format(day, "d")}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      />
    </div>
  );
}
