import { format } from "date-fns";
import { CalendarDays, Plus } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/responsive-modal";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { AddEditEventDialog } from "@/features/calendar/dialogs/add-edit-event-dialog";
import { EventDetailsDialog } from "@/features/calendar/dialogs/event-details-dialog";
import { formatTime } from "@/features/calendar/helpers";
import type { IEvent } from "@/features/calendar/interfaces";
import { cn } from "@/lib/utils";

interface EventListDialogProps {
  date: Date;
  events: IEvent[];
  maxVisibleEvents?: number;
  children?: ReactNode;
}

const stripe: Record<string, string> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  red: "bg-red-600",
  yellow: "bg-yellow-500",
  purple: "bg-purple-600",
  orange: "bg-orange-600",
};

export function EventListDialog({
  date,
  events,
  maxVisibleEvents = 3,
  children,
}: EventListDialogProps) {
  const [open, setOpen] = useState(false);
  const hiddenEventsCount = Math.max(events.length - maxVisibleEvents, 0);
  const { use24HourFormat, setView, setSelectedDate } = useCalendar();

  const sorted = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const defaultTrigger = (
    <button type="button" className="cursor-pointer rounded-xl border px-2 py-0.5 hover:bg-accent">
      +{hiddenEventsCount} more
    </button>
  );

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>{children || defaultTrigger}</ModalTrigger>
      <ModalContent className="flex flex-col gap-3 overflow-x-hidden lg:max-w-md">
        <ModalHeader className="pr-10 text-left">
          <ModalTitle className="text-base">{format(date, "EEEE, MMMM d")}</ModalTitle>
          <ModalDescription id="responsive-modal-description">
            {events.length === 0
              ? "No events"
              : `${events.length} ${events.length === 1 ? "event" : "events"}`}
          </ModalDescription>
        </ModalHeader>

        <div className="-mx-1 flex max-h-[55dvh] flex-col gap-1.5 overflow-y-auto px-1">
          {sorted.length > 0 ? (
            sorted.map((event) => (
              <EventDetailsDialog event={event} key={event.id}>
                <button
                  type="button"
                  data-list-event={event.id}
                  className="flex min-h-12 w-full min-w-0 items-stretch gap-3 overflow-hidden rounded-lg border p-2 text-left hover:bg-muted"
                >
                  <span className={cn("w-1 shrink-0 rounded-full", stripe[event.color])} />
                  <span className="flex min-w-0 flex-1 flex-col justify-center">
                    <span className="truncate text-sm font-medium" title={event.title}>{event.title}</span>
                    <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                      <span className="shrink-0 tabular-nums">
                        {formatTime(event.startDate, use24HourFormat)} –{" "}
                        {formatTime(event.endDate, use24HourFormat)}
                      </span>
                      <span aria-hidden className="shrink-0">·</span>
                      <span data-list-subject className="min-w-0 truncate" title={event.subject.name}>{event.subject.name}</span>
                    </span>
                  </span>
                </button>
              </EventDetailsDialog>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing planned for this day.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-11"
            onClick={() => {
              setSelectedDate(date);
              setView("day");
              setOpen(false);
            }}
          >
            <CalendarDays className="size-4" />
            Open day
          </Button>
          <AddEditEventDialog startDate={date}>
            <Button className="h-11">
              <Plus className="size-4" />
              Add event
            </Button>
          </AddEditEventDialog>
        </div>
      </ModalContent>
    </Modal>
  );
}
