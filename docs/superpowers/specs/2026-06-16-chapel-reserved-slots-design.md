# Chapel reserved slots (admin-defined locks)

**Date:** 2026-06-16
**Feature area:** Chapel slot booking (`/chapel-slot`, `/chapel`, `/event`)

## Problem

Today a slot only becomes locked ("Reserved") when a prayer leader, in `/power`
mode, makes a booking on one specific date. There is no way for an admin to
pre-declare that certain hours are reserved for a named person. Each lock is a
manual, per-date action.

The admin wants, from the **Edit / New event** screen, to pre-define reserved
slots that automatically show as locked on the booking page — each carrying a
**name** (who it is reserved for) and **no other field** (no phone).

## Decisions (settled during brainstorming)

- **Slot-wise, not free-form times.** Reservations reference the event's existing
  slot grid by start time, not arbitrary start/end clock times.
- **Start time only; end is derived.** A reservation stores start-time keys only.
  The end label is derived from the event's `slotMinutes`, exactly as
  `generateSlots` already does. No end time is ever stored or typed.
- **Several start times share one name.** One reservation entry = a name + one or
  more selected start times.
- **No per-reservation scope.** Reservations have no daily/range setting of their
  own. They inherit the event's existing booking window:
  - Daily event → reserved slots are locked **every day**.
  - Range event → reserved slots are locked across the **event's whole range**.
- **Reserved slots are frozen for everyone** on the public booking page,
  including leader mode. To change a reservation you edit the event.
- **Slot-length edge case: no special handling.** Slot-time keys depend on
  `slotMinutes`. If the admin changes the slot length after creating
  reservations, the selection chips simply re-render on the new grid; any saved
  key that no longer lands on the grid is silently dropped on the next save.
  No migration, no warning.

## Approach

Reservations are pure **event configuration**, stored as an array on the event
document — mirroring the existing `fields` array. The booking page computes the
reserved slots from this config and merges them into the existing locked-slot
rendering. Nothing is written per day.

Rejected alternative: materializing each reservation into `chapelBookings`
documents with `locked: true`. "Daily" has no end date, so that would generate
unbounded booking docs, and every edit would require reconciling them. Too heavy.

## Data model

On the event document (`chapelEvents/{id}`):

```js
reservations: [
  {
    id: "r1",                       // local uuid, stable per entry
    name: "Fr. Thomas",            // shown to visitors as "Reserved · {name}"
    slotKeys: ["06:00", "06:30"],  // start-time keys matching generateSlots()
  }
]
```

Absent / empty `reservations` means no admin locks (unchanged behaviour).

## Components

### 1. Util — `src/utils/chapelSlots.js`

Add:

```js
// Map of every reserved start-time key to the name it is reserved for.
// Reservations apply to all bookable dates of the event, so no date is needed.
// Later entries win if two reservations name the same slotKey.
export const getReservedNames = (event) => {
  const map = {};
  (event?.reservations || []).forEach((r) => {
    const name = String(r?.name || "").trim();
    (r?.slotKeys || []).forEach((key) => {
      if (name) map[key] = name;
    });
  });
  return map;
};
```

No date math — a reservation applies to every date the event is bookable.

### 2. Admin UI — `src/pages/SlotEventAdmin/ReservationsBuilder.jsx` (new)

Modeled on `FieldsBuilder.jsx`. Props: `{ reservations, slotMinutes, onChange }`.

Per reservation card:
- **Name** — `TextField`.
- **Start times** — a wrap of toggle chips, one per slot from
  `generateSlots(slotMinutes)`, value = `slot.key`. Each chip shows the **full
  derived range** (`{slot.label} – {slot.endLabel}`, e.g. "6:00 AM – 6:30 AM")
  so the admin confirms the calculated end time before saving — even though only
  the start time is stored. Tapping toggles membership in that entry's
  `slotKeys`. Selected chips are visually filled.
- **Delete** entry button.

Plus an **"Add reservation"** button that appends a blank entry
(`{ id: uuid, name: "", slotKeys: [] }`).

Export a `makeReservation()` helper for blank entries (parallels `makeField`).

### 3. Admin form — `src/pages/SlotEventAdmin/EventForm.jsx`

- New state `reservations`, normalized from `event?.reservations` (default `[]`).
- Render `<ReservationsBuilder reservations slotMinutes onChange />` below the
  fields section.
- Include in the save payload:
  ```js
  reservations: reservations
    .map((r) => ({
      id: r.id,
      name: r.name.trim(),
      slotKeys: r.slotKeys || [],
    }))
    .filter((r) => r.name && r.slotKeys.length), // drop blank/incomplete
  ```
- Validation: an entry that has a name but no slots (or slots but no name) is
  dropped silently on save rather than blocking — keeps the form forgiving.
  (No hard validation error; matches the "simple" intent.)

### 4. Booking page — `src/pages/SlotBookingEvent/index.jsx`

- `const reservedBySlot = useMemo(() => getReservedNames(event), [event]);`
- A slot is locked if it has a locked booking **or** is in `reservedBySlot`:
  ```js
  const reservedName = reservedBySlot[slot.key];
  const locked = slotBookings.some((b) => b.locked) || Boolean(reservedName);
  ```
- Pass `reservedName` to `SlotRow`.
- Blocking: in `handleCirclePress`, if `reservedBySlot[slot.key]` is set, block
  the action for everyone (including leader mode and "book for others") with an
  info snackbar — admin reservations are not bookable from the public page.

### 5. Booking row — `src/pages/SlotBookingEvent/SlotRow.jsx`

- New prop `reservedName`.
- When `reservedName` is set, the slot renders in the existing locked styling and
  the "Reserved" badge is followed by the name: **Reserved · Fr. Thomas**.
- `frozen` becomes `true` whenever `reservedName` is set (regardless of
  `leaderMode` / `isMine`), in addition to the existing locked-booking rule.

## Edge cases

- **Slot length changed after reservations exist** — handled by doing nothing
  (see Decisions). Chips re-render on the new grid; stale keys drop on next save.
- **Reservation name also matches a real booking on a slot** — the reservation
  wins the lock state; the slot shows as reserved.
- **Duplicate slotKey across two reservations** — last entry's name wins (see
  `getReservedNames`).
- **Empty `reservations`** — booking page behaves exactly as today.

## Out of scope

- Reserving only part of a date range (dropped with per-reservation scope).
- Any field other than name (no phone, no notes).
- Editing reservations from the booking page / leader mode.

## Testing

- `getReservedNames`: empty/missing event; multiple entries; duplicate keys
  (last wins); entry with blank name ignored.
- Booking page: a reserved slot renders frozen with "Reserved · {name}";
  tapping it is blocked for normal user, book-for-others, and leader mode.
- EventForm save: blank/incomplete reservation entries are stripped from payload.
