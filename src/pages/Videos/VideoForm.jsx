import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate, useParams } from "react-router-dom";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { useAuth } from "../../components/AuthProvider";
import ChapelFooter from "../../components/ChapelFooter";
import { listStages } from "../../firebase/video/stages";
import { addVideo, getVideo, updateVideoMeta } from "../../firebase/video/videos";
import { buildStagesFromList } from "../../utils/videoWorkflow";
import { amberButtonSx } from "./ui";

const VideoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);

  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    (async () => {
      try {
        const video = await getVideo(id);
        if (video && active) setTitle(video.title || "");
      } catch (e) {
        showSnackbar("Could not load video.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      showSnackbar("Title is required.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateVideoMeta(id, { title: title.trim() });
        showSnackbar("Video updated", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
        navigate(`/videos/${id}`);
        return;
      }
      const steps = await listStages();
      if (steps.length === 0) {
        showSnackbar("Add steps first under Manage.", SNACK_BAR_SEVERITY_TYPES.ERROR);
        setSaving(false);
        return;
      }
      const newId = await addVideo({
        title: title.trim(),
        stages: buildStagesFromList(steps),
        createdBy: user?.email || "",
      });
      showSnackbar("Video created", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      navigate(`/videos/${newId}`);
    } catch (e) {
      showSnackbar(e?.message || "Could not save.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2.5, sm: 5 }, px: { xs: 2, sm: 3 } }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(isEdit ? `/videos/${id}` : "/videos")} sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600 }}>
          Back
        </Button>
      </Stack>

      <Typography sx={{ fontWeight: 800, color: "#1f2937", mb: 2, fontSize: { xs: "1.5rem", sm: "2rem" } }}>
        {isEdit ? "Edit Video" : "New Video"}
      </Typography>

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, border: "1px solid rgba(160,103,38,0.16)" }}>
        <Stack spacing={2.5}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoFocus={!isEdit}
          />
          {!isEdit ? (
            <Typography sx={{ color: "#8a6a36", fontSize: "0.85rem" }}>
              The production steps are added automatically. Assign people after creating.
            </Typography>
          ) : null}
          <Button variant="contained" onClick={handleSubmit} disabled={saving || loading} sx={{ ...amberButtonSx, py: 1.25 }}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create video"}
          </Button>
        </Stack>
      </Paper>
      <ChapelFooter />
    </Container>
  );
};

export default VideoForm;
