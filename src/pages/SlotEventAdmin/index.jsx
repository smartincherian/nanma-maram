import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import { useNavigate } from "react-router-dom";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { fetchEvents } from "../../firebase/chapel/events";
import { formatDateKey, getToday } from "../../utils/chapelSlots";
import {
  MARIAN,
  MARIAN_BUTTON_BG,
  MARIAN_PAGE_BG,
} from "../../utils/chapelTheme";
import EventForm from "./EventForm";
import BookingsSheet from "./BookingsSheet";

// Every shared link carries a date. Range events open on their start date;
// daily events open on today.
const buildBookingPath = (event) => {
  const date =
    event.mode === "range" && event.startDate
      ? event.startDate
      : formatDateKey(getToday());
  return `/chapel/${event.id}/${date}`;
};

const SlotEventAdmin = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useContext(SnackbarContext);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // "list" | "form"
  const [editing, setEditing] = useState(null);
  const [viewingBookings, setViewingBookings] = useState(null); // event | null

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await fetchEvents());
    } catch (err) {
      console.error(err);
      showSnackbar("Could not load events.", SNACK_BAR_SEVERITY_TYPES.ERROR);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCopyLink = async (event) => {
    const url = `${window.location.origin}${buildBookingPath(event)}`;
    try {
      await navigator.clipboard.writeText(url);
      showSnackbar("Booking link copied.", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
    } catch {
      window.prompt("Copy this booking link:", url);
    }
  };

  if (view === "form") {
    return (
      <Box sx={{ minHeight: "100vh", background: MARIAN_PAGE_BG }}>
        <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
          <EventForm
            event={editing}
            onBack={() => setView("list")}
            onSaved={() => {
              setView("list");
              loadEvents();
            }}
          />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: MARIAN_PAGE_BG }}>
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="Home">
            <IconButton onClick={() => navigate("/")} sx={{ color: MARIAN.blue }}>
              <HomeRoundedIcon />
            </IconButton>
          </Tooltip>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: MARIAN.deep }}
          >
            Slot booking events
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setEditing(null);
            setView("form");
          }}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2.5,
            background: MARIAN_BUTTON_BG,
            boxShadow: "0 10px 22px rgba(21, 50, 122, 0.2)",
          }}
        >
          New event
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            textAlign: "center",
            border: `1px dashed ${MARIAN.border}`,
            background: MARIAN.skySoft,
            color: MARIAN.inkSoft,
          }}
        >
          No events yet. Create your first one.
        </Paper>
      ) : (
        <Stack spacing={2}>
          {events.map((event) => (
            <Paper
              key={event.id}
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                border: `1px solid ${MARIAN.border}`,
                background:
                  "linear-gradient(180deg, #ffffff 0%, #f5f8fe 100%)",
                boxShadow: "0 10px 30px rgba(21, 50, 122, 0.06)",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ sm: "center" }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ fontWeight: 700, color: MARIAN.deep, mb: 0.5 }}
                  >
                    {event.heading}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      label={
                        event.mode === "range"
                          ? `${event.startDate} → ${event.endDate}`
                          : "Daily"
                      }
                      sx={{
                        background: MARIAN.goldSoft,
                        color: "#8a6d1f",
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      size="small"
                      label={`${event.slotMinutes} min slots`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`${event.fields?.length || 0} fields`}
                      variant="outlined"
                    />
                    {event.active === false ? (
                      <Chip size="small" color="default" label="Inactive" />
                    ) : null}
                  </Stack>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="View all bookings">
                    <IconButton
                      sx={{ color: MARIAN.blue }}
                      onClick={() => setViewingBookings(event)}
                    >
                      <PeopleAltRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      sx={{ color: MARIAN.blue }}
                      onClick={() => {
                        setEditing(event);
                        setView("form");
                      }}
                    >
                      <EditRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Copy booking link">
                    <IconButton
                      sx={{ color: MARIAN.blue }}
                      onClick={() => handleCopyLink(event)}
                    >
                      <LinkRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Open booking page">
                    <IconButton
                      sx={{ color: MARIAN.blue }}
                      onClick={() => navigate(buildBookingPath(event))}
                    >
                      <OpenInNewRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Container>

    <BookingsSheet
      open={Boolean(viewingBookings)}
      event={viewingBookings}
      onClose={() => setViewingBookings(null)}
    />
    </Box>
  );
};

export default SlotEventAdmin;
