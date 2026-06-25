import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Avatar, Box, Button, Chip, CircularProgress, Container, Dialog,
  DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton,
  Menu, MenuItem, Paper, Slide, Stack, Switch, TextField, Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import dayjs from "dayjs";
import { useAuth } from "../../components/AuthProvider";
import { signOutUser } from "../../firebase/auth";
import { setCrewAvailability } from "../../firebase/video/crew";
import { subscribeMyWorks, updateWork } from "../../firebase/video/works";
import { getVideo } from "../../firebase/video/videos";
import { STAGE_STATUS } from "../../utils/videoWorkflow";
import { getStepName } from "../../utils/videoSteps";
import { getDueMeta } from "../../utils/dueDate";
import { SnackbarContext, SNACK_BAR_SEVERITY_TYPES } from "../../components/Snackbar";
import ChapelFooter from "../../components/ChapelFooter";
import { cardSx, STAGE_STATUS_META } from "../Videos/ui";

const eyebrowSx = {
  display: "block",
  fontWeight: 700,
  letterSpacing: "0.18em",
  color: "#935100",
  textTransform: "uppercase",
  fontSize: "0.72rem",
};

const sectionSx = { ...cardSx, borderRadius: { xs: 3, sm: 4 } };

const availabilitySx = { ...cardSx, borderRadius: { xs: 3, sm: 4 }, py: 1 };

const heroSx = {
  ...cardSx,
  borderRadius: { xs: 3, sm: 4 },
  border: "1.5px solid rgba(147, 81, 0, 0.32)",
  boxShadow: "0 14px 32px rgba(147, 81, 0, 0.12)",
  background: "linear-gradient(180deg, rgba(255,250,242,0.97) 0%, rgba(255,242,226,0.97) 100%)",
};

const pageSx = {
  minHeight: "100svh",
  pt: { xs: 3, sm: 6 },
  pb: { xs: "calc(88px + env(safe-area-inset-bottom))", sm: 6 },
  background:
    "radial-gradient(circle at top, rgba(255, 232, 208, 0.95) 0%, rgba(255, 247, 236, 0.96) 34%, #fffdf8 100%)",
};

// Slide up — used so the work dialog reads as a bottom sheet on phones.
const SlideUp = React.forwardRef(function SlideUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CrewHome = () => {
  const { user, crew, isCrew, loading, refreshCrew } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { showSnackbar } = useContext(SnackbarContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [available, setAvailable] = useState(crew?.available !== false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [works, setWorks] = useState([]);
  const [videoTitles, setVideoTitles] = useState({});
  const [selectedWork, setSelectedWork] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingWork, setSavingWork] = useState(false);

  // Sync the toggle from Firestore once the crew record loads. Without this the
  // initial useState value (computed while crew is still null) sticks, so a
  // member saved as unavailable would wrongly show as available.
  useEffect(() => {
    if (crew) setAvailable(crew.available !== false);
  }, [crew]);

  // Live subscription to this member's works.
  useEffect(() => {
    if (!crew?.id) return undefined;
    return subscribeMyWorks(crew.id, setWorks);
  }, [crew?.id]);

  // Open works only — pending or in progress, never done.
  const openWorks = useMemo(
    () => works.filter((w) => w.status !== STAGE_STATUS.DONE),
    [works]
  );

  // Fetch the title for each distinct video referenced by an open work. A ref
  // tracks ids already requested so each video is read exactly once — without
  // it, depending on `videoTitles` would re-run this as each title resolves and
  // re-fetch any still-in-flight id (dedup'd, so several steps of one video cost
  // a single read).
  const requestedTitles = useRef(new Set());
  useEffect(() => {
    const missing = [...new Set(openWorks.map((w) => w.videoId))].filter(
      (id) => id && !requestedTitles.current.has(id)
    );
    missing.forEach((id) => {
      requestedTitles.current.add(id);
      getVideo(id)
        .then((v) => setVideoTitles((prev) => ({ ...prev, [id]: v?.title || "Untitled" })))
        .catch(() => setVideoTitles((prev) => ({ ...prev, [id]: "Untitled" })));
    });
  }, [openWorks]);

  if (loading) {
    return (
      <Box sx={{ ...pageSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isCrew) return <Navigate to="/crew/join" replace />;

  const toggleAvailability = async () => {
    const next = !available;
    setAvailable(next);
    setSavingAvailability(true);
    try {
      await setCrewAvailability(crew.id, next);
      await refreshCrew();
    } catch (e) {
      setAvailable(!next);
      showSnackbar("Could not update availability.", SNACK_BAR_SEVERITY_TYPES.ERROR);
    } finally {
      setSavingAvailability(false);
    }
  };

  const openWork = (w) => {
    setSelectedWork(w);
    setNoteDraft(w.note || "");
  };

  // Crew can only save their note, or mark the work done — they can't move it
  // back to other statuses (that stays with the admin).
  const saveWork = async (patch, successMsg) => {
    if (!selectedWork) return;
    setSavingWork(true);
    try {
      await updateWork(selectedWork.videoId, selectedWork.stageId, patch, crew.id);
      showSnackbar(successMsg, SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      setSelectedWork(null);
    } catch (e) {
      showSnackbar(e?.message || "Could not update the work.", SNACK_BAR_SEVERITY_TYPES.ERROR);
    } finally {
      setSavingWork(false);
    }
  };

  const handleSaveNote = () => saveWork({ note: noteDraft }, "Note updated. 🙏");
  const handleMarkDone = () =>
    saveWork({ note: noteDraft, status: STAGE_STATUS.DONE }, "Marked as done. God bless! 🙏");

  return (
    <Box sx={{ ...pageSx, display: "flex", flexDirection: "column" }}>
      <Container maxWidth="sm">
        <Stack spacing={2}>
          {/* Section 1 — identity */}
          <Paper elevation={0} sx={sectionSx}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontStyle: "italic", fontWeight: 700, color: "#3b2a13", minWidth: 0 }}>
                Welcome, {(crew?.name || "").split(" ")[0]}
              </Typography>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Account menu" sx={{ p: 0.5 }}>
                <Avatar src={user?.photoURL || undefined} alt={crew?.name} sx={{ width: 40, height: 40 }}>
                  {crew?.name?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { setAnchorEl(null); navigate("/crew/profile"); }}>
                  <PersonRoundedIcon fontSize="small" sx={{ mr: 1, color: "#935100" }} /> Profile
                </MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); signOutUser(); }}>
                  <LogoutRoundedIcon fontSize="small" sx={{ mr: 1, color: "#b3261e" }} /> Logout
                </MenuItem>
              </Menu>
            </Stack>
          </Paper>

          {/* Section 2 — availability */}
          <Paper elevation={0} sx={availabilitySx}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="overline" sx={{ ...eyebrowSx, lineHeight: 1.2 }}>Availability</Typography>
              </Box>
              <FormControlLabel
                sx={{ mr: 0 }}
                control={
                  <Switch
                    checked={available}
                    onChange={toggleAvailability}
                    disabled={savingAvailability}
                    color="success"
                  />
                }
                label={
                  <Chip
                    size="small"
                    label={available ? "Available" : "Not available"}
                    sx={{
                      fontWeight: 700,
                      backgroundColor: available ? "rgba(46,125,50,0.14)" : "rgba(91,100,114,0.14)",
                      color: available ? "#2e7d32" : "#5b6472",
                    }}
                  />
                }
              />
            </Stack>
          </Paper>

          {/* Section 3 — open works (the focus) */}
          <Paper elevation={0} sx={heroSx}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AssignmentRoundedIcon sx={{ color: "#935100" }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#3b2a13" }}>
                Your works
              </Typography>
              {openWorks.length > 0 ? (
                <Chip size="small" label={openWorks.length} sx={{ fontWeight: 800, backgroundColor: "rgba(214,123,31,0.16)", color: "#8a4b00" }} />
              ) : null}
            </Stack>
            {openWorks.length === 0 ? (
              <Typography variant="body2" sx={{ color: "#8a6a36", mt: 1 }}>
                No open works right now. Newly assigned works will appear here.
              </Typography>
            ) : (
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {openWorks.map((w) => {
                  const meta = STAGE_STATUS_META[w.status] || STAGE_STATUS_META.pending;
                  const due = getDueMeta(w.dueDate);
                  return (
                    <Box
                      key={w.id}
                      onClick={() => openWork(w)}
                      sx={{
                        cursor: "pointer",
                        borderRadius: 2,
                        p: 1.25,
                        border: due?.overdue ? "1px solid rgba(179,38,30,0.4)" : "1px solid rgba(160,103,38,0.18)",
                        backgroundColor: due?.overdue ? "rgba(179,38,30,0.05)" : "rgba(255,255,255,0.6)",
                        transition: "background-color 0.15s",
                        "&:hover": { backgroundColor: "rgba(214,123,31,0.06)" },
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography noWrap sx={{ fontWeight: 800, color: "#1f2937" }}>
                            {videoTitles[w.videoId] || "…"}
                          </Typography>
                          <Typography noWrap sx={{ fontSize: "0.85rem", color: "#8a6a36" }}>
                            {getStepName(w.stageId, w.stageId)}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={meta.label}
                          sx={{ flexShrink: 0, fontWeight: 700, backgroundColor: meta.bg, color: meta.color }}
                        />
                      </Stack>
                      {due ? (
                        <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.75 }}>
                          <EventRoundedIcon sx={{ fontSize: 15, color: due.color }} />
                          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: due.color }}>
                            {due.label}
                          </Typography>
                        </Stack>
                      ) : null}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Stack>
      </Container>

      {/* Work detail — notes, status, dates, update. Stays on /crew. */}
      <Dialog
        open={Boolean(selectedWork)}
        onClose={() => setSelectedWork(null)}
        fullWidth
        maxWidth="xs"
        TransitionComponent={isMobile ? SlideUp : undefined}
        sx={{ "& .MuiDialog-container": { alignItems: { xs: "flex-end", sm: "center" } } }}
        PaperProps={{
          sx: {
            m: { xs: 0, sm: 4 },
            width: "100%",
            maxWidth: { sm: 444 },
            borderRadius: { xs: "22px 22px 0 0", sm: 4 },
          },
        }}
      >
        {isMobile ? (
          <Box sx={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(147,81,0,0.25)", mx: "auto", mt: 1.25 }} />
        ) : null}
        <DialogTitle sx={{ fontWeight: 800, color: "#3b2a13", pb: 0.5 }}>
          {selectedWork ? getStepName(selectedWork.stageId, selectedWork.stageId) : ""}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ mt: 0.5 }}>
            <Box>
              <Typography sx={eyebrowSx}>Video</Typography>
              <Typography sx={{ fontWeight: 700, color: "#1f2937" }}>
                {selectedWork ? (videoTitles[selectedWork.videoId] || "…") : ""}
              </Typography>
            </Box>

            {(() => {
              const due = getDueMeta(selectedWork?.dueDate);
              return due ? (
                <Box>
                  <Typography sx={eyebrowSx}>Expected by</Typography>
                  <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.25 }}>
                    <EventRoundedIcon sx={{ fontSize: 18, color: due.color }} />
                    <Typography sx={{ fontWeight: 700, color: due.color }}>
                      {dayjs(selectedWork.dueDate).format("D MMM YYYY")} · {due.label}
                    </Typography>
                  </Stack>
                </Box>
              ) : null;
            })()}

            <Box>
              <TextField
                label="Notes / link"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder="Add a note or paste a link"
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
                <Button
                  size="small"
                  onClick={handleSaveNote}
                  disabled={savingWork || noteDraft === (selectedWork?.note || "")}
                  sx={{ textTransform: "none", fontWeight: 700, color: "#935100" }}
                >
                  {savingWork ? "Saving…" : "Update note"}
                </Button>
              </Box>
            </Box>

            {selectedWork?.updatedAt ? (
              <Typography variant="body2" sx={{ color: "#8a6a36" }}>
                Last updated {dayjs(selectedWork.updatedAt).format("D MMM YYYY · h:mm A")}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pt: 1, pb: { xs: "calc(16px + env(safe-area-inset-bottom))", sm: 2 } }}>
          <Button onClick={() => setSelectedWork(null)} sx={{ textTransform: "none", color: "#5b6472" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleRoundedIcon />}
            onClick={handleMarkDone}
            disabled={savingWork}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5 }}
          >
            Mark as done
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ flexGrow: 1 }} />
      <Typography variant="caption" sx={{ textAlign: "center", color: "#8a6a36", fontStyle: "italic", pt: 3 }}>
        Jesus Loves You 🙏
      </Typography>
      <ChapelFooter />
    </Box>
  );
};

export default CrewHome;
