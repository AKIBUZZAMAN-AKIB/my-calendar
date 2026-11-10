"use client";

import { CheckIcon, Layers, Plus, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SUBJECT_NAME_MAX,
  useCalendar,
} from "@/features/calendar/contexts/calendar-context";
import type { ISubject } from "@/features/calendar/interfaces";
import { SubjectIcon } from "@/features/calendar/subjects/subject-icon";
import { cn } from "@/lib/utils";

interface SubjectPickerProps {
  value: ISubject["id"] | "all" | undefined;
  onChange: (id: ISubject["id"] | "all") => void;
  /** Show an "All subjects" choice first (used by the filter). */
  includeAll?: boolean;
  /** Select the subject right after it is created (used by the event form). */
  selectOnCreate?: boolean;
  /** Let the user remove subjects they created. */
  allowRemove?: boolean;
  invalid?: boolean;
}

/**
 * Subjects as a grid of same-size chips, with a "New subject" button at the end.
 * Long names are cut with … so every chip keeps its size.
 */
export function SubjectPicker({
  value,
  onChange,
  includeAll = false,
  selectOnCreate = false,
  allowRemove = false,
  invalid = false,
}: SubjectPickerProps) {
  const { subjects, addSubject, removeSubject } = useCalendar();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  const create = () => {
    const result = addSubject(name);
    if (!result) {
      inputRef.current?.focus();
      return;
    }
    if (result.created) toast.success("Subject created");
    else toast.info("That subject already exists");
    if (selectOnCreate) onChange(result.subject.id);
    setName("");
    // stay in create mode so several subjects can be added in a row
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // never submit the surrounding event form
      e.preventDefault();
      e.stopPropagation();
      create();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setCreating(false);
      setName("");
    }
  };

  const chip = (subject: ISubject | { id: "all"; name: string }) => {
    const selected = (value ?? "all") === subject.id;
    const removable = allowRemove && "custom" in subject && subject.custom;
    return (
      <div
        key={subject.id}
        className={cn(
          "flex h-10 min-w-0 items-center rounded-lg border transition-colors",
          selected ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
        )}
      >
        <button
          type="button"
          data-subject={subject.id}
          aria-pressed={selected}
          title={subject.name}
          onClick={() => onChange(subject.id)}
          className="flex h-full min-w-0 flex-1 items-center gap-2 overflow-hidden px-2 text-left text-sm"
        >
          {subject.id === "all" ? (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Layers className="size-3.5" />
            </span>
          ) : (
            <SubjectIcon subject={subject} />
          )}
          <span data-subject-name className="min-w-0 flex-1 truncate">
            {subject.name}
          </span>
          {selected && <CheckIcon className="size-4 shrink-0" />}
        </button>
        {removable && (
          <button
            type="button"
            aria-label={`Remove subject ${subject.name}`}
            data-subject-remove={subject.id}
            onClick={() => removeSubject(subject.id)}
            className="flex h-full w-7 shrink-0 items-center justify-center text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2",
        invalid && "rounded-lg ring-1 ring-red-500 ring-offset-2 ring-offset-background",
      )}
    >
      {includeAll && chip({ id: "all", name: "All subjects" })}
      {subjects.map((t) => chip(t))}

      {creating ? (
        <div className="col-span-2 flex min-w-0 items-center gap-2">
          <Input
            ref={inputRef}
            value={name}
            maxLength={SUBJECT_NAME_MAX}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="New subject name"
            aria-label="New subject name"
            data-subject-input
            enterKeyHint="done"
            className="h-10 min-w-0 flex-1"
          />
          <Button
            type="button"
            className="h-10 shrink-0"
            data-subject-create
            disabled={!name.trim()}
            onClick={create}
          >
            Create
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close new subject"
            className="size-10 shrink-0"
            onClick={() => {
              setCreating(false);
              setName("");
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          data-subject-new
          onClick={() => setCreating(true)}
          className="flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-dashed px-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="size-4 shrink-0" />
          <span className="truncate">New subject</span>
        </button>
      )}
    </div>
  );
}
