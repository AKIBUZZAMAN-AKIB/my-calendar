import { z } from "zod/v4";

export const eventSchema = z.object({
	title: z.string().trim().min(1, "Title is required").max(300, "Keep the title under 300 characters"),
	description: z.string().max(5000).optional().default(""),
	subjectId: z.string().min(1, "Choose a subject"),
	startDate: z.date("Start date is required"),
	endDate: z.date("End date is required"),
	color: z.enum(["blue", "green", "red", "yellow", "purple", "orange"]),
}).refine((v) => v.endDate.getTime() >= v.startDate.getTime(), {
	message: "End must be after the start",
	path: ["endDate"],
});

export type TEventFormData = z.input<typeof eventSchema>;
