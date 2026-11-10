import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { ControllerRenderProps, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import type { TEventFormData } from "@/features/calendar/schemas";

interface DatePickerProps {
  form: UseFormReturn<TEventFormData>;
  field: ControllerRenderProps<TEventFormData, "endDate" | "startDate">;
}

export function DateTimePicker({ form, field }: DatePickerProps) {
  const { use24HourFormat } = useCalendar();

  /** Start moves: the end moves with it, so the event keeps its length. */
  function commit(next: Date) {
    const prev = form.getValues(field.name);
    form.setValue(field.name, next, { shouldDirty: true });
    if (field.name === "startDate" && prev) {
      const end = form.getValues("endDate");
      if (end) {
        form.setValue(
          "endDate",
          new Date(end.getTime() + (next.getTime() - prev.getTime())),
          { shouldDirty: true },
        );
      }
    }
    if (form.formState.isSubmitted) void form.trigger(["startDate", "endDate"]);
  }

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    // picking a day keeps the time that was already chosen
    const current = form.getValues(field.name) || new Date();
    const next = new Date(date);
    next.setHours(current.getHours(), current.getMinutes(), 0, 0);
    commit(next);
  }

  function handleTimeChange(type: "hour" | "minute" | "ampm", value: string) {
    const currentDate = form.getValues(field.name) || new Date();
    const newDate = new Date(currentDate);
    newDate.setSeconds(0, 0);

    if (type === "hour") {
      const h = parseInt(value, 10);
      if (use24HourFormat) newDate.setHours(h);
      // 12h: 12 means hour 0 of the half; keep AM/PM as it was
      else newDate.setHours((h % 12) + (newDate.getHours() >= 12 ? 12 : 0));
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(value, 10));
    } else if (type === "ampm") {
      const hours = newDate.getHours();
      if (value === "AM" && hours >= 12) {
        newDate.setHours(hours - 12);
      } else if (value === "PM" && hours < 12) {
        newDate.setHours(hours + 12);
      }
    }

    commit(newDate);
  }

  const hours = use24HourFormat
    ? Array.from({ length: 24 }, (_, i) => i)
    : [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return (
    <FormItem className="flex flex-col">
      <FormLabel>
        {field.name === "startDate" ? "Start Date" : "End Date"}
      </FormLabel>
      <Popover modal={true}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant={"outline"}
              data-dt={field.name}
              className={cn(
                "w-full pl-3 text-left font-normal",
                !field.value && "text-muted-foreground",
              )}
            >
              {field.value ? (
                format(
                  field.value,
                  use24HourFormat ? "MM/dd/yyyy HH:mm" : "MM/dd/yyyy hh:mm aa",
                )
              ) : (
                <span>MM/DD/YYYY hh:mm aa</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <div className="sm:flex">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={handleDateSelect}
              initialFocus
            />
            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2" data-hours>
                  {hours.map((hour) => (
                    <Button
                      key={hour}
                      size="icon"
                      variant={
                        field.value &&
                        field.value.getHours() % (use24HourFormat ? 24 : 12) ===
                          hour % (use24HourFormat ? 24 : 12)
                          ? "default"
                          : "ghost"
                      }
                      type="button"
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() => handleTimeChange("hour", hour.toString())}
                    >
                      {hour.toString().padStart(2, "0")}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2" data-minutes>
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <Button
                      key={minute}
                      size="icon"
                      variant={
                        field.value && field.value.getMinutes() === minute
                          ? "default"
                          : "ghost"
                      }
                      type="button"
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() =>
                        handleTimeChange("minute", minute.toString())
                      }
                    >
                      {minute.toString().padStart(2, "0")}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
              {!use24HourFormat && (
                <div className="flex gap-1 p-2 sm:flex-col" data-ampm>
                  {(["AM", "PM"] as const).map((half) => (
                    <Button
                      key={half}
                      type="button"
                      size="icon"
                      variant={
                        field.value &&
                        (field.value.getHours() >= 12 ? "PM" : "AM") === half
                          ? "default"
                          : "ghost"
                      }
                      className="shrink-0 aspect-square sm:w-full"
                      onClick={() => handleTimeChange("ampm", half)}
                    >
                      {half}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
}
