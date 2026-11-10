"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { AddEditEventDialog } from "@/features/calendar/dialogs/add-edit-event-dialog";
import { DateNavigator } from "@/features/calendar/header/date-navigator";
import FilterEvents from "@/features/calendar/header/filter";
import { TodayButton } from "@/features/calendar/header/today-button";
import { Settings } from "@/features/calendar/settings/settings";
import Views from "./view-tabs";

/**
 * Phone  (< 640px):  row 1  ‹ November 2026 ▾ ›            [today]
 *                    row 2  [▦ Month | ▤ ▥ ▧ ☰]  [filter] [⚙]
 *                    + floating "+" button for Add Event
 * Tablet (640–1023): same two rows, Add Event button in row 1
 * Desktop (≥ 1024):  one row with everything
 */
export function CalendarHeader() {
  const { view, events } = useCalendar();

  return (
    <>
      <header className="flex flex-col gap-2 border-b px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <TodayButton className="order-2 ml-auto lg:order-none lg:ml-0" />
          <div className="order-1 min-w-0 lg:order-none">
            <DateNavigator view={view} events={events} />
          </div>
          <AddEditEventDialog>
            <Button className="order-3 hidden h-10 sm:inline-flex lg:hidden">
              <Plus className="size-4" />
              Add Event
            </Button>
          </AddEditEventDialog>
        </div>

        <div className="flex min-w-0 items-center gap-1.5">
          <Views className="flex-1 lg:flex-none" />
          <FilterEvents />
          <AddEditEventDialog>
            <Button className="hidden h-10 lg:inline-flex">
              <Plus className="size-4" />
              Add Event
            </Button>
          </AddEditEventDialog>
          <Settings />
        </div>
      </header>

      <AddEditEventDialog>
        <Button
          size="icon"
          aria-label="Add event"
          data-fab="add"
          className="fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] right-4 z-40 size-14 rounded-full shadow-lg shadow-primary/30 active:scale-95 sm:hidden"
        >
          <Plus className="size-6" />
        </Button>
      </AddEditEventDialog>
    </>
  );
}
