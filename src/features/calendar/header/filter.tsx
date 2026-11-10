"use client";

import { CheckIcon, Filter, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { AdaptivePanel } from "@/features/calendar/header/adaptive-panel";
import { SubjectPicker } from "@/features/calendar/subjects/subject-picker";
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
 * One filter button for both subjects and colours.
 * Popover on desktop, bottom sheet on phones.
 */
export default function FilterEvents() {
  const {
    selectedSubjectId,
    filterEventsBySelectedSubject,
    selectedColors,
    filterEventsBySelectedColors,
    clearFilter,
  } = useCalendar();

  const activeCount =
    selectedColors.length + (selectedSubjectId && selectedSubjectId !== "all" ? 1 : 0);

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
        <section className="flex flex-col gap-1.5" data-filter-subjects>
          <h3 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Subjects
          </h3>
          <SubjectPicker
            value={selectedSubjectId}
            onChange={filterEventsBySelectedSubject}
            includeAll
            allowRemove
          />
        </section>

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
