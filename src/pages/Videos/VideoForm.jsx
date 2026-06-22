import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { useAuth } from "../../components/AuthProvider";
import { listTypes } from "../../firebase/video/types";
import { listStages } from "../../firebase/video/stages";
import { listCrew } from "../../firebase/video/crew";
import { listSkills } from "../../firebase/video/skills";
import { addVideo, getVideo, updateVideoMeta } from "../../firebase/video/videos";
import { buildStagesForType, PRIORITY } from "../../utils/videoWorkflow";
import { amberButtonSx } from "./ui";
import CrewPicker from "./components/CrewPicker";

const VideoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);

  const [types, setTypes] = useState([]);
  const [stages, setStages] = useState([]);
  const [crew, setCrew] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [typeId, setTypeId] = useState("");
  const [priority, setPriority] = useState(PRIORITY.NORMAL);
  const [targetDate, setTargetDate] = useState(null);
  const [sourceLink, setSourceLink] = useState("");
  // stage assignments for create mode: { [stageId]: { assigneeId, assigneeName } }
  const [assignments, setAssignments] = useState({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [t, s, c, sk] = await Promise.all([listTypes(), listStages(), listCrew(), listSkills()]);
        if (!active) return;
        setTypes(t);
        setStages(s);
        setCrew(c);
        setSkills(sk);
        if (isEdit) {
          const video = await getVideo(id);
          if (video && active) {
            setTitle(video.title || "");
            setTypeId(video.typeId || "");
            setPriority(video.priority || PRIORITY.NORMAL);
            setTargetDate(video.targetDate ? dayjs(video.targetDate) : null);
            setSourceLink(video.sourceLink || "");
          }
        }
      } catch (e) {
        showSnackbar("Could not load form data.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const selectedType = types.find((t) => t.id === typeId);
  const stagesById = Object.fromEntries(stages.map((s) => [s.id, s]));
  const pipelineStages = selectedType ? buildStagesForType(selectedType, stagesById) : [];

  const handleSubmit = async () => {
    if (!title.trim()) {
      showSnackbar("Title is required.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    setSaving(true);
    const targetIso = targetDate ? targetDate.toISOString() : null;
    try {
      if (isEdit) {
        await updateVideoMeta(id, {
          title: title.trim(),
          priority,
          targetDate: targetIso,
          sourceLink: sourceLink.trim(),
        });
        showSnackbar("Video updated", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
        navigate(`/videos/${id}`);
        return;
      }
      if (!selectedType) {
        showSnackbar("Pick a video type.", SNACK_BAR_SEVERITY_TYPES.ERROR);
        setSaving(false);
        return;
      }
      const builtStages = pipelineStages.map((stage) => {
        const a = assignments[stage.stageId];
        return a ? { ...stage, assigneeId: a.assigneeId, assigneeName: a.assigneeName } : stage;
      });
      const newId = await addVideo({
        title: title.trim(),
        typeId: selectedType.id,
        typeName: selectedType.name,
        priority,
        targetDate: targetIso,
        sourceLink: sourceLink.trim(),
        stages: builtStages,
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
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(isEdit ? `/videos/${id}` : "/videos")} sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600 }}>
          Back
        </Button>
      </Stack>

      <Typography variant="h4" sx={{ fontWeight: 800, color: "#1f2937", mb: 2 }}>
        {isEdit ? "Edit Video" : "New Video"}
      </Typography>

      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 4, border: "1px solid rgba(160,103,38,0.16)" }}>
        <Stack spacing={2.5}>
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />

          <FormControl fullWidth disabled={isEdit}>
            <InputLabel>Video type</InputLabel>
            <Select label="Video type" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              {types.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>
          {isEdit ? <Typography sx={{ color: "#8a6a36", fontSize: "0.82rem", mt: -1.5 }}>Type can't change after creation. Edit stages on the video page.</Typography> : null}

          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <MenuItem value={PRIORITY.NORMAL}>Normal</MenuItem>
              <MenuItem value={PRIORITY.HIGH}>High</MenuItem>
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Target date (optional)" value={targetDate} onChange={setTargetDate} slotProps={{ textField: { fullWidth: true }, field: { clearable: true } }} />
          </LocalizationProvider>

          <TextField label="Source link (optional)" value={sourceLink} onChange={(e) => setSourceLink(e.target.value)} fullWidth placeholder="Raw footage URL" />

          {!isEdit && pipelineStages.length > 0 ? (
            <Box>
              <Divider textAlign="left" sx={{ color: "#8a6a36", fontWeight: 700, mb: 2 }}>Pre-assign crew (optional)</Divider>
              <Stack spacing={2}>
                {pipelineStages.map((stage) => (
                  <Box key={stage.stageId}>
                    <Typography sx={{ fontWeight: 700, color: "#3b2a13", mb: 0.5 }}>{stage.name}</Typography>
                    <CrewPicker
                      crew={crew}
                      skills={skills}
                      label="Assignee (optional)"
                      value={assignments[stage.stageId]?.assigneeId || null}
                      onChange={(assigneeId, assigneeName) => setAssignments((prev) => ({ ...prev, [stage.stageId]: { assigneeId, assigneeName } }))}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : null}

          <Button variant="contained" onClick={handleSubmit} disabled={saving || loading} sx={{ ...amberButtonSx, py: 1.25 }}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create video"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default VideoForm;
