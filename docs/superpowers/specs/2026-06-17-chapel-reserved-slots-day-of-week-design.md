# Chapel reserved slots — day-of-week scope

**Date:** 2026-06-17
**Feature area:** Chapel slot booking (`/chapel-slot`, `/chapel`, `/event`)
**Builds on:** `2026-06-16-chapel-reserved-slots-design.md`

## Problem

Admin-defined reserved slots (see the 2026-06-16 design) lock a slot on **every**
bookable day of the event. There is no way to reserve a slot only on certain
weekdays — e.g. "reserve 6:00–6:30 for Fr. Thomas every Tuesday and Thursday".

The admin wants, from the **Edit / New event** screen, to optionally scope each
reservation to specific days of the week, alongside the existing start-time
selection. The booking page must then honour that scope: a reserved slot only
appears locked on dates whose weekday matches.

## Decisions (settled during brainstorming)

- **Per-reservation day-of-week scope.** Each reservation entry gains an optional
  `days` list. This intentionally reverses the original "no per-reservation
  scope" decision for the day dimension only.
- **Empty `days` = every day.** No days selected means the reservation applies to
  every bookable date — preserving existing behaviour and back-compat with all
  reservations saved before this change (which have no `days` field).
- **One multi-select dropdown for days.** A single `Select multiple` listing the
  seven weekdays. There is no separate "every day" toggle — selecting nothing is
  "every day", surfaced with an explicit **"Every day"** label.
- **Sunday-first ordering.** The dropdown lists Sun, Mon, Tue, Wed, Thu, Fri, Sat.
  Weekday values are dayjs ints (`0=Sun … 6=Sat`).
- **Both days and times are dropdowns.** The existing start-time chip grid becomes
  a multi-select dropdown too, so the day and time controls are visually
  consistent.
- **Applies uniformly to daily and range events.** A range event respects the
  weekday filter within its date range, exactly as a daily event does across its
  rolling window.
- **No date is stored per day.** Reservations remain pure event config; the
  booking page derives the lock state from `days` + the date being viewed. Nothing
  is written to `chapelBookings`.

## Data model

On the event document (`chapelEvents/{id}`), each reservation entry gains `days`:

```js
reservations: [
  {
    id: "r1",
    name: "Fr. Thomas",
    slotKeys: ["06:00", "06:30"],  // start-time keys (unchanged)
    days: [2, 4],                   // NEW — dayjs weekday ints (0=Sun…6=Sat)
  }                                 //       absent / [] = every day
]
```

## Components

### 1. Util — `src/utils/chapelSlots.js`

Add an ordered weekday table for the dropdown and the collapsed-card label:

```js
// Sunday-first, matching dayjs's day() integers (0=Sun … 6=Sat).
export const WEEKDAYS = [
  { value: 0, short: "Sun", long: "Sunday" },
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
];
```

Extend `getReservedNames` with an optional `date` argument. A reservation's
`slotKeys` are included only when its `days` is empty/absent **or** contains the
weekday of `date`. When `date` is omitted, the day filter is skipped entirely, so
existing callers and tests keep their current behaviour.

```js
export const getReservedNames = (event, date) => {
  const weekday = date ? dayjs(date).day() : null;
  const map = {};
  (event?.reservations || []).forEach((reservation) => {
    const name = String(reservation?.name || "").trim();
    if (!name) return;
    const days = Array.isArray(reservation?.days) ? reservation.days : [];
    // Empty days = every day. With a date, filter to matching weekdays.
    if (weekday !== null && days.length && !days.includes(weekday)) return;
    (reservation?.slotKeys || []).forEach((key) => {
      map[key] = name;
    });
  });
  return map;
};
```

Optional small helper for the collapsed card label:

```js
// "Every day" when no days, else short names in Sunday-first order: "Tue, Thu".
export const formatReservedDays = (days) => {
  if (!Array.isArray(days) || days.length === 0) return "Every day";
  return WEEKDAYS.filter((d) => days.includes(d.value))
    .map((d) => d.short)
    .join(", ");
};
```

### 2. Admin editor — `src/pages/SlotEventAdmin/ReservationsBuilder.jsx`

- `makeReservation()` gains `days: []`.
- **Build view** — replace the time chip grid with two MUI `Select multiple`
  controls, each using `renderValue` to show chips and `MenuItem` + `Checkbox`
  rows:
  - **Days** — options from `WEEKDAYS` (Sunday-first), value = weekday int.
    When the selection is empty, `renderValue` shows a muted **"Every day"**.
  - **Times** — one option per slot from `generateSlots(slotMinutes)`, value =
    `slot.key`, label = `${slot.label} – ${slot.endLabel}` (e.g. "6:00 AM – 6:30
    AM"), so the derived end time is still visible.
- `toggleSlot` is replaced by `onChange` handlers that set `slotKeys` / `days`
  directly from the Select value.
- **Collapsed view** gains a small line above the slot chips showing
  `formatReservedDays(reservation.days)` — **"Every day"** or e.g. **"Tue, Thu"**.
- Save-enabled rule is unchanged: name + ≥1 slot. `days` is always optional.

### 3. Admin form — `src/pages/SlotEventAdmin/EventForm.jsx`

- `normalizeReservations` carries `days` through:
  `days: Array.isArray(r.days) ? r.days : []`.
- Save payload includes `days: r.days || []`; the existing
  `.filter((r) => r.name && r.slotKeys.length)` strip rule is unchanged (a
  reservation is never dropped for lacking days).

### 4. Booking page — `src/pages/SlotBookingEvent/index.jsx`

- Pass the viewed date into the util so it recomputes per date:
  ```js
  const reservedBySlot = useMemo(
    () => getReservedNames(event, selectedDate),
    [event, selectedDate]
  );
  ```
- Lock detection (`SlotRow`) and blocking (`handleCirclePress`) are unchanged. A
  slot is simply only reserved on weekdays that match the reservation's `days`.

### 5. Booking row — `src/pages/SlotBookingEvent/SlotRow.jsx`

Unchanged. It still receives `reservedName` and renders "Reserved · {name}".

## Edge cases

- **Pre-existing reservations (no `days`)** — treated as every day. ✅
- **`days: []`** — every day, identical to absent.
- **Range event** — weekday filter applies within the range like any other date.
- **Viewing a non-matching weekday** — the slot is bookable as normal; no lock,
  no "Reserved" badge.
- **`getReservedNames(event)` with no date** — day filter skipped; behaves exactly
  as before this change (keeps existing callers/tests valid).
- **Slot length changed after reservations exist** — unchanged from prior design;
  stale slot keys drop on next save. `days` is unaffected.

## Out of scope

- Specific calendar-date exceptions (e.g. "every Tuesday except the 24th").
- Any reservation field other than name, slot times, and days.
- Editing reservations from the booking page / leader mode.

## Testing (`src/utils/chapelSlots.test.js`)

- `getReservedNames(event)` (no date) — day filter skipped; every reservation's
  slots included (back-compat preserved).
- `getReservedNames(event, date)` with `days: []` — included on any weekday.
- `getReservedNames(event, date)` with `days: [2]` — included only when `date` is
  a Tuesday; excluded otherwise.
- Mixed reservations sharing/​differing slotKeys across weekdays resolve to the
  right names for a given date.
- `formatReservedDays` — `[]`/missing → "Every day"; `[4, 2]` → "Tue, Thu"
  (Sunday-first order regardless of input order).
