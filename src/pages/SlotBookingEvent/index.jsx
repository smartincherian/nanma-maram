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
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import {
  formatDateKey,
  formatDateLabel,
  generateSlots,
  getBookableWindow,
  getDefaultDate,
  isDateBookable,
  parseDateKey,
} from "../../utils/chapelSlots";
import { subscribeEvent } from "../../firebase/chapel/events";
import {
  addBooking,
  deleteBooking,
  subscribeBookings,
} from "../../firebase/chapel/bookings";
import {
  addMyBookingId,
  clearProfile,
  getMyBookingIds,
  getSavedProfile,
  removeMyBookingId,
  saveProfile,
} from "../../utils/chapelStorage";
import {
  MARIAN,
  MARIAN_HEADER_BG,
  MARIAN_PAGE_BG,
} from "../../utils/chapelTheme";
import SlotRow from "./SlotRow";
import BookingDrawer from "./BookingDrawer";
import ProfileBar from "./ProfileBar";
import CreditsSheet from "./CreditsSheet";
import LeaderGate from "./LeaderGate";

const LEADER_UNLOCK_KEY = "powerLeaderUnlock";

// Stable empty object for the "book for others" drawer — a fresh `{}` literal
// per render would re-fire the drawer's reset effect on every bookings snapshot
// and wipe whatever the leader is typing.
const EMPTY_VALUES = {};

const ZOOM_URL =
  "https://buddytutor.zoom.us/j/81689299863?pwd=nYwo5nDTEWgN4eso5jvFf4jRP7rcVS#success";

const SlotBookingEvent = () => {
  const { eventId, date: dateParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSnackbar } = useContext(SnackbarContext);

  // Leader mode: URL ends with "/power". A booking made in this mode locks the
  // slot so no one else can book it (a single leader booking freezes the slot).
  const leaderMode = location.pathname.endsWith("/power");
  const pathSuffix = leaderMode ? "/power" : "";
  // Preserve whichever base the visitor arrived on (/chapel, /event, /chapel-slot).
  const basePath = `/${location.pathname.split("/")[1]}`;

  const [event, setEvent] = useState(undefined); // undefined = loading, null = missing
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [profile, setProfile] = useState(() => getSavedProfile());
  const [myBookingIds, setMyBookingIds] = useState(() => getMyBookingIds());
  const [drawer, setDrawer] = useState(null); // null | { mode: "book"|"profile", slot?, forOthers? }
  const [bookFor, setBookFor] = useState("self"); // "self" | "others"
  const [showCredits, setShowCredits] = useState(false);
  const [leaderUnlocked, setLeaderUnlocked] = useState(
    () => sessionStorage.getItem(LEADER_UNLOCK_KEY) === "1"
  );

  // Subscribe to the event document.
  useEffect(() => {
    if (!eventId) return undefined;
    const unsubscribe = subscribeEvent(eventId, setEvent, () => setEvent(null));
    return unsubscribe;
  }, [eventId]);

  // Resolve the date: from URL if valid, else the event's default date.
  const selectedDate = useMemo(() => {
    if (!event) return null;
    return parseDateKey(dateParam) || getDefaultDate(event);
  }, [event, dateParam]);

  const dateKey = selectedDate ? formatDateKey(selectedDate) : null;

  // Keep the date in the URL at all times — if it's missing or invalid, put
  // the resolved default date (today, or the range start) into the address.
  useEffect(() => {
    if (event && dateKey && dateParam !== dateKey) {
      navigate(`${basePath}/${eventId}/${dateKey}${pathSuffix}`, {
        replace: true,
      });
    }
  }, [event, dateKey, dateParam, eventId, navigate, pathSuffix, basePath]);

  const bookable = useMemo(
    () => (event && selectedDate ? isDateBookable(event, selectedDate) : false),
    [event, selectedDate]
  );

  // Subscribe to bookings for this event + date (only when bookable).
  useEffect(() => {
    if (!eventId || !dateKey || !bookable) {
      setBookings([]);
      setBookingsLoading(false);
      return undefined;
    }
    setBookingsLoading(true);
    const unsubscribe = subscribeBookings(
      { eventId, date: dateKey },
      (rows) => {
        setBookings(rows);
        setBookingsLoading(false);
      },
      () => setBookingsLoading(false)
    );
    return unsubscribe;
  }, [eventId, dateKey, bookable]);

  const fields = useMemo(() => event?.fields || [], [event]);
  const displayFieldId =
    fields.find((f) => f.isDisplayName)?.id || fields[0]?.id;
  const savedName = String(profile?.[displayFieldId] || "").trim();

  // Can we book in one tap? Need a name and every required field already saved.
  const profileComplete =
    Boolean(savedName) &&
    fields.every(
      (f) => !f.required || String(profile?.[f.id] || "").trim()
    );

  const slots = useMemo(
    () => (event ? generateSlots(event.slotMinutes) : []),
    [event]
  );

  // Group bookings by slot key.
  const bookingsBySlot = useMemo(() => {
    const map = {};
    bookings.forEach((booking) => {
      (map[booking.slotKey] = map[booking.slotKey] || []).push(booking);
    });
    return map;
  }, [bookings]);

  // A booking is "mine" if this browser created it, or it matches my saved name.
  const isBookingMine = useCallback(
    (booking) =>
      myBookingIds.includes(booking.id) ||
      (savedName &&
        String(booking.displayName || "").trim().toLowerCase() ===
          savedName.toLowerCase()),
    [myBookingIds, savedName]
  );

  const persistBooking = async (slotKey, values, displayName, locked) => {
    const id = await addBooking({
      eventId,
      date: dateKey,
      slotKey,
      displayName,
      values,
      // A leader's own booking locks the slot for everyone else. Bookings the
      // leader makes for other people stay open (locked === false).
      locked: Boolean(locked),
    });
    addMyBookingId(id);
    setMyBookingIds((prev) => [...new Set([...prev, id])]);
  };

  const removeMyBooking = async (bookingId) => {
    try {
      await deleteBooking(bookingId);
      removeMyBookingId(bookingId);
      setMyBookingIds((prev) => prev.filter((id) => id !== bookingId));
    } catch (err) {
      console.error(err);
      showSnackbar(
        "Could not remove the booking. Please try again.",
        SNACK_BAR_SEVERITY_TYPES.ERROR
      );
    }
  };

  // Left circle: book in one tap, or remove my booking if already booked.
  const handleCirclePress = async (slot) => {
    // In leader mode, the gate must be unlocked before any booking action.
    if (leaderMode && !leaderUnlocked) return;
    const slotBookings = bookingsBySlot[slot.key] || [];

    // Booking for someone else: never one-tap. A locked slot still blocks
    // non-leaders. Open a fresh form so the other person's details are entered.
    if (bookFor === "others") {
      if (slotBookings.some((b) => b.locked) && !leaderMode) {
        showSnackbar(
          "This slot is reserved by the prayer leader.",
          SNACK_BAR_SEVERITY_TYPES.INFO
        );
        return;
      }
      setDrawer({ mode: "book", slot, forOthers: true });
      return;
    }

    const mine = slotBookings.find(isBookingMine);
    if (mine) {
      await removeMyBooking(mine.id);
      return;
    }
    // A locked slot is reserved by the prayer leader — block everyone else.
    if (slotBookings.some((b) => b.locked) && !leaderMode) {
      showSnackbar(
        "This slot is reserved by the prayer leader.",
        SNACK_BAR_SEVERITY_TYPES.INFO
      );
      return;
    }
    if (!profileComplete) {
      setDrawer({ mode: "book", slot });
      return;
    }
    const values = {};
    fields.forEach((f) => {
      values[f.id] = String(profile[f.id] || "").trim();
    });
    try {
      await persistBooking(slot.key, values, savedName, leaderMode);
      showSnackbar("Slot booked. Thank you!", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
    } catch (err) {
      console.error(err);
      showSnackbar(
        "Could not book the slot. Please try again.",
        SNACK_BAR_SEVERITY_TYPES.ERROR
      );
    }
  };

  // Drawer submit: save the profile (unless booking for someone else); also
  // book the slot in "book" mode.
  const handleDrawerSubmit = async (values) => {
    if (!drawer?.forOthers) {
      saveProfile(values);
      setProfile(values);
    }
    if (drawer?.mode === "book" && drawer.slot) {
      // Leader's own booking locks the slot; book-for-others stays open.
      await persistBooking(
        drawer.slot.key,
        values,
        String(values[displayFieldId] || "Guest").trim(),
        leaderMode && !drawer.forOthers
      );
    }
  };

  const handleDeleteProfile = () => {
    clearProfile();
    setProfile({});
  };

  if (event === undefined) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (event === null) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          This booking event was not found.
        </Alert>
      </Container>
    );
  }

  const bookWindow = getBookableWindow(event);
  const showBooking = event.active !== false && bookable;

  // "Enter the Chapel" mirrors the AM/PM slot palette based on the current
  // system time — warm gold in the morning, cool blue in the afternoon/evening.
  const isMorning = new Date().getHours() < 12;
  const enterChapelSx = isMorning
    ? {
        color: "#3a2b06",
        background:
          "linear-gradient(135deg, #e7c35a 0%, #caa23c 55%, #b68a26 100%)",
        boxShadow: "0 12px 26px rgba(178, 138, 38, 0.34)",
        "&:hover": {
          background:
            "linear-gradient(135deg, #edcb66 0%, #d0a942 55%, #bd9029 100%)",
        },
      }
    : {
        color: "#f4f7ff",
        background:
          "linear-gradient(135deg, #4a4ec9 0%, #2c2f8f 55%, #1c1e63 100%)",
        boxShadow: "0 12px 26px rgba(28, 30, 99, 0.36)",
        "&:hover": {
          background:
            "linear-gradient(135deg, #565ad6 0%, #34379c 55%, #23266f 100%)",
        },
      };

  return (
    <Box sx={{ minHeight: "100vh", background: MARIAN_PAGE_BG }}>
    <Container
      maxWidth="sm"
      disableGutters
      sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0, sm: 0 } }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: `1px solid ${MARIAN.border}`,
          boxShadow: "0 24px 60px rgba(21, 50, 122, 0.14)",
          background: MARIAN.white,
        }}
      >
        {/* Fixed header — circular badge + chapel name + date, stays visible
            while scrolling */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 5,
            px: { xs: 2, sm: 3 },
            py: 1.25,
            background: MARIAN_HEADER_BG,
            color: MARIAN.white,
            boxShadow: "0 4px 14px rgba(58, 106, 191, 0.22)",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src="/images/chapel-banner.png"
              alt="Nanma Maram Chapel"
              sx={{
                flexShrink: 0,
                width: { xs: 46, sm: 52 },
                height: { xs: 46, sm: 52 },
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.55)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.02rem", sm: "1.12rem" },
                  lineHeight: 1.2,
                  letterSpacing: "0.01em",
                }}
              >
                {event.heading}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  lineHeight: 1.25,
                  mt: 0.25,
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                {formatDateLabel(selectedDate)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(238,243,252,0.82)", display: "block" }}
              >
                All timings are in IST (Indian Standard Time)
                {leaderMode ? " · Leader mode" : ""}
              </Typography>
            </Box>
          </Box>
        </Box>

        {event.description ? (
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 1.5, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: MARIAN.inkSoft }}>
              {event.description}
            </Typography>
          </Box>
        ) : null}

        {/* Enter the Chapel — primary call to action, kept up top */}
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            endIcon={<ArrowForwardRoundedIcon />}
            href={ZOOM_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 2.5,
              py: 1.15,
              ...enterChapelSx,
            }}
          >
            Enter the Chapel
          </Button>
        </Box>

        {/* Saved name */}
        {showBooking ? (
          <ProfileBar
            name={savedName}
            showBookForOthers={leaderMode}
            bookFor={bookFor}
            onBookForChange={setBookFor}
            onAdd={() => setDrawer({ mode: "profile" })}
            onEdit={() => setDrawer({ mode: "profile" })}
            onDelete={handleDeleteProfile}
          />
        ) : null}

        {/* Body */}
        {event.active === false ? (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Booking for this event is currently closed.
            </Alert>
          </Box>
        ) : !bookable ? (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Booking isn't open for this date. Please pick a date between{" "}
              <strong>{formatDateLabel(bookWindow.start)}</strong> and{" "}
              <strong>{formatDateLabel(bookWindow.end)}</strong>.
            </Alert>
          </Box>
        ) : bookingsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: 1 }}>
            {slots.map((slot) => {
              const slotBookings = bookingsBySlot[slot.key] || [];
              return (
                <SlotRow
                  key={slot.key}
                  slot={slot}
                  bookings={slotBookings}
                  isMine={slotBookings.some(isBookingMine)}
                  locked={slotBookings.some((b) => b.locked)}
                  leaderMode={leaderMode}
                  isBookingMine={isBookingMine}
                  onCirclePress={handleCirclePress}
                  onDeleteBooking={removeMyBooking}
                />
              );
            })}
          </Box>
        )}

        <Box sx={{ pb: 1.5 }} />
      </Paper>

      {/* Almost-hidden credits trigger — a small sparkle icon */}
      <Box sx={{ textAlign: "center", mt: 1.5 }}>
        <Box
          component="button"
          type="button"
          onClick={() => setShowCredits(true)}
          aria-label="Credits"
          title="Credits"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "rgba(27, 42, 74, 0.28)",
            p: 0.5,
            "&:hover": { color: "rgba(27, 42, 74, 0.55)" },
          }}
        >
          <AutoAwesomeRoundedIcon sx={{ fontSize: 13 }} />
        </Box>
      </Box>

      <BookingDrawer
        open={Boolean(drawer)}
        mode={drawer?.mode}
        slot={drawer?.slot}
        forOthers={drawer?.forOthers}
        fields={fields}
        initialValues={drawer?.forOthers ? EMPTY_VALUES : profile}
        onClose={() => setDrawer(null)}
        onSubmit={handleDrawerSubmit}
      />

      <CreditsSheet open={showCredits} onClose={() => setShowCredits(false)} />

      <LeaderGate
        open={leaderMode && !leaderUnlocked}
        onUnlock={() => {
          sessionStorage.setItem(LEADER_UNLOCK_KEY, "1");
          setLeaderUnlocked(true);
        }}
      />
    </Container>
    </Box>
  );
};

export default SlotBookingEvent;
