"use client";

import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
  /** Removes a subject the user created. Built-in subjects cannot be removed. */
  removeSubject: (subjectId: ISubject["id"]) => void;
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
/** Older builds kept user subjects under this key (when they were called "topics"). */
const LEGACY_SUBJECTS_STORAGE_KEY = "calendar-topics";
const EVENTS_STORAGE_KEY = "calendar-events";
const EVENTS_STORAGE_VERSION = 1;
const NO_SUBJECT: ISubject = { id: "subject-none", name: "No subject" };

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

  // Subjects the user created. Loaded after mount so server and client render the same HTML.
  const [customSubjects, setCustomSubjects] = useState<ISubject[]>([]);
  useEffect(() => {
    try {
      let raw = window.localStorage.getItem(SUBJECTS_STORAGE_KEY);
      let fromLegacy = false;
      if (raw === null) {
        raw = window.localStorage.getItem(LEGACY_SUBJECTS_STORAGE_KEY);
        fromLegacy = raw !== null;
      }
      const parsed = raw ? (JSON.parse(raw) as ISubject[]) : [];
      if (Array.isArray(parsed)) {
        const list = parsed
          .filter((t) => t && typeof t.id === "string" && typeof t.name === "string")
          .map((t) => ({ id: t.id, name: t.name, custom: true }));
        setCustomSubjects(list);
        if (fromLegacy) {
          // move subjects saved by the older "topics" build to the new key
          window.localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(list));
          window.localStorage.removeItem(LEGACY_SUBJECTS_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn("Could not read saved subjects", error);
    }
  }, []);

  const saveCustomSubjects = (next: ISubject[]) => {
    setCustomSubjects(next);
    try {
      window.localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn("Could not save subjects", error);
    }
  };

  const subjects = useMemo(
    () => [...defaultSubjects, ...customSubjects],
    [defaultSubjects, customSubjects],
  );

  const addSubject = (rawName: string) => {
    const name = rawName.replace(/\s+/g, " ").trim().slice(0, SUBJECT_NAME_MAX);
    if (!name) return null;
    const existing = subjects.find(
      (t) => t.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (existing) return { subject: existing, created: false };
    // Re-creating a deleted subject reconnects the events that still carry it.
    const orphan = allEvents.find(
      (e) =>
        e.subject.id !== NO_SUBJECT.id &&
        e.subject.name.toLocaleLowerCase() === name.toLocaleLowerCase() &&
        !subjects.some((t) => t.id === e.subject.id),
    )?.subject;
    const subject: ISubject = orphan ? { id: orphan.id, name, custom: true } : {
      id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      custom: true,
    };
    saveCustomSubjects([...customSubjects, subject]);
    return { subject, created: true };
  };

  const removeSubject = (subjectId: ISubject["id"]) => {
    const removed = customSubjects.find((t) => t.id === subjectId);
    saveCustomSubjects(customSubjects.filter((t) => t.id !== subjectId));
    const used = allEvents.filter((e) => e.subject.id === subjectId).length;
    if (removed && used > 0) {
      toast.info(
        `Subject removed. ${used} event${used === 1 ? "" : "s"} keep "${removed.name}" until you pick another subject.`,
      );
    }
    if (selectedSubjectId === subjectId) setSelectedSubjectId("all");
  };

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

  const setView = (newView: TCalendarView) => {
    setCurrentViewState(newView);
    updateSettings({ view: newView });
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
