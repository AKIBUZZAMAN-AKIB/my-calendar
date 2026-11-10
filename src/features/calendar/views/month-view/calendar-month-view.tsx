import { endOfMonth, startOfMonth } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";

import {
	calculateMonthEventPositions,
	getMonthCellEventsMap,
	getCalendarCells,
} from "@/features/calendar/helpers";

import type { IEvent } from "@/features/calendar/interfaces";
import { DayCell } from "@/features/calendar/views/month-view/day-cell";
import { chipHeight } from "@/features/calendar/views/month-view/month-event-badge";

/**
 * Phones: 2 text lines per chip when every week row has the height for three
 * 2-line chips and the "+N more" line without growing; else 1 line.
 * A row holds: top padding 4 + date 20 + gap 2, three chips with 2px gaps,
 * "+N more" 13, bottom padding 4.
 */
function linesThatFit(rowHeight: number) {
	let lines = 1;
	for (const l of [2, 3]) {
		if (4 + 20 + 2 + 3 * chipHeight(l) + 2 * 2 + 13 + 4 <= rowHeight) lines = l;
	}
	return lines;
}

const NO_EVENTS: ReturnType<typeof getMonthCellEventsMap> extends Map<string, infer V> ? V : never = [];

interface IProps {
	singleDayEvents: IEvent[];
	multiDayEvents: IEvent[];
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({ singleDayEvents, multiDayEvents }: IProps) {
	const { selectedDate } = useCalendar();

	const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);
	const monthStart = useMemo(() => startOfMonth(selectedDate), [selectedDate]);
	const monthEnd = useMemo(() => endOfMonth(selectedDate), [selectedDate]);
	const rows = Math.ceil(cells.length / 7);

	const rootRef = useRef<HTMLDivElement>(null);
	const headRef = useRef<HTMLDivElement>(null);
	const [lines, setLines] = useState(1);
	useEffect(() => {
		const root = rootRef.current;
		const scroller = root?.parentElement;
		if (!root || !scroller) return;
		const update = () => {
			if (window.innerWidth >= 1024) return setLines(1);
			const free = scroller.clientHeight - (headRef.current?.offsetHeight ?? 0);
			setLines(linesThatFit(Math.floor(free / rows)));
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(scroller);
		return () => ro.disconnect();
	}, [rows]);

	const eventPositions = useMemo(
		() =>
			calculateMonthEventPositions(
				multiDayEvents,
				singleDayEvents,
				selectedDate,
			),
		[multiDayEvents, singleDayEvents, selectedDate],
	);

	const cellEvents = useMemo(
		() =>
			getMonthCellEventsMap(
				cells,
				[...multiDayEvents, ...singleDayEvents],
				eventPositions,
			),
		[cells, multiDayEvents, singleDayEvents, eventPositions],
	);

	return (
		<div
			ref={rootRef}
			data-chip-lines={lines}
			className="flex min-h-full flex-col"
		>
			<div ref={headRef} className="sticky top-0 z-20 grid grid-cols-7 bg-background">
				{WEEK_DAYS.map((day, index) => (
					<div
						key={day}
						className="flex items-center justify-center py-1.5 lg:py-2"
					>
						<span className="text-xs font-medium text-t-quaternary">{day}</span>
					</div>
				))}
			</div>

			<div className="grid flex-1 auto-rows-fr grid-cols-7 overflow-hidden">
				{cells.map((cell) => (
					<DayCell
						key={cell.date.toISOString()}
						cell={cell}
						cellEvents={cellEvents.get(cell.date.toISOString()) ?? NO_EVENTS}
						lines={lines}
						monthStart={monthStart}
						monthEnd={monthEnd}
					/>
				))}
			</div>
		</div>
	);
}
