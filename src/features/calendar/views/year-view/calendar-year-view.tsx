import { getYear, isSameDay, isSameMonth } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { staggerContainer, transition } from "@/features/calendar/animations";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { EventListDialog } from "@/features/calendar/dialogs/events-list-dialog";
import { getCalendarCells } from "@/features/calendar/helpers";
import type { IEvent } from "@/features/calendar/interfaces";
import { EventBullet } from "@/features/calendar/views/month-view/event-bullet";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarYearView({ singleDayEvents, multiDayEvents }: IProps) {
  const { selectedDate, setSelectedDate, setView } = useCalendar();
  const currentYear = getYear(selectedDate);
  const allEvents = [...multiDayEvents, ...singleDayEvents];

  return (
    <div className="flex flex-col p-2 pb-24 sm:p-6">
      {/* Year grid */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 auto-rows-fr"
      >
        {MONTHS.map((month, monthIndex) => {
          const monthDate = new Date(currentYear, monthIndex, 1);
          const cells = getCalendarCells(monthDate);

          return (
            <motion.div
              key={month}
              className="flex flex-col border border-border rounded-lg shadow-sm overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: monthIndex * 0.05, ...transition }}
              aria-label={`${month} ${currentYear} calendar`}
            >
              {/* Month header */}
              <button
                type="button"
                className="w-full px-2 py-1.5 text-left sm:text-center text-primary sm:text-foreground font-semibold text-sm sm:py-2 sm:text-base cursor-pointer hover:bg-primary/20 transition-colors bg-transparent border-none appearance-none"
                onClick={() => {
                  setSelectedDate(new Date(currentYear, monthIndex, 1));
                  setView("month");
                }}
                aria-label={`Select ${month}`}
              >
                {month}
              </button>

              <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs font-medium text-muted-foreground sm:py-2">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="p-0.5 sm:p-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px sm:gap-0.5 p-1 sm:p-1.5 flex-grow text-[11px] sm:text-xs">
                {cells.map((cell) => {
                  const isCurrentMonth = isSameMonth(cell.date, monthDate);
                  const isToday = isSameDay(cell.date, new Date());
                  const dayEvents = allEvents.filter((event) =>
                    isSameDay(new Date(event.startDate), cell.date),
                  );
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <div
                      key={cell.date.toISOString()}
                      className={cn(
                        "flex flex-col items-center justify-start p-0 sm:p-1 min-h-[1.75rem] sm:min-h-[2rem] relative",
                        !isCurrentMonth && "text-muted-foreground/40",
                        hasEvents && isCurrentMonth
                          ? "cursor-pointer hover:bg-accent/20 hover:rounded-md"
                          : "cursor-default",
                      )}
                    >
                      {isCurrentMonth && hasEvents ? (
                        <EventListDialog date={cell.date} events={dayEvents}>
                          <div className="w-full h-full flex flex-col items-center justify-start gap-0.5">
                            <span
                              className={cn(
                                "size-[18px] sm:size-5 flex items-center justify-center font-medium",
                                isToday &&
                                  "rounded-full bg-primary text-primary-foreground",
                              )}
                            >
                              {cell.day}
                            </span>
                            <div className="flex justify-center items-center gap-0.5">
                              {dayEvents.slice(0, 3).map((event) => (
                                <EventBullet
                                  key={event.id}
                                  color={event.color}
                                  className="size-1 sm:size-1.5"
                                />
                              ))}
                            </div>
                          </div>
                        </EventListDialog>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-start">
                          <span
                            className={cn(
                              "size-[18px] sm:size-5 flex items-center justify-center font-medium",
                            )}
                          >
                            {cell.day}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
