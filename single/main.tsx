import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { CalendarBody } from "@/features/calendar/calendar-body";
import { ManageSubjectsDialog } from "@/features/calendar/subjects/manage-subjects";
import { CalendarProvider } from "@/features/calendar/contexts/calendar-context";
import { DndProvider } from "@/features/calendar/contexts/dnd-context";
import { CalendarHeader } from "@/features/calendar/header/calendar-header";
import { CALENDAR_ITEMS_MOCK, SUBJECTS_MOCK } from "@/features/calendar/mocks";

// Entry point for the single-file build (npm run build:single).
// Same tree as src/app/layout.tsx + src/features/calendar/calendar.tsx,
// rendered fully in the browser, without the Next.js server.
function App() {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<main className="h-dvh w-full overflow-hidden">
				<CalendarProvider
					events={CALENDAR_ITEMS_MOCK}
					subjects={SUBJECTS_MOCK}
					view="month"
				>
					<DndProvider>
						<div className="flex h-dvh w-full flex-col">
							<div className="shrink-0">
								<CalendarHeader />
							</div>
							<div className="min-h-0 flex-1">
								<CalendarBody />
							</div>
						</div>
						<ManageSubjectsDialog />
					</DndProvider>
				</CalendarProvider>
			</main>
			<Toaster richColors closeButton position="top-center" />
		</ThemeProvider>
	);
}

const rootEl = document.getElementById("root");
if (rootEl) {
	createRoot(rootEl).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}
