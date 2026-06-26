import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Slide,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import NoteAddRoundedIcon from "@mui/icons-material/NoteAddRounded";
import { useNavigate, useParams } from "react-router-dom";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { useAuth } from "../../components/AuthProvider";
import {
  subscribeVideo,
  deleteVideo,
  rejectVideo,
  reactivateVideo,
  updateVideoMeta,
} from "../../firebase/video/videos";
import { subscribeVideoWorks, updateWork } from "../../firebase/video/works";
import { listCrew } from "../../firebase/video/crew";
import { STAGE_STATUS, VIDEO_STATUS, mergeStepsWithWorks } from "../../utils/videoWorkflow";
import { getStepSkills, getStepName } from "../../utils/videoSteps";
import { amberButtonSx, VIDEO_STATUS_META } from "./ui";
import StageTimeline from "./components/StageTimeline";
import CrewPicker from "./components/CrewPicker";
import ChapelFooter from "../../components/ChapelFooter";

// Slide up — used so the stage dialog reads as a bottom sheet on phones.
const SlideUp = React.forwardRef(function SlideUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const VideoDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [video, setVideo] = useState(undefined); // undefined = loading, null = missing
  const [works, setWorks] = useState([]);
  const [crew, setCrew] = useState([]);
  const [editStage, setEditStage] = useState(null); // { stageId, status, assigneeId, assigneeName, note }
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [editingRemarks, setEditingRemarks] = useState(false);
  const [remarksDraft, setRemarksDraft] = useState("");
  const [savingRemarks, setSavingRemarks] = useState(false);

  useEffect(() => {
    const unsubVideo = subscribeVideo(id, setVideo);
    const unsubWorks = subscribeVideoWorks(id, setWorks);
    listCrew().then(setCrew).catch(() => {});
    return () => {
      unsubVideo();
      unsubWorks();
    };
  }, [id]);

  // The 7 fixed steps with each step's live work overlaid; assignee names are
  // resolved from the crew list since work docs only store the id.
  const crewById = useMemo(
    () => Object.fromEntries(crew.map((c) => [c.id, c])),
    [crew]
  );
  const steps = useMemo(
    () => mergeStepsWithWorks(works, (assigneeId) => crewById[assigneeId]?.name || null),
    [works, crewById]
  );

  const openStageDialog = (stage, startOnSave = false) =>
    setEditStage({
      stageId: stage.stageId,
      name: getStepName(stage.stageId, stage.name),
      status: stage.status,
      assigneeId: stage.assigneeId,
      assigneeName: stage.assigneeName,
      note: stage.note || "",
      dueDate: stage.dueDate || "",
      startOnSave,
    });

  // Tapping a step's circle: a pending step opens the assignee dialog first
  // (it becomes In progress on save); In progress → Done; Done → reopen. Steps
  // are independent, so this never touches the other steps.
  const handleCircleTap = async (stage) => {
    if (stage.status === STAGE_STATUS.PENDING) {
      openStageDialog(stage, true);
      return;
    }
    const next = stage.status === STAGE_STATUS.IN_PROGRESS ? STAGE_STATUS.DONE : STAGE_STATUS.PENDING;
    try {
      await updateWork(id, stage.stageId, { status: next }, user?.email || "");
    } catch (e) {
      showSnackbar(e?.message || "Could not update step.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    const stageName = getStepName(stage.stageId, stage.name);
    showSnackbar(
      next === STAGE_STATUS.DONE ? `${stageName} complete` : `${stageName} reopened`,
      SNACK_BAR_SEVERITY_TYPES.SUCCESS
    );
  };

  // Save assignee + note. When opened from a pending step's circle
  // (startOnSave), also move the step to In progress.
  const handleStageSave = async () => {
    setSaving(true);
    const patch = {
      assigneeId: editStage.assigneeId,
      note: editStage.note,
      dueDate: editStage.dueDate || null,
    };
    if (editStage.startOnSave) {
      patch.status = STAGE_STATUS.IN_PROGRESS;
    }
    try {
      await updateWork(id, editStage.stageId, patch, user?.email || "");
    } catch (e) {
      showSnackbar(e?.message || "Could not update stage.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setSaving(false);
      return;
    }
    const started = editStage.startOnSave;
    setSaving(false);
    setEditStage(null);
    showSnackbar(started ? "Step started" : "Stage updated", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
  };

  // Reopen a completed stage — it goes straight back to In progress (not pending),
  // since reopening means work is resuming on it.
  const handleReopenStage = async () => {
    setSaving(true);
    try {
      await updateWork(id, editStage.stageId, { status: STAGE_STATUS.IN_PROGRESS }, user?.email || "");
    } catch (e) {
      showSnackbar(e?.message || "Could not reopen stage.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditStage(null);
    showSnackbar("Stage reopened", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
  };

  // Reject the video — leaves the step docs untouched. Any remark typed here is
  // saved to the same `remarks` field that the Remarks section below shows/edits.
  const handleReject = async () => {
    setRejecting(true);
    try {
      await rejectVideo(id, { remarks: rejectRemarks }, user?.email || "");
    } catch (e) {
      showSnackbar(e?.message || "Could not reject video.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setRejecting(false);
      return;
    }
    setRejecting(false);
    setRejectOpen(false);
    setRejectRemarks("");
    showSnackbar("Video rejected", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
  };

  const handleReactivate = async () => {
    try {
      await reactivateVideo(id);
    } catch (e) {
      showSnackbar(e?.message || "Could not reactivate video.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    showSnackbar("Video reactivated", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
  };

  const handleSaveRemarks = async () => {
    setSavingRemarks(true);
    try {
      await updateVideoMeta(id, { remarks: remarksDraft.trim() });
    } catch (e) {
      showSnackbar(e?.message || "Could not save remarks.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setSavingRemarks(false);
      return;
    }
    setSavingRemarks(false);
    setEditingRemarks(false);
    showSnackbar("Remarks saved", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
  };

  const handleDelete = async () => {
    try {
      await deleteVideo(id);
    } catch (e) {
      showSnackbar("Could not delete video.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    showSnackbar("Video deleted", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
    navigate("/videos");
  };

  if (video === undefined) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (video === null) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#6f3a00", mb: 2 }}>Video not found</Typography>
        <Button variant="contained" onClick={() => navigate("/videos")} sx={amberButtonSx}>Back to videos</Button>
      </Container>
    );
  }

  const done = steps.filter((s) => s.status === STAGE_STATUS.DONE).length;
  const total = steps.length;
  const statusMeta = VIDEO_STATUS_META[video.status] || VIDEO_STATUS_META.active;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2.5, sm: 5 }, px: { xs: 1.5, sm: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/videos")} sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600, minWidth: 0 }}>
          Videos
        </Button>
        <Stack direction="row">
          {video.status === VIDEO_STATUS.REJECTED ? (
            <IconButton aria-label="Reactivate video" onClick={handleReactivate} sx={{ color: "#2e7d32" }}><ReplayRoundedIcon /></IconButton>
          ) : (
            <IconButton
              aria-label="Reject video"
              onClick={() => {
                setRejectRemarks(video.remarks || "");
                setRejectOpen(true);
              }}
              sx={{ color: "#b3261e" }}
            >
              <BlockRoundedIcon />
            </IconButton>
          )}
          <IconButton aria-label="Edit video" onClick={() => navigate(`/videos/${id}/edit`)} sx={{ color: "#935100" }}><EditRoundedIcon /></IconButton>
          <IconButton aria-label="Delete video" onClick={() => setConfirmDelete(true)} sx={{ color: "#b3261e" }}><DeleteOutlineRoundedIcon /></IconButton>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, border: "1px solid rgba(160,103,38,0.16)", mb: 2.5 }}>
        <Typography sx={{ fontWeight: 800, color: "#1f2937", mb: 1, fontSize: { xs: "1.3rem", sm: "1.6rem" } }}>{video.title}</Typography>
        <Stack direction="row" gap={0.75} sx={{ flexWrap: "wrap" }}>
          <Chip size="small" label={statusMeta.label} sx={{ backgroundColor: statusMeta.bg, color: statusMeta.color, fontWeight: 700 }} />
          <Chip size="small" label={`${done}/${total} done`} sx={{ backgroundColor: "rgba(46,125,50,0.12)", color: "#1b5e20", fontWeight: 700 }} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, border: "1px solid rgba(160,103,38,0.16)" }}>
        <Typography variant="overline" sx={{ letterSpacing: "0.16em", color: "#a16207", fontWeight: 700 }}>Steps</Typography>
        <Box sx={{ mt: 2 }}>
          <StageTimeline stages={steps} onCycleStage={handleCircleTap} onEditStage={openStageDialog} />
        </Box>
      </Paper>

      {/* Remarks — hidden until added; an "Add remarks" button reveals the field.
          A remark set at rejection time shows here too. */}
      {editingRemarks || video.remarks ? (
        <Paper elevation={0} sx={{ mt: 2.5, p: { xs: 2, sm: 3 }, borderRadius: 4, border: "1px solid rgba(160,103,38,0.16)" }}>
          <Typography variant="overline" sx={{ letterSpacing: "0.16em", color: "#a16207", fontWeight: 700 }}>Remarks</Typography>
          {editingRemarks ? (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <TextField
                value={remarksDraft}
                onChange={(e) => setRemarksDraft(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                autoFocus
                placeholder="Add a remark…"
              />
              <Stack direction="row" justifyContent="flex-end" gap={1}>
                <Button onClick={() => setEditingRemarks(false)} sx={{ textTransform: "none", fontWeight: 600, color: "#5b6472" }}>Cancel</Button>
                <Button variant="contained" onClick={handleSaveRemarks} disabled={savingRemarks} sx={{ ...amberButtonSx, px: 3 }}>Save</Button>
              </Stack>
            </Stack>
          ) : (
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1} sx={{ mt: 1 }}>
              <Typography sx={{ color: "#3f3a33", whiteSpace: "pre-wrap", flexGrow: 1, minWidth: 0 }}>{video.remarks}</Typography>
              <IconButton aria-label="Edit remarks" size="small" onClick={() => { setRemarksDraft(video.remarks || ""); setEditingRemarks(true); }} sx={{ color: "#935100" }}><EditRoundedIcon fontSize="small" /></IconButton>
            </Stack>
          )}
        </Paper>
      ) : (
        <Button startIcon={<NoteAddRoundedIcon />} onClick={() => { setRemarksDraft(""); setEditingRemarks(true); }} sx={{ mt: 2.5, textTransform: "none", fontWeight: 700, color: "#935100" }}>Add remarks</Button>
      )}

      {/* Stage update dialog — a bottom sheet on phones, centered dialog above */}
      <Dialog
        open={editStage !== null}
        onClose={() => setEditStage(null)}
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
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{editStage?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <CrewPicker
              crew={crew}
              value={editStage?.assigneeId || null}
              relevantSkills={editStage ? getStepSkills(editStage.stageId) : []}
              onChange={(assigneeId, assigneeName) => setEditStage((s) => ({ ...s, assigneeId, assigneeName }))}
            />
            <TextField
              label="Expected by (optional)"
              type="date"
              value={editStage?.dueDate || ""}
              onChange={(e) => setEditStage((s) => ({ ...s, dueDate: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField label="Note / link (optional)" value={editStage?.note || ""} onChange={(e) => setEditStage((s) => ({ ...s, note: e.target.value }))} fullWidth multiline minRows={2} placeholder="e.g. YouTube URL" />
            {editStage?.status === STAGE_STATUS.DONE ? (
              <Button onClick={handleReopenStage} disabled={saving} sx={{ textTransform: "none", fontWeight: 700, color: "#935100", alignSelf: "flex-start", px: 0 }}>
                Reopen this stage
              </Button>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: { xs: `calc(16px + env(safe-area-inset-bottom))`, sm: 2 },
            pt: 1,
            gap: 1,
            flexDirection: { xs: "column-reverse", sm: "row" },
            "& > :not(style)": { ml: { xs: 0, sm: 1 } },
          }}
        >
          <Button
            onClick={() => setEditStage(null)}
            fullWidth={isMobile}
            sx={{ textTransform: "none", fontWeight: 600, color: "#5b6472", py: { xs: 1.1, sm: 0.5 } }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStageSave}
            disabled={saving}
            fullWidth={isMobile}
            sx={{ ...amberButtonSx, px: 3, py: { xs: 1.1, sm: 0.75 } }}
          >
            {editStage?.startOnSave ? "Start step" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject confirmation — bottom sheet on phones, with an optional remark */}
      <Dialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
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
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Reject this video?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            It moves to the Done tab marked rejected. The steps are left untouched and you can reactivate it later.
          </DialogContentText>
          <TextField
            label="Remarks (optional)"
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            placeholder="Reason for rejection…"
          />
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: { xs: `calc(16px + env(safe-area-inset-bottom))`, sm: 2 },
            pt: 1,
            gap: 1,
            flexDirection: { xs: "column-reverse", sm: "row" },
            "& > :not(style)": { ml: { xs: 0, sm: 1 } },
          }}
        >
          <Button onClick={() => setRejectOpen(false)} fullWidth={isMobile} sx={{ textTransform: "none", fontWeight: 600, color: "#5b6472", py: { xs: 1.1, sm: 0.5 } }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={rejecting} fullWidth={isMobile} sx={{ textTransform: "none", fontWeight: 700, px: 3, py: { xs: 1.1, sm: 0.75 } }}>Reject video</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete video?</DialogTitle>
        <DialogContent>
          <DialogContentText>“{video.title}” and its timeline will be permanently removed.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ textTransform: "none", fontWeight: 700 }}>Confirm delete</Button>
        </DialogActions>
      </Dialog>

      <ChapelFooter />
    </Container>
  );
};

export default VideoDetail;
