import React, { useCallback, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import {
  dateTimeMark,
  generateSlots,
  isDateReservationComplete,
} from "../../utils/chapelSlots";
import { MARIAN } from "../../utils/chapelTheme";

// Shared Select menu config. `disableScrollLock` is the key bit: it stops MUI
// from locking body scroll (and reflowing this long form) every time a time
// dropdown opens, which was causing a visible delay. Capped height keeps the
// 48-slot list scrollable rather than spanning the viewport. Defined once at
// module scope so the object identity stays stable across renders.
const MENU_PROPS = {
  disableScrollLock: true,
  PaperProps: { sx: { maxHeight: 320 } },
};

const cardSx = {
  border: `1px solid ${MARIAN.border}`,
  borderRadius: 2.5,
  p: { xs: 1.5, sm: 2 },
  background: MARIAN.skySoft,
};

export const makeDateReservation = (overrides = {}) => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  reason: "",
  startDate: "",
  endDate: "",
  startSlotKey: "",
  endSlotKey: "",
  ...overrides,
});

// One reservation row. Memoised so editing (or typing in) a single row only
// re-renders that row — not every other open row and its two 48-item time
// Selects. Without this, typing a reason re-rendered the whole builder and cost
// scaled linearly with the number of open reservations.
const DateReservationRow = React.memo(function DateReservationRow({
  reservation,
  editing,
  startMenuItems,
  endMenuItems,
  slotByKey,
  onUpdate,
  onRemove,
  onSetEditing,
}) {
  const { id, reason, startDate, endDate, startSlotKey, endSlotKey } =
    reservation;

  const startLabel = (key) => slotByKey[key]?.label || key;
  const endLabel = (key) => slotByKey[key]?.endLabel || key;
  const timeRangeLabel =
    startSlotKey && endSlotKey
      ? `${startLabel(startSlotKey)} – ${endLabel(endSlotKey)}`
      : "";

  // ── Collapsed view ──
  if (!editing) {
    return (
      <Box sx={cardSx}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <EventBusyRoundedIcon sx={{ fontSize: 18, color: MARIAN.blue }} />
              <Typography sx={{ fontWeight: 700, color: MARIAN.ink }} noWrap>
                {reason.trim() || "Unnamed reservation"}
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              sx={{ color: MARIAN.inkSoft, display: "block", mt: 0.5 }}
            >
              {startDate && endDate
                ? `${startDate} → ${endDate}`
                : "No dates set"}
            </Typography>
            <Box sx={{ mt: 1 }}>
              {timeRangeLabel ? (
                <Chip
                  label={timeRangeLabel}
                  size="small"
                  sx={{
                    background: MARIAN.blue,
                    color: MARIAN.white,
                    fontWeight: 600,
                  }}
                />
              ) : (
                <Typography variant="caption" sx={{ color: MARIAN.inkSoft }}>
                  No times selected.
                </Typography>
              )}
            </Box>
          </Box>
          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Tooltip title="Edit reservation">
              <IconButton
                size="small"
                sx={{ color: MARIAN.blue }}
                onClick={() => onSetEditing(id, true)}
              >
                <EditRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete reservation">
              <IconButton
                size="small"
                color="error"
                onClick={() => onRemove(id)}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>
    );
  }

  // ── Build view ──
  const canSave = isDateReservationComplete(reservation);

  return (
    <Box sx={cardSx}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <TextField
          label="Reserved for (reason)"
          value={reason}
          onChange={(e) => onUpdate(id, { reason: e.target.value })}
          size="small"
          fullWidth
          autoFocus
        />
        <Tooltip title="Discard reservation">
          <IconButton size="small" color="error" onClick={() => onRemove(id)}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: 1.5 }}
      >
        <TextField
          label="From date"
          type="date"
          value={startDate}
          onChange={(e) => onUpdate(id, { startDate: e.target.value })}
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To date"
          type="date"
          value={endDate}
          onChange={(e) => onUpdate(id, { endDate: e.target.value })}
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: 1.5 }}
      >
        <FormControl size="small" fullWidth>
          <InputLabel id={`start-${id}`}>Start time</InputLabel>
          <Select
            labelId={`start-${id}`}
            label="Start time"
            value={startSlotKey}
            onChange={(e) => onUpdate(id, { startSlotKey: e.target.value })}
            MenuProps={MENU_PROPS}
          >
            {startMenuItems}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel id={`end-${id}`}>End time</InputLabel>
          <Select
            labelId={`end-${id}`}
            label="End time"
            value={endSlotKey}
            onChange={(e) => onUpdate(id, { endSlotKey: e.target.value })}
            MenuProps={MENU_PROPS}
          >
            {endMenuItems}
          </Select>
        </FormControl>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mt: 1.5 }}
      >
        <Typography variant="caption" sx={{ color: MARIAN.inkSoft }}>
          {startDate &&
          endDate &&
          startSlotKey &&
          endSlotKey &&
          dateTimeMark(startDate, startSlotKey) >
            dateTimeMark(endDate, endSlotKey)
            ? "Start (date & time) must be before the end"
            : timeRangeLabel || "Pick a date & time range"}
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<CheckRoundedIcon />}
          disabled={!canSave}
          onClick={() => onSetEditing(id, false)}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            background: MARIAN.blue,
            "&:hover": { background: MARIAN.deep },
          }}
        >
          Done
        </Button>
      </Stack>
    </Box>
  );
});

// Admin-defined date-range locks. Each entry reserves a contiguous block of
// slots — every slot whose start time falls in [startSlotKey, endSlotKey]
// (inclusive) — across a specific date span, regardless of weekday. The reason
// is shown wherever a reservation name would be, and the slots render as
// "Reserved" to everyone.
//
// UX mirrors ReservationsBuilder: new entries open in build mode; saved ones
// collapse to a summary and reopen on edit.
const DateReservationsBuilder = ({
  dateReservations,
  slotMinutes,
  onChange,
}) => {
  const slots = useMemo(() => generateSlots(slotMinutes), [slotMinutes]);
  const slotByKey = useMemo(() => {
    const map = {};
    slots.forEach((slot) => {
      map[slot.key] = slot;
    });
    return map;
  }, [slots]);

  // Build the time-option elements once per slot length and share them across
  // every row's Select. MUI clones children to inject its own props, so reusing
  // the same elements in multiple Selects is safe and avoids rebuilding ~100
  // MenuItems per keystroke.
  const startMenuItems = useMemo(
    () =>
      slots.map((slot) => (
        <MenuItem key={slot.key} value={slot.key}>
          {slot.label}
        </MenuItem>
      )),
    [slots]
  );
  const endMenuItems = useMemo(
    () =>
      slots.map((slot) => (
        <MenuItem key={slot.key} value={slot.key}>
          {slot.endLabel}
        </MenuItem>
      )),
    [slots]
  );

  // Ids whose pickers are open. Local UI state — never persisted.
  const [editingIds, setEditingIds] = useState(() => new Set());

  const setEditing = useCallback((id, on) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  // Functional updates so the handlers stay referentially stable (required for
  // the row memoisation to actually skip re-renders) and never read a stale
  // `dateReservations` — a fast double "Add" used to drop a reservation.
  const update = useCallback(
    (id, patch) =>
      onChange((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      ),
    [onChange]
  );

  const remove = useCallback(
    (id) => {
      setEditing(id, false);
      onChange((prev) => prev.filter((r) => r.id !== id));
    },
    [onChange, setEditing]
  );

  const add = useCallback(() => {
    const reservation = makeDateReservation();
    setEditing(reservation.id, true);
    onChange((prev) => [...prev, reservation]);
  }, [onChange, setEditing]);

  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontWeight: 700, color: MARIAN.ink }}>
        Date-range reservations
      </Typography>
      <Typography variant="body2" sx={{ color: MARIAN.inkSoft, mt: -0.5 }}>
        Lock everything from a start date &amp; time to an end date &amp; time —
        e.g. an overnight vigil or a multi-day retreat. The whole range shows as
        “Reserved” to everyone and can’t be booked.
      </Typography>

      {dateReservations.map((reservation) => (
        <DateReservationRow
          key={reservation.id}
          reservation={reservation}
          editing={editingIds.has(reservation.id)}
          startMenuItems={startMenuItems}
          endMenuItems={endMenuItems}
          slotByKey={slotByKey}
          onUpdate={update}
          onRemove={remove}
          onSetEditing={setEditing}
        />
      ))}

      <Button
        onClick={add}
        startIcon={<AddRoundedIcon />}
        sx={{
          alignSelf: "flex-start",
          textTransform: "none",
          fontWeight: 700,
          color: MARIAN.blue,
        }}
      >
        Add date-range reservation
      </Button>
    </Stack>
  );
};

// Memoised so typing in other sections of the event form doesn't re-render this
// builder — only re-renders when its own dateReservations change.
export default React.memo(DateReservationsBuilder);
