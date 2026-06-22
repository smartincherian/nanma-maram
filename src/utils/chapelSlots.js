import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(utc);
dayjs.extend(timezone);

export const DATE_FORMAT = "YYYY-MM-DD";
export const DAYS_BEFORE = 2;
export const DAYS_AFTER = 30;
export const SLOT_LENGTH_OPTIONS = [15, 30, 60, 120, 180];

// Whole hours read as "1 hour" / "3 hours"; anything else stays in minutes.
export const formatSlotLength = (mins) => {
  if (mins % 60 === 0) {
    const hours = mins / 60;
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${mins} minutes`;
};
export const FIELD_TYPES = ["text", "number", "phone"];

// The chapel runs on Indian Standard Time, so "today"/"tomorrow" must be the
// IST calendar day for every visitor regardless of their device timezone.
export const IST_TIMEZONE = "Asia/Kolkata";

export const getToday = () => dayjs().tz(IST_TIMEZONE).startOf("day");

// Current instant expressed in IST. The chapel runs on IST, so "now" for the
// elapsed-slot check must be IST regardless of the visitor's device timezone.
export const getIstNow = () => dayjs().tz(IST_TIMEZONE);

const slotKeyToMinutes = (key) => {
  const [h, m] = key.split(":").map(Number);
  return h * 60 + m;
};

// Split a day's slots into { upcoming, elapsed } relative to the current IST
// time, on an hourly boundary. Only "today" has elapsed slots — for any other
// date every slot stays upcoming. The cutoff is the start of the current clock
// hour: a slot is elapsed only if it starts in an earlier hour. So at 3:48 PM
// every slot from 3:00 PM onward stays in "upcoming" (the whole current hour),
// and only 2:30 PM and earlier are elapsed.
export const splitSlotsByElapsed = (slots, date, now = getIstNow()) => {
  if (!dayjs(date).isSame(now, "day")) {
    return { upcoming: slots, elapsed: [] };
  }
  const hourFloorMinutes = now.hour() * 60;
  const upcoming = [];
  const elapsed = [];
  slots.forEach((slot) => {
    (slotKeyToMinutes(slot.key) < hourFloorMinutes ? elapsed : upcoming).push(
      slot
    );
  });
  return { upcoming, elapsed };
};

// Relative date keywords usable in the URL date segment, as day offsets from
// the IST "today".
export const RELATIVE_DATE_KEYWORDS = { today: 0, tomorrow: 1 };

// Resolve a URL date segment into a start-of-day dayjs. Accepts the relative
// keywords in RELATIVE_DATE_KEYWORDS (resolved against IST) or a "YYYY-MM-DD"
// string. Returns null when missing or unrecognised.
export const resolveDateParam = (value) => {
  if (!value) return null;
  const keyword = String(value).trim().toLowerCase();
  if (keyword in RELATIVE_DATE_KEYWORDS) {
    return getToday().add(RELATIVE_DATE_KEYWORDS[keyword], "day");
  }
  return parseDateKey(value);
};

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
export const getBookableWindow = (event, now = getToday()) => {
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

export const isDateBookable = (event, date, now = getToday()) => {
  if (!date) return false;
  const target = dayjs(date).startOf("day");
  const { start, end } = getBookableWindow(event, now);
  return target.isSameOrAfter(start, "day") && target.isSameOrBefore(end, "day");
};

// Weekdays, Sunday-first, matching dayjs's day() integers (0=Sun … 6=Sat).
// Used by the reservation editor's day picker and the collapsed-card label.
export const WEEKDAYS = [
  { value: 0, short: "Sun", long: "Sunday" },
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
];

// Human label for a reservation's days: "Every day" when none chosen, else the
// short names in Sunday-first order regardless of input order ("Tue, Thu").
export const formatReservedDays = (days) => {
  if (!Array.isArray(days) || days.length === 0) return "Every day";
  return WEEKDAYS.filter((d) => days.includes(d.value))
    .map((d) => d.short)
    .join(", ");
};

// Map of every admin-reserved start-time key to the name it is reserved for.
// Reservations are pure event config. Each entry may scope itself to specific
// weekdays via `days` (dayjs ints); an empty/absent list means every day.
// When `date` is given, only reservations matching that weekday are included;
// when omitted, the day filter is skipped (every reservation counts). If two
// reservations name the same slotKey, the later entry wins. Blank names ignored.
export const getReservedNames = (event, date) => {
  const weekday = date ? dayjs(date).day() : null;
  const map = {};
  (event?.reservations || []).forEach((reservation) => {
    const name = String(reservation?.name || "").trim();
    if (!name) return;
    const days = Array.isArray(reservation?.days) ? reservation.days : [];
    if (weekday !== null && days.length && !days.includes(weekday)) return;
    (reservation?.slotKeys || []).forEach((key) => {
      map[key] = name;
    });
  });
  // Date-range locks reserve a contiguous block of slots across a specific date
  // span, regardless of weekday. They apply only when a concrete date is known,
  // and are layered last so a date reservation wins any slot it shares with a
  // weekday reservation. Each entry locks every slot whose start key falls in
  // [startSlotKey, endSlotKey] (inclusive) on each date in [startDate, endDate]
  // (inclusive). Keys are zero-padded "HH:mm", so string comparison orders them.
  if (date) {
    const dateKey = formatDateKey(date);
    const slotKeys = generateSlots(event?.slotMinutes).map((slot) => slot.key);
    (event?.dateReservations || []).forEach((reservation) => {
      const reason = String(reservation?.reason || "").trim();
      const { startDate, endDate, startSlotKey, endSlotKey } = reservation || {};
      if (!reason || !startDate || !endDate || !startSlotKey || !endSlotKey) {
        return;
      }
      if (dateKey < startDate || dateKey > endDate) return;
      slotKeys.forEach((key) => {
        if (key >= startSlotKey && key <= endSlotKey) map[key] = reason;
      });
    });
  }
  return map;
};

// The date the booking page should open on when the URL has no date.
export const getDefaultDate = (event, now = getToday()) => {
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
