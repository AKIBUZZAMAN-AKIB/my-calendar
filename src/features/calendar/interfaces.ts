import type { TEventColor } from "@/features/calendar/types";

/** The subject (study subject, work area, group) an event belongs to. Replaces the old "people". */
export interface ISubject {
	id: string;
	name: string;
	/** true for subjects the user created in the app (kept in localStorage). */
	custom?: boolean;
}

export interface IEvent {
	id: number;
	startDate: string;
	endDate: string;
	title: string;
	color: TEventColor;
	description: string;
	subject: ISubject;
	/** true for the starter sample events (they can be removed in one go in Settings). */
	sample?: boolean;
}

export interface ICalendarCell {
	day: number;
	currentMonth: boolean;
	date: Date;
}
