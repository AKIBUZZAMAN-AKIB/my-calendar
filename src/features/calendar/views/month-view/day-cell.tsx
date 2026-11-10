"use client";

import { cva } from "class-variance-authority";
import { isSaturday, isSunday, isToday, startOfDay } from "date-fns";
import { memo, useMemo, useCallback } from "react";

import { cn } from "@/lib/utils";
import { EventListDialog } from "@/features/calendar/dialogs/events-list-dialog";
import { DroppableArea } from "@/features/calendar/dnd/droppable-area";
import type { getMonthCellEvents } from "@/features/calendar/helpers";
import { useMediaQuery } from "@/features/calendar/hooks";
import type { ICalendarCell, IEvent } from "@/features/calendar/interfaces";
import { chipHeight, MonthEventBadge } from "@/features/calendar/views/month-view/month-event-badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddEditEventDialog } from "@/features/calendar/dialogs/add-edit-event-dialog";

interface IProps {
  cell: ICalendarCell;
  /** This cell's events, worked out once for the whole month by the month view. */
  cellEvents: ReturnType<typeof getMonthCellEvents>;
  /** Text lines per chip on phones (the month view picks 1 or 2 from the room it has). */
  lines: number;
  monthStart: Date;
  monthEnd: Date;
}

export const dayCellVariants = cva("text-white", {
  variants: {
    color: {
      blue: "bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 ",
      green:
        "bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-400",
      red: "bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-400",
      yellow:
        "bg-yellow-600 dark:bg-yellow-500 hover:bg-yellow-700 dark:hover:bg-yellow-400",
      purple:
        "bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-400",
      orange:
        "bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-400",
      gray: "bg-gray-600 dark:bg-gray-500 hover:bg-gray-700 dark:hover:bg-gray-400",
    },
  },
  defaultVariants: {
    color: "blue",
  },
});

const MAX_VISIBLE_EVENTS = 3;

export const DayCell = memo(function DayCell({ cell, cellEvents, lines, monthStart, monthEnd }: IProps) {
  const { day, currentMonth, date } = cell;
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const month = useMemo(() => ({ lines, monthStart, monthEnd }), [lines, monthStart, monthEnd]);
  const rowHeight = isMobile ? chipHeight(lines) : undefined;


  // Memoize event rendering for each position with animation
  const renderEventAtPosition = useCallback(
    (position: number) => {
      const event = cellEvents.find((e) => e.position === position);
      if (!event) {
        return (
          <div
            key={`empty-${position}`}
            className="h-4 lg:h-auto lg:flex-1"
            style={rowHeight ? { height: rowHeight } : undefined}
          />
        );
      }

      return (
        <div
          key={`event-${event.id}-${position}`}
          className="lg:flex-1"
        >
          <MonthEventBadge event={event} cellDate={startOfDay(date)} compact={isMobile} month={month} />
        </div>
      );
    },
    [cellEvents, date, isMobile, month, rowHeight],
  );

  const showMoreCount = cellEvents.length - MAX_VISIBLE_EVENTS;

  const showMobileMore = isMobile && currentMonth && showMoreCount > 0;
  const showDesktopMore = !isMobile && currentMonth && showMoreCount > 0;

  const cellContent = useMemo(
    () => (
      <div
        data-month-cell
        // the last day of the row: a bar that runs on ends at the screen edge
        data-last-col={isSaturday(date) ? "" : undefined}
        className={cn(
          "flex h-full min-h-[80px] flex-col border-l border-t lg:min-h-40",
          isMobile && currentMonth && "cursor-pointer active:bg-accent/60",
          isSunday(date) && "border-l-0",
        )}
      >
        <DroppableArea
          date={date}
          className="flex h-full w-full flex-col py-1 lg:py-2"
        >
          <span
            className={cn(
              "mx-auto flex h-5 items-center text-xs font-semibold lg:mx-0 lg:h-6 lg:px-2",
              !currentMonth && "opacity-30",
              isToday(date) &&
                "w-5 justify-center rounded-full bg-primary px-0 font-bold text-primary-foreground lg:ml-1 lg:w-6 lg:px-0",
            )}
          >
            {day}
          </span>

          <div
            className={cn(
              "mt-0.5 flex flex-col gap-0.5 lg:mt-1 lg:h-[94px] lg:gap-2",
              !currentMonth && "opacity-50",
            )}
          >
            {cellEvents.length === 0 && !isMobile ? (
              <div className="w-full h-full flex justify-center items-center group">
                <AddEditEventDialog startDate={date}>
                  <Button
                    variant="ghost"
                    className="border opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="max-sm:hidden">Add Event</span>
                  </Button>
                </AddEditEventDialog>
              </div>
            ) : (
              [0, 1, 2].map(renderEventAtPosition)
            )}
          </div>

          {showMobileMore && (
            <div className="mt-auto px-1">
              <span className="block truncate text-[10px] font-semibold leading-tight text-muted-foreground">
                +{showMoreCount} more
              </span>
            </div>
          )}

          {showDesktopMore && (
            <div
              className={cn(
                "h-4.5 px-1.5 my-2 text-end text-xs font-semibold text-muted-foreground",
                !currentMonth && "opacity-50",
              )}
            >
              <EventListDialog date={date} events={cellEvents} />
            </div>
          )}
        </DroppableArea>
      </div>
    ),
    [
      date,
      day,
      currentMonth,
      cellEvents,
      showMobileMore,
      showDesktopMore,
      showMoreCount,
      renderEventAtPosition,
      isMobile,
    ],
  );

  if (isMobile && currentMonth) {
    return (
      <EventListDialog date={date} events={cellEvents}>
        {cellContent}
      </EventListDialog>
    );
  }

  return cellContent;
});
