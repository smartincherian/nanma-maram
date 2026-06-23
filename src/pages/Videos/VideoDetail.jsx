import React, { useContext, useEffect, useState } from "react";
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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useNavigate, useParams } from "react-router-dom";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { useAuth } from "../../components/AuthProvider";
import { subscribeVideo, updateVideoStage, deleteVideo } from "../../firebase/video/videos";
import { listCrew } from "../../firebase/video/crew";
import {
  STAGE_STATUS,
  progress,
} from "../../utils/videoWorkflow";
import { amberButtonSx, VIDEO_STATUS_META } from "./ui";
import StageTimeline from "./components/StageTimeline";
import CrewPicker from "./components/CrewPicker";

const VideoDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);

  const [video, setVideo] = useState(undefined); // undefined = loading, null = missing
  const [crew, setCrew] = useState([]);
  const [editStage, setEditStage] = useState(null); // { stageId, status, assigneeId, assigneeName, note }
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const unsub = subscribeVideo(id, setVideo);
    listCrew().then(setCrew).catch(() => {});
    return unsub;
  }, [id]);

  const openStageDialog = (stage) =>
    setEditStage({
      stageId: stage.stageId,
      name: stage.name,
      status: stage.status,
      assigneeId: stage.assigneeId,
      assigneeName: stage.assigneeName,
      note: stage.note || "",
    });

  const handleCompleteStage = async (stage) => {
    try {
      await updateVideoStage(id, stage.stageId, { status: STAGE_STATUS.DONE }, user?.email || "");
    } catch (e) {
      showSnackbar(e?.message || "Could not update stage.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    showSnackbar(`${stage.name} complete`, SNACK_BAR_SEVERITY_TYPES.SUCCESS);
  };

  // Save assignee + note from the Edit dialog without touching status.
  const handleStageSave = async () => {
    setSaving(true);
    try {
      await updateVideoStage(
        id,
        editStage.stageId,
        {
          assigneeId: editStage.assigneeId,
          assigneeName: editStage.assigneeName,
          note: editStage.note,
        },
        user?.email || ""
      );
    } catch (e) {
      showSnackbar(e?.message || "Could not update stage.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditStage(null);
    showSnackbar("Stage updated", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
  };

  // Reopen a completed stage — it becomes the active stage again.
  const handleReopenStage = async () => {
    setSaving(true);
    try {
      await updateVideoStage(id, editStage.stageId, { status: STAGE_STATUS.PENDING }, user?.email || "");
    } catch (e) {
      showSnackbar(e?.message || "Could not reopen stage.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditStage(null);
    showSnackbar("Stage reopened", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
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

  const { done, total } = progress(video);
  const statusMeta = VIDEO_STATUS_META[video.status] || VIDEO_STATUS_META.active;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2.5, sm: 5 }, px: { xs: 1.5, sm: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/videos")} sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600, minWidth: 0 }}>
          Videos
        </Button>
        <Stack direction="row">
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
          <StageTimeline stages={video.stages || []} onCompleteStage={handleCompleteStage} onEditStage={openStageDialog} />
        </Box>
      </Paper>

      {/* Stage update dialog */}
      <Dialog open={editStage !== null} onClose={() => setEditStage(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{editStage?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <CrewPicker
              crew={crew}
              value={editStage?.assigneeId || null}
              onChange={(assigneeId, assigneeName) => setEditStage((s) => ({ ...s, assigneeId, assigneeName }))}
            />
            <TextField label="Note / link (optional)" value={editStage?.note || ""} onChange={(e) => setEditStage((s) => ({ ...s, note: e.target.value }))} fullWidth multiline minRows={2} placeholder="e.g. YouTube URL" />
            {editStage?.status === STAGE_STATUS.DONE ? (
              <Button onClick={handleReopenStage} disabled={saving} sx={{ textTransform: "none", fontWeight: 700, color: "#935100", alignSelf: "flex-start", px: 0 }}>
                Reopen this stage
              </Button>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditStage(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleStageSave} disabled={saving} sx={amberButtonSx}>Save</Button>
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
    </Container>
  );
};

export default VideoDetail;
