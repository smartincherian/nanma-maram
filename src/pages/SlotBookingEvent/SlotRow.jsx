import React, { useState } from "react";
import {
  Box,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { MARIAN } from "../../utils/chapelTheme";

// AM slots wear a warm gold accent, PM slots a cool blue one — so morning and
// evening hours are instantly distinguishable while scanning the day.
const AM_ACCENT = MARIAN.gold; // #caa23c
const AM_TINT = "rgba(202, 162, 60, 0.07)";
const PM_ACCENT = MARIAN.blue; // #2a4fa0
const PM_TINT = "rgba(42, 79, 160, 0.06)";
const LOCK_ACCENT = "#9aa3b2";
const LOCK_TINT = "rgba(120, 130, 150, 0.1)";

const SlotRow = ({
  slot,
  bookings,
  isMine,
  locked,
  leaderMode,
  isBookingMine,
  onCirclePress,
  onDeleteBooking,
}) => {
  const [expanded, setExpanded] = useState(false);
  const count = bookings.length;
  const hasBookings = count > 0;

  const isAM = Number(slot.key.slice(0, 2)) < 12;
  const accent = locked ? LOCK_ACCENT : isAM ? AM_ACCENT : PM_ACCENT;
  const tint = locked ? LOCK_TINT : isAM ? AM_TINT : PM_TINT;

  // A locked slot is frozen for everyone but the leader.
  const frozen = locked && !leaderMode && !isMine;

  let circleColor = "#9fb0cc";
  let CircleIcon = RadioButtonUncheckedRoundedIcon;
  if (isMine) {
    circleColor = "#1f9c74";
    CircleIcon = CheckCircleRoundedIcon;
  } else if (locked) {
    circleColor = LOCK_ACCENT;
    CircleIcon = LockRoundedIcon;
  }

  return (
    <Box
      sx={{
        my: 0.5,
        px: 1.25,
        py: 1,
        borderRadius: 2,
        background: hasBookings ? tint : "transparent",
        border: "1px solid rgba(42, 79, 160, 0.08)",
        opacity: frozen ? 0.6 : 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <IconButton
          onClick={() => onCirclePress(slot)}
          disabled={frozen}
          sx={{ p: 0.5, color: circleColor }}
          aria-label={
            isMine
              ? `Remove my booking for ${slot.label}`
              : frozen
              ? `${slot.label} is reserved`
              : `Book ${slot.label}`
          }
        >
          <CircleIcon sx={{ fontSize: 27 }} />
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography
              sx={{
                fontWeight: 600,
                color: isMine ? MARIAN.deep : MARIAN.ink,
                fontSize: "1.02rem",
              }}
            >
              {slot.label} to {slot.endLabel}
            </Typography>
            {locked ? (
              <Box
                component="span"
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: LOCK_ACCENT,
                  border: `1px solid ${LOCK_ACCENT}`,
                  borderRadius: 1,
                  px: 0.6,
                  py: 0.1,
                }}
              >
                Reserved
              </Box>
            ) : null}
          </Stack>
          <Box
            sx={{
              mt: 0.75,
              height: 6,
              borderRadius: 3,
              background: hasBookings
                ? `linear-gradient(90deg, ${accent} 0%, ${accent} 100%)`
                : "rgba(42, 79, 160, 0.1)",
              width: "100%",
            }}
          />
        </Box>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography
            sx={{
              fontWeight: 700,
              color: MARIAN.inkSoft,
              minWidth: 18,
              textAlign: "right",
            }}
          >
            {count}
          </Typography>
          {hasBookings ? (
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
      </Stack>

      <Collapse in={expanded} unmountOnExit>
        <Stack spacing={0.25} sx={{ pl: 6, pr: 1, pt: 1, pb: 0.5 }}>
          {bookings.map((booking) => {
            const mine = isBookingMine(booking);
            return (
              <Stack
                key={booking.id}
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
                    color: mine ? MARIAN.deep : MARIAN.ink,
                    fontWeight: mine ? 600 : 400,
                  }}
                >
                  • {booking.displayName}
                  {booking.locked ? " 🔒" : ""}
                </Typography>
                {mine ? (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDeleteBooking(booking.id)}
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
