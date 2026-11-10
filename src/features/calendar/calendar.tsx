import React from "react";
import { CalendarBody } from "@/features/calendar/calendar-body";
import { ClientOnly } from "@/features/calendar/client-only";
import { CalendarProvider } from "@/features/calendar/contexts/calendar-context";
import { DndProvider } from "@/features/calendar/contexts/dnd-context";
import { CalendarHeader } from "@/features/calendar/header/calendar-header";
import { getEvents, getSubjects } from "@/features/calendar/requests";

async function getCalendarData() {
  return {
    events: await getEvents(),
    subjects: await getSubjects(),
  };
}

export async function Calendar() {
  const { events, subjects } = await getCalendarData();

  return (
    <CalendarProvider events={events} subjects={subjects} view="month">
      <DndProvider>
        <ClientOnly>
        <div className="flex h-dvh w-full flex-col">
          <div className="shrink-0">
            <CalendarHeader />
          </div>
          <div className="min-h-0 flex-1">
            <CalendarBody />
          </div>
        </div>
        </ClientOnly>
      </DndProvider>
    </CalendarProvider>
  );
}
