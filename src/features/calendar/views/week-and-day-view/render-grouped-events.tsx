import { HOUR_HEIGHT_PX, type PositionedEvent } from "@/features/calendar/helpers";
import { EventBlock } from "@/features/calendar/views/week-and-day-view/event-block";

interface RenderGroupedEventsProps {
  events: PositionedEvent[];
}

/** Gap between boxes and to the column edges, in px. */
const GAP = 2;

/**
 * Places each event box inside its day column. Position and size come from
 * layoutDayEvents (column packing), so a box always sits fully inside the
 * column: left + width never pass 100%.
 */
export function RenderGroupedEvents({ events }: RenderGroupedEventsProps) {
  return events.map((p) => {
    const top = (p.top / 60) * HOUR_HEIGHT_PX;
    const height = Math.max(16, (p.height / 60) * HOUR_HEIGHT_PX - GAP);
    const left = (p.col / p.cols) * 100;
    const width = (p.span / p.cols) * 100;
    return (
      <div
        key={p.event.id}
        data-event-box
        data-event-id={p.event.id}
        className="absolute z-[1] min-w-0"
        style={{
          top: top + 1,
          height,
          left: `calc(${left}% + ${GAP}px)`,
          width: `calc(${width}% - ${GAP * 2}px)`,
          // never wider than the part of the grid on screen, so a box always
          // shows all four sides once it is scrolled into view
          maxWidth: `calc(var(--tg-vis, 100vw) - ${GAP * 2}px)`,
        }}
      >
        <EventBlock event={p.event} heightPx={height} duration={p.duration} />
      </div>
    );
  });
}
