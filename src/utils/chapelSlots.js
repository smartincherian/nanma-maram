import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export const DATE_FORMAT = "YYYY-MM-DD";
export const DAYS_BEFORE = 2;
export const DAYS_AFTER = 30;
export const SLOT_LENGTH_OPTIONS = [15, 30, 60];
export const FIELD_TYPES = ["text", "number", "phone"];

export const getToday = () => dayjs().startOf("day");

export const formatDateKey = (date) => dayjs(date).format(DATE_FORMAT);

// Parse a "YYYY-MM-DD" string into a start-of-day dayjs.
// Returns null when the input is missing or unparseable.
export const parseDateKey = (value) => {
  if (!value) return null;
  const parsed = dayjs(value, DATE_FORMAT, true);
  return parsed.isValid() ? parsed.startOf("day") : null;
};

export const formatDateLabel = (date) => dayjs(date).format("ddd, MMM D, YYYY");

// All slots for a day, stepping by slotMinutes from 00:00 up to (but not
// including) the end of day. Each slot: { key: "HH:mm", label, endLabel }.
export const generateSlots = (slotMinutes) => {
  const step = SLOT_LENGTH_OPTIONS.includes(slotMinutes) ? slotMinutes : 30;
  const slots = [];
  const dayStart = dayjs().startOf("day");
  for (let minutes = 0; minutes < 24 * 60; minutes += step) {
    const start = dayStart.add(minutes, "minute");
    const end = dayStart.add(minutes + step, "minute");
    slots.push({
      key: start.format("HH:mm"),
      label: start.format("h:mm A"),
      endLabel: end.format("h:mm A"),
    });
  }
  return slots;
};

// The inclusive [start, end] range (start-of-day dayjs values) for which the
// event accepts bookings.
export const getBookableWindow = (event, now = dayjs()) => {
  const today = now.startOf("day");
  if (event?.mode === "range") {
    const start = parseDateKey(event.startDate) || today;
    const end = parseDateKey(event.endDate) || start;
    return { start, end };
  }
  return {
    start: today.subtract(DAYS_BEFORE, "day"),
    end: today.add(DAYS_AFTER, "day"),
  };
};

export const isDateBookable = (event, date, now = dayjs()) => {
  if (!date) return false;
  const target = dayjs(date).startOf("day");
  const { start, end } = getBookableWindow(event, now);
  return target.isSameOrAfter(start, "day") && target.isSameOrBefore(end, "day");
};

// The date the booking page should open on when the URL has no date.
export const getDefaultDate = (event, now = dayjs()) => {
  const today = now.startOf("day");
  if (event?.mode === "range") {
    const { start, end } = getBookableWindow(event, now);
    if (today.isSameOrAfter(start, "day") && today.isSameOrBefore(end, "day")) {
      return today;
    }
    return start;
  }
  return today;
};
