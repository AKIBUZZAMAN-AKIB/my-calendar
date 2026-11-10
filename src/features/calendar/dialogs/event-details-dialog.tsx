"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Tag, Text } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
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
import { formatTime } from "@/features/calendar/helpers";
import type { IEvent } from "@/features/calendar/interfaces";
import { SubjectIcon } from "@/features/calendar/subjects/subject-icon";

const DOT: Record<string, string> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  red: "bg-red-600",
  yellow: "bg-yellow-500",
  purple: "bg-purple-600",
  orange: "bg-orange-600",
};

interface IProps {
  event: IEvent;
  children: ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const { use24HourFormat, removeEvent } = useCalendar();
  const [open, setOpen] = useState(false);
  // Delete asks for a second tap, since deleting is permanent on this device.
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);
  useEffect(() => {
    if (!open) setConfirmDelete(false);
  }, [open]);

  const deleteEvent = (eventId: number) => {
    try {
      removeEvent(eventId);
      setOpen(false);
      toast.success("Event deleted successfully.");
    } catch {
      toast.error("Error deleting event.");
    }
  };

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent className="flex max-h-[92dvh] flex-col gap-3 overflow-hidden lg:max-w-md" data-event-details>
        <ModalHeader className="pr-10 text-left">
          <ModalTitle className="flex items-center gap-2 text-lg">
            <span className={`size-3 shrink-0 rounded-full ${DOT[event.color] ?? "bg-primary"}`} />
            <span data-detail-title className="line-clamp-4 min-w-0 [overflow-wrap:anywhere]" title={event.title}>{event.title}</span>
          </ModalTitle>
          <ModalDescription id="responsive-modal-description" className="sr-only">
            Event details
          </ModalDescription>
        </ModalHeader>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1">
          <div className="space-y-4 py-1">
            <div className="flex items-start gap-2">
              <Tag className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Subject</p>
                <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <SubjectIcon subject={event.subject} className="size-5 text-[10px]" />
                  <span data-detail-subject className="min-w-0 truncate" title={event.subject.name}>
                    {event.subject.name}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "EEEE dd MMMM yyyy")}
                  <span className="mx-1">at</span>
                  {formatTime(parseISO(event.startDate), use24HourFormat)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">End Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(endDate, "EEEE dd MMMM yyyy")}
                  <span className="mx-1">at</span>
                  {formatTime(parseISO(event.endDate), use24HourFormat)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Description</p>
                <p className="whitespace-pre-line text-sm text-muted-foreground [overflow-wrap:anywhere]">
                  {event.description || "No description"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:justify-end">
          <AddEditEventDialog event={event}>
            <Button variant="outline" className="h-11 sm:h-9">Edit</Button>
          </AddEditEventDialog>
          <Button
            variant="destructive"
            className="h-11 sm:h-9"
            data-detail-delete
            onClick={() => {
              if (confirmDelete) deleteEvent(event.id);
              else setConfirmDelete(true);
            }}
          >
            {confirmDelete ? "Tap again to delete" : "Delete"}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
