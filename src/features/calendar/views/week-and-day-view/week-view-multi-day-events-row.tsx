import {
	addDays,
	differenceInDays,
	endOfWeek,
	isAfter,
	isBefore,
	parseISO,
	startOfWeek,
} from "date-fns";
import type { VariantProps } from "class-variance-authority";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type CSSProperties, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { EventDetailsDialog } from "@/features/calendar/dialogs/event-details-dialog";
import { DraggableEvent } from "@/features/calendar/dnd/draggable-event";
import type { IEvent } from "@/features/calendar/interfaces";
import { EventBullet } from "@/features/calendar/views/month-view/event-bullet";
import { eventBadgeVariants } from "@/features/calendar/views/month-view/month-event-badge";

interface IProps {
	selectedDate: Date;
	multiDayEvents: IEvent[];
	/** Column template shared with the hour grid, so the rows line up when it scrolls sideways. */
	gridStyle?: CSSProperties;
}

export function WeekViewMultiDayEventsRow({
	selectedDate,
	multiDayEvents,
	gridStyle,
}: IProps) {
	const weekStart = startOfWeek(selectedDate);
	const weekEnd = endOfWeek(selectedDate);
	const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

	const processedEvents = useMemo(() => {
		return multiDayEvents
			.map((event) => {
				const start = parseISO(event.startDate);
				const end = parseISO(event.endDate);
				const adjustedStart = isBefore(start, weekStart) ? weekStart : start;
				const adjustedEnd = isAfter(end, weekEnd) ? weekEnd : end;
				const startIndex = differenceInDays(adjustedStart, weekStart);
				const endIndex = differenceInDays(adjustedEnd, weekStart);

				return {
					...event,
					adjustedStart,
					adjustedEnd,
					startIndex,
					endIndex,
				};
			})
			// only events that touch this week
			.filter((e) => e.startIndex <= 6 && e.endIndex >= 0 && e.startIndex <= e.endIndex)
			.sort((a, b) => {
				const startDiff = a.adjustedStart.getTime() - b.adjustedStart.getTime();
				if (startDiff !== 0) return startDiff;
				return b.endIndex - b.startIndex - (a.endIndex - a.startIndex);
			});
	}, [multiDayEvents, weekStart, weekEnd]);

	const eventRows = useMemo(() => {
		const rows: (typeof processedEvents)[] = [];

		processedEvents.forEach((event) => {
			let rowIndex = rows.findIndex((row) =>
				row.every(
					(e) => e.endIndex < event.startIndex || e.startIndex > event.endIndex,
				),
			);

			if (rowIndex === -1) {
				rowIndex = rows.length;
				rows.push([]);
			}

			rows[rowIndex].push(event);
		});

		return rows;
	}, [processedEvents]);

	const hasEventsInWeek = useMemo(() => {
		return multiDayEvents.some((event) => {
			const start = parseISO(event.startDate);
			const end = parseISO(event.endDate);

			return (
				// Event starts within the week
				(start >= weekStart && start <= weekEnd) ||
				// Event ends within the week
				(end >= weekStart && end <= weekEnd) ||
				// Event spans the entire week
				(start <= weekStart && end >= weekEnd)
			);
		});
	}, [multiDayEvents, weekStart, weekEnd]);

	if (!hasEventsInWeek) {
		return null;
	}

	const rowCount = eventRows.length;

	return (
		<div className="flex">
			<div className="sticky left-0 z-20 w-11 shrink-0 border-b border-r bg-background sm:w-18" />
			<div
				data-allday-row
				className="grid min-w-0 flex-1 border-b"
				style={{
					...gridStyle,
					gridTemplateRows: `4px repeat(${rowCount}, auto) 4px`,
					rowGap: 4,
				}}
			>
				{weekDays.map((day, dayIndex) => (
					<div
						key={day.toISOString()}
						aria-hidden
						className={dayIndex === 0 ? "" : "border-l"}
						style={{ gridColumn: dayIndex + 1, gridRow: `1 / ${rowCount + 3}` }}
					/>
				))}
				{eventRows.map((row, rowIndex) =>
					row.map((event) => (
						<WeekSpanBar
							key={event.id}
							event={event}
							gridColumn={`${event.startIndex + 1} / ${event.endIndex + 2}`}
							gridRow={rowIndex + 2}
							continuesBefore={isBefore(parseISO(event.startDate), weekStart)}
							continuesAfter={isAfter(parseISO(event.endDate), weekEnd)}
						/>
					)),
				)}
			</div>
		</div>
	);
}

/**
 * One multi-day event as a single bar across the days it covers this week.
 * Rounded ends and borders where the event really starts or ends; a flat end
 * with an arrow where it goes on into the week before or after. The title
 * sticks to the left edge of the screen while the week scrolls sideways.
 */
function WeekSpanBar({
	event,
	gridColumn,
	gridRow,
	continuesBefore,
	continuesAfter,
}: {
	event: IEvent;
	gridColumn: string;
	gridRow: number;
	continuesBefore: boolean;
	continuesAfter: boolean;
}) {
	const { badgeVariant } = useCalendar();
	const color = (
		badgeVariant === "dot" ? `${event.color}-dot` : event.color
	) as VariantProps<typeof eventBadgeVariants>["color"];

	return (
		<div
			data-span-bar
			className={cn("z-[1] min-w-0", !continuesBefore && "pl-0.5 lg:pl-1", !continuesAfter && "pr-0.5 lg:pr-1")}
			style={{ gridColumn, gridRow }}
		>
			<DraggableEvent event={event} className="w-full">
				<EventDetailsDialog event={event}>
					<button
						type="button"
						data-event-block
						aria-label={event.title}
						className={cn(
							eventBadgeVariants({ color, multiDayPosition: "none" }),
							"h-5 justify-start text-[11px] lg:h-6.5 lg:text-xs",
							continuesBefore && "rounded-l-none border-l-0 pl-0.5",
							continuesAfter && "rounded-r-none border-r-0 pr-0.5",
						)}
						style={{ overflow: "clip" }}
					>
						{continuesBefore && <ChevronLeft aria-hidden className="size-3 shrink-0 opacity-70" />}
						<span
							className="sticky left-12 flex min-w-0 shrink items-center gap-1 sm:left-20"
							// as wide as the title needs, at most the visible part of the week,
							// so it can slide along the bar and stay readable while scrolling
							style={{ maxWidth: "min(100%, calc(var(--tg-vis, 100vw) - 16px))" }}
						>
							{badgeVariant === "dot" && <EventBullet color={event.color} />}
							<span data-event-title className="min-w-0 truncate font-semibold">
								{event.title}
							</span>
						</span>
						{continuesAfter && <ChevronRight aria-hidden className="size-3 shrink-0 opacity-70" />}
					</button>
				</EventDetailsDialog>
			</DraggableEvent>
		</div>
	);
}
