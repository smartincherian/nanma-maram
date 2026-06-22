import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { useNavigate } from "react-router-dom";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { useAuth } from "../../components/AuthProvider";
import { listVideos } from "../../firebase/video/videos";
import { listTypes } from "../../firebase/video/types";
import { listCrew } from "../../firebase/video/crew";
import { listSkills } from "../../firebase/video/skills";
import { VIDEO_STATUS } from "../../utils/videoWorkflow";
import { amberButtonSx } from "./ui";
import VideoCard from "./components/VideoCard";
import TeamWorkload from "./components/TeamWorkload";

const VideosDashboard = () => {
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [types, setTypes] = useState([]);
  const [crew, setCrew] = useState([]);
  const [skills, setSkills] = useState([]);

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(VIDEO_STATUS.ACTIVE);
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [v, t, c, s] = await Promise.all([listVideos(), listTypes(), listCrew(), listSkills()]);
        if (!active) return;
        setVideos(v);
        setTypes(t);
        setCrew(c);
        setSkills(s);
      } catch (e) {
        showSnackbar("Could not load videos.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredVideos = useMemo(
    () =>
      videos.filter((v) => {
        if (typeFilter && v.typeId !== typeFilter) return false;
        if (statusFilter && v.status !== statusFilter) return false;
        if (priorityFilter && v.priority !== priorityFilter) return false;
        return true;
      }),
    [videos, typeFilter, statusFilter, priorityFilter]
  );

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/")} sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600 }}>
          Home
        </Button>
        <Stack direction="row" gap={1}>
          {isOwner ? (
            <Button startIcon={<SettingsRoundedIcon />} onClick={() => navigate("/video-config")} sx={{ textTransform: "none", fontWeight: 700, color: "#935100" }}>
              Manage
            </Button>
          ) : null}
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate("/videos/new")} sx={amberButtonSx}>
            New video
          </Button>
        </Stack>
      </Stack>

      <Typography variant="h4" sx={{ fontWeight: 800, color: "#1f2937", mb: 0.5 }}>Video Tracking</Typography>
      <Typography sx={{ color: "#5b6472", mb: 2 }}>Track each video's production stages and the team's workload.</Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} textColor="inherit"
          TabIndicatorProps={{ sx: { backgroundColor: "#d67b1f" } }}
          sx={{ "& .Mui-selected": { color: "#8a4b00" }, "& .MuiTab-root": { textTransform: "none", fontWeight: 700 } }}
        >
          <Tab label="Videos" />
          <Tab label="Team" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : tab === 0 ? (
        <Box>
          <Stack direction="row" gap={1} sx={{ mb: 2, flexWrap: "wrap" }}>
            <Select size="small" displayEmpty value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All statuses</MenuItem>
              <MenuItem value={VIDEO_STATUS.ACTIVE}>Active</MenuItem>
              <MenuItem value={VIDEO_STATUS.COMPLETED}>Completed</MenuItem>
              <MenuItem value={VIDEO_STATUS.ON_HOLD}>On hold</MenuItem>
            </Select>
            <Select size="small" displayEmpty value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <MenuItem value="">All types</MenuItem>
              {types.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
            <Select size="small" displayEmpty value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <MenuItem value="">Any priority</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
            </Select>
          </Stack>

          {filteredVideos.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: "center", border: "1px dashed rgba(160,103,38,0.3)" }}>
              <Typography sx={{ color: "#8a6a36", mb: 2 }}>No videos here yet.</Typography>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate("/videos/new")} sx={amberButtonSx}>New video</Button>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {filteredVideos.map((v) => <VideoCard key={v.id} video={v} onOpen={(id) => navigate(`/videos/${id}`)} />)}
            </Stack>
          )}
        </Box>
      ) : (
        <TeamWorkload videos={videos} crew={crew} skills={skills} />
      )}
    </Container>
  );
};

export default VideosDashboard;
