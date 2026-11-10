import { format, isToday, parseISO } from "date-fns";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { type FC, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { EventDetailsDialog } from "@/features/calendar/dialogs/event-details-dialog";
import {
  formatTime,
  getEventsForMonth,
  toCapitalize,
} from "@/features/calendar/helpers";
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

  const monthEvents = getEventsForMonth(events, selectedDate).sort(
    (a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime(),
  );

  const agendaEvents = Object.groupBy(monthEvents, (event) =>
    agendaModeGroupBy === "date"
      ? format(parseISO(event.startDate), "yyyy-MM-dd")
      : event.color,
  );

  const groups = Object.entries(agendaEvents).sort((a, b) =>
    agendaModeGroupBy === "date"
      ? new Date(a[0]).getTime() - new Date(b[0]).getTime()
      : a[0].localeCompare(b[0]),
  );

  const searching = search.trim().length > 0;
  const allCollapsed = groups.length > 0 && collapsed.size >= groups.length;

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <Command
      filter={(value, q) => (value.toLowerCase().includes(q.trim().toLowerCase()) ? 1 : 0)}
      className="h-auto overflow-visible rounded-none bg-transparent" data-agenda>
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/95 px-2 py-2 backdrop-blur sm:px-4">
        <div className="min-w-0 flex-1 [&_[data-slot=command-input-wrapper]]:h-10 [&_[data-slot=command-input-wrapper]]:rounded-lg [&_[data-slot=command-input-wrapper]]:border [&_[data-slot=command-input-wrapper]]:border-b">
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={`Search ${monthEvents.length} events…`}
            className="text-base sm:text-sm"
          />
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

      <CommandList className="max-h-none overflow-visible px-2 pb-24 sm:px-4 sm:pb-6">
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
            <CommandGroup
              key={key}
              className="overflow-visible p-0 [&_[cmdk-group-heading]]:p-0"
              heading={
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
              }
            >
              {groupEvents!.map((event) => (
                <CommandItem
                  key={event.id}
                  value={`${event.title} ${event.description} ${event.user.name} ${event.id}`}
                  className={cn(
                    "mb-1.5 rounded-lg border p-0 data-[selected=true]:bg-accent/50",
                    isCollapsed && "hidden",
                  )}
                >
                  <EventDetailsDialog event={event}>
                    <div
                      data-agenda-event={event.id}
                      className={cn(
                        "flex min-h-14 w-full cursor-pointer items-stretch gap-3 rounded-lg p-2.5",
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
                        <p className="truncate text-sm font-medium">{event.title}</p>
                        {event.description && (
                          <p className="truncate text-xs text-muted-foreground">{event.description}</p>
                        )}
                      </div>
                      <Avatar className="size-7 shrink-0 self-center">
                        <AvatarImage src={event.user.picturePath ?? undefined} alt={event.user.name} />
                        <AvatarFallback className="text-[10px]">
                          {event.user.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </EventDetailsDialog>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
        <CommandEmpty>No events found.</CommandEmpty>
      </CommandList>
    </Command>
  );
};
