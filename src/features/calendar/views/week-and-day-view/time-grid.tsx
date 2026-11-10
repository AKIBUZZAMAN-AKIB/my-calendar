"use client";

import { format, isSameDay, parseISO } from "date-fns";
import {
  type CSSProperties,
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { useDragDrop } from "@/features/calendar/contexts/dnd-context";
import { AddEditEventDialog } from "@/features/calendar/dialogs/add-edit-event-dialog";
import { HOUR_HEIGHT_PX, layoutDayEvents, type PositionedEvent } from "@/features/calendar/helpers";
import { useMediaQuery } from "@/features/calendar/hooks";
import type { IEvent } from "@/features/calendar/interfaces";
import { CalendarTimeline } from "@/features/calendar/views/week-and-day-view/calendar-time-line";
import { RenderGroupedEvents } from "@/features/calendar/views/week-and-day-view/render-grouped-events";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const EDGE_PX = 48;
const HIGHLIGHT = "bg-primary/10";

export interface TimeGridColumn {
  day: Date;
  events: PositionedEvent[];
  minWidth: number;
}

/** Columns for the given days, each with its grouped events and a minimum width. */
export function useTimeGridColumns(
  days: Date[],
  singleDayEvents: IEvent[],
  { baseMin, perGroupMin }: { baseMin: number; perGroupMin: number },
): TimeGridColumn[] {
  return useMemo(() => {
    const parsed = singleDayEvents.map((e) => ({
      e,
      s: parseISO(e.startDate),
      end: parseISO(e.endDate),
    }));
    return days.map((day) => {
      const dayEvents = parsed
        .filter(({ s, end }) => isSameDay(s, day) || isSameDay(end, day))
        .map(({ e }) => e);
      const events = layoutDayEvents(dayEvents, day);
      // overlapping events sit side by side: give each column room to read
      const maxCols = events.reduce((m, p) => Math.max(m, p.cols), 1);
      const minWidth = Math.max(baseMin, maxCols > 1 ? maxCols * perGroupMin : 0);
      return { day, events, minWidth };
    });
  }, [days, singleDayEvents, baseMin, perGroupMin]);
}

interface TimeGridProps {
  columns: TimeGridColumn[];
  /** Rows above the hour grid that scroll sideways with it (all-day events, day names). */
  renderHeader?: (gridStyle: CSSProperties, gutter: ReactNode) => ReactNode;
  /** Scroll this day's column into view when the grid opens. */
  focusDay?: Date;
}

/**
 * The hour grid of the week and day views.
 *
 * One native scroll box in both directions: the header rows stick to the top,
 * the hour labels stick to the left, so a wide week (or a day with many
 * overlapping events) scrolls sideways with a finger swipe and stays aligned.
 *
 * Empty slots are plain divs. A single click / drag handler on the grid finds
 * the slot under the pointer, and one shared dialog adds the event, so the
 * view mounts hundreds of divs instead of hundreds of dialogs.
 */
function TimeGridImpl({ columns, renderHeader, focusDay }: TimeGridProps) {
  const { use24HourFormat, startOfDayHour } = useCalendar();
  const { isDragging, handleEventDrop } = useDragDrop();
  const isSm = useMediaQuery("(min-width: 640px)");
  const gutterPx = isSm ? 72 : 44;
  const scrollRef = useRef<HTMLDivElement>(null);
  const overRef = useRef<HTMLElement | null>(null);
  const [slot, setSlot] = useState<{ date: Date; hour: number; minute: number } | null>(null);

  const gridStyle = useMemo<CSSProperties>(
    () => ({
      gridTemplateColumns: columns
        .map((c) => (c.minWidth ? `minmax(${c.minWidth}px, 1fr)` : "minmax(0, 1fr)"))
        .join(" "),
    }),
    [columns],
  );
  const contentMinWidth = gutterPx + columns.reduce((sum, c) => sum + c.minWidth, 0);

  // the visible width of the grid, as --tg-vw, so rows that must stay on
  // screen (the all-day row of the day view) can size to it while the grid
  // scrolls sideways
  useLayoutEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    const set = () => {
      const gutter = box.querySelector<HTMLElement>("[data-time-gutter]")?.offsetWidth ?? 0;
      box.style.setProperty("--tg-vw", `${box.clientWidth}px`);
      box.style.setProperty("--tg-vis", `${box.clientWidth - gutter}px`);
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  // open at the configured start of the day
  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = startOfDayHour * HOUR_HEIGHT_PX;
  }, [startOfDayHour]);

  // bring the selected day into view when the grid is wider than the screen
  const focusKey = focusDay ? focusDay.toDateString() : "";
  const columnsKey = columns.map((c) => c.day.toDateString()).join("|");
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed by day strings
  useLayoutEffect(() => {
    const box = scrollRef.current;
    if (!box || !focusDay || box.scrollWidth <= box.clientWidth) return;
    const cell = box.querySelector<HTMLElement>(`[data-col-day="${focusDay.toDateString()}"]`);
    if (!cell) return;
    const left = cell.offsetLeft - gutterPx;
    const right = cell.offsetLeft + cell.offsetWidth;
    if (left < box.scrollLeft || right > box.scrollLeft + box.clientWidth) {
      box.scrollLeft = Math.max(0, left);
    }
  }, [focusKey, columnsKey, gutterPx]);

  // mouse drag near an edge scrolls the grid (both directions)
  useEffect(() => {
    if (!isDragging) return;
    const onDragOver = (e: DragEvent) => {
      const box = scrollRef.current;
      if (!box) return;
      const r = box.getBoundingClientRect();
      if (e.clientY < r.top + EDGE_PX) box.scrollTop -= 15;
      else if (e.clientY > r.bottom - EDGE_PX) box.scrollTop += 15;
      if (box.scrollWidth > box.clientWidth) {
        if (e.clientX < r.left + gutterPx + EDGE_PX) box.scrollLeft -= 15;
        else if (e.clientX > r.right - EDGE_PX) box.scrollLeft += 15;
      }
    };
    document.addEventListener("dragover", onDragOver);
    return () => document.removeEventListener("dragover", onDragOver);
  }, [isDragging, gutterPx]);

  const slotFrom = (target: EventTarget | null) =>
    (target as HTMLElement | null)?.closest?.<HTMLElement>("[data-drop-hour]") ?? null;

  const setOver = useCallback((node: HTMLElement | null) => {
    if (overRef.current === node) return;
    overRef.current?.classList.remove(HIGHLIGHT);
    overRef.current = node;
    node?.classList.add(HIGHLIGHT);
  }, []);

  const onGridClick = (e: React.MouseEvent) => {
    const el = slotFrom(e.target);
    if (!el || !e.currentTarget.contains(el)) return;
    const { dropDate, dropHour, dropMinute } = el.dataset;
    setSlot({ date: new Date(dropDate as string), hour: Number(dropHour), minute: Number(dropMinute) });
  };

  const onDragOver = (e: React.DragEvent) => {
    const el = slotFrom(e.target);
    if (!el) return;
    e.preventDefault();
    setOver(el);
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null);
  };

  const onDrop = (e: React.DragEvent) => {
    const el = slotFrom(e.target);
    setOver(null);
    if (!el) return;
    e.preventDefault();
    const { dropDate, dropHour, dropMinute } = el.dataset;
    handleEventDrop(new Date(dropDate as string), Number(dropHour), Number(dropMinute));
  };

  const hourLabel = (hour: number) =>
    format(new Date().setHours(hour, 0, 0, 0), use24HourFormat ? "HH:00" : "h a");

  const gutter = (
    <div className="sticky left-0 z-20 w-11 shrink-0 self-stretch border-r bg-background sm:w-18" />
  );

  return (
    <>
      <div
        ref={scrollRef}
        data-time-grid-scroll
        className="min-h-0 flex-1 scroll-pl-11 overflow-auto overscroll-contain [scrollbar-width:thin] sm:scroll-pl-18"
      >
        <div className="relative w-full" style={{ minWidth: contentMinWidth }}>
          {renderHeader && (
            <div data-time-grid-header className="sticky top-0 z-30 bg-background">
              {renderHeader(gridStyle, gutter)}
            </div>
          )}

          <div className="flex">
            {/* Hour labels, stuck to the left edge */}
            <div data-time-gutter className="sticky left-0 z-20 w-11 shrink-0 border-r bg-background sm:w-18">
              {HOURS.map((hour) => (
                <div key={hour} className="relative" style={{ height: HOUR_HEIGHT_PX }}>
                  {hour !== 0 && (
                    <span className="absolute -top-2 right-1 whitespace-nowrap text-[10px] leading-4 text-t-quaternary sm:right-2 sm:text-xs">
                      {hourLabel(hour)}
                    </span>
                  )}
                </div>
              ))}
              <CalendarTimeline part="label" />
            </div>

            {/* Day columns */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: slots are reachable through the Add event button */}
            <div
              data-time-grid
              className="relative grid min-w-0 flex-1 divide-x"
              style={gridStyle}
              onClick={onGridClick}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              {columns.map(({ day, events }) => {
                const iso = day.toISOString();
                return (
                  <div key={iso} data-col-day={day.toDateString()} className="relative min-w-0 overflow-x-clip">
                    {HOURS.map((hour) => (
                      <div key={hour} className="relative" style={{ height: HOUR_HEIGHT_PX }}>
                        {hour !== 0 && (
                          <div className="pointer-events-none absolute inset-x-0 top-0 border-b" />
                        )}
                        <div
                          role="gridcell"
                          aria-label={`Add event ${format(day, "EEE d")} ${hourLabel(hour)}`}
                          data-drop-date={iso}
                          data-drop-hour={hour}
                          data-drop-minute={0}
                          className={cn(
                            "absolute inset-x-0 top-0 h-1/2 cursor-pointer transition-colors hover:bg-secondary",
                            isDragging && "drop-target",
                          )}
                        />
                        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-b-tertiary" />
                        <div
                          role="gridcell"
                          aria-label={`Add event ${format(day, "EEE d")} ${hour}:30`}
                          data-drop-date={iso}
                          data-drop-hour={hour}
                          data-drop-minute={30}
                          className={cn(
                            "absolute inset-x-0 bottom-0 h-1/2 cursor-pointer transition-colors hover:bg-secondary",
                            isDragging && "drop-target",
                          )}
                        />
                      </div>
                    ))}
                    <RenderGroupedEvents events={events} />
                  </div>
                );
              })}
              <CalendarTimeline part="line" />
            </div>
          </div>
          {/* room below midnight on phones, so the floating + button never covers the last events */}
          <div aria-hidden className="h-20 sm:hidden" />
        </div>
      </div>

      <AddEditEventDialog
        open={!!slot}
        onOpenChange={(open) => !open && setSlot(null)}
        startDate={slot?.date}
        startTime={slot ? { hour: slot.hour, minute: slot.minute } : undefined}
      />
    </>
  );
}

export const TimeGrid = memo(TimeGridImpl);
