"use client";

import { motion } from "framer-motion";
import type React from "react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useDragDrop } from "@/features/calendar/contexts/dnd-context";
import type { IEvent } from "@/features/calendar/interfaces";

interface DraggableEventProps {
  event: IEvent;
  children: ReactNode;
  className?: string;
  /** Let clicks bubble to the parent (used on phones, where a tap opens the day sheet). */
  passClick?: boolean;
}

const LONG_PRESS_MS = 350;
const MOVE_TOLERANCE_PX = 8;
const AUTO_SCROLL_EDGE_PX = 56;
const HIGHLIGHT = ["bg-primary/15", "ring-2", "ring-primary/60", "ring-inset"];

function findDropTarget(x: number, y: number): HTMLElement | undefined {
  return document
    .elementsFromPoint(x, y)
    .find((n) => (n as HTMLElement).dataset?.dropDate) as
    | HTMLElement
    | undefined;
}

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    if (
      /(auto|scroll)/.test(style.overflowY) &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Draggable wrapper.
 * - Mouse / pen: native HTML5 drag & drop.
 * - Touch: long-press (~350ms) to pick the event up, then move the finger
 *   and lift it over a day / time slot. The list scrolls when the finger is
 *   near the top or bottom edge.
 */
export function DraggableEvent({
  event,
  children,
  className,
  passClick = false,
}: DraggableEventProps) {
  const { startDrag, endDrag, isDragging, draggedEvent, handleEventDrop } =
    useDragDrop();
  const ref = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = useState(false);

  const latest = useRef({ startDrag, endDrag, handleEventDrop, event });
  latest.current = { startDrag, endDrag, handleEventDrop, event };

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: number | undefined;
    let active = false;
    let ghost: HTMLElement | null = null;
    let over: HTMLElement | null = null;
    let scroller: HTMLElement | null = null;
    let raf = 0;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let offsetX = 0;
    let offsetY = 0;

    const setOver = (node: HTMLElement | null | undefined) => {
      if (over === node) return;
      over?.classList.remove(...HIGHLIGHT);
      over = node ?? null;
      over?.classList.add(...HIGHLIGHT);
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      timer = undefined;
      cancelAnimationFrame(raf);
      ghost?.remove();
      ghost = null;
      setOver(null);
      el.style.opacity = "";
      document.body.classList.remove("touch-dragging");
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onCancel);
    };

    const autoScroll = () => {
      if (!active) return;
      if (scroller) {
        const r = scroller.getBoundingClientRect();
        if (lastY < r.top + AUTO_SCROLL_EDGE_PX) scroller.scrollTop -= 8;
        else if (lastY > r.bottom - AUTO_SCROLL_EDGE_PX)
          scroller.scrollTop += 8;
        setOver(findDropTarget(lastX, lastY));
      }
      raf = requestAnimationFrame(autoScroll);
    };

    const activate = () => {
      timer = undefined;
      active = true;
      navigator.vibrate?.(15);
      const r = el.getBoundingClientRect();
      offsetX = startX - r.left;
      offsetY = startY - r.top;
      ghost = el.cloneNode(true) as HTMLElement;
      Object.assign(ghost.style, {
        position: "fixed",
        left: `${r.left}px`,
        top: `${r.top}px`,
        width: `${Math.max(r.width, 72)}px`,
        height: `${r.height}px`,
        margin: "0",
        pointerEvents: "none",
        zIndex: "9999",
        opacity: "0.95",
        transform: "scale(1.06)",
        boxShadow: "0 10px 28px rgba(0,0,0,.28)",
        borderRadius: "8px",
        overflow: "hidden",
      });
      ghost.setAttribute("data-drag-ghost", "true");
      document.body.appendChild(ghost);
      el.style.opacity = "0.35";
      document.body.classList.add("touch-dragging");
      scroller = findScrollParent(el);
      latest.current.startDrag(latest.current.event);
      setOver(findDropTarget(lastX, lastY));
      raf = requestAnimationFrame(autoScroll);
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startX = lastX = t.clientX;
      startY = lastY = t.clientY;
      active = false;
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onEnd, { passive: false });
      document.addEventListener("touchcancel", onCancel);
      timer = window.setTimeout(activate, LONG_PRESS_MS);
    };

    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      lastX = t.clientX;
      lastY = t.clientY;
      if (!active) {
        if (Math.hypot(lastX - startX, lastY - startY) > MOVE_TOLERANCE_PX) {
          cleanup(); // the user is scrolling, not dragging
        }
        return;
      }
      if (e.cancelable) e.preventDefault();
      if (ghost) {
        ghost.style.left = `${lastX - offsetX}px`;
        ghost.style.top = `${lastY - offsetY}px`;
      }
      setOver(findDropTarget(lastX, lastY));
    };

    const onEnd = (e: TouchEvent) => {
      if (active) {
        if (e.cancelable) e.preventDefault(); // no click → no dialog
        const target = findDropTarget(lastX, lastY);
        if (target?.dataset.dropDate) {
          const { dropDate, dropHour, dropMinute } = target.dataset;
          latest.current.handleEventDrop(
            new Date(dropDate),
            dropHour !== undefined ? Number(dropHour) : undefined,
            dropMinute !== undefined ? Number(dropMinute) : undefined,
            latest.current.event,
          );
        } else {
          latest.current.endDrag();
        }
      }
      active = false;
      cleanup();
    };

    const onCancel = () => {
      if (active) latest.current.endDrag();
      active = false;
      cleanup();
    };

    const onContextMenu = (e: Event) => {
      if (active || timer !== undefined) e.preventDefault();
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("contextmenu", onContextMenu);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("contextmenu", onContextMenu);
      cleanup();
    };
  }, []);

  const isCurrentlyDragged = isDragging && draggedEvent?.id === event.id;

  return (
    <motion.div
      ref={ref}
      data-event-id={event.id}
      className={`${className || ""} touch-callout-none select-none ${isCurrentlyDragged ? "opacity-50 cursor-grabbing" : "cursor-grab"}`}
      draggable={!isTouch}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (!passClick) e.stopPropagation();
      }}
      onDragStart={(e) => {
        (e as unknown as DragEvent).dataTransfer?.setData(
          "text/plain",
          event.id.toString(),
        );
        startDrag(event);
      }}
      onDragEnd={() => {
        endDrag();
      }}
    >
      {children}
    </motion.div>
  );
}
