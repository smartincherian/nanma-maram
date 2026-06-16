import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import { useNavigate } from "react-router-dom";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { fetchEvents } from "../../firebase/chapel/events";
import {
  formatDateKey,
  formatDateLabel,
  getToday,
} from "../../utils/chapelSlots";
import {
  MARIAN,
  MARIAN_BUTTON_BG,
  MARIAN_PAGE_BG,
} from "../../utils/chapelTheme";
import EventForm from "./EventForm";
import BookingsSheet from "./BookingsSheet";
import ChapelFooter from "../../components/ChapelFooter";

// Every shared link carries a date. `leader` appends /power for the locking
// leader view.
const buildBookingPath = (event, dateKey, leader) =>
  `/chapel/${event.id}/${dateKey}${leader ? "/power" : ""}`;

const SlotEventAdmin = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useContext(SnackbarContext);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // "list" | "form"
  const [editing, setEditing] = useState(null);
  const [viewingBookings, setViewingBookings] = useState(null); // event | null
  const [linkMenu, setLinkMenu] = useState(null); // { anchorEl, event, leader } | null

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

  // Capture the trigger's position as plain coordinates rather than holding a
  // live DOM node: a node reference can be detached by a re-render before MUI
  // measures it, which intermittently flings the menu to the top-left corner.
  const openLinkMenu = (e, event, leader) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setLinkMenu({
      anchorPosition: { top: rect.bottom, left: rect.right },
      event,
      leader,
    });
  };
  const closeLinkMenu = () => setLinkMenu(null);

  const handleOpenLink = (dateKey) => {
    navigate(buildBookingPath(linkMenu.event, dateKey, linkMenu.leader));
    closeLinkMenu();
  };

  const handleCopyLink = async (dateKey) => {
    const { event, leader } = linkMenu;
    const url = `${window.location.origin}${buildBookingPath(
      event,
      dateKey,
      leader
    )}`;
    closeLinkMenu();
    try {
      await navigator.clipboard.writeText(url);
      showSnackbar(
        leader
          ? "Leader link copied — God bless 🙏"
          : "Booking link copied — God bless 🙏",
        SNACK_BAR_SEVERITY_TYPES.SUCCESS
      );
    } catch {
      window.prompt(
        leader ? "Copy this leader link:" : "Copy this booking link:",
        url
      );
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
                  <Tooltip title="Booking link">
                    <IconButton
                      sx={{ color: MARIAN.blue }}
                      onClick={(e) => openLinkMenu(e, event, false)}
                    >
                      <LinkRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Leader link (/power)">
                    <IconButton
                      sx={{ color: MARIAN.gold }}
                      onClick={(e) => openLinkMenu(e, event, true)}
                    >
                      <LinkRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <ChapelFooter />
    </Container>

    <Menu
      anchorReference="anchorPosition"
      anchorPosition={linkMenu?.anchorPosition}
      open={Boolean(linkMenu)}
      onClose={closeLinkMenu}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Typography
        sx={{
          px: 2,
          pt: 1,
          pb: 0.5,
          fontSize: "0.72rem",
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: linkMenu?.leader ? MARIAN.gold : MARIAN.blue,
        }}
      >
        {linkMenu?.leader ? "Leaders Link" : "Public Link"}
      </Typography>
      {[
        { date: getToday(), label: "Today", Icon: TodayRoundedIcon },
        { date: getToday().add(1, "day"), label: "Tomorrow", Icon: EventRoundedIcon },
      ].flatMap(({ date, label, Icon }, idx) => {
        const dateKey = formatDateKey(date);
        const items = [
          <ListSubheader
            key={`${label}-head`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              color: MARIAN.deep,
              fontWeight: 700,
              lineHeight: 2.2,
            }}
          >
            <Icon fontSize="small" />
            {label}
            <Typography
              component="span"
              variant="caption"
              sx={{ color: MARIAN.inkSoft, fontWeight: 500 }}
            >
              · {formatDateLabel(date)}
            </Typography>
          </ListSubheader>,
          <MenuItem key={`${label}-open`} onClick={() => handleOpenLink(dateKey)}>
            <ListItemIcon>
              <OpenInNewRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Open</ListItemText>
          </MenuItem>,
          <MenuItem key={`${label}-copy`} onClick={() => handleCopyLink(dateKey)}>
            <ListItemIcon>
              <ContentCopyRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy</ListItemText>
          </MenuItem>,
        ];
        return idx === 0
          ? [...items, <Divider key={`${label}-div`} />]
          : items;
      })}
    </Menu>

    <BookingsSheet
      open={Boolean(viewingBookings)}
      event={viewingBookings}
      onClose={() => setViewingBookings(null)}
    />
    </Box>
  );
};

export default SlotEventAdmin;
