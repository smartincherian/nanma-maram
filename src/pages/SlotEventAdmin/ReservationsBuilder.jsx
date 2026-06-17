import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
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
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import {
  WEEKDAYS,
  formatReservedDays,
  generateSlots,
} from "../../utils/chapelSlots";
import { MARIAN } from "../../utils/chapelTheme";

export const makeReservation = (overrides = {}) => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  slotKeys: [],
  days: [],
  ...overrides,
});

// Admin-defined locks. Each entry reserves one or more start times for a named
// person; the end time is derived from the event's slot length. An entry can be
// scoped to specific weekdays — leave the day picker empty to lock every day.
//
// UX: the full pickers are only shown while an entry is being built. New
// reservations open in build mode; saved ones load collapsed to a summary.
// Editing a collapsed entry reopens the pickers for it.
const ReservationsBuilder = ({ reservations, slotMinutes, onChange }) => {
  const slots = useMemo(() => generateSlots(slotMinutes), [slotMinutes]);
  const slotByKey = useMemo(() => {
    const map = {};
    slots.forEach((slot) => {
      map[slot.key] = slot;
    });
    return map;
  }, [slots]);

  // Ids whose pickers are open. Kept as local UI state — it never persists.
  const [editingIds, setEditingIds] = useState(() => new Set());

  const isEditing = (id) => editingIds.has(id);
  const setEditing = (id, on) =>
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const update = (id, patch) =>
    onChange(reservations.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const remove = (id) => {
    setEditing(id, false);
    onChange(reservations.filter((r) => r.id !== id));
  };

  const add = () => {
    const reservation = makeReservation();
    setEditing(reservation.id, true);
    onChange([...reservations, reservation]);
  };

  // Selected slots resolved to objects and ordered by start time, for display.
  const selectedSlots = (reservation) =>
    reservation.slotKeys
      .map((key) => slotByKey[key])
      .filter(Boolean)
      .sort((a, b) => a.key.localeCompare(b.key));

  const slotLabel = (key) => {
    const slot = slotByKey[key];
    return slot ? `${slot.label} – ${slot.endLabel}` : key;
  };

  const cardSx = {
    border: `1px solid ${MARIAN.border}`,
    borderRadius: 2.5,
    p: { xs: 1.5, sm: 2 },
    background: MARIAN.skySoft,
  };

  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontWeight: 700, color: MARIAN.ink }}>
        Reserved slots
      </Typography>
      <Typography variant="body2" sx={{ color: MARIAN.inkSoft, mt: -0.5 }}>
        Pre-lock slots for a named person. They show as “Reserved” to everyone
        and can’t be booked. Pick which days they apply to, or leave days empty
        to lock every day this event runs.
      </Typography>

      {reservations.map((reservation) => {
        const chosen = selectedSlots(reservation);
        const canSave = reservation.name.trim() && chosen.length > 0;

        // ── Collapsed view: name + days + chosen slots, edit/delete only ──
        if (!isEditing(reservation.id)) {
          return (
            <Box key={reservation.id} sx={cardSx}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="flex-start"
                justifyContent="space-between"
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <LockRoundedIcon
                      sx={{ fontSize: 18, color: MARIAN.blue }}
                    />
                    <Typography
                      sx={{ fontWeight: 700, color: MARIAN.ink }}
                      noWrap
                    >
                      {reservation.name.trim() || "Unnamed reservation"}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ color: MARIAN.inkSoft, display: "block", mt: 0.5 }}
                  >
                    {formatReservedDays(reservation.days)}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      mt: 1,
                    }}
                  >
                    {chosen.length ? (
                      chosen.map((slot) => (
                        <Chip
                          key={slot.key}
                          label={`${slot.label} – ${slot.endLabel}`}
                          size="small"
                          sx={{
                            background: MARIAN.blue,
                            color: MARIAN.white,
                            fontWeight: 600,
                          }}
                        />
                      ))
                    ) : (
                      <Typography
                        variant="caption"
                        sx={{ color: MARIAN.inkSoft }}
                      >
                        No slots selected.
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <Tooltip title="Edit reservation">
                    <IconButton
                      size="small"
                      sx={{ color: MARIAN.blue }}
                      onClick={() => setEditing(reservation.id, true)}
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete reservation">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => remove(reservation.id)}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Box>
          );
        }

        // ── Build view: name + days dropdown + times dropdown ──
        return (
          <Box key={reservation.id} sx={cardSx}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField
                label="Reserved for (name)"
                value={reservation.name}
                onChange={(e) =>
                  update(reservation.id, { name: e.target.value })
                }
                size="small"
                fullWidth
                autoFocus
              />
              <Tooltip title="Discard reservation">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => remove(reservation.id)}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <FormControl size="small" fullWidth sx={{ mt: 1.5 }}>
              <InputLabel id={`days-${reservation.id}`} shrink>
                Days
              </InputLabel>
              <Select
                labelId={`days-${reservation.id}`}
                multiple
                value={reservation.days}
                onChange={(e) =>
                  update(reservation.id, {
                    days:
                      typeof e.target.value === "string"
                        ? e.target.value.split(",").map(Number)
                        : e.target.value,
                  })
                }
                input={<OutlinedInput notched label="Days" />}
                displayEmpty
                renderValue={(selected) =>
                  selected.length === 0 ? (
                    <Typography
                      component="span"
                      sx={{ color: MARIAN.inkSoft }}
                    >
                      Every day
                    </Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {WEEKDAYS.filter((d) => selected.includes(d.value)).map(
                        (d) => (
                          <Chip key={d.value} label={d.short} size="small" />
                        )
                      )}
                    </Box>
                  )
                }
              >
                {WEEKDAYS.map((d) => (
                  <MenuItem key={d.value} value={d.value}>
                    <Checkbox checked={reservation.days.includes(d.value)} />
                    <ListItemText primary={d.long} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth sx={{ mt: 1.5 }}>
              <InputLabel id={`times-${reservation.id}`}>
                Start times
              </InputLabel>
              <Select
                labelId={`times-${reservation.id}`}
                multiple
                value={reservation.slotKeys}
                onChange={(e) =>
                  update(reservation.id, {
                    slotKeys:
                      typeof e.target.value === "string"
                        ? e.target.value.split(",")
                        : e.target.value,
                  })
                }
                input={<OutlinedInput label="Start times" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {[...selected]
                      .sort((a, b) => a.localeCompare(b))
                      .map((key) => (
                        <Chip key={key} label={slotLabel(key)} size="small" />
                      ))}
                  </Box>
                )}
              >
                {slots.map((slot) => (
                  <MenuItem key={slot.key} value={slot.key}>
                    <Checkbox
                      checked={reservation.slotKeys.includes(slot.key)}
                    />
                    <ListItemText
                      primary={`${slot.label} – ${slot.endLabel}`}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 1.5 }}
            >
              <Typography variant="caption" sx={{ color: MARIAN.inkSoft }}>
                {chosen.length
                  ? `${chosen.length} slot${chosen.length > 1 ? "s" : ""} · ${formatReservedDays(reservation.days)}`
                  : "No slots selected yet"}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<CheckRoundedIcon />}
                disabled={!canSave}
                onClick={() => setEditing(reservation.id, false)}
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
      })}

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
        Add reservation
      </Button>
    </Stack>
  );
};

export default ReservationsBuilder;
