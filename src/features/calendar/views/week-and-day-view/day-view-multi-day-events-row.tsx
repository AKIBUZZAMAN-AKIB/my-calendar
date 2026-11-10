import {
  differenceInDays,
  endOfDay,
  isWithinInterval,
  parseISO,
  startOfDay,
} from "date-fns";
import type { IEvent } from "@/features/calendar/interfaces";
import { MonthEventBadge } from "@/features/calendar/views/month-view/month-event-badge";

interface IProps {
  selectedDate: Date;
  multiDayEvents: IEvent[];
}

export function DayViewMultiDayEventsRow({
  selectedDate,
  multiDayEvents,
}: IProps) {
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  const multiDayEventsInDay = multiDayEvents
    .filter((event) => {
      const eventStart = parseISO(event.startDate);
      const eventEnd = parseISO(event.endDate);

      return (
        isWithinInterval(dayStart, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(dayEnd, { start: eventStart, end: eventEnd }) ||
        (eventStart <= dayStart && eventEnd >= dayEnd)
      );
    })
    .sort((a, b) => {
      const durationA = differenceInDays(
        parseISO(a.endDate),
        parseISO(a.startDate),
      );
      const durationB = differenceInDays(
        parseISO(b.endDate),
        parseISO(b.startDate),
      );
      return durationB - durationA;
    });

  if (multiDayEventsInDay.length === 0) return null;

  return (
    <div className="flex border-b">
      <div className="sticky left-0 z-20 w-11 shrink-0 border-r bg-background sm:w-18" />
      {/* stays on screen while the grid scrolls sideways, so every bar shows both ends */}
      <div
        data-allday-row
        className="sticky left-11 flex min-w-0 shrink-0 flex-col gap-1 py-1 w-[calc(var(--tg-vw,100%)-44px)] sm:left-18 sm:w-[calc(var(--tg-vw,100%)-72px)]"
      >
        {multiDayEventsInDay.map((event) => {
          const eventStart = startOfDay(parseISO(event.startDate));
          const eventEnd = startOfDay(parseISO(event.endDate));
          const currentDate = startOfDay(selectedDate);

          const eventTotalDays = differenceInDays(eventEnd, eventStart) + 1;
          const eventCurrentDay = differenceInDays(currentDate, eventStart) + 1;

          return (
            <MonthEventBadge
              key={event.id}
              event={event}
              cellDate={selectedDate}
              eventCurrentDay={eventCurrentDay}
              eventTotalDays={eventTotalDays}
            />
          );
        })}
      </div>
    </div>
  );
}
