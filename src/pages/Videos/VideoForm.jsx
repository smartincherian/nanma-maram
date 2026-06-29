import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  Container,
  MenuItem,
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
import { addVideo, getVideo, updateVideoMeta } from "../../firebase/video/videos";
import { MEDIA_BASE, MEDIA_TYPES } from "../../utils/mediaTypes";
import { amberButtonSx } from "./ui";

const VideoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    (async () => {
      try {
        const video = await getVideo(id);
        if (video && active) {
          setTitle(video.title || "");
          setType(video.type || "");
        }
      } catch (e) {
        showSnackbar("Could not load media.", SNACK_BAR_SEVERITY_TYPES.ERROR);
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
    if (!isEdit && !type) {
      showSnackbar("Please choose a media type.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    if (!title.trim()) {
      showSnackbar("Title is required.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateVideoMeta(id, { title: title.trim(), type });
        showSnackbar("Media updated", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
        navigate(`${MEDIA_BASE}/${id}`);
        return;
      }
      const newId = await addVideo({
        title: title.trim(),
        type,
        createdBy: user?.email || "",
      });
      showSnackbar("Media created", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      navigate(`${MEDIA_BASE}/${newId}`);
    } catch (e) {
      showSnackbar(e?.message || "Could not save.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2.5, sm: 5 }, px: { xs: 2, sm: 3 } }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(isEdit ? `${MEDIA_BASE}/${id}` : MEDIA_BASE)} sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600 }}>
          Back
        </Button>
      </Stack>

      <Typography sx={{ fontWeight: 800, color: "#1f2937", mb: 2, fontSize: { xs: "1.5rem", sm: "2rem" } }}>
        {isEdit ? "Edit Media" : "New Media"}
      </Typography>

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, border: "1px solid rgba(160,103,38,0.16)" }}>
        <Stack spacing={2.5}>
          <TextField
            select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            fullWidth
            required={!isEdit}
            autoFocus={!isEdit}
          >
            {MEDIA_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />
          
          <Button variant="contained" onClick={handleSubmit} disabled={saving || loading} sx={{ ...amberButtonSx, py: 1.25 }}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create media"}
          </Button>
        </Stack>
      </Paper>
      <ChapelFooter />
    </Container>
  );
};

export default VideoForm;
