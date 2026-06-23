import React from "react";
import { Box, Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { currentStage, progress } from "../../../utils/videoWorkflow";
import { cardSx } from "../ui";

const VideoCard = ({ video, onOpen }) => {
  const { done, total } = progress(video);
  const current = currentStage(video);
  const pct = total > 0 ? (done / total) * 100 : 0;
  const isDone = !current;

  return (
    <Paper
      elevation={0}
      onClick={() => onOpen(video.id)}
      sx={{
        ...cardSx,
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
        "&:active": { transform: "scale(0.99)" },
        "&:hover": { boxShadow: "0 10px 22px rgba(93,53,17,0.1)" },
      }}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography sx={{ flexGrow: 1, fontWeight: 800, color: "#1f2937", fontSize: { xs: "1rem", sm: "1.1rem" }, minWidth: 0 }}>
          {video.title}
        </Typography>
        <Chip
          size="small"
          label={`${done}/${total}`}
          icon={isDone ? <CheckCircleRoundedIcon /> : undefined}
          sx={{
            fontWeight: 800,
            backgroundColor: isDone ? "rgba(46,125,50,0.16)" : "rgba(214,123,31,0.14)",
            color: isDone ? "#1b5e20" : "#8a4b00",
            "& .MuiChip-icon": { color: "#1b5e20" },
          }}
        />
      </Stack>

      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          mt: 1.25,
          height: 7,
          borderRadius: 4,
          backgroundColor: "rgba(160,103,38,0.14)",
          "& .MuiLinearProgress-bar": { backgroundColor: isDone ? "#2e7d32" : "#d67b1f", borderRadius: 4 },
        }}
      />

      <Box sx={{ mt: 1.25 }}>
        {isDone ? (
          <Typography sx={{ color: "#1b5e20", fontWeight: 700, fontSize: "0.9rem" }}>All steps done</Typography>
        ) : (
          <Stack direction="row" alignItems="center" gap={0.75} sx={{ flexWrap: "wrap" }}>
            <Typography sx={{ color: "#8a4b00", fontWeight: 700, fontSize: "0.92rem" }}>{current.name}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" alignItems="center" gap={0.4} sx={{ color: current.assigneeName ? "#3b2a13" : "#b3261e" }}>
              <PersonRoundedIcon sx={{ fontSize: 17 }} />
              <Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>
                {current.assigneeName || "Unassigned"}
              </Typography>
            </Stack>
          </Stack>
        )}
      </Box>
    </Paper>
  );
};

export default VideoCard;
