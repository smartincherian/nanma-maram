import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
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
import NoteAddRoundedIcon from "@mui/icons-material/NoteAddRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
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
import { amberButtonSx, cardSx } from "../Videos/ui";

const eyebrowSx = {
  display: "block",
  fontWeight: 700,
  letterSpacing: "0.18em",
  color: "#935100",
  textTransform: "uppercase",
  fontSize: "0.72rem",
};

// Read-friendly label + palette for a work's status, used in the details sheet.
const STATUS_META = {
  [STAGE_STATUS.PENDING]: { label: "Pending", color: "#8a6a36", bg: "rgba(160,103,38,0.14)" },
  [STAGE_STATUS.IN_PROGRESS]: { label: "In progress", color: "#8a4b00", bg: "rgba(214,123,31,0.16)" },
  [STAGE_STATUS.DONE]: { label: "Done", color: "#2e7d32", bg: "rgba(46,125,50,0.14)" },
};

// Shared bottom-sheet footer: one row, secondary action at the left end and the
// primary action at the right end. Both work sheets use this so their footers
// read identically. See CLAUDE.md → "UI consistency".
const sheetActionsSx = {
  px: 3,
  pt: 1.5,
  pb: { xs: "calc(16px + env(safe-area-inset-bottom))", sm: 2 },
  justifyContent: "space-between",
  gap: 1,
};

// Secondary (dismiss) button styling shared across the sheets.
const dismissButtonSx = { textTransform: "none", color: "#5b6472", fontWeight: 600 };

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
  // The open work is driven by the URL (/crew/work/:videoId/:stageId) so the
  // sheet is a modal route — back button dismisses it and it's deep-linkable.
  const { videoId, stageId } = useParams();
  const [anchorEl, setAnchorEl] = useState(null);
  const [available, setAvailable] = useState(crew?.available !== false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [works, setWorks] = useState([]);
  const [videoTitles, setVideoTitles] = useState({});
  const [noteDraft, setNoteDraft] = useState("");
  const [savingWork, setSavingWork] = useState(false);
  const [confirmDoneWork, setConfirmDoneWork] = useState(null);
  const [markingDone, setMarkingDone] = useState(false);
  const [detailsWork, setDetailsWork] = useState(null); // work shown in the read-only details sheet

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

  // Resolve the URL params to the actual work doc. Null while works load or if
  // the link points at a work that no longer exists / isn't this member's.
  const selectedWork = useMemo(
    () => (videoId && stageId ? works.find((w) => w.videoId === videoId && w.stageId === stageId) || null : null),
    [works, videoId, stageId]
  );

  // Seed the note field when a work opens; keyed on id so live updates to the
  // same work don't clobber what the member is typing.
  useEffect(() => {
    if (selectedWork) setNoteDraft(selectedWork.note || "");
  }, [selectedWork?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const openWork = (w) => navigate(`/crew/work/${w.videoId}/${w.stageId}`);
  const closeWork = () => navigate("/crew");

  // Crew can only save their note — they can't move the work between statuses
  // (that stays with the admin); the one exception is marking it done below.
  const handleSaveNote = async () => {
    if (!selectedWork) return;
    setSavingWork(true);
    try {
      await updateWork(selectedWork.videoId, selectedWork.stageId, { note: noteDraft }, crew.id, "crew");
      showSnackbar("Note updated. 🙏", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      closeWork();
    } catch (e) {
      showSnackbar(e?.message || "Could not update the work.", SNACK_BAR_SEVERITY_TYPES.ERROR);
    } finally {
      setSavingWork(false);
    }
  };

  // Mark done is now a card-level action with its own confirmation, so it takes
  // the work explicitly rather than relying on the open sheet.
  const handleMarkDone = async () => {
    const work = confirmDoneWork;
    if (!work) return;
    setMarkingDone(true);
    try {
      await updateWork(work.videoId, work.stageId, { status: STAGE_STATUS.DONE }, crew.id, "crew");
      showSnackbar("Marked as done. God bless! 🙏", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      setConfirmDoneWork(null);
      // If this work's sheet happened to be open, drop back to the list.
      if (selectedWork && selectedWork.id === work.id) closeWork();
    } catch (e) {
      showSnackbar(e?.message || "Could not update the work.", SNACK_BAR_SEVERITY_TYPES.ERROR);
    } finally {
      setMarkingDone(false);
    }
  };

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
                  const due = getDueMeta(w.dueDate);
                  return (
                    <Box
                      key={w.id}
                      onClick={() => setDetailsWork(w)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${getStepName(w.stageId, w.stageId)}`}
                      onKeyDown={(e) => {
                        // Only when the card itself is focused — otherwise Enter/Space
                        // on an inner button would bubble here and open this too.
                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setDetailsWork(w);
                        }
                      }}
                      sx={{
                        borderRadius: 2,
                        p: 1.25,
                        cursor: "pointer",
                        border: due?.overdue ? "1px solid rgba(179,38,30,0.4)" : "1px solid rgba(160,103,38,0.18)",
                        backgroundColor: due?.overdue ? "rgba(179,38,30,0.05)" : "rgba(255,255,255,0.6)",
                        transition: "background-color 120ms ease, box-shadow 120ms ease",
                        "&:hover": { boxShadow: "0 6px 16px rgba(147,81,0,0.12)" },
                      }}
                    >
                      {/* Title on the left; due date pinned top-right so it's
                          never squeezed by the action buttons below. */}
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography noWrap sx={{ fontWeight: 800, color: "#1f2937" }}>
                            {videoTitles[w.videoId] || "…"}
                          </Typography>
                          <Typography noWrap sx={{ fontSize: "0.85rem", color: "#8a6a36" }}>
                            {getStepName(w.stageId, w.stageId)}
                          </Typography>
                        </Box>
                        {due ? (
                          <Stack
                            direction="row"
                            alignItems="center"
                            gap={0.5}
                            sx={{
                              flexShrink: 0,
                              px: 1,
                              py: 0.25,
                              borderRadius: 1.5,
                              backgroundColor: due.bg,
                            }}
                          >
                            <EventRoundedIcon sx={{ fontSize: 15, color: due.color }} />
                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: due.color, whiteSpace: "nowrap" }}>
                              {due.label}
                            </Typography>
                          </Stack>
                        ) : null}
                      </Stack>
                      {/* Card body opens the details sheet; the buttons stop
                          propagation so Add note / Mark done keep their own action.
                          Add note sits at the left end, Mark done at the right. */}
                      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<NoteAddRoundedIcon />}
                          aria-label={`${w.note ? "Edit" : "Add"} note for ${getStepName(w.stageId, w.stageId)}`}
                          onClick={(e) => { e.stopPropagation(); openWork(w); }}
                          sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: 2.5,
                            px: 1.5,
                            color: "#935100",
                            borderColor: "rgba(147,81,0,0.5)",
                            "&:hover": { borderColor: "#935100", backgroundColor: "rgba(147,81,0,0.06)" },
                          }}
                        >
                          {w.note ? "Edit note" : "Add note"}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleRoundedIcon />}
                          aria-label={`Mark ${getStepName(w.stageId, w.stageId)} as done`}
                          onClick={(e) => { e.stopPropagation(); setConfirmDoneWork(w); }}
                          sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: 2.5,
                            px: 1.75,
                            boxShadow: "0 4px 10px rgba(46,125,50,0.28)",
                          }}
                        >
                          Mark done
                        </Button>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Stack>
      </Container>

      {/* Read-only details — opened by tapping a work card. Shows every field we
          have on the work; the Add note / Mark done actions live on the card. */}
      <Dialog
        open={Boolean(detailsWork)}
        onClose={() => setDetailsWork(null)}
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
        {detailsWork ? (() => {
          const due = getDueMeta(detailsWork.dueDate);
          const status = STATUS_META[detailsWork.status] || STATUS_META[STAGE_STATUS.PENDING];
          return (
            <>
              <DialogTitle sx={{ fontWeight: 800, color: "#3b2a13", pb: 0.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <span>{getStepName(detailsWork.stageId, detailsWork.stageId)}</span>
                  <Chip size="small" label={status.label} sx={{ fontWeight: 700, backgroundColor: status.bg, color: status.color }} />
                </Stack>
              </DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 0.5 }} divider={<Box sx={{ height: 1, backgroundColor: "rgba(160,103,38,0.12)" }} />}>
                  <Box>
                    <Typography sx={eyebrowSx}>Video</Typography>
                    <Typography sx={{ fontWeight: 700, color: "#1f2937" }}>
                      {videoTitles[detailsWork.videoId] || "…"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography sx={eyebrowSx}>Expected by</Typography>
                    {due ? (
                      <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.25 }}>
                        <EventRoundedIcon sx={{ fontSize: 18, color: due.color }} />
                        <Typography sx={{ fontWeight: 700, color: due.color }}>
                          {dayjs(detailsWork.dueDate).format("D MMM YYYY")} · {due.label}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography sx={{ color: "#8a6a36" }}>No due date set</Typography>
                    )}
                  </Box>

                  {detailsWork.assignedBy || detailsWork.assignedAt ? (
                    <Box>
                      <Typography sx={eyebrowSx}>Assigned</Typography>
                      {detailsWork.assignedBy ? (
                        <Typography sx={{ color: "#3b2a13", overflowWrap: "anywhere" }}>
                          By {detailsWork.assignedBy}
                        </Typography>
                      ) : null}
                      {detailsWork.assignedAt ? (
                        <Typography variant="body2" sx={{ color: "#8a6a36" }}>
                          On {dayjs(detailsWork.assignedAt).format("D MMM YYYY · h:mm A")}
                        </Typography>
                      ) : null}
                    </Box>
                  ) : null}

                  <Box>
                    <Typography sx={eyebrowSx}>Note</Typography>
                    {detailsWork.note ? (
                      <Typography sx={{ color: "#3b2a13", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                        {detailsWork.note}
                      </Typography>
                    ) : (
                      <Typography sx={{ color: "#8a6a36" }}>No note yet</Typography>
                    )}
                  </Box>

                  {detailsWork.updatedAt ? (
                    <Box>
                      <Typography sx={eyebrowSx}>Last updated</Typography>
                      <Typography variant="body2" sx={{ color: "#8a6a36" }}>
                        {dayjs(detailsWork.updatedAt).format("D MMM YYYY · h:mm A")}
                        {detailsWork.updatedBy ? ` · ${detailsWork.updatedBy}` : ""}
                      </Typography>
                    </Box>
                  ) : null}
                </Stack>
              </DialogContent>
              <DialogActions sx={sheetActionsSx}>
                <Button
                  startIcon={<NoteAddRoundedIcon />}
                  onClick={() => { const w = detailsWork; setDetailsWork(null); openWork(w); }}
                  sx={{ textTransform: "none", color: "#935100", fontWeight: 700 }}
                >
                  {detailsWork.note ? "Edit note" : "Add note"}
                </Button>
                <Button onClick={() => setDetailsWork(null)} sx={dismissButtonSx}>
                  Close
                </Button>
              </DialogActions>
            </>
          );
        })() : null}
      </Dialog>

      {/* Work detail — notes, status, dates, update. Stays on /crew. */}
      <Dialog
        open={Boolean(selectedWork)}
        onClose={closeWork}
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
              {selectedWork?.updatedAt ? (
                <Typography variant="caption" sx={{ color: "#8a6a36", display: "block", mt: 0.75 }}>
                  Last updated {dayjs(selectedWork.updatedAt).format("D MMM YYYY · h:mm A")}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={sheetActionsSx}>
          <Button onClick={closeWork} sx={dismissButtonSx}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveRoundedIcon />}
            onClick={handleSaveNote}
            disabled={savingWork || noteDraft === (selectedWork?.note || "")}
            sx={amberButtonSx}
          >
            {savingWork ? "Saving…" : "Save note"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm before marking a work done — it's a one-way action for crew
          (only the admin can reopen it afterwards). */}
      <Dialog
        open={Boolean(confirmDoneWork)}
        onClose={() => setConfirmDoneWork(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 4, m: 2, maxWidth: 380 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#3b2a13", pb: 1 }}>Mark as done?</DialogTitle>
        <DialogContent>
          <Stack direction="row" alignItems="flex-start" gap={1}>
            <CheckCircleRoundedIcon sx={{ color: "#2e7d32", mt: 0.25, flexShrink: 0 }} />
            <Typography sx={{ color: "#3f3a33" }}>
              Mark{" "}
              <strong>{confirmDoneWork ? getStepName(confirmDoneWork.stageId, confirmDoneWork.stageId) : ""}</strong>
              {" "}for{" "}
              <strong>{confirmDoneWork ? (videoTitles[confirmDoneWork.videoId] || "this video") : ""}</strong>
              {" "}as done?
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button
            onClick={() => setConfirmDoneWork(null)}
            sx={{ textTransform: "none", color: "#5b6472", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleRoundedIcon />}
            onClick={handleMarkDone}
            disabled={markingDone}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, px: 2.5 }}
          >
            {markingDone ? "Saving…" : "Mark done"}
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
