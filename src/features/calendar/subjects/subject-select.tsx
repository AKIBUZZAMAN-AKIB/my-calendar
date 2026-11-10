"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ISubject } from "@/features/calendar/interfaces";
import { SubjectIcon } from "@/features/calendar/subjects/subject-icon";

interface SubjectSelectProps {
  subjects: ISubject[];
  value: string;
  onChange: (id: string) => void;
  counts?: Record<string, number>;
  placeholder?: string;
  disabled?: boolean;
  "aria-label": string;
  /** test hook, put on the trigger; each option gets data-subject-option=<id> */
  dataAttr?: string;
}

/**
 * The app's own subject chooser, in place of the browser's <select>.
 * The list opens inline, under the field, inside the sheet: no native popup,
 * nothing floating that a phone sheet could cut off. Big rows (44px) for
 * fingers, the subject's colour badge, the event count, and a check on the
 * chosen one. Long names end in "…".
 */
export function SubjectSelect({
  subjects,
  value,
  onChange,
  counts,
  placeholder = "Choose a subject…",
  disabled,
  dataAttr,
  ...rest
}: SubjectSelectProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const selected = subjects.find((s) => s.id === value);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (open) listRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5 [contain:inline-size]">
      <button
        type="button"
        {...(dataAttr ? { [dataAttr]: "" } : {})}
        aria-label={rest["aria-label"]}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        data-value={value}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn(
          "flex h-11 w-full min-w-0 items-center gap-2.5 rounded-md border bg-background px-2.5 text-left text-sm shadow-xs transition-colors outline-none sm:h-10",
          "hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-primary ring-2 ring-primary/20",
        )}
      >
        {selected ? (
          <>
            <SubjectIcon subject={selected} />
            <span className="w-0 min-w-0 flex-1 truncate font-medium">{selected.name}</span>
            {counts && (
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{counts[selected.id] ?? 0}</span>
            )}
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className={cn("size-4 shrink-0 opacity-60 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={rest["aria-label"]}
          className="w-full min-w-0 max-h-64 scroll-my-3 overflow-y-auto overscroll-contain rounded-md border bg-popover p-1 shadow-sm"
        >
          {subjects.map((s) => {
            const isSel = s.id === value;
            return (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={isSel}
                data-subject-option={s.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(s.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-11 w-full min-w-0 items-center gap-2.5 rounded-sm px-2 text-left text-sm outline-none transition-colors",
                  "hover:bg-accent focus-visible:bg-accent",
                  isSel && "bg-primary/10 font-medium",
                )}
              >
                <SubjectIcon subject={s} />
                <span className="w-0 min-w-0 flex-1 truncate" title={s.name}>
                  {s.name}
                </span>
                {counts && (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{counts[s.id] ?? 0}</span>
                )}
                <Check className={cn("size-4 shrink-0 text-primary", !isSel && "invisible")} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** The app's checkbox look; the real input stays for keyboard and screen readers. */
export function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
        "peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
        checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background",
      )}
    >
      <Check className={cn("size-3.5", !checked && "invisible")} strokeWidth={3} />
    </span>
  );
}

/** The app's radio look. */
export function RadioMark({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
        "peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
        checked ? "border-primary" : "border-input",
        disabled && "opacity-50",
      )}
    >
      <span className={cn("size-2.5 rounded-full bg-primary", !checked && "invisible")} />
    </span>
  );
}
