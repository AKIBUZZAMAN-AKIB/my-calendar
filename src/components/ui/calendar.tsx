"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";
import { DayPicker } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Month grid for the date picker (react-day-picker v9 class names).
 * 7 × 38px days + padding = 282px, so it fits a 360px phone with room to spare.
 */
function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	...props
}: React.ComponentProps<typeof DayPicker>) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn("p-3", className)}
			classNames={{
				root: "relative w-fit",
				months: "flex flex-col",
				month: "flex flex-col gap-2",
				nav: "absolute inset-x-2 top-2 z-10 flex items-center justify-between",
				button_previous: cn(
					buttonVariants({ variant: "ghost" }),
					"size-8 p-0 text-muted-foreground",
				),
				button_next: cn(
					buttonVariants({ variant: "ghost" }),
					"size-8 p-0 text-muted-foreground",
				),
				month_caption: "flex h-8 items-center justify-center",
				caption_label: "text-sm font-semibold",
				month_grid: "border-collapse",
				weekdays: "flex",
				weekday:
					"w-[38px] text-center text-[11px] font-medium text-muted-foreground",
				week: "mt-1 flex",
				day: "size-[38px] p-0 text-center text-sm",
				day_button: cn(
					buttonVariants({ variant: "ghost" }),
					"size-[38px] rounded-full p-0 font-normal tabular-nums",
				),
				selected:
					"[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
				today: "[&>button]:ring-1 [&>button]:ring-primary/50",
				outside: "text-muted-foreground/60",
				disabled: "opacity-40",
				hidden: "invisible",
				...classNames,
			}}
			components={{
				Chevron: ({ orientation }) =>
					orientation === "left" ? (
						<ChevronLeft className="size-4" />
					) : (
						<ChevronRight className="size-4" />
					),
			}}
			{...props}
		/>
	);
}

export { Calendar };
