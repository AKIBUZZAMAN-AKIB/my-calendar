import { Suspense } from "react";
import { Calendar } from "@/features/calendar/calendar";
import { CalendarSkeleton } from "@/features/calendar/skeletons/calendar-skeleton";

export default function CalendarPage() {
	return (
		<main className="h-dvh w-full overflow-hidden">
			<Suspense fallback={<CalendarSkeleton />}>
				<Calendar />
			</Suspense>
		</main>
	);
}
