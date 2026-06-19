import React, { useState } from "react";
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { MARIAN } from "../../utils/chapelTheme";

// A booked slot wears a single WhatsApp green — the same "taken" signal for
// every slot. Reserved and leader-locked slots wear the same green and look
// like a normal booking; the name (with a "World Wide" chip) lives in the
// dropdown, and the grey is only the dot's outer ring.
const FILLED_ACCENT = "#25D366"; // WhatsApp green
const FILLED_TINT = "rgba(37, 211, 102, 0.1)";
const LOCK_ACCENT = "#9aa3b2";

// Morning vs evening is conveyed purely by the time-label colour, kept on-theme:
// a deep amber/bronze for AM, the Madonna blue for PM. Both sit at a similar
// dark weight so they read as a matched pair (warm vs cool), not mismatched.
const AM_TEXT = " #9a6a17"; // deep amber/bronze (refined, no olive cast)
const PM_TEXT = MARIAN.deep; // ultramarine

const SlotRow = ({
  slot,
  bookings,
  isMine,
  locked,
  reservedName,
  leaderMode,
  isBookingMine,
  onCirclePress,
  onDeleteBooking,
  readOnly = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const count = bookings.length;
  const hasBookings = count > 0;
  const reserved = Boolean(reservedName);

  // Reserved/locked slots read exactly like a normal booking: a count and a
  // dropdown. The admin-reserved name has no booking of its own, so it adds one
  // to the count and appears as a synthetic "World Wide" entry in the dropdown.
  const displayCount = count + (reserved ? 1 : 0);
  const expandable = hasBookings || reserved;
  const dropdownEntries = [
    ...bookings.map((booking) => ({
      id: booking.id,
      displayName: booking.displayName,
      worldWide: Boolean(booking.locked),
      booking,
    })),
    ...(reserved
      ? [
          {
            id: "__reserved__",
            displayName: reservedName,
            worldWide: false,
            reserved: true,
            booking: null,
          },
        ]
      : []),
  ];

  // Admin-reserved and leader-locked slots both read as "taken" — the same green
  // fill and chip as a booked slot (Divine Mercy look), no muted-gray state.
  const accent = FILLED_ACCENT;
  const tint = FILLED_TINT;
  // Reserved/locked slots may have no bookings of their own but still show filled.
  const filled = hasBookings || reserved || locked;

  const isAM = Number(slot.key.slice(0, 2)) < 12;
  const labelColor = isAM ? AM_TEXT : PM_TEXT;

  // An admin-reserved slot is frozen for everyone (no override). A leader-locked
  // booking is frozen for everyone but the leader. Elapsed slots (read-only) are
  // past — no booking or removal, but still expandable to see who prayed.
  const frozen =
    readOnly || Boolean(reservedName) || (locked && !leaderMode && !isMine);

  // Booked-by-me shows a green check; reserved/locked slots show the same green
  // dot as Divine Mercy (non-clickable) — the dropdown reveals who it's for.
  const circleColor = isMine ? "#1f9c74" : "#9fb0cc";

  return (
    <Box
      sx={{
        my: 0.5,
        px: 1.25,
        py: 1,
        borderRadius: 2,
        background: filled ? tint : "transparent",
        border: "1px solid rgba(42, 79, 160, 0.08)",
        opacity: frozen ? 0.75 : 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <IconButton
          onClick={() => onCirclePress(slot)}
          disabled={frozen}
          sx={{
            p: 0.5,
            color: circleColor,
            // Keep the slot's own colour even when the button is disabled
            // (a reserved slot stays green, not MUI's default disabled grey).
            "&.Mui-disabled": { color: circleColor },
          }}
          aria-label={
            isMine
              ? `Remove my booking for ${slot.label}`
              : frozen
              ? `${slot.label} is reserved`
              : `Book ${slot.label}`
          }
        >
          {isMine ? (
            <CheckCircleRoundedIcon sx={{ fontSize: 27 }} />
          ) : reserved || locked ? (
            // Reserved / locked: green fill inside a grey ring (Divine Mercy look).
            <Box
              sx={{
                width: 21,
                height: 21,
                borderRadius: "50%",
                bgcolor: FILLED_ACCENT,
                border: `2px solid ${LOCK_ACCENT}`,
                boxSizing: "border-box",
              }}
            />
          ) : (
            <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 27 }} />
          )}
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            flexWrap="wrap"
            useFlexGap
          >
            <Typography
              sx={{
                fontWeight: isMine ? 700 : 600,
                color: labelColor,
                fontSize: "1.02rem",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {slot.label} to {slot.endLabel}
            </Typography>
          </Stack>
          <Box
            sx={{
              mt: 0.75,
              height: 6,
              borderRadius: 3,
              background: filled
                ? `linear-gradient(90deg, ${accent} 0%, ${accent} 100%)`
                : "rgba(42, 79, 160, 0.1)",
              width: "100%",
            }}
          />
        </Box>

        {/* Reserved/locked slots count like a normal booking and expand to
            reveal the name(s) in the dropdown. */}
        {filled ? (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography
              sx={{
                fontWeight: 700,
                color: MARIAN.inkSoft,
                minWidth: 18,
                textAlign: "right",
              }}
            >
              {displayCount}
            </Typography>
            {expandable ? (
              <IconButton
                size="small"
                onClick={() => setExpanded((prev) => !prev)}
                sx={{
                  transform: expanded ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                  color: MARIAN.blue,
                }}
                aria-label="Show booked people"
              >
                <KeyboardArrowDownRoundedIcon />
              </IconButton>
            ) : (
              <Box sx={{ width: 34 }} />
            )}
          </Stack>
        ) : null}
      </Stack>

      <Collapse in={expanded} unmountOnExit>
        <Stack spacing={0.25} sx={{ pl: 6, pr: 1, pt: 1, pb: 0.5 }}>
          {dropdownEntries.map((entry) => {
            const mine = entry.booking ? isBookingMine(entry.booking) : false;
            return (
              <Stack
                key={entry.id}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  borderRadius: 1.5,
                  px: 1,
                  py: 0.25,
                  background: mine ? "rgba(42, 79, 160, 0.1)" : "transparent",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    color: entry.reserved
                      ? AM_TEXT.trim() // admin-reserved gets a distinct bronze
                      : mine
                      ? MARIAN.deep
                      : MARIAN.ink,
                    fontWeight: entry.reserved || mine ? 600 : 400,
                  }}
                >
                  • {entry.displayName}
                </Typography>
                {entry.worldWide ? (
                  <Chip
                    label="World Wide"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      bgcolor: FILLED_ACCENT,
                      color: "#fff",
                      "& .MuiChip-label": { px: 0.75 },
                    }}
                  />
                ) : null}
                {mine && !readOnly ? (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDeleteBooking(entry.booking.id)}
                    aria-label="Delete my booking"
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                ) : null}
              </Stack>
            );
          })}
        </Stack>
      </Collapse>
    </Box>
  );
};

export default SlotRow;
