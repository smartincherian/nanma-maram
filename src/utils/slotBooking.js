import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

const IST_TIMEZONE = "Asia/Kolkata";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

dayjs.tz.setDefault(IST_TIMEZONE);

const getIstNow = () => dayjs().tz(IST_TIMEZONE);

const getWeekWindow = (reference) => {
  const base = (reference || getIstNow()).tz(IST_TIMEZONE);
  const dayOfWeek = base.day(); // 0 = Sunday
  const start = base.subtract(dayOfWeek, "day").startOf("day");
  const end = start.add(13, "day").endOf("day");
  return { start, end };
};

const getWeekDays = (start, end) => {
  const days = [];
  let cursor = start.startOf("day");
  while (cursor.isSameOrBefore(end, "day")) {
    days.push(cursor);
    cursor = cursor.add(1, "day");
  }
  return days;
};

const generateSlotsForDate = (date, durationMinutes, stepMinutes = 30) => {
  if (!date) return [];
  const slots = [];
  const dayStart = date.startOf("day");
  const dayEnd = date.endOf("day");
  let cursor = dayStart;
  while (cursor.isSameOrBefore(dayEnd, "minute")) {
    const slotStart = cursor;
    const slotEnd = cursor.add(durationMinutes, "minute");
    slots.push({
      start: slotStart,
      end: slotEnd,
      label: `${slotStart.format("h:mm A")} - ${slotEnd.format("h:mm A")}`,
      startMs: slotStart.valueOf(),
      endMs: slotEnd.valueOf(),
    });
    cursor = cursor.add(stepMinutes, "minute");
  }
  return slots;
};

const isOverlapping = (startA, endA, startB, endB) =>
  startA < endB && endA > startB;

const mergeConsecutiveSlots = (slots) => {
  if (!slots.length) return [];
  const sorted = [...slots].sort((a, b) => a.startMs - b.startMs);
  const merged = [];
  let current = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i += 1) {
    const next = sorted[i];
    if (current.endMs === next.startMs) {
      current = {
        ...current,
        endMs: next.endMs,
        end: next.end,
        label: `${current.start.format("h:mm A")} - ${next.end.format(
          "h:mm A"
        )}`,
      };
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
};

const formatDateLabel = (date) => date.format("ddd, MMM D");

export {
  IST_TIMEZONE,
  getIstNow,
  getWeekWindow,
  getWeekDays,
  generateSlotsForDate,
  isOverlapping,
  mergeConsecutiveSlots,
  formatDateLabel,
};
