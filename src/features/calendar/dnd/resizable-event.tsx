"use client";

import {
  addMinutes,
  differenceInMinutes,
  format,
  isAfter,
  isBefore,
  parseISO,
} from "date-fns";
import { Resizable, type ResizeCallback } from "re-resizable";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";

import type { IEvent } from "@/features/calendar/interfaces";

interface ResizableEventBlockProps {
  event: IEvent;
  children: React.ReactNode;
  className?: string;
}

const PIXELS_PER_HOUR = 96;
const MINUTES_PER_PIXEL = 60 / PIXELS_PER_HOUR;
const MIN_DURATION = 15; // in minutes

export function ResizableEvent({
  event,
  children,
  className,
}: ResizableEventBlockProps) {
  const { updateEvent, use24HourFormat } = useCalendar();

  const [isResizing, setIsResizing] = useState(false);
  const [resizePreview, setResizePreview] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const start = useMemo(() => parseISO(event.startDate), [event.startDate]);
  const end = useMemo(() => parseISO(event.endDate), [event.endDate]);
  // where the event was when the resize began; every step is measured from here
  const origin = useRef<{ start: Date; end: Date } | null>(null);

  /** New times from how far the edge moved (re-resizable's delta since the start), in 5-minute steps. */
  const compute = useCallback(
    (direction: string, deltaPx: number) => {
      const o = origin.current ?? { start, end };
      const minutes = Math.round((deltaPx * MINUTES_PER_PIXEL) / 5) * 5;
      const dayStart = new Date(o.start);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(o.start);
      dayEnd.setHours(23, 59, 0, 0);
      let newStart = o.start;
      let newEnd = o.end;
      if (direction.includes("top")) {
        newStart = addMinutes(o.start, -minutes);
        if (differenceInMinutes(newEnd, newStart) < MIN_DURATION) newStart = addMinutes(newEnd, -MIN_DURATION);
        if (isBefore(newStart, dayStart)) newStart = dayStart;
      } else {
        newEnd = addMinutes(o.end, minutes);
        if (differenceInMinutes(newEnd, newStart) < MIN_DURATION) newEnd = addMinutes(newStart, MIN_DURATION);
        if (isAfter(newEnd, dayEnd)) newEnd = dayEnd;
      }
      return { newStart, newEnd };
    },
    [start, end],
  );

  const handleResizeStart = useCallback(() => {
    origin.current = { start, end };
    setIsResizing(true);
  }, [start, end]);

  const handleResize: ResizeCallback = useCallback(
    (_, direction, _ref, delta) => {
      const { newStart, newEnd } = compute(direction, delta.height);
      setResizePreview({
        start: format(newStart, use24HourFormat ? "HH:mm" : "h:mm a"),
        end: format(newEnd, use24HourFormat ? "HH:mm" : "h:mm a"),
      });
    },
    [compute, use24HourFormat],
  );

  // the event is saved once, when the edge is let go
  const handleResizeStop: ResizeCallback = useCallback(
    (_, direction, _ref, delta) => {
      const { newStart, newEnd } = compute(direction, delta.height);
      origin.current = null;
      setIsResizing(false);
      setResizePreview(null);
      if (newStart.getTime() !== start.getTime() || newEnd.getTime() !== end.getTime()) {
        updateEvent({ ...event, startDate: newStart.toISOString(), endDate: newEnd.toISOString() });
      }
    },
    [compute, start, end, event, updateEvent],
  );

  // Resize by the edge only with a mouse or pen. On a touch screen an 8px edge
  // strip would catch swipes meant to scroll the grid (and could stretch the
  // event by accident); there the time is changed in Edit instead.
  const [finePointer, setFinePointer] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const set = () => setFinePointer(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  const resizeConfig = useMemo(
    () => ({
      // fill the slot the day layout gives the event; the layout keeps it inside its column
      size: { width: "100%", height: "100%" },
      minHeight: 15,
      maxHeight: 1440,
      enable: {
        top: finePointer,
        bottom: finePointer,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      },
      handleStyles: {
        top: {
          cursor: "ns-resize",
          height: "8px",
          top: "-4px",
          backgroundColor: "transparent",
        },
        bottom: {
          cursor: "ns-resize",
          height: "8px",
          bottom: "-4px",
          backgroundColor: "transparent",
        },
      },
      handleClasses: {
        top: "transition-colors rounded-sm",
        bottom: "transition-colors rounded-sm",
      },
      onResizeStart: handleResizeStart,
      onResize: handleResize,
      onResizeStop: handleResizeStop,
      className: cn(
        "transition-shadow duration-200",
        isResizing && "z-50 shadow-lg",
      ),
    }),
    [handleResizeStart, handleResize, handleResizeStop, isResizing, finePointer],
  );

  return (
    <div
      className={cn("relative group", className)}
    >
      <Resizable {...resizeConfig}>{children}</Resizable>

      {isResizing && resizePreview && (
        <div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap"
        >
          {resizePreview.start} - {resizePreview.end}
        </div>
      )}
    </div>
  );
}
