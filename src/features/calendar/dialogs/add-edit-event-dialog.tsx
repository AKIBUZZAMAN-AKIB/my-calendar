import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, set } from "date-fns";
import { type ReactNode, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/responsive-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { COLORS } from "@/features/calendar/constants";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { useDisclosure } from "@/features/calendar/hooks";
import type { IEvent } from "@/features/calendar/interfaces";
import { eventSchema, type TEventFormData } from "@/features/calendar/schemas";
import { SubjectPicker } from "@/features/calendar/subjects/subject-picker";

interface IProps {
  children: ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
  event?: IEvent;
}

export function AddEditEventDialog({
  children,
  startDate,
  startTime,
  event,
}: IProps) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const { addEvent, updateEvent, subjects, selectedSubjectId } = useCalendar();
  // New events start in the subject the filter shows, else the first subject.
  const defaultSubjectId =
    event?.subject?.id ??
    (selectedSubjectId !== "all" ? selectedSubjectId : subjects[0]?.id) ??
    "";
  const isEditing = !!event;
  // The event's subject was deleted: it keeps the name until another one is picked.
  const deletedSubject =
    event && !subjects.some((t) => t.id === event.subject.id) ? event.subject : null;

  const initialDates = useMemo(() => {
    if (!isEditing && !event) {
      // "now", rounded up to the next 5 minutes so it matches the time picker
      const now = new Date();
      const rounded = set(now, {
        minutes: Math.ceil((now.getMinutes() + 1) / 5) * 5,
        seconds: 0,
        milliseconds: 0,
      });
      if (!startDate) {
        return { startDate: rounded, endDate: addMinutes(rounded, 30) };
      }
      // a day picked without a time (month view) starts at the current time of day, not midnight
      const start = startTime
        ? set(new Date(startDate), {
            hours: startTime.hour,
            minutes: startTime.minute,
            seconds: 0,
            milliseconds: 0,
          })
        : set(new Date(startDate), {
            hours: rounded.getHours(),
            minutes: rounded.getMinutes(),
            seconds: 0,
            milliseconds: 0,
          });
      const end = addMinutes(start, 30);
      return { startDate: start, endDate: end };
    }

    return {
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
    };
  }, [startDate, startTime, event, isEditing]);

  const form = useForm<TEventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title ?? "",
      description: event?.description ?? "",
      startDate: initialDates.startDate,
      endDate: initialDates.endDate,
      color: event?.color ?? "blue",
      subjectId: defaultSubjectId,
    },
  });

  useEffect(() => {
    form.reset({
      title: event?.title ?? "",
      description: event?.description ?? "",
      startDate: initialDates.startDate,
      endDate: initialDates.endDate,
      color: event?.color ?? "blue",
      subjectId: defaultSubjectId,
    });
    // defaultSubjectId is read on open only, so a new subject does not wipe the form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, initialDates, form, isOpen]);

  const onSubmit = (values: TEventFormData) => {
    try {
      const subject =
        subjects.find((t) => t.id === values.subjectId) ??
        (isEditing ? event.subject : subjects[0]);
      const formattedEvent: IEvent = {
        title: values.title.trim(),
        description: values.description ?? "",
        // saved as an exact instant; whole minutes, so nothing drifts by seconds
        startDate: set(values.startDate, { seconds: 0, milliseconds: 0 }).toISOString(),
        endDate: set(values.endDate, { seconds: 0, milliseconds: 0 }).toISOString(),
        id: isEditing ? event.id : Date.now(),
        subject: { id: subject.id, name: subject.name, custom: subject.custom },
        color: values.color,
      };

      if (isEditing) {
        updateEvent(formattedEvent);
        toast.success("Event updated successfully");
      } else {
        addEvent(formattedEvent);
        toast.success("Event created successfully");
      }

      onClose();
      form.reset();
    } catch (error) {
      console.error(`Error ${isEditing ? "editing" : "adding"} event:`, error);
      toast.error(`Failed to ${isEditing ? "edit" : "add"} event`);
    }
  };

  return (
    // Modal, so the sheet owns touch scrolling. As a non-modal sheet opened from
    // another sheet, the sheet underneath blocked every scroll inside it.
    <Modal open={isOpen} onOpenChange={onToggle}>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent
        data-event-form-sheet
        className="flex max-h-[92dvh] flex-col gap-3 overflow-hidden lg:max-h-[90dvh] lg:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ModalHeader className="shrink-0 pr-10 text-left">
          <ModalTitle>{isEditing ? "Edit Event" : "Add New Event"}</ModalTitle>
          <ModalDescription>
            {isEditing
              ? "Modify your existing event."
              : "Create a new event for your calendar."}
          </ModalDescription>
        </ModalHeader>

        <Form {...form}>
          <form
            id="event-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="-mx-4 flex min-h-0 flex-1 touch-pan-y flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-2 sm:-mx-6 sm:px-6 lg:py-4 [-webkit-overflow-scrolling:touch]"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel htmlFor="title" className="required">
                    Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="title"
                      placeholder="Enter a title"
                      maxLength={300}
                      autoComplete="off"
                      {...field}
                      className={fieldState.invalid ? "border-red-500" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field, fieldState }) => (
                <FormItem className="min-w-0" data-form-subjects>
                  <FormLabel className="required">Subject</FormLabel>
                  <SubjectPicker
                    value={field.value}
                    onChange={(id) => field.onChange(id === "all" ? "" : id)}
                    selectOnCreate
                    invalid={fieldState.invalid}
                  />
                  {deletedSubject && field.value === deletedSubject.id && (
                    <p data-deleted-subject className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                      Current subject “{deletedSubject.name}” was deleted. It stays on this event unless you pick another.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <DateTimePicker form={form} field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <DateTimePicker form={form} field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="required">Color</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className={`w-full ${
                          fieldState.invalid ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select a color" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORS.map((color) => (
                          <SelectItem value={color} key={color}>
                            <div className="flex items-center gap-2">
                              <div
                                className={`size-3.5 rounded-full bg-${color}-600 dark:bg-${color}-700`}
                              />
                              <span className="capitalize">{color}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter a description (optional)"
                      className={`max-h-48 min-h-20 [overflow-wrap:anywhere] ${fieldState.invalid ? "border-red-500" : ""}`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <ModalFooter className="grid shrink-0 grid-cols-2 gap-2 border-t pt-3 sm:flex sm:justify-end sm:space-x-0">
          <ModalClose asChild>
            <Button type="button" variant="outline" className="h-11 sm:h-9">
              Cancel
            </Button>
          </ModalClose>
          <Button form="event-form" type="submit" className="h-11 sm:h-9">
            {isEditing ? "Save Changes" : "Create Event"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
