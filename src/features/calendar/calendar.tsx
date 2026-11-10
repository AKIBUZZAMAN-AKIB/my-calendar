import React from "react";
import { CalendarBody } from "@/features/calendar/calendar-body";
import { CalendarProvider } from "@/features/calendar/contexts/calendar-context";
import { DndProvider } from "@/features/calendar/contexts/dnd-context";
import { CalendarHeader } from "@/features/calendar/header/calendar-header";
import { getEvents, getUsers } from "@/features/calendar/requests";

async function getCalendarData() {
  return {
    events: await getEvents(),
    users: await getUsers(),
  };
}

export async function Calendar() {
  const { events, users } = await getCalendarData();

  return (
    <CalendarProvider events={events} users={users} view="month">
      <DndProvider>
        <div className="flex h-dvh w-full flex-col">
          <div className="shrink-0">
            <CalendarHeader />
          </div>
          <div className="min-h-0 flex-1">
            <CalendarBody />
          </div>
        </div>
      </DndProvider>
    </CalendarProvider>
  );
}
