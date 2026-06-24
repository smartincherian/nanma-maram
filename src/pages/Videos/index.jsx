import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
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
import ChapelFooter from "../../components/ChapelFooter";
import { listVideos } from "../../firebase/video/videos";
import { amberButtonSx } from "./ui";
import VideoCard from "./components/VideoCard";

const VideosDashboard = () => {
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);

  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const v = await listVideos();
        if (active) setVideos(v);
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

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2.5, sm: 5 }, px: { xs: 1.5, sm: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/")} sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600, minWidth: 0 }}>
          Home
        </Button>
        {isOwner ? (
          <Button startIcon={<SettingsRoundedIcon />} onClick={() => navigate("/video-config")} sx={{ textTransform: "none", fontWeight: 700, color: "#935100", minWidth: 0 }}>
            Manage
          </Button>
        ) : null}
      </Stack>

      <Typography sx={{ fontWeight: 800, color: "#1f2937", mb: 2, fontSize: { xs: "1.5rem", sm: "2rem" } }}>
        Videos
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : videos.length === 0 ? (
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, textAlign: "center", border: "1px dashed rgba(160,103,38,0.3)" }}>
          <Typography sx={{ color: "#8a6a36", mb: 2 }}>No videos yet.</Typography>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate("/videos/new")} sx={amberButtonSx}>New video</Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {videos.map((v) => <VideoCard key={v.id} video={v} onOpen={(id) => navigate(`/videos/${id}`)} />)}
        </Stack>
      )}

      <Button
        variant="contained"
        startIcon={<AddRoundedIcon />}
        onClick={() => navigate("/videos/new")}
        sx={{
          ...amberButtonSx,
          position: "fixed",
          bottom: { xs: 20, sm: 32 },
          right: { xs: 20, sm: 32 },
          py: 1.25,
          px: 2.5,
          boxShadow: "0 10px 24px rgba(147,81,0,0.35)",
          zIndex: 10,
        }}
      >
        New
      </Button>

      <ChapelFooter />
    </Container>
  );
};

export default VideosDashboard;
