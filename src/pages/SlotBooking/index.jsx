import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import ClearIcon from "@mui/icons-material/Clear";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import "./slotBooking.css";
import {
  IST_TIMEZONE,
  formatDateLabel,
  generateSlotsForDate,
  getIstNow,
  getWeekDays,
  getWeekWindow,
  isOverlapping,
  mergeConsecutiveSlots,
} from "../../utils/slotBooking";
import {
  createBookings,
  fetchBookingsInRange,
} from "../../firebase/slotBooking/bookings";

const SlotBooking = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { showSnackbar } = useContext(SnackbarContext);

  const windowRange = useMemo(() => getWeekWindow(getIstNow()), []);
  const weekDays = useMemo(
    () => getWeekDays(windowRange.start, windowRange.end),
    [windowRange],
  );

  const [tabIndex, setTabIndex] = useState(0);
  const [name, setName] = useState("");
  const [selectedDate, setSelectedDate] = useState(getIstNow());
  const slotDuration = 60;
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatDates, setRepeatDates] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const windowStartMs = windowRange.start.valueOf();
  const windowEndMs = windowRange.end.valueOf();
  const todayIst = getIstNow().startOf("day");
  const minSelectableDate = todayIst.isAfter(windowRange.start, "day")
    ? todayIst
    : windowRange.start;

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchBookingsInRange({
        startMs: windowStartMs,
        endMs: windowEndMs,
      });
      setBookings(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load bookings right now.");
    } finally {
      setLoading(false);
    }
  }, [windowStartMs, windowEndMs]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const slotsForDate = useMemo(
    () => generateSlotsForDate(selectedDate, slotDuration, 60),
    [selectedDate],
  );

  const nowMs = getIstNow().valueOf();

  const isSlotBooked = (slot) =>
    bookings.some((booking) =>
      isOverlapping(slot.startMs, slot.endMs, booking.startMs, booking.endMs),
    );

  const isSlotUnavailable = (slot) => slot.endMs <= nowMs;

  const handleSlotToggle = (slot) => {
    if (isSlotUnavailable(slot)) return;
    setSelectedSlots((prev) => {
      const exists = prev.find((item) => item.startMs === slot.startMs);
      if (exists) {
        return prev.filter((item) => item.startMs !== slot.startMs);
      }
      return [...prev, slot].sort((a, b) => a.startMs - b.startMs);
    });
  };

  const availableSlotsForDay = slotsForDate.filter(
    (slot) => !isSlotUnavailable(slot),
  );

  const handleRepeatToggle = () => {
    setRepeatEnabled((prev) => !prev);
    if (repeatEnabled) {
      setRepeatDates([]);
    }
  };

  const handleRepeatDateToggle = (date) => {
    const dateKey = date.format("YYYY-MM-DD");
    setRepeatDates((prev) => {
      if (prev.includes(dateKey)) {
        return prev.filter((item) => item !== dateKey);
      }
      return [...prev, dateKey];
    });
  };

  const validateBooking = (bookingsToCreate) => {
    if (!name.trim()) {
      setError("Please enter your name.");
      return false;
    }
    if (!bookingsToCreate.length) {
      setError("Please select at least one slot.");
      return false;
    }
    const outOfWindow = bookingsToCreate.some(
      (booking) =>
        booking.startMs < windowStartMs || booking.endMs > windowEndMs,
    );
    if (outOfWindow) {
      setError("Bookings must be within the current and next week.");
      return false;
    }
    const hasPast = bookingsToCreate.some((booking) => booking.endMs <= nowMs);
    if (hasPast) {
      setError("Past slots cannot be booked.");
      return false;
    }
    return true;
  };

  const buildBookingsPayload = () => {
    const baseDate = selectedDate.tz(IST_TIMEZONE).startOf("day");
    const dateOffsets = [
      0,
      ...repeatDates.map((dateKey) =>
        dayjs.tz(dateKey, IST_TIMEZONE).diff(baseDate, "day"),
      ),
    ];

    return dateOffsets.flatMap((offset) =>
      selectedSlots.map((slot) => {
        const start = slot.start.add(offset, "day");
        const end = slot.end.add(offset, "day");
        return {
          name: name.trim(),
          startMs: start.valueOf(),
          endMs: end.valueOf(),
          durationMinutes: slotDuration,
          createdAt: Date.now(),
          timezone: "Asia/Kolkata",
        };
      }),
    );
  };

  const handleBookSlots = async () => {
    setError("");
    const bookingsToCreate = buildBookingsPayload();
    if (!validateBooking(bookingsToCreate)) return;

    try {
      setSaving(true);
      await createBookings({ bookings: bookingsToCreate });
      setSelectedSlots([]);
      setRepeatDates([]);
      setRepeatEnabled(false);
      await loadBookings();
      showSnackbar("Praise God 🙏", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("Booking failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const groupedBookings = useMemo(() => {
    const groups = {};
    bookings.forEach((booking) => {
      const bookingDate = dayjs(booking.startMs).tz(IST_TIMEZONE);
      if (bookingDate.isBefore(todayIst, "day")) {
        return;
      }
      const dateKey = bookingDate.format("YYYY-MM-DD");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(booking);
    });
    return groups;
  }, [bookings, todayIst]);

  const handleShareWeek = () => {
    const lines = [`Available slots (IST)`];
    weekDays.forEach((date) => {
      if (date.isBefore(todayIst, "day")) {
        return;
      }
      const daySlots = generateSlotsForDate(date, 60, 60);
      const availableSlots = daySlots.filter(
        (slot) => !isSlotBooked(slot) && !isSlotUnavailable(slot),
      );
      const merged = mergeConsecutiveSlots(availableSlots);
      if (!merged.length) {
        lines.push(`${formatDateLabel(date)}: No slots available`);
        return;
      }
      const ranges = merged.map(
        (slot) =>
          `${slot.start.format("h:mm A")} - ${slot.end.format("h:mm A")}`,
      );
      lines.push(`${formatDateLabel(date)}: ${ranges.join(", ")}`);
    });

    const message = lines.join("\n");
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Box
      className="slot-booking-root"
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgba(255,245,235,1) 0%, rgba(237,248,255,1) 45%, rgba(243,236,255,1) 100%)",
        py: { xs: 3, sm: 4 },
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={6}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 4,
            position: "relative",
            overflow: "hidden",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -80,
              right: -80,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(255, 214, 170, 0.35)",
              filter: "blur(2px)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -60,
              left: -60,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(173, 216, 255, 0.35)",
              filter: "blur(2px)",
            }}
          />
          <Stack spacing={2} sx={{ position: "relative" }}>
            <Box
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                background:
                  "linear-gradient(120deg, rgba(255,245,230,0.9) 0%, rgba(231,245,255,0.9) 100%)",
                border: "1px solid rgba(15, 23, 42, 0.06)",
              }}
            >
              <Typography
                variant={isMobile ? "h5" : "h4"}
                fontWeight={700}
                sx={{
                  letterSpacing: "-0.02em",
                  fontFamily: '"Playfair Display", serif',
                }}
              >
                Chapel Screen Sharing Slot Booking (IST)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Book your Zoom screen share slot for the current and next week
                chapel sessions. Select your name, choose available time slots,
                and confirm your booking.
              </Typography>
            </Box>

            <Tabs
              value={tabIndex}
              onChange={(_, value) => setTabIndex(value)}
              variant="fullWidth"
              sx={{
                background: "rgba(15, 23, 42, 0.04)",
                borderRadius: 999,
                p: 0.5,
                "& .MuiTabs-indicator": { display: "none" },
              }}
            >
              <Tab
                label="Available"
                sx={{
                  borderRadius: 999,
                  minHeight: 44,
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: tabIndex === 0 ? "white" : "transparent",
                  boxShadow:
                    tabIndex === 0 ? "0 6px 16px rgba(15,23,42,0.08)" : "none",
                }}
              />
              <Tab
                label="Booked"
                sx={{
                  borderRadius: 999,
                  minHeight: 44,
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: tabIndex === 1 ? "white" : "transparent",
                  boxShadow:
                    tabIndex === 1 ? "0 6px 16px rgba(15,23,42,0.08)" : "none",
                }}
              />
            </Tabs>

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && tabIndex === 0 && (
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                  label="Your Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  fullWidth
                  sx={{
                    background: "white",
                    borderRadius: 2,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Select Date"
                    value={selectedDate}
                    onChange={(newDate) => {
                      if (newDate) {
                        if (newDate.isBefore(minSelectableDate, "day")) {
                          return;
                        }
                        setSelectedDate(newDate.tz(IST_TIMEZONE));
                        setSelectedSlots([]);
                      }
                    }}
                    minDate={minSelectableDate}
                    maxDate={windowRange.end}
                    format="DD-MMM-YYYY"
                    shouldDisableDate={(date) =>
                      date.isBefore(minSelectableDate, "day") ||
                      date.isAfter(windowRange.end, "day")
                    }
                    sx={{
                      width: "100%",
                      background: "white",
                      borderRadius: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </LocalizationProvider>

              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Select one or more slots for {formatDateLabel(selectedDate)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedSlots([])}
                    disabled={selectedSlots.length === 0}
                    aria-label="Clear selected slots"
                    sx={{ mt: -0.5 }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Stack>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {slotsForDate.map((slot) => {
                      const booked = isSlotBooked(slot);
                      const unavailable = isSlotUnavailable(slot);
                      const selected = selectedSlots.some(
                        (item) => item.startMs === slot.startMs,
                      );
                      return (
                        <Chip
                          key={slot.startMs}
                          label={slot.label}
                          color={
                            selected
                              ? "primary"
                              : booked
                                ? "warning"
                                : "default"
                          }
                          variant={
                            booked || unavailable ? "outlined" : "filled"
                          }
                          onClick={() => handleSlotToggle(slot)}
                          disabled={unavailable}
                          sx={{
                            mb: 1,
                            borderRadius: 2,
                            fontWeight: selected ? 600 : 500,
                          }}
                        />
                      );
                    })}
                  </Stack>
                  {availableSlotsForDay.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No available slots for this day.
                    </Typography>
                  )}
                </Box>

                <Divider />

                <FormControlLabel
                  control={
                    <Switch
                      checked={repeatEnabled}
                      onChange={handleRepeatToggle}
                    />
                  }
                  label="Repeat on other dates (same time)"
                />

                {repeatEnabled && (
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {weekDays
                      .filter(
                        (date) =>
                          !date.isSame(selectedDate, "day") &&
                          date.isSameOrAfter(minSelectableDate, "day") &&
                          date.isSameOrBefore(windowRange.end, "day"),
                      )
                      .map((date) => {
                        const dateKey = date.format("YYYY-MM-DD");
                        const selected = repeatDates.includes(dateKey);
                        return (
                          <Chip
                            key={dateKey}
                            label={formatDateLabel(date)}
                            color={selected ? "primary" : "default"}
                            onClick={() => handleRepeatDateToggle(date)}
                          />
                        );
                      })}
                  </Stack>
                )}

                <Divider />

                {selectedSlots.length > 0 && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      background: "rgba(15,23,42,0.02)",
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700}>
                      Confirmation Summary
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Name: {name?.trim() || "—"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {formatDateLabel(selectedDate)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Slots: {selectedSlots.length} ({selectedSlots.length} hour
                      {selectedSlots.length !== 1 ? "s" : ""})
                    </Typography>
                    {repeatEnabled && repeatDates.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Repeat on: {repeatDates.length} day
                        {repeatDates.length !== 1 ? "s" : ""}
                      </Typography>
                    )}
                  </Paper>
                )}

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Selected: {selectedSlots.length} slot
                    {selectedSlots.length !== 1 ? "s" : ""} (
                    {(selectedSlots.length * slotDuration) / 60} hrs)
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleBookSlots}
                  disabled={saving || loading}
                  sx={{
                    borderRadius: 3,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "1rem",
                    py: 1.4,
                    boxShadow: "0 12px 24px rgba(30, 64, 175, 0.2)",
                    background:
                      "linear-gradient(135deg, rgba(30,64,175,1) 0%, rgba(59,130,246,1) 100%)",
                  }}
                >
                  {saving ? "Booking..." : "Confirm Booking"}
                </Button>
              </Stack>
            )}

            {!loading && tabIndex === 1 && (
              <Stack spacing={2}>
                <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                  <Button
                    variant="outlined"
                    onClick={handleShareWeek}
                    sx={{
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Share vacant slots
                  </Button>
                </Box>
                {Object.keys(groupedBookings).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No bookings yet for this week window.
                  </Typography>
                )}
                {Object.entries(groupedBookings).map(
                  ([dateKey, dayBookings]) => (
                    <Box key={dateKey}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {formatDateLabel(dayjs(dateKey))}
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        {dayBookings.map((booking) => {
                          const start = dayjs(booking.startMs).tz(IST_TIMEZONE);
                          const end = dayjs(booking.endMs).tz(IST_TIMEZONE);
                          return (
                            <Paper
                              key={booking.id}
                              variant="outlined"
                              sx={{ p: 1.5, borderRadius: 2 }}
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {booking.name || "Guest"}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {start.format("h:mm A")} -{" "}
                                {end.format("h:mm A")}
                              </Typography>
                            </Paper>
                          );
                        })}
                      </Stack>
                    </Box>
                  ),
                )}
              </Stack>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default SlotBooking;
