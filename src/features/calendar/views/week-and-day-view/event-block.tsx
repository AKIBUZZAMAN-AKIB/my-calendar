import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { parseISO } from "date-fns";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { EventDetailsDialog } from "@/features/calendar/dialogs/event-details-dialog";
import { DraggableEvent } from "@/features/calendar/dnd/draggable-event";
import { ResizableEvent } from "@/features/calendar/dnd/resizable-event";
import { formatTime } from "@/features/calendar/helpers";
import type { IEvent } from "@/features/calendar/interfaces";

const calendarWeekEventCardVariants = cva(
  "flex select-none flex-col items-stretch whitespace-nowrap rounded-md border text-xs focus-visible:outline-offset-2",
  {
    variants: {
      color: {
        // Colored variants
        blue: "border-blue-200 bg-blue-100/50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-950",
        green:
          "border-green-200 bg-green-100/50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/50 dark:text-green-300 dark:hover:bg-green-950",
        red: "border-red-200 bg-red-100/50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950",
        yellow:
          "border-yellow-200 bg-yellow-100/50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300 dark:hover:bg-yellow-950",
        purple:
          "border-purple-200 bg-purple-100/50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:bg-purple-950",
        orange:
          "border-orange-200 bg-orange-100/50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300 dark:hover:bg-orange-950",

        // Dot variants
        "blue-dot":
          "border-border bg-card text-foreground hover:bg-accent [&_svg]:fill-blue-600 dark:[&_svg]:fill-blue-500",
        "green-dot":
          "border-border bg-card text-foreground hover:bg-accent [&_svg]:fill-green-600 dark:[&_svg]:fill-green-500",
        "red-dot":
          "border-border bg-card text-foreground hover:bg-accent [&_svg]:fill-red-600 dark:[&_svg]:fill-red-500",
        "orange-dot":
          "border-border bg-card text-foreground hover:bg-accent [&_svg]:fill-orange-600 dark:[&_svg]:fill-orange-500",
        "purple-dot":
          "border-border bg-card text-foreground hover:bg-accent [&_svg]:fill-purple-600 dark:[&_svg]:fill-purple-500",
        "yellow-dot":
          "border-border bg-card text-foreground hover:bg-accent [&_svg]:fill-yellow-600 dark:[&_svg]:fill-yellow-500",
      },
    },
    defaultVariants: {
      color: "blue-dot",
    },
  },
);

interface IProps
  extends
    HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof calendarWeekEventCardVariants>, "color"> {
  event: IEvent;
  /** Box height in px, from the day layout. */
  heightPx: number;
  /** Real length of the event on this day, in minutes. */
  duration: number;
}

const LINE_PX = 16; // text-xs leading-4
const PAD_Y_PX = 8 + 2; // py-1 + border

/**
 * One event in the hour grid. The box always fills the slot the layout gave
 * it (never wider), and the text adapts to the room inside:
 * - short boxes: one line, title first, then the time if it still fits;
 * - taller boxes: the title wraps over as many lines as fit and ends in "…",
 *   with the time on its own line below.
 * Long words without spaces break anywhere, so nothing pushes the box wider.
 */
export function EventBlock({ event, className, heightPx }: IProps) {
  const { badgeVariant, use24HourFormat } = useCalendar();

  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);

  const color = (
    badgeVariant === "dot" ? `${event.color}-dot` : event.color
  ) as VariantProps<typeof calendarWeekEventCardVariants>["color"];

  const compact = heightPx < PAD_Y_PX + LINE_PX * 2;
  const titleLines = compact
    ? 1
    : Math.max(1, Math.floor((heightPx - PAD_Y_PX - LINE_PX) / LINE_PX));
  const startText = formatTime(start, use24HourFormat);
  const rangeText = `${startText} - ${formatTime(end, use24HourFormat)}`;

  const dot = badgeVariant === "dot" && (
    <svg
      width="8"
      height="8"
      viewBox="0 0 8 8"
      xmlns="http://www.w3.org/2000/svg"
      className="mr-1 inline-block shrink-0 align-[0.5px]"
      aria-hidden="true"
    >
      <circle cx="4" cy="4" r="4" />
    </svg>
  );

  return (
    <ResizableEvent event={event} className="h-full w-full">
      <DraggableEvent event={event} className="h-full w-full">
        <EventDetailsDialog event={event}>
          <button
            type="button"
            data-event-block
            data-compact={compact ? "" : undefined}
            aria-label={`${event.title}, ${rangeText}`}
            className={cn(
              calendarWeekEventCardVariants({ color, className }),
              "@container h-full w-full min-w-0 max-w-full overflow-hidden text-left",
              compact ? "justify-center px-1.5 py-0" : "justify-start px-1.5 py-1",
            )}
          >
            {compact ? (
              <p data-event-title className="w-full min-w-0 truncate leading-4">
                {dot}
                <span className="font-semibold">{event.title}</span>
                <span className="hidden @[56px]:inline">, {startText}</span>
              </p>
            ) : (
              <>
                <p
                  data-event-title
                  className="w-full min-w-0 shrink-0 overflow-hidden font-semibold leading-4 whitespace-normal [overflow-wrap:anywhere]"
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: titleLines,
                    maxHeight: titleLines * LINE_PX,
                  }}
                >
                  {dot}
                  {event.title}
                </p>
                <p data-event-time className="hidden w-full min-w-0 shrink-0 truncate leading-4 @[40px]:block">
                  <span className="@[92px]:hidden">{startText}</span>
                  <span className="hidden @[92px]:inline">{rangeText}</span>
                </p>
              </>
            )}
          </button>
        </EventDetailsDialog>
      </DraggableEvent>
    </ResizableEvent>
  );
}
