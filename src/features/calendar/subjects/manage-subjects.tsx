"use client";

import { ArrowLeft, Check, Merge, Pencil, Plus, Trash2, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/responsive-modal";
import {
  NO_SUBJECT,
  SUBJECT_NAME_MAX,
  useCalendar,
} from "@/features/calendar/contexts/calendar-context";
import type { ISubject } from "@/features/calendar/interfaces";
import { SubjectIcon } from "@/features/calendar/subjects/subject-icon";
import { CheckMark, RadioMark, SubjectSelect } from "@/features/calendar/subjects/subject-select";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Open / close from anywhere (filter, settings) while the dialog itself is
// mounted once, outside any popover, so closing the popover never unmounts it.
let isOpen = false;
const listeners = new Set<() => void>();
const setManageOpen = (next: boolean) => {
  isOpen = next;
  for (const l of listeners) l();
};
export const openManageSubjects = () => setManageOpen(true);
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const names = (list: ISubject[]) =>
  list.length <= 1
    ? `“${list[0]?.name ?? ""}”`
    : `${list
        .slice(0, -1)
        .map((s) => `“${s.name}”`)
        .join(", ")} and “${list[list.length - 1].name}”`;

type Screen =
  | { kind: "list" }
  | { kind: "delete"; id: string }
  | { kind: "merge" }
  | { kind: "merge-confirm"; sources: string[]; target: string };

export function ManageSubjectsDialog() {
  const open = useSyncExternalStore(subscribe, () => isOpen, () => false);
  const [screen, setScreen] = useState<Screen>({ kind: "list" });

  // every opening starts at the list
  useEffect(() => {
    if (open) setScreen({ kind: "list" });
  }, [open]);

  const title =
    screen.kind === "delete"
      ? "Delete subject"
      : screen.kind === "merge" || screen.kind === "merge-confirm"
        ? "Merge subjects"
        : "Manage subjects";

  return (
    <Modal open={open} onOpenChange={setManageOpen}>
      <ModalContent
        data-manage-subjects
        className="flex max-h-[92dvh] flex-col gap-3 overflow-hidden lg:max-h-[85dvh] lg:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          // Escape in a name box cancels that edit only, not the whole dialog
          if ((document.activeElement as HTMLElement | null)?.closest?.("[data-rename-input],[data-manage-new-input]")) {
            e.preventDefault();
          }
        }}
      >
        <ModalHeader className="text-left">
          <ModalTitle className="flex items-center gap-2">
            {screen.kind !== "list" && (
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2 size-8"
                aria-label="Back to subjects"
                data-manage-back
                onClick={() => setScreen(screen.kind === "merge-confirm" ? { kind: "merge" } : { kind: "list" })}
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            {title}
          </ModalTitle>
          <ModalDescription>
            {screen.kind === "list"
              ? "Rename, delete or merge subjects. Changes are saved on this device."
              : screen.kind === "delete"
                ? "Choose what happens to its events first."
                : "All events of the chosen subjects move into one subject."}
          </ModalDescription>
        </ModalHeader>

        <div className="-mx-1 min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-1 pb-1">
          {screen.kind === "list" && <ListScreen setScreen={setScreen} />}
          {screen.kind === "delete" && (
            <DeleteScreen id={screen.id} done={() => setScreen({ kind: "list" })} />
          )}
          {screen.kind === "merge" && <MergeScreen setScreen={setScreen} />}
          {screen.kind === "merge-confirm" && (
            <MergeConfirmScreen
              sources={screen.sources}
              target={screen.target}
              done={() => setScreen({ kind: "list" })}
            />
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

function ListScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const { subjects, subjectEventCounts, renameSubject, addSubject } = useCalendar();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const editRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) editRef.current?.select();
  }, [editing]);
  useEffect(() => {
    if (creating) newRef.current?.focus();
  }, [creating]);

  const startEdit = (subject: ISubject) => {
    setEditing(subject.id);
    setDraft(subject.name);
    setError(null);
  };
  const cancelEdit = () => {
    setEditing(null);
    setError(null);
  };
  const saveEdit = () => {
    if (!editing) return;
    const result = renameSubject(editing, draft);
    if (!result.ok) {
      setError(result.error ?? "Could not rename");
      editRef.current?.focus();
      return;
    }
    toast.success("Subject renamed");
    cancelEdit();
  };
  const create = () => {
    const result = addSubject(newName);
    if (!result) return;
    if (result.created) toast.success("Subject created");
    else toast.info("That subject already exists");
    setNewName("");
    newRef.current?.focus();
  };

  const keys = (onEnter: () => void, onEscape: () => void) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onEscape();
    }
  };

  const unassigned = subjectEventCounts[NO_SUBJECT.id] ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y rounded-lg border" data-manage-list>
        {subjects.length === 0 && (
          <li className="p-3 text-sm text-muted-foreground">No subjects yet.</li>
        )}
        {subjects.map((subject) => {
          const count = subjectEventCounts[subject.id] ?? 0;
          if (editing === subject.id) {
            return (
              <li key={subject.id} className="flex flex-col gap-1.5 p-2" data-manage-row={subject.id}>
                <div className="flex min-w-0 items-center gap-2">
                  <Input
                    ref={editRef}
                    value={draft}
                    maxLength={SUBJECT_NAME_MAX}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={keys(saveEdit, cancelEdit)}
                    aria-label={`New name for ${subject.name}`}
                    aria-invalid={!!error}
                    data-rename-input
                    enterKeyHint="done"
                    className="h-10 min-w-0 flex-1 text-base sm:text-sm"
                  />
                  <Button
                    size="icon"
                    className="size-10 shrink-0"
                    aria-label="Save name"
                    data-rename-save
                    disabled={!draft.trim()}
                    onClick={saveEdit}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 shrink-0"
                    aria-label="Cancel rename"
                    onClick={cancelEdit}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                {error && (
                  <p data-rename-error className="px-1 text-xs text-destructive [overflow-wrap:anywhere]">
                    {error}
                  </p>
                )}
              </li>
            );
          }
          return (
            <li
              key={subject.id}
              className="flex min-w-0 items-center gap-2 py-1.5 pl-2.5 pr-1"
              data-manage-row={subject.id}
            >
              <SubjectIcon subject={subject} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={subject.name} data-manage-name>
                  {subject.name}
                </p>
                <p className="text-xs text-muted-foreground" data-manage-count={count}>
                  {plural(count, "event")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 shrink-0"
                aria-label={`Rename ${subject.name}`}
                data-subject-rename={subject.id}
                onClick={() => startEdit(subject)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${subject.name}`}
                data-subject-delete={subject.id}
                onClick={() => setScreen({ kind: "delete", id: subject.id })}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          );
        })}
      </ul>

      {unassigned > 0 && (
        <p className="px-1 text-xs text-muted-foreground" data-unassigned-count={unassigned}>
          {plural(unassigned, "event")} without a subject. Find them under “No subject” in the filter.
        </p>
      )}

      {creating ? (
        <div className="flex min-w-0 items-center gap-2">
          <Input
            ref={newRef}
            value={newName}
            maxLength={SUBJECT_NAME_MAX}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={keys(create, () => setCreating(false))}
            placeholder="New subject name"
            aria-label="New subject name"
            data-manage-new-input
            enterKeyHint="done"
            className="h-10 min-w-0 flex-1 text-base sm:text-sm"
          />
          <Button className="h-10 shrink-0" disabled={!newName.trim()} onClick={create} data-manage-create>
            Create
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 shrink-0"
            aria-label="Close new subject"
            onClick={() => setCreating(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-10" onClick={() => setCreating(true)} data-manage-new>
            <Plus className="size-4" />
            New subject
          </Button>
          <Button
            variant="outline"
            className="h-10"
            disabled={subjects.length < 2}
            onClick={() => setScreen({ kind: "merge" })}
            data-subjects-merge-start
          >
            <Merge className="size-4" />
            Merge
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function DeleteScreen({ id, done }: { id: string; done: () => void }) {
  const { subjects, subjectEventCounts, deleteSubject } = useCalendar();
  const subject = subjects.find((s) => s.id === id);
  const others = subjects.filter((s) => s.id !== id);
  const count = subjectEventCounts[id] ?? 0;
  const [mode, setMode] = useState<"move" | "none">(others.length ? "move" : "none");
  const [moveTo, setMoveTo] = useState(others[0]?.id ?? "");

  if (!subject) return <p className="text-sm text-muted-foreground">This subject is already gone.</p>;

  const confirm = () => {
    const target = mode === "move" ? others.find((s) => s.id === moveTo) : undefined;
    deleteSubject(id, target?.id);
    toast.success(
      count === 0
        ? `Deleted “${subject.name}”`
        : target
          ? `Deleted “${subject.name}”. ${plural(count, "event")} moved to “${target.name}”.`
          : `Deleted “${subject.name}”. ${plural(count, "event")} now have no subject.`,
    );
    done();
  };

  return (
    <div className="flex flex-col gap-4" data-delete-screen={id}>
      <div className="flex min-w-0 items-center gap-3 rounded-lg border p-3">
        <SubjectIcon subject={subject} className="size-8 text-sm" />
        <div className="min-w-0">
          <p className="truncate font-medium" title={subject.name}>
            {subject.name}
          </p>
          <p className="text-xs text-muted-foreground">{plural(count, "event")}</p>
        </div>
      </div>

      {count > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm">
            {count === 1 ? "1 event uses" : `${count} events use`} this subject. What should happen to{" "}
            {count === 1 ? "it" : "them"}?
          </legend>
          <div
            className={cn(
              "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
              mode === "move" && "border-primary bg-primary/5",
              !others.length && "opacity-50",
            )}
          >
            <label
              className={cn(
                "flex min-h-6 cursor-pointer items-center gap-2 text-sm font-medium",
                !others.length && "cursor-not-allowed",
              )}
            >
              <input
                type="radio"
                name="delete-mode"
                value="move"
                data-delete-mode="move"
                disabled={!others.length}
                checked={mode === "move"}
                onChange={() => setMode("move")}
                className="peer sr-only"
              />
              <RadioMark checked={mode === "move"} disabled={!others.length} />
              Move them to another subject
            </label>
            {others.length > 0 && (
              <SubjectSelect
                aria-label="Move events to"
                dataAttr="data-delete-move-to"
                subjects={others}
                counts={subjectEventCounts}
                value={moveTo}
                onChange={(id) => {
                  setMoveTo(id);
                  setMode("move");
                }}
              />
            )}
          </div>
          <label
            className={cn(
              "flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors",
              mode === "none" && "border-primary bg-primary/5",
            )}
          >
            <input
              type="radio"
              name="delete-mode"
              value="none"
              data-delete-mode="none"
              checked={mode === "none"}
              onChange={() => setMode("none")}
              className="peer sr-only"
            />
            <RadioMark checked={mode === "none"} />
            <span>
              <span className="block font-medium">Keep them with no subject</span>
              <span className="text-xs text-muted-foreground">
                The events stay in the calendar under “No subject”.
              </span>
            </span>
          </label>
        </fieldset>
      ) : (
        <p className="text-sm text-muted-foreground">No events use this subject.</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11" onClick={done}>
          Cancel
        </Button>
        <Button variant="destructive" className="h-11" onClick={confirm} data-subject-delete-confirm>
          <Trash2 className="size-4" />
          Delete subject
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function MergeScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const { subjects, subjectEventCounts } = useCalendar();
  const [picked, setPicked] = useState<string[]>([]);
  const [target, setTarget] = useState("");

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // target: any subject; defaults to the first one picked
  const targetId = target || picked[0] || "";
  const sources = picked.filter((id) => id !== targetId);
  const moving = sources.reduce((sum, id) => sum + (subjectEventCounts[id] ?? 0), 0);
  const targetSubject = subjects.find((s) => s.id === targetId);
  const sourceSubjects = subjects.filter((s) => sources.includes(s.id));

  return (
    <div className="flex flex-col gap-4" data-merge-screen>
      <section className="flex flex-col gap-1.5">
        <h3 className="px-1 text-sm font-medium">1. Pick the subjects to merge</h3>
        <ul className="flex flex-col divide-y rounded-lg border">
          {subjects.map((s) => {
            const checked = picked.includes(s.id);
            return (
              <li key={s.id}>
                <label
                  className={cn(
                    "flex min-h-11 min-w-0 cursor-pointer items-center gap-2.5 px-2.5 py-2 transition-colors hover:bg-accent/50",
                    checked && "bg-primary/5",
                  )}
                >
                  <input
                    type="checkbox"
                    data-merge-source={s.id}
                    checked={checked}
                    onChange={() => toggle(s.id)}
                    className="peer sr-only"
                  />
                  <CheckMark checked={checked} />
                  <SubjectIcon subject={s} />
                  <span className="min-w-0 flex-1 truncate text-sm" title={s.name}>
                    {s.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{subjectEventCounts[s.id] ?? 0}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-1.5">
        <h3 className="px-1 text-sm font-medium">2. Merge into</h3>
        <SubjectSelect
          aria-label="Merge into"
          dataAttr="data-merge-target"
          subjects={subjects}
          counts={subjectEventCounts}
          value={targetId}
          onChange={setTarget}
        />
      </section>

      <p className="min-h-10 px-1 text-sm text-muted-foreground [overflow-wrap:anywhere]" data-merge-summary>
        {sources.length === 0 || !targetSubject
          ? "Pick at least one subject besides the one you merge into."
          : `${plural(moving, "event")} from ${names(sourceSubjects)} will move to “${targetSubject.name}”.`}
      </p>

      <Button
        className="h-11"
        disabled={sources.length === 0 || !targetSubject}
        onClick={() => setScreen({ kind: "merge-confirm", sources, target: targetId })}
        data-merge-next
      >
        <Merge className="size-4" />
        Merge {sources.length > 0 ? plural(sources.length + 1, "subject") : ""}
      </Button>
    </div>
  );
}

function MergeConfirmScreen({
  sources,
  target,
  done,
}: {
  sources: string[];
  target: string;
  done: () => void;
}) {
  const { subjects, subjectEventCounts, mergeSubjects } = useCalendar();
  const targetSubject = subjects.find((s) => s.id === target);
  const sourceSubjects = subjects.filter((s) => sources.includes(s.id));
  const moving = sources.reduce((sum, id) => sum + (subjectEventCounts[id] ?? 0), 0);

  if (!targetSubject || sourceSubjects.length === 0) {
    return <p className="text-sm text-muted-foreground">These subjects changed. Go back and pick again.</p>;
  }

  const confirm = () => {
    const moved = mergeSubjects(
      sourceSubjects.map((s) => s.id),
      targetSubject.id,
    );
    toast.success(`Merged into “${targetSubject.name}”. ${plural(moved, "event")} moved.`);
    done();
  };

  return (
    <div className="flex flex-col gap-4" data-merge-confirm-screen>
      <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm [overflow-wrap:anywhere]">
        <p>
          <span className="font-medium">{plural(moving, "event")}</span> from {names(sourceSubjects)} will move to{" "}
          <span className="font-medium">“{targetSubject.name}”</span>.
        </p>
        <p className="text-muted-foreground">
          {sourceSubjects.length === 1 ? "That subject" : "Those subjects"} will then be deleted. This cannot be undone.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11" onClick={done}>
          Cancel
        </Button>
        <Button className="h-11" onClick={confirm} data-merge-confirm>
          Confirm merge
        </Button>
      </div>
    </div>
  );
}
