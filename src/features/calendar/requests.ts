import {
	CALENDAR_ITEMS_MOCK,
	SUBJECTS_MOCK,
} from "@/features/calendar/mocks";

export const getEvents = async () => {
	return CALENDAR_ITEMS_MOCK;
};

export const getSubjects = async () => {
	return SUBJECTS_MOCK;
};
