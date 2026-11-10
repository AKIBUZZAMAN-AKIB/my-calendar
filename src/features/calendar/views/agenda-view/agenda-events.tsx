import { format, isToday, parseISO } from "date-fns";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, SearchIcon } from "lucide-react";
import { type FC, useDeferredValue, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { EventDetailsDialog } from "@/features/calendar/dialogs/event-details-dialog";
import {
  formatTime,
  getEventsForMonth,
  toCapitalize,
} from "@/features/calendar/helpers";
import { SubjectIcon } from "@/features/calendar/subjects/subject-icon";
import { cn } from "@/lib/utils";

const stripe: Record<string, string> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  red: "bg-red-600",
  yellow: "bg-yellow-500",
  purple: "bg-purple-600",
  orange: "bg-orange-600",
};

const tint: Record<string, string> = {
  blue: "bg-blue-50 dark:bg-blue-950/40",
  green: "bg-green-50 dark:bg-green-950/40",
  red: "bg-red-50 dark:bg-red-950/40",
  yellow: "bg-yellow-50 dark:bg-yellow-950/40",
  purple: "bg-purple-50 dark:bg-purple-950/40",
  orange: "bg-orange-50 dark:bg-orange-950/40",
};

export const AgendaEvents: FC = () => {
  const {
    events,
    use24HourFormat,
    badgeVariant,
    agendaModeGroupBy,
    selectedDate,
  } = useCalendar();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Plain list + own search (was cmdk, whose auto-select scrolled the page and
  // re-sorted every item on mount, slowing the switch to Agenda).
  const monthEvents = useMemo(
    () =>
      getEventsForMonth(events, selectedDate)
        .map((e) => ({ e, t: parseISO(e.startDate).getTime() }))
        .sort((a, b) => a.t - b.t)
        .map((x) => x.e),
    [events, selectedDate],
  );

  const deferredSearch = useDeferredValue(search);
  const query = deferredSearch.trim().toLowerCase();

  const groups = useMemo(() => {
    const shown = query
      ? monthEvents.filter((event) =>
          `${event.title} ${event.description} ${event.subject.name}`
            .toLowerCase()
            .includes(query),
        )
      : monthEvents;
    const grouped = Object.groupBy(shown, (event) =>
      agendaModeGroupBy === "date"
        ? format(parseISO(event.startDate), "yyyy-MM-dd")
        : event.color,
    );
    // keys are yyyy-MM-dd or colour names: both sort as text
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [monthEvents, query, agendaModeGroupBy]);

  const searching = query.length > 0;
  const allCollapsed = groups.length > 0 && collapsed.size >= groups.length;

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="h-auto" data-agenda>
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/95 px-2 py-2 backdrop-blur sm:px-4">
        <div className="min-w-0 flex-1 [&_[data-slot=command-input-wrapper]]:h-10 [&_[data-slot=command-input-wrapper]]:rounded-lg [&_[data-slot=command-input-wrapper]]:border [&_[data-slot=command-input-wrapper]]:border-b">
          <div data-slot="command-input-wrapper" className="flex h-9 items-center gap-2 rounded-md border px-3">
            <SearchIcon className="size-4 shrink-0 opacity-50" />
            <input
              type="search"
              data-slot="command-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${monthEvents.length} events…`}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-base outline-hidden placeholder:text-muted-foreground sm:text-sm [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 shrink-0"
          aria-label={allCollapsed ? "Expand all groups" : "Collapse all groups"}
          title={allCollapsed ? "Expand all" : "Collapse all"}
          data-agenda-toggle-all
          onClick={() =>
            setCollapsed(allCollapsed ? new Set() : new Set(groups.map(([k]) => k)))
          }
        >
          {allCollapsed ? <ChevronsUpDown className="size-4" /> : <ChevronsDownUp className="size-4" />}
        </Button>
      </div>

      <div role="list" className="px-2 pb-24 sm:px-4 sm:pb-6">
        {groups.map(([key, groupEvents]) => {
          const isCollapsed = !searching && collapsed.has(key);
          const today = agendaModeGroupBy === "date" && isToday(parseISO(key));
          const heading = agendaModeGroupBy === "date" ? (
            <span className="flex items-baseline gap-2">
              <span className={cn("text-sm font-semibold text-foreground", today && "text-primary")}>
                {today ? "Today" : format(parseISO(key), "EEE, MMM d")}
              </span>
              {today && (
                <span className="text-xs text-muted-foreground">{format(parseISO(key), "EEE, MMM d")}</span>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className={cn("size-2.5 rounded-full", stripe[key])} />
              {toCapitalize(key)}
            </span>
          );

          return (
            <section key={key} role="group">
                <button
                  type="button"
                  data-agenda-group={key}
                  aria-expanded={!isCollapsed}
                  onClick={() => toggle(key)}
                  className="sticky top-14 flex w-full items-center justify-between gap-2 bg-background py-2 pl-1 pr-2 text-left"
                >
                  {heading}
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {groupEvents!.length}
                    <ChevronDown
                      className={cn("size-4 transition-transform", isCollapsed && "-rotate-90")}
                    />
                  </span>
                </button>
              {groupEvents!.map((event) => (
                <div
                  key={event.id}
                  role="listitem"
                  className={cn(
                    "mb-1.5 rounded-lg border p-0 hover:bg-accent/50",
                    isCollapsed && "hidden",
                  )}
                >
                  <EventDetailsDialog event={event}>
                    <div
                      data-agenda-event={event.id}
                      className={cn(
                        "flex min-h-14 w-full min-w-0 cursor-pointer items-stretch gap-3 overflow-hidden rounded-lg p-2.5",
                        badgeVariant === "colored" && tint[event.color],
                      )}
                    >
                      <div className="flex w-14 shrink-0 flex-col justify-center text-xs tabular-nums sm:w-20 sm:text-sm">
                        {agendaModeGroupBy === "date" ? (
                          <>
                            <span className="font-medium">{formatTime(event.startDate, use24HourFormat)}</span>
                            <span className="text-muted-foreground">{formatTime(event.endDate, use24HourFormat)}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium">{format(parseISO(event.startDate), "MMM d")}</span>
                            <span className="text-muted-foreground">{formatTime(event.startDate, use24HourFormat)}</span>
                          </>
                        )}
                      </div>
                      <span className={cn("w-1 shrink-0 rounded-full", stripe[event.color])} />
                      <div className="flex min-w-0 flex-1 flex-col justify-center">
                        <p className="truncate text-sm font-medium" title={event.title}>{event.title}</p>
                        <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                          <span data-agenda-subject className="max-w-[60%] shrink-0 truncate font-medium" title={event.subject.name}>
                            {event.subject.name}
                          </span>
                          {event.description && (
                            <>
                              <span aria-hidden className="shrink-0">·</span>
                              <span className="min-w-0 truncate">{event.description}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <SubjectIcon subject={event.subject} className="size-7 self-center" />
                    </div>
                  </EventDetailsDialog>
                </div>
              ))}
            </section>
          );
        })}
        {groups.length === 0 && (
          <p className="py-6 text-center text-sm">No events found.</p>
        )}
      </div>
    </div>
  );
};
