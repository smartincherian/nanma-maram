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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { useAuth } from "../../components/AuthProvider";
import { subscribeVideo, updateVideoStage, deleteVideo } from "../../firebase/video/videos";
import { listCrew } from "../../firebase/video/crew";
import { listSkills } from "../../firebase/video/skills";
import {
  STAGE_STATUS,
  progress,
} from "../../utils/videoWorkflow";
import { amberButtonSx, PRIORITY_META, VIDEO_STATUS_META } from "./ui";
import StageTimeline from "./components/StageTimeline";
import CrewPicker from "./components/CrewPicker";

const VideoDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);

  const [video, setVideo] = useState(undefined); // undefined = loading, null = missing
  const [crew, setCrew] = useState([]);
  const [skills, setSkills] = useState([]);
  const [editStage, setEditStage] = useState(null); // { stageId, status, assigneeId, assigneeName, note }
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const unsub = subscribeVideo(id, setVideo);
    listCrew().then(setCrew).catch(() => {});
    listSkills().then(setSkills).catch(() => {});
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

  const handleStageSave = async () => {
    setSaving(true);
    try {
      await updateVideoStage(
        id,
        editStage.stageId,
        {
          status: editStage.status,
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
  const priorityMeta = PRIORITY_META[video.priority] || PRIORITY_META.normal;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/videos")} sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600 }}>
          Videos
        </Button>
        <Stack direction="row">
          <IconButton aria-label="Edit video" onClick={() => navigate(`/videos/${id}/edit`)} sx={{ color: "#935100" }}><EditRoundedIcon /></IconButton>
          <IconButton aria-label="Delete video" onClick={() => setConfirmDelete(true)} sx={{ color: "#b3261e" }}><DeleteOutlineRoundedIcon /></IconButton>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 4, border: "1px solid rgba(160,103,38,0.16)", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#1f2937", mb: 1 }}>{video.title}</Typography>
        <Stack direction="row" gap={0.75} sx={{ flexWrap: "wrap", mb: 1 }}>
          {video.typeName ? <Chip size="small" label={video.typeName} sx={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#1d4ed8", fontWeight: 700 }} /> : null}
          <Chip size="small" label={statusMeta.label} sx={{ backgroundColor: statusMeta.bg, color: statusMeta.color, fontWeight: 700 }} />
          <Chip size="small" label={`${priorityMeta.label} priority`} sx={{ backgroundColor: priorityMeta.bg, color: priorityMeta.color, fontWeight: 700 }} />
          <Chip size="small" label={`${done}/${total} done`} sx={{ backgroundColor: "rgba(46,125,50,0.12)", color: "#1b5e20", fontWeight: 700 }} />
        </Stack>
        {video.targetDate ? (
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ color: "#8a6a36" }}>
            <EventRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: "0.9rem" }}>Target {dayjs(video.targetDate).format("ddd, D MMM YYYY")}</Typography>
          </Stack>
        ) : null}
      </Paper>

      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 4, border: "1px solid rgba(160,103,38,0.16)" }}>
        <Typography variant="overline" sx={{ letterSpacing: "0.18em", color: "#a16207", fontWeight: 700 }}>Production timeline</Typography>
        <Box sx={{ mt: 2 }}>
          <StageTimeline stages={video.stages || []} onEditStage={openStageDialog} />
        </Box>
      </Paper>

      {/* Stage update dialog */}
      <Dialog open={editStage !== null} onClose={() => setEditStage(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{editStage?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <CrewPicker
              crew={crew}
              skills={skills}
              value={editStage?.assigneeId || null}
              onChange={(assigneeId, assigneeName) => setEditStage((s) => ({ ...s, assigneeId, assigneeName }))}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={editStage?.status || STAGE_STATUS.PENDING} onChange={(e) => setEditStage((s) => ({ ...s, status: e.target.value }))}>
                <MenuItem value={STAGE_STATUS.PENDING}>Pending</MenuItem>
                <MenuItem value={STAGE_STATUS.IN_PROGRESS}>In progress</MenuItem>
                <MenuItem value={STAGE_STATUS.DONE}>Done</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Note / link (optional)" value={editStage?.note || ""} onChange={(e) => setEditStage((s) => ({ ...s, note: e.target.value }))} fullWidth multiline minRows={2} placeholder="e.g. YouTube URL" />
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
