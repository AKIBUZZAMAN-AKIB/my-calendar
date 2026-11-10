"use client";

import { CheckIcon, Filter, RefreshCcw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { AdaptivePanel } from "@/features/calendar/header/adaptive-panel";
import { useMediaQuery } from "@/features/calendar/hooks";
import type { TEventColor } from "@/features/calendar/types";
import { cn } from "@/lib/utils";

const colors: TEventColor[] = [
  "blue",
  "green",
  "red",
  "yellow",
  "purple",
  "orange",
];

const swatch: Record<TEventColor, string> = {
  blue: "bg-blue-600 dark:bg-blue-700",
  green: "bg-green-600 dark:bg-green-700",
  red: "bg-red-600 dark:bg-red-700",
  yellow: "bg-yellow-500 dark:bg-yellow-600",
  purple: "bg-purple-600 dark:bg-purple-700",
  orange: "bg-orange-600 dark:bg-orange-700",
};

/**
 * One filter button for both "who" (user) and "which colours".
 * Popover on desktop, bottom sheet on phones.
 * `showPeople` lets desktop keep its separate user select.
 */
export default function FilterEvents() {
  // On wide screens the header already shows a separate user select.
  const showPeople = !useMediaQuery("(min-width: 1280px)");
  const {
    users,
    selectedUserId,
    filterEventsBySelectedUser,
    selectedColors,
    filterEventsBySelectedColors,
    clearFilter,
  } = useCalendar();

  const activeCount =
    selectedColors.length + (selectedUserId && selectedUserId !== "all" ? 1 : 0);

  return (
    <AdaptivePanel
      title="Filter events"
      trigger={
        <Button
          variant="outline"
          size="icon"
          aria-label={`Filter events${activeCount ? ` (${activeCount} active)` : ""}`}
          data-header-btn="filter"
          className={cn("relative size-10 shrink-0", activeCount && "border-primary text-primary")}
        >
          <Filter className="size-4" />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {showPeople && (
          <section className="flex flex-col gap-1.5">
            <h3 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              People
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {[{ id: "all", name: "Everyone", picturePath: null }, ...users].map(
                (user) => {
                  const selected = (selectedUserId ?? "all") === user.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      data-filter-user={user.id}
                      aria-pressed={selected}
                      onClick={() => filterEventsBySelectedUser(user.id)}
                      className={cn(
                        "flex w-16 shrink-0 flex-col items-center gap-1 rounded-lg p-1.5 text-xs transition-colors",
                        selected ? "bg-primary/10 text-primary" : "hover:bg-accent",
                      )}
                    >
                      <Avatar
                        className={cn(
                          "size-10 ring-2 ring-offset-2 ring-offset-background",
                          selected ? "ring-primary" : "ring-transparent",
                        )}
                      >
                        <AvatarImage src={user.picturePath ?? undefined} alt={user.name} />
                        <AvatarFallback className="text-xs">
                          {user.id === "all" ? "All" : user.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="w-full truncate text-center">
                        {user.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-1.5">
          <h3 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Colors
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {colors.map((color) => {
              const selected = selectedColors.includes(color);
              return (
                <button
                  key={color}
                  type="button"
                  data-filter-color={color}
                  aria-pressed={selected}
                  onClick={() => filterEventsBySelectedColors(color)}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-lg border px-2.5 text-sm capitalize transition-colors",
                    selected ? "border-primary bg-primary/10" : "hover:bg-accent",
                  )}
                >
                  <span className={cn("size-3.5 shrink-0 rounded-full", swatch[color])} />
                  <span className="flex-1 text-left">{color}</span>
                  {selected && <CheckIcon className="size-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </section>

        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          disabled={activeCount === 0}
          onClick={clearFilter}
        >
          <RefreshCcw className="size-3.5" />
          Clear filters
        </Button>
      </div>
    </AdaptivePanel>
  );
}
