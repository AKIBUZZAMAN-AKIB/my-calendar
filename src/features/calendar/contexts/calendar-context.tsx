"use client";

import type React from "react";
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { COLORS } from "@/features/calendar/constants";
import { useLocalStorage } from "@/features/calendar/hooks";
import type { IEvent, ISubject } from "@/features/calendar/interfaces";
import type { TCalendarView, TEventColor } from "@/features/calendar/types";

interface ICalendarContext {
  selectedDate: Date;
  view: TCalendarView;
  setView: (view: TCalendarView) => void;
  agendaModeGroupBy: "date" | "color";
  setAgendaModeGroupBy: (groupBy: "date" | "color") => void;
  use24HourFormat: boolean;
  toggleTimeFormat: () => void;
  startOfDayHour: number;
  setStartOfDayHour: (newVal: number) => void;
  setSelectedDate: (date: Date | undefined) => void;
  selectedSubjectId: ISubject["id"] | "all";
  setSelectedSubjectId: (subjectId: ISubject["id"] | "all") => void;
  badgeVariant: "dot" | "colored";
  setBadgeVariant: (variant: "dot" | "colored") => void;
  selectedColors: TEventColor[];
  filterEventsBySelectedColors: (colors: TEventColor) => void;
  filterEventsBySelectedSubject: (subjectId: ISubject["id"] | "all") => void;
  subjects: ISubject[];
  /** Creates a subject (or returns the existing one with the same name). */
  addSubject: (name: string) => { subject: ISubject; created: boolean } | null;
  /** Deletes a subject; its events get "No subject". */
  removeSubject: (subjectId: ISubject["id"]) => void;
  /** Renames a subject (and the copy every event keeps). Names stay unique. */
  renameSubject: (subjectId: ISubject["id"], name: string) => { ok: boolean; error?: string };
  /** Deletes a subject. Its events move to `moveToId`, or get "No subject" when it is left out. */
  deleteSubject: (subjectId: ISubject["id"], moveToId?: ISubject["id"]) => void;
  /** Moves all events of `sourceIds` to `targetId` and deletes the sources. Returns how many events moved. */
  mergeSubjects: (sourceIds: ISubject["id"][], targetId: ISubject["id"]) => number;
  /** Events per subject id, counting every event (filters ignored). */
  subjectEventCounts: Record<string, number>;
  events: IEvent[];
  /** false until the saved events have been read from this device. */
  eventsLoaded: boolean;
  /** How many of the starter sample events are still in the calendar. */
  sampleEventCount: number;
  removeSampleEvents: () => void;
  addEvent: (event: IEvent) => void;
  updateEvent: (event: IEvent) => void;
  removeEvent: (eventId: number) => void;
  clearFilter: () => void;
}

interface CalendarSettings {
  badgeVariant: "dot" | "colored";
  view: TCalendarView;
  use24HourFormat: boolean;
  startOfDayHour: number;
  agendaModeGroupBy: "date" | "color";
}

export const MIN_SCROLL_HOUR = 0;
export const SUBJECT_NAME_MAX = 100;
const SUBJECTS_STORAGE_KEY = "calendar-subjects";
const SUBJECTS_STORAGE_VERSION = 2;
/** Older builds kept user subjects under this key (when they were called "topics"). */
const LEGACY_SUBJECTS_STORAGE_KEY = "calendar-topics";
const EVENTS_STORAGE_KEY = "calendar-events";
const EVENTS_STORAGE_VERSION = 1;
export const NO_SUBJECT: ISubject = { id: "subject-none", name: "No subject" };

/** Any date the app may have stored -> exact ISO instant (UTC, with Z), or null. */
function toIso(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Validates one stored event and fills safe defaults, so a bad record never breaks the calendar. */
function normalizeEvent(raw: unknown): IEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const id = typeof e.id === "number" && Number.isFinite(e.id) ? e.id : Number(e.id);
  const startDate = toIso(e.startDate);
  let endDate = toIso(e.endDate);
  if (!Number.isFinite(id) || !startDate || typeof e.title !== "string") return null;
  if (!endDate || new Date(endDate).getTime() < new Date(startDate).getTime()) endDate = startDate;
  const rawSubject = (e.subject ?? e.topic) as Record<string, unknown> | undefined;
  const subject: ISubject =
    rawSubject && typeof rawSubject.id === "string" && typeof rawSubject.name === "string"
      ? { id: rawSubject.id, name: rawSubject.name, ...(rawSubject.custom ? { custom: true } : {}) }
      : NO_SUBJECT;
  const color = COLORS.includes(e.color as TEventColor) ? (e.color as TEventColor) : "blue";
  return {
    id,
    title: e.title,
    description: typeof e.description === "string" ? e.description : "",
    startDate,
    endDate,
    color,
    subject,
    ...(e.sample ? { sample: true } : {}),
  };
}
// With a fixed calendar height, having 16h on top
// of the frame allows to see the rest of the day
export const MAX_SCROLL_HOUR = 16;

const DEFAULT_SETTINGS: CalendarSettings = {
  badgeVariant: "colored",
  view: "day",
  use24HourFormat: true,
  startOfDayHour: 8,
  agendaModeGroupBy: "date",
};

const CalendarContext = createContext({} as ICalendarContext);

export function CalendarProvider({
  children,
  subjects: defaultSubjects,
  events,
  badge = "colored",
  view = "day",
}: {
  children: React.ReactNode;
  subjects: ISubject[];
  events: IEvent[];
  view?: TCalendarView;
  badge?: "dot" | "colored";
}) {

  const [rawSettings, setSettings] = useLocalStorage<Partial<CalendarSettings>>("calendar-settings", {});

  const settings: CalendarSettings = {
    ...DEFAULT_SETTINGS,
    badgeVariant: badge,
    view: view,
    ...rawSettings,
  };

  const [badgeVariant, setBadgeVariantState] = useState<"dot" | "colored">(
    settings.badgeVariant,
  );
  const [currentView, setCurrentViewState] = useState<TCalendarView>(
    settings.view,
  );
  const [use24HourFormat, setUse24HourFormatState] = useState<boolean>(
    settings.use24HourFormat,
  );
  const [startOfDayHour, setStartOfDayHourState] = useState<number>(
    settings.startOfDayHour,
  );
  const [agendaModeGroupBy, setAgendaModeGroupByState] = useState<
    "date" | "color"
  >(settings.agendaModeGroupBy);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSubjectId, setSelectedSubjectId] = useState<ISubject["id"] | "all">(
    "all",
  );
  const [selectedColors, setSelectedColors] = useState<TEventColor[]>([]);

  // Events live on this device (localStorage). They are read after mount so the
  // server HTML and the first client render match; until then the calendar is empty.
  const [allEvents, setAllEvents] = useState<IEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  useEffect(() => {
    let loaded: IEvent[] | null = null;
    try {
      const raw = window.localStorage.getItem(EVENTS_STORAGE_KEY);
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          const list = Array.isArray(parsed) ? parsed : parsed?.events;
          if (Array.isArray(list)) {
            loaded = list.map(normalizeEvent).filter((e): e is IEvent => e !== null);
          }
        } catch (error) {
          // keep the unreadable copy instead of silently losing it
          window.localStorage.setItem(`${EVENTS_STORAGE_KEY}-unreadable-backup`, raw);
          console.warn("Saved events could not be read; a backup was kept", error);
        }
      }
    } catch (error) {
      console.warn("Could not read saved events", error);
    }
    if (loaded === null) {
      // First visit on this device: start with the sample events, marked as samples.
      loaded = (events || [])
        .map(normalizeEvent)
        .filter((e): e is IEvent => e !== null)
        .map((e) => ({ ...e, sample: true }));
    }
    setAllEvents(loaded);
    setEventsLoaded(true);
    // the server-provided sample events are only a first-visit seed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every change (create, edit, drag, resize, delete) is written straight away.
  useEffect(() => {
    if (!eventsLoaded) return;
    try {
      window.localStorage.setItem(
        EVENTS_STORAGE_KEY,
        JSON.stringify({ version: EVENTS_STORAGE_VERSION, events: allEvents }),
      );
    } catch (error) {
      console.warn("Could not save events", error);
      toast.error("Could not save events on this device");
    }
  }, [allEvents, eventsLoaded]);

  // The subject list (built-in ones the user kept + ones they created). Saved
  // as { version: 2, subjects } so built-in subjects can be renamed or removed
  // too. Older saves (a plain array of created subjects, or the "topics" key)
  // are read and upgraded without losing anything. Loaded after mount so server
  // and client render the same HTML.
  const [subjects, setSubjects] = useState<ISubject[]>(defaultSubjects);
  const subjectsRef = useRef(subjects);
  subjectsRef.current = subjects;
  const allEventsRef = useRef(allEvents);
  allEventsRef.current = allEvents;

  useEffect(() => {
    try {
      let raw = window.localStorage.getItem(SUBJECTS_STORAGE_KEY);
      let fromLegacy = false;
      if (raw === null) {
        raw = window.localStorage.getItem(LEGACY_SUBJECTS_STORAGE_KEY);
        fromLegacy = raw !== null;
      }
      if (raw === null) return;
      const parsed = JSON.parse(raw);
      const clean = (list: unknown[]): ISubject[] =>
        list
          .filter(
            (t): t is ISubject =>
              !!t && typeof (t as ISubject).id === "string" && typeof (t as ISubject).name === "string",
          )
          .map((t) => ({ id: t.id, name: t.name, ...(t.custom ? { custom: true } : {}) }));
      let next: ISubject[] | null = null;
      if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.subjects)) {
        next = clean(parsed.subjects);
      } else if (Array.isArray(parsed)) {
        // v1: only the created subjects were saved; built-ins came from code
        next = [...defaultSubjects, ...clean(parsed).map((t) => ({ ...t, custom: true }))];
        window.localStorage.setItem(`${SUBJECTS_STORAGE_KEY}-v1-backup`, raw);
      }
      if (!next) return;
      // never two subjects with the same id
      const seen = new Set<string>();
      next = next.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
      setSubjects(next);
      window.localStorage.setItem(
        SUBJECTS_STORAGE_KEY,
        JSON.stringify({ version: SUBJECTS_STORAGE_VERSION, subjects: next }),
      );
      if (fromLegacy) window.localStorage.removeItem(LEGACY_SUBJECTS_STORAGE_KEY);
    } catch (error) {
      console.warn("Could not read saved subjects", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSubjects = (next: ISubject[]) => {
    subjectsRef.current = next;
    setSubjects(next);
    try {
      window.localStorage.setItem(
        SUBJECTS_STORAGE_KEY,
        JSON.stringify({ version: SUBJECTS_STORAGE_VERSION, subjects: next }),
      );
    } catch (error) {
      console.warn("Could not save subjects", error);
      toast.error("Could not save subjects on this device");
    }
  };

  const cleanName = (rawName: string) =>
    rawName.replace(/\s+/g, " ").trim().slice(0, SUBJECT_NAME_MAX);
  const sameName = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

  /** Number of events (all of them, not just the filtered ones) per subject id. */
  const subjectEventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of allEvents) counts[e.subject.id] = (counts[e.subject.id] ?? 0) + 1;
    return counts;
  }, [allEvents]);

  const addSubject = (rawName: string) => {
    const name = cleanName(rawName);
    if (!name) return null;
    const list = subjectsRef.current;
    const existing = list.find((t) => sameName(t.name, name));
    if (existing) return { subject: existing, created: false };
    // Re-creating a deleted subject reconnects the events that still carry it.
    const orphan = allEventsRef.current.find(
      (e) =>
        e.subject.id !== NO_SUBJECT.id &&
        sameName(e.subject.name, name) &&
        !list.some((t) => t.id === e.subject.id),
    )?.subject;
    const subject: ISubject = orphan ? { id: orphan.id, name, custom: true } : {
      id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      custom: true,
    };
    saveSubjects([...list, subject]);
    return { subject, created: true };
  };

  /** Moves every event of the given subjects to `to` (a subject, or no subject). */
  const reassignEvents = (fromIds: string[], to: ISubject) => {
    const from = new Set(fromIds);
    const target: ISubject = { id: to.id, name: to.name, ...(to.custom ? { custom: true } : {}) };
    setAllEvents((prev) =>
      prev.map((e) => (from.has(e.subject.id) ? { ...e, subject: target } : e)),
    );
  };

  const renameSubject: ICalendarContext["renameSubject"] = (subjectId, rawName) => {
    const name = cleanName(rawName);
    if (!name) return { ok: false, error: "Name cannot be empty" };
    const list = subjectsRef.current;
    const subject = list.find((t) => t.id === subjectId);
    if (!subject) return { ok: false, error: "Subject not found" };
    const clash = list.find((t) => t.id !== subjectId && sameName(t.name, name));
    if (clash) return { ok: false, error: `"${clash.name}" already exists. Use Merge to join them.` };
    if (subject.name === name) return { ok: true };
    saveSubjects(list.map((t) => (t.id === subjectId ? { ...t, name } : t)));
    // events keep a copy of the subject: update their name too
    setAllEvents((prev) =>
      prev.map((e) => (e.subject.id === subjectId ? { ...e, subject: { ...e.subject, name } } : e)),
    );
    return { ok: true };
  };

  const deleteSubject: ICalendarContext["deleteSubject"] = (subjectId, moveToId) => {
    const list = subjectsRef.current;
    if (!list.some((t) => t.id === subjectId)) return;
    const target = moveToId ? list.find((t) => t.id === moveToId && t.id !== subjectId) : undefined;
    reassignEvents([subjectId], target ?? NO_SUBJECT);
    saveSubjects(list.filter((t) => t.id !== subjectId));
    if (selectedSubjectId === subjectId) setSelectedSubjectId(target ? target.id : "all");
  };

  const mergeSubjects: ICalendarContext["mergeSubjects"] = (sourceIds, targetId) => {
    const list = subjectsRef.current;
    const target = list.find((t) => t.id === targetId);
    const sources = sourceIds.filter((id) => id !== targetId && list.some((t) => t.id === id));
    if (!target || sources.length === 0) return 0;
    const moved = allEventsRef.current.filter((e) => sources.includes(e.subject.id)).length;
    reassignEvents(sources, target);
    saveSubjects(list.filter((t) => !sources.includes(t.id)));
    if (sources.includes(selectedSubjectId)) setSelectedSubjectId(target.id);
    return moved;
  };

  /** Kept for the filter's quick × button: events become "No subject". */
  const removeSubject = (subjectId: ISubject["id"]) => deleteSubject(subjectId);

  // Subject and colour filters work together.
  const filteredEvents = useMemo(
    () =>
      allEvents.filter(
        (event) =>
          (selectedSubjectId === "all" || event.subject?.id === selectedSubjectId) &&
          (selectedColors.length === 0 ||
            selectedColors.includes(event.color || "blue")),
      ),
    [allEvents, selectedSubjectId, selectedColors],
  );

  const updateSettings = (newPartialSettings: Partial<CalendarSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newPartialSettings,
    }));
  };

  const setBadgeVariant = (variant: "dot" | "colored") => {
    setBadgeVariantState(variant);
    updateSettings({ badgeVariant: variant });
  };

  // A view switch is a transition: React renders the new view without
  // blocking input, and the tabs show the choice at once (see view-tabs.tsx).
  const setView = (newView: TCalendarView) => {
    startTransition(() => {
      setCurrentViewState(newView);
      updateSettings({ view: newView });
    });
  };

  const toggleTimeFormat = () => {
    const newValue = !use24HourFormat;
    setUse24HourFormatState(newValue);
    updateSettings({ use24HourFormat: newValue });
  };

  const setStartOfDayHour = (newVal: number) => {
    if (!isNaN(newVal) && newVal >= MIN_SCROLL_HOUR && newVal <= MAX_SCROLL_HOUR) {
      setStartOfDayHourState(newVal);
      updateSettings({ startOfDayHour: newVal });
    }
  };


  const setAgendaModeGroupBy = (groupBy: "date" | "color") => {
    setAgendaModeGroupByState(groupBy);
    updateSettings({ agendaModeGroupBy: groupBy });
  };

  const filterEventsBySelectedColors = (color: TEventColor) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  };

  const filterEventsBySelectedSubject = (subjectId: ISubject["id"] | "all") => {
    setSelectedSubjectId(subjectId);
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const addEvent = (event: IEvent) => {
    const normalized = normalizeEvent(event);
    if (!normalized) throw new Error("Invalid event");
    setAllEvents((prev) => {
      // never let two events share an id (edit/delete/drag find events by id)
      const id = prev.some((e) => e.id === normalized.id)
        ? Math.max(0, ...prev.map((e) => e.id)) + 1
        : normalized.id;
      const { sample: _sample, ...rest } = normalized;
      return [...prev, { ...rest, id }];
    });
  };

  const updateEvent = (event: IEvent) => {
    const normalized = normalizeEvent(event);
    if (!normalized) throw new Error("Invalid event");
    // an event the user changed is theirs now, not a sample
    const { sample: _sample, ...updated } = normalized;
    setAllEvents((prev) => prev.map((e) => (e.id === event.id ? updated : e)));
  };

  const removeEvent = (eventId: number) => {
    setAllEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const sampleEventCount = useMemo(
    () => allEvents.filter((e) => e.sample).length,
    [allEvents],
  );

  const removeSampleEvents = () => {
    setAllEvents((prev) => prev.filter((e) => !e.sample));
  };

  const clearFilter = () => {
    setSelectedColors([]);
    setSelectedSubjectId("all");
  };

  const value = {
    selectedDate,
    setSelectedDate: handleSelectDate,
    selectedSubjectId,
    setSelectedSubjectId,
    badgeVariant,
    setBadgeVariant,
    subjects,
    addSubject,
    removeSubject,
    renameSubject,
    deleteSubject,
    mergeSubjects,
    subjectEventCounts,
    selectedColors,
    filterEventsBySelectedColors,
    filterEventsBySelectedSubject,
    events: filteredEvents,
    eventsLoaded,
    sampleEventCount,
    removeSampleEvents,
    view: currentView,
    use24HourFormat,
    toggleTimeFormat,
    startOfDayHour,
    setStartOfDayHour,
    setView,
    agendaModeGroupBy,
    setAgendaModeGroupBy,
    addEvent,
    updateEvent,
    removeEvent,
    clearFilter,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context)
    throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}
