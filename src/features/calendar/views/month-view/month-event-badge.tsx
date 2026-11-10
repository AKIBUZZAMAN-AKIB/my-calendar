import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import {
  differenceInCalendarDays,
  endOfDay,
  endOfWeek,
  isSameDay,
  isSunday,
  min as minDate,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { EventDetailsDialog } from "@/features/calendar/dialogs/event-details-dialog";
import { DraggableEvent } from "@/features/calendar/dnd/draggable-event";
import { formatTime } from "@/features/calendar/helpers";
import type { IEvent } from "@/features/calendar/interfaces";
import { EventBullet } from "@/features/calendar/views/month-view/event-bullet";

export const eventBadgeVariants = cva(
  "flex w-full h-4 lg:h-6.5 select-none items-center justify-between gap-1 lg:gap-1.5 truncate whitespace-nowrap rounded-[4px] lg:rounded-md border px-1 lg:px-2 text-[10px] leading-none lg:text-xs cursor-grab",
  {
    variants: {
      color: {
        // Colored variants
        blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
        green:
          "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
        red: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
        yellow:
          "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
        purple:
          "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300",
        orange:
          "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300",

        // Dot variants
        "blue-dot": "bg-bg-secondary text-t-primary [&_svg]:fill-blue-600",
        "green-dot": "bg-bg-secondary text-t-primary [&_svg]:fill-green-600",
        "red-dot": "bg-bg-secondary text-t-primary [&_svg]:fill-red-600",
        "orange-dot": "bg-bg-secondary text-t-primary [&_svg]:fill-orange-600",
        "purple-dot": "bg-bg-secondary text-t-primary [&_svg]:fill-purple-600",
        "yellow-dot": "bg-bg-secondary text-t-primary [&_svg]:fill-yellow-600",
      },
      multiDayPosition: {
        first: "relative z-10 mr-0 rounded-r-none border-r-0 [&>span]:mr-2.5",
        middle:
          "relative z-10 mx-0 w-[calc(100%_+_1px)] rounded-none border-x-0 [[data-last-col]_&]:w-full",
        last: "ml-0 rounded-l-none border-l-0",
        none: "",
      },
    },
    defaultVariants: {
      color: "blue-dot",
    },
  },
);

interface IProps extends Omit<
  VariantProps<typeof eventBadgeVariants>,
  "color" | "multiDayPosition"
> {
  event: IEvent;
  cellDate: Date;
  eventCurrentDay?: number;
  eventTotalDays?: number;
  className?: string;
  position?: "first" | "middle" | "last" | "none";
  /** Phone mode: a tap falls through to the day cell (opens the day sheet); long-press drags. */
  compact?: boolean;
  /**
   * Month grid only. lines: how many text lines a chip gets (phones get 2 when
   * the month has the height for it). monthEnd: a bar's name may run on to it.
   */
  month?: { lines: number; monthStart: Date; monthEnd: Date };
}

/** Line height of chip text on phones, in px. */
export const CHIP_LINE_PX = 11;
/** Chip height on phones for a number of text lines (1 line keeps the 16px chip). */
export const chipHeight = (lines: number) => (lines <= 1 ? 16 : lines * CHIP_LINE_PX + 2);

export function MonthEventBadge({
  event,
  cellDate,
  eventCurrentDay,
  eventTotalDays,
  className,
  position: propPosition,
  compact = false,
  month,
}: IProps) {
  const { badgeVariant, use24HourFormat } = useCalendar();
  if (month) {
    return (
      <MonthGridBadge
        event={event}
        cellDate={cellDate}
        compact={compact}
        month={month}
        badgeVariant={badgeVariant}
        use24HourFormat={use24HourFormat}
      />
    );
  }

  const itemStart = startOfDay(parseISO(event.startDate));
  const itemEnd = endOfDay(parseISO(event.endDate));

  if (cellDate < itemStart || cellDate > itemEnd) return null;

  let position: "first" | "middle" | "last" | "none" | undefined;

  if (propPosition) {
    position = propPosition;
  } else if (eventCurrentDay && eventTotalDays) {
    position = "none";
  } else if (isSameDay(itemStart, itemEnd)) {
    position = "none";
  } else if (isSameDay(cellDate, itemStart)) {
    position = "first";
  } else if (isSameDay(cellDate, itemEnd)) {
    position = "last";
  } else {
    position = "middle";
  }

  const renderBadgeText = ["first", "none"].includes(position);
  const renderBadgeTime = ["last", "none"].includes(position);

  const color = (
    badgeVariant === "dot" ? `${event.color}-dot` : event.color
  ) as VariantProps<typeof eventBadgeVariants>["color"];

  const eventBadgeClasses = cn(
    eventBadgeVariants({ color, multiDayPosition: position, className }),
  );

  const marginClass = {
    first: "ml-0.5 mr-0 lg:ml-1",
    middle: "mx-0",
    last: "ml-0 mr-0.5 lg:mr-1",
    none: "mx-0.5 lg:mx-1",
  }[position || "none"];

  const badge = (
<button type="button" data-month-badge className={eventBadgeClasses}>
          <div className="flex items-center gap-1.5 truncate">
            {!["middle", "last"].includes(position) &&
              badgeVariant === "dot" && <EventBullet color={event.color} />}

            {renderBadgeText && (
              <p className="min-w-0 flex-1 truncate font-semibold" title={event.title}>
                {eventCurrentDay && (
                  <span className="text-[10px] lg:text-xs">
                    Day {eventCurrentDay} of {eventTotalDays} •{" "}
                  </span>
                )}
                {event.title}
              </p>
            )}
          </div>

          <div className="hidden shrink-0 lg:block">
            {renderBadgeTime && (
              <span>
                {formatTime(new Date(event.startDate), use24HourFormat)}
              </span>
            )}
          </div>
        </button>
  );

  if (compact) {
    return (
      <DraggableEvent event={event} className={marginClass} passClick>
<div data-month-badge className={eventBadgeClasses}>
          <div className="flex items-center gap-1.5 truncate">
            {!["middle", "last"].includes(position) &&
              badgeVariant === "dot" && <EventBullet color={event.color} />}

            {renderBadgeText && (
              <p className="min-w-0 flex-1 truncate font-semibold" title={event.title}>
                {eventCurrentDay && (
                  <span className="text-[10px] lg:text-xs">
                    Day {eventCurrentDay} of {eventTotalDays} •{" "}
                  </span>
                )}
                {event.title}
              </p>
            )}
          </div>

          <div className="hidden shrink-0 lg:block">
            {renderBadgeTime && (
              <span>
                {formatTime(new Date(event.startDate), use24HourFormat)}
              </span>
            )}
          </div>
        </div>
      </DraggableEvent>
    );
  }

  return (
    <DraggableEvent event={event} className={marginClass}>
      <EventDetailsDialog event={event}>{badge}</EventDetailsDialog>
    </DraggableEvent>
  );
}

/**
 * A chip or a bar segment in the month grid.
 *
 * - The name of a multi-day event is written once per week row, in the row's
 *   first segment, and runs across every day of the bar in that row (not only
 *   the first day's width). It sits above the next segments and lets taps
 *   through to them.
 * - Phones, 1 line: no "…". The text fills the chip to its edge and fades
 *   out there, as in Google Calendar's month view. 2 lines (when the month has
 *   the height): it wraps, long words break, and "…" comes only at the end
 *   of the second line. Padding and margins are
 *   1–3px so the text gets nearly the whole cell.
 * - Desktop keeps one line with "…": the cells are wide there.
 */
function MonthGridBadge({
  event,
  cellDate,
  compact,
  month,
  badgeVariant,
  use24HourFormat,
}: {
  event: IEvent;
  cellDate: Date;
  compact: boolean;
  month: { lines: number; monthStart: Date; monthEnd: Date };
  badgeVariant: "dot" | "colored";
  use24HourFormat: boolean;
}) {
  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);
  const itemStart = startOfDay(start);
  const itemEnd = endOfDay(end);
  if (cellDate < itemStart || cellDate > itemEnd) return null;

  const multi = !isSameDay(itemStart, itemEnd);
  const isStart = isSameDay(cellDate, itemStart);
  const isEnd = isSameDay(cellDate, itemEnd);
  const position: "first" | "middle" | "last" | "none" = !multi
    ? "none"
    : isStart
      ? "first"
      : isEnd
        ? "last"
        : "middle";

  // where this bar's run in the current week row ends
  // (the days of other months are a separate, faded part of the grid)
  const rowEnd = minDate([
    startOfDay(end),
    startOfDay(endOfWeek(cellDate)),
    cellDate < month.monthStart
      ? subDays(startOfDay(month.monthStart), 1)
      : cellDate > month.monthEnd
        ? startOfDay(endOfWeek(cellDate))
        : startOfDay(month.monthEnd),
  ]);
  const span = Math.max(1, differenceInCalendarDays(rowEnd, cellDate) + 1);
  const runEndsAtEventEnd = isSameDay(rowEnd, itemEnd);
  // the name goes in the first segment of each week row
  const hasText =
    !multi ||
    isStart ||
    isSunday(cellDate) ||
    isSameDay(cellDate, month.monthStart);

  const lines = compact ? Math.max(1, month.lines) : 1;
  const color = (
    badgeVariant === "dot" ? `${event.color}-dot` : event.color
  ) as VariantProps<typeof eventBadgeVariants>["color"];

  // horizontal geometry (px): margin before the chip, its border, its padding
  const mStart = position === "first" || position === "none" ? (compact ? 1 : 4) : 0;
  const mEnd = position === "last" || position === "none" ? (compact ? 1 : 4) : 0;
  const pad = compact ? 3 : 8;
  const borderStart = position === "first" || position === "none" ? 1 : 0;
  const runs = multi && hasText && span > 1;

  const chipClass = cn(
    eventBadgeVariants({ color, multiDayPosition: position }),
    "[&>span]:mr-0",
    compact && "gap-0.5 px-[3px] tracking-[-0.01em]",
    compact && lines > 1 && "h-auto",
    // a segment that writes the name across the next days: above them, unclipped
    runs && "relative z-[11] overflow-visible!",
  );
  const chipStyle: CSSProperties | undefined =
    compact && lines > 1 ? { height: chipHeight(lines) } : undefined;

  const lineBox = compact
    ? lines > 1
      ? // wraps; a long word breaks; clipped after the last line
        "whitespace-normal [overflow-wrap:anywhere] leading-[11px] overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical]"
      : // one line, clipped at the edge with a short fade instead of "…"
        "whitespace-nowrap overflow-hidden text-clip leading-[11px] [mask-image:linear-gradient(to_right,#000_calc(100%-5px),transparent)]"
    : "truncate";
  // "…" only at the end of the last line, when the name really does not fit
  const lineStyle: CSSProperties | undefined =
    compact && lines > 1
      ? { maxHeight: lines * CHIP_LINE_PX, WebkitLineClamp: lines }
      : undefined;

  const bullet =
    badgeVariant === "dot" && hasText ? (
      <EventBullet color={event.color} className={cn("shrink-0", compact && "size-1.5")} />
    ) : null;

  const title = (
    <span
      data-badge-title
      title={event.title}
      className={cn("block min-w-0 flex-1 font-semibold", lineBox)}
      style={lineStyle}
    >
      {event.title}
    </span>
  );

  let content: ReactNode = null;
  if (hasText && runs) {
    // From the text start to the end of the bar in this row. 100% is this
    // chip's padding box; one cell step = 100% + border + margin + the cell's
    // 1px left border. Minus what comes before the text and after it.
    const cellBorder = isSunday(cellDate) ? 0 : 1;
    const step = cellBorder + mStart + borderStart;
    const lead = pad;
    const tail = pad + (runEndsAtEventEnd ? (compact ? 1 : 4) + 1 : 0);
    content = (
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 flex min-w-0 items-center",
          compact ? "gap-0.5" : "gap-1.5",
        )}
        style={{
          left: pad,
          width: `calc(${span} * (100% + ${step}px) - ${step + lead + tail}px)`,
        }}
      >
        {bullet}
        {title}
      </span>
    );
  } else if (hasText) {
    content = (
      <>
        <span className={cn("flex min-w-0 flex-1 items-center", compact ? "gap-0.5" : "gap-1.5")}>
          {bullet}
          {title}
        </span>
        {!compact && !multi && (
          <span className="hidden shrink-0 lg:block">
            {formatTime(start, use24HourFormat)}
          </span>
        )}
      </>
    );
  }

  const marginStyle: CSSProperties = {
    marginInlineStart: mStart,
    marginInlineEnd: mEnd,
    // the chip plus its margins = the cell (a middle segment keeps its +1px over the border)
    ...(position === "middle" ? {} : { width: `calc(100% - ${mStart + mEnd}px)` }),
  };

  if (compact) {
    return (
      <DraggableEvent event={event} passClick>
        <div data-month-badge data-span={runs ? span : undefined} className={chipClass} style={{ ...chipStyle, ...marginStyle }}>
          {content}
        </div>
      </DraggableEvent>
    );
  }

  return (
    <DraggableEvent event={event}>
      <EventDetailsDialog event={event}>
        <button
          type="button"
          data-month-badge
          data-span={runs ? span : undefined}
          className={chipClass}
          style={marginStyle}
        >
          {content}
        </button>
      </EventDetailsDialog>
    </DraggableEvent>
  );
}
