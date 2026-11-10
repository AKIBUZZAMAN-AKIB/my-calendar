import { differenceInMinutes, format } from "date-fns";
import { CalendarIcon, Clock, Minus, Plus } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { ControllerRenderProps, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import type { TEventFormData } from "@/features/calendar/schemas";

interface DatePickerProps {
  form: UseFormReturn<TEventFormData>;
  field: ControllerRenderProps<TEventFormData, "endDate" | "startDate">;
}

const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const pad2 = (n: number) => n.toString().padStart(2, "0");

/** "1h 30m", "45m", "2d 3h" */
function formatLength(min: number) {
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  return [d && `${d}d`, h && `${h}h`, (m || (!d && !h)) && `${m}m`].filter(Boolean).join(" ");
}

/**
 * Date and time for the Add and the Edit event form alike: two chips, a date
 * and a time. Each opens a small floating panel next to it (Radix popover:
 * it flips above or below and shifts sideways to stay 8px inside the screen,
 * and never needs the keyboard). The time panel shows every hour, the 5-minute
 * steps, and the five single minutes of the chosen step, so any minute is two
 * taps away; −/+ moves one minute (hold to repeat). A tap outside or Done
 * closes it. Moving the start moves the end too, so the event keeps its length.
 */
export function DateTimePicker({ form, field }: DatePickerProps) {
  const { use24HourFormat } = useCalendar();
  const [timeOpen, setTimeOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const value = field.value;
  const isStart = field.name === "startDate";

  /** Start moves: the end moves with it, so the event keeps its length. */
  function commit(next: Date) {
    next.setSeconds(0, 0);
    const prev = form.getValues(field.name);
    form.setValue(field.name, next, { shouldDirty: true });
    if (isStart && prev) {
      const end = form.getValues("endDate");
      if (end) {
        form.setValue("endDate", new Date(end.getTime() + (next.getTime() - prev.getTime())), {
          shouldDirty: true,
        });
      }
    }
    if (form.formState.isSubmitted) void form.trigger(["startDate", "endDate"]);
  }

  const current = () => new Date(form.getValues(field.name) || new Date());

  function selectDay(date: Date | undefined) {
    if (!date) return;
    // picking a day keeps the time that was already chosen
    const cur = current();
    const next = new Date(date);
    next.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
    commit(next);
    setDateOpen(false);
  }

  function selectHour(h: number) {
    const next = current();
    // 12h: "12" is hour 0 of the half, and AM/PM stays as it was
    next.setHours(use24HourFormat ? h : (h % 12) + (next.getHours() >= 12 ? 12 : 0));
    commit(next);
  }

  function selectHalf(half: "AM" | "PM") {
    const next = current();
    const h = next.getHours();
    if (half === "AM" && h >= 12) next.setHours(h - 12);
    if (half === "PM" && h < 12) next.setHours(h + 12);
    commit(next);
  }

  function selectMinute(m: number) {
    const next = current();
    next.setMinutes(m);
    commit(next);
  }

  /** One minute up or down; 11:59 → 12:00, and it stays on the same day. */
  function stepMinute(delta: 1 | -1) {
    const next = current();
    const mod = (next.getHours() * 60 + next.getMinutes() + delta + 1440) % 1440;
    next.setHours(Math.floor(mod / 60), mod % 60);
    commit(next);
  }

  const hours = use24HourFormat
    ? Array.from({ length: 24 }, (_, i) => i)
    : [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const isHour = (h: number) =>
    !!value &&
    (use24HourFormat ? value.getHours() === h : value.getHours() % 12 === h % 12);
  const half = value && value.getHours() >= 12 ? "PM" : "AM";
  const minute = value ? value.getMinutes() : 0;
  const block = minute - (minute % 5);
  const hourText = value
    ? use24HourFormat
      ? pad2(value.getHours())
      : pad2(value.getHours() % 12 || 12)
    : "--";

  const timeFmt = use24HourFormat ? "HH:mm" : "hh:mm aa";
  // the other end of the event, to show its length while picking
  const start = form.watch("startDate");
  const end = form.watch("endDate");
  const length = start && end ? differenceInMinutes(end, start) : null;
  const hint =
    length === null
      ? null
      : length < 0
        ? { text: "Ends before it starts", bad: true }
        : isStart
          ? { text: `Ends ${format(end, timeFmt)} · ${formatLength(length)}`, bad: false }
          : { text: `Length ${formatLength(length)}`, bad: false };

  const label = isStart ? "Start" : "End";
  const cell = "h-8 min-w-0 px-0 text-[13px] font-medium tabular-nums shadow-none";
  const panel =
    "w-[min(18.5rem,calc(100vw-16px))] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto overscroll-contain rounded-xl p-0 shadow-lg";

  return (
    <FormItem className="flex flex-col">
      <FormLabel>{label}</FormLabel>
      <div className="flex gap-2">
        <Popover modal open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              data-dt-date={field.name}
              aria-label={`${label} date`}
              className={cn(
                "h-11 min-w-0 flex-1 justify-start gap-2 pl-3 text-left font-normal sm:h-9",
                !value && "text-muted-foreground",
                dateOpen && "border-primary ring-2 ring-primary/20",
              )}
            >
              <CalendarIcon className="size-4 shrink-0 opacity-50" />
              <span className="truncate tabular-nums">
                {value ? format(value, "EEE, MMM d, yyyy") : "Pick a date"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            data-dt-date-panel={field.name}
            align="start"
            sideOffset={6}
            collisionPadding={8}
            sticky="always"
            className={cn(panel, "w-auto")}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Calendar
              mode="single"
              selected={value}
              defaultMonth={value}
              onSelect={selectDay}
              className="p-2"
            />
          </PopoverContent>
        </Popover>

        <Popover modal open={timeOpen} onOpenChange={setTimeOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              data-dt={field.name}
              aria-label={`${label} time`}
              aria-expanded={timeOpen}
              className={cn(
                "h-11 shrink-0 gap-2 px-3 font-medium tabular-nums sm:h-9",
                !value && "text-muted-foreground",
                timeOpen && "border-primary ring-2 ring-primary/20",
              )}
            >
              <Clock className="size-4 opacity-50" />
              {value ? format(value, timeFmt) : "--:--"}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            data-dt-panel={field.name}
            align="end"
            sideOffset={6}
            collisionPadding={8}
            sticky="always"
            className={panel}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {/* header: the time being set, large, with AM/PM */}
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {label} time
                </div>
                <div className="text-2xl font-semibold leading-tight tabular-nums" data-time-display>
                  {hourText}
                  <span className="px-0.5 text-muted-foreground">:</span>
                  {pad2(minute)}
                </div>
              </div>
              {!use24HourFormat && (
                <div className="flex shrink-0 rounded-lg bg-muted p-0.5" data-ampm role="group" aria-label="AM or PM">
                  {(["AM", "PM"] as const).map((h) => (
                    <button
                      key={h}
                      type="button"
                      aria-pressed={half === h}
                      onClick={() => selectHalf(h)}
                      className={cn(
                        "h-8 rounded-md px-3 text-xs font-semibold transition-colors",
                        half === h
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground",
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5 p-2.5">
              <div>
                <div className="mb-1 px-0.5 text-[11px] font-medium text-muted-foreground">Hour</div>
                <div className="grid grid-cols-6 gap-1" data-hours>
                  {hours.map((h) => (
                    <Button
                      key={h}
                      type="button"
                      variant={isHour(h) ? "default" : "ghost"}
                      aria-pressed={isHour(h)}
                      className={cn(cell, !isHour(h) && "bg-muted/50")}
                      onClick={() => selectHour(h)}
                    >
                      {pad2(h)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1 px-0.5 text-[11px] font-medium text-muted-foreground">Minute</div>
                <div className="grid grid-cols-6 gap-1" data-minutes>
                  {MINUTES.map((m) => (
                    <Button
                      key={m}
                      type="button"
                      variant={minute === m ? "default" : block === m ? "secondary" : "ghost"}
                      aria-pressed={minute === m}
                      className={cn(cell, minute !== m && block !== m && "bg-muted/50")}
                      onClick={() => selectMinute(m)}
                    >
                      {pad2(m)}
                    </Button>
                  ))}
                </div>
                {/* the single minutes of the chosen 5-minute step, with −/+ */}
                <div className="mt-1.5 flex items-center gap-1" data-minute-step>
                  <RepeatButton label="One minute earlier" onStep={() => stepMinute(-1)}>
                    <Minus className="size-3.5" />
                  </RepeatButton>
                  <div className="grid flex-1 grid-cols-5 gap-1" data-fine-minutes>
                    {[0, 1, 2, 3, 4].map((i) => {
                      const m = block + i;
                      return (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={minute === m}
                          aria-label={`Minute ${pad2(m)}`}
                          onClick={() => selectMinute(m)}
                          className={cn(
                            "h-8 rounded-md border text-xs tabular-nums transition-colors",
                            minute === m
                              ? "border-primary bg-primary/10 font-semibold text-foreground"
                              : "border-transparent text-muted-foreground",
                          )}
                        >
                          :{pad2(m)}
                        </button>
                      );
                    })}
                  </div>
                  <span className="sr-only" data-minute-value>
                    {pad2(minute)}
                  </span>
                  <RepeatButton label="One minute later" onStep={() => stepMinute(1)}>
                    <Plus className="size-3.5" />
                  </RepeatButton>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t pt-2.5">
                <span
                  data-time-hint
                  className={cn(
                    "min-w-0 truncate text-xs tabular-nums",
                    hint?.bad ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {hint?.text}
                </span>
                <Button type="button" size="sm" className="h-8 shrink-0 px-4" onClick={() => setTimeOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <FormMessage />
    </FormItem>
  );
}

/** −/+ that steps once on a tap and keeps stepping while held. */
function RepeatButton({
  label,
  onStep,
  children,
}: {
  label: string;
  onStep: () => void;
  children: ReactNode;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeated = useRef(false);
  const step = useRef(onStep);
  step.current = onStep;
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);
  const start = () => {
    repeated.current = false;
    stop();
    const tick = (delay: number) => {
      timer.current = setTimeout(() => {
        repeated.current = true;
        step.current();
        tick(70);
      }, delay);
    };
    tick(450);
  };
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="size-8 shrink-0"
      aria-label={label}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        // a hold already stepped; a plain tap steps once
        if (!repeated.current) step.current();
        repeated.current = false;
      }}
    >
      {children}
    </Button>
  );
}

