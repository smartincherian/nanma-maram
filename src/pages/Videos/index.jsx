import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { useNavigate } from "react-router-dom";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { useAuth } from "../../components/AuthProvider";
import ChapelFooter from "../../components/ChapelFooter";
import { listVideosPage } from "../../firebase/video/videos";
import { amberButtonSx } from "./ui";
import VideoCard from "./components/VideoCard";

const PAGE_SIZE = 15;

const VideosDashboard = () => {
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);

  const [videos, setVideos] = useState([]);
  const [filter, setFilter] = useState("pending"); // "pending" | "done"
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef(null);
  // Guards against a slow previous-tab response landing after a tab switch.
  const requestId = useRef(0);

  // (Re)load the first page whenever the tab changes.
  useEffect(() => {
    const id = ++requestId.current;
    setLoadingInitial(true);
    setVideos([]);
    setHasMore(false);
    cursorRef.current = null;
    (async () => {
      try {
        const page = await listVideosPage({ filter, pageSize: PAGE_SIZE });
        if (id !== requestId.current) return;
        setVideos(page.videos);
        cursorRef.current = page.cursor;
        setHasMore(page.hasMore);
      } catch (e) {
        if (id !== requestId.current) return;
        showSnackbar("Could not load videos.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      } finally {
        if (id === requestId.current) setLoadingInitial(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const page = await listVideosPage({
        filter,
        pageSize: PAGE_SIZE,
        cursor: cursorRef.current,
      });
      setVideos((prev) => [...prev, ...page.videos]);
      cursorRef.current = page.cursor;
      setHasMore(page.hasMore);
    } catch (e) {
      showSnackbar("Could not load more videos.", SNACK_BAR_SEVERITY_TYPES.ERROR);
    } finally {
      setLoadingMore(false);
    }
  }, [filter, showSnackbar]);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2.5, sm: 5 }, px: { xs: 1.5, sm: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/")} sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600, minWidth: 0 }}>
          Home
        </Button>
        {isOwner ? (
          <Button startIcon={<GroupsRoundedIcon />} onClick={() => navigate("/video-config")} sx={{ textTransform: "none", fontWeight: 700, color: "#935100", minWidth: 0 }}>
            Crew
          </Button>
        ) : null}
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 2 }}>
        <Typography sx={{ fontWeight: 800, color: "#1f2937", fontSize: { xs: "1.5rem", sm: "2rem" }, minWidth: 0 }}>
          Videos
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filter}
          onChange={(e, next) => {
            if (next) setFilter(next);
          }}
          sx={{
            flexShrink: 0,
            "& .MuiToggleButton-root": {
              textTransform: "none",
              fontWeight: 700,
              px: 1.75,
              py: 0.4,
              border: "1px solid rgba(160,103,38,0.3)",
              color: "#8a6a36",
              "&.Mui-selected": {
                background: "linear-gradient(135deg, #935100 0%, #d67b1f 100%)",
                color: "#fff",
                "&:hover": { background: "linear-gradient(135deg, #7d4500 0%, #c06d12 100%)" },
              },
            },
          }}
        >
          <ToggleButton value="pending">Active</ToggleButton>
          <ToggleButton
            value="done"
            sx={{
              "&.Mui-selected": {
                background: "linear-gradient(135deg, #2e7d32 0%, #43a047 100%)",
                color: "#fff",
                "&:hover": { background: "linear-gradient(135deg, #256628 0%, #388e3c 100%)" },
              },
            }}
          >
            Done
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {loadingInitial ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : videos.length === 0 ? (
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, textAlign: "center", border: "1px dashed rgba(160,103,38,0.3)" }}>
          <Typography sx={{ color: "#8a6a36", mb: 2 }}>
            {filter === "done"
              ? "No completed videos yet."
              : "No active videos — all caught up!"}
          </Typography>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate("/videos/new")} sx={amberButtonSx}>New video</Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {videos.map((v) => <VideoCard key={v.id} video={v} onOpen={(id) => navigate(`/videos/${id}`)} />)}
          {hasMore ? (
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              variant="outlined"
              startIcon={loadingMore ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{
                mt: 0.5,
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 3,
                color: "#935100",
                borderColor: "rgba(160,103,38,0.4)",
                "&:hover": { borderColor: "#935100", background: "rgba(147,81,0,0.04)" },
              }}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          ) : null}
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
