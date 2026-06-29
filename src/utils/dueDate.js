import dayjs from "dayjs";

// Urgency metadata for an expected-completion date (stored as a "YYYY-MM-DD"
// string). Returns null when no date is set or it can't be parsed. Colours
// escalate as the deadline nears: green (comfortable) → amber (soon) → red
// (due today / overdue), mirroring the chip palette used elsewhere.
export const getDueMeta = (dueDate) => {
  if (!dueDate) return null;
  const d = dayjs(dueDate);
  if (!d.isValid()) return null;

  const daysLeft = d.startOf("day").diff(dayjs().startOf("day"), "day");
  const dateLabel = d.format("D MMM");

  const RED = { color: "#b3261e", bg: "rgba(179,38,30,0.12)" };
  const AMBER = { color: "#8a4b00", bg: "rgba(214,123,31,0.16)" };
  const GREEN = { color: "#2e7d32", bg: "rgba(46,125,50,0.12)" };

  if (daysLeft < 0) {
    const n = Math.abs(daysLeft);
    return { ...RED, daysLeft, dateLabel, overdue: true, label: n === 1 ? "1 day overdue" : `${n} days overdue` };
  }
  if (daysLeft === 0) {
    return { ...RED, daysLeft, dateLabel, overdue: false, label: "Due today" };
  }
  if (daysLeft === 1) {
    return { ...AMBER, daysLeft, dateLabel, overdue: false, label: "Due tomorrow" };
  }
  if (daysLeft <= 3) {
    return { ...AMBER, daysLeft, dateLabel, overdue: false, label: `${daysLeft} days left` };
  }
  return { ...GREEN, daysLeft, dateLabel, overdue: false, label: `Due ${dateLabel}` };
};
