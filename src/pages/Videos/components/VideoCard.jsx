import React from "react";
import { Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { progress } from "../../../utils/videoWorkflow";
import { cardSx } from "../ui";

const toMillis = (value) =>
  value && typeof value.toMillis === "function" ? value.toMillis() : value || 0;

const VideoCard = ({ video, onOpen }) => {
  const { done, total } = progress(video);
  const pct = total > 0 ? (done / total) * 100 : 0;
  // Steps run in parallel, so there's no single "current" step to surface here —
  // the card just shows overall progress.
  const isDone = total > 0 && done === total;
  // The video is "done" only once the final Uploading step completes, so the
  // completion time is effectively the uploaded date. Fall back to updatedAt for
  // videos completed before completedAt was stamped.
  const uploadedAt = isDone ? toMillis(video.completedAt) || toMillis(video.updatedAt) : 0;

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
        ...(isDone && {
          background: "linear-gradient(180deg, rgba(232,245,233,0.95) 0%, rgba(220,240,222,0.95) 100%)",
          border: "1px solid rgba(46,125,50,0.25)",
        }),
      }}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography sx={{ flexGrow: 1, fontWeight: 800, color: "#1f2937", fontSize: { xs: "1rem", sm: "1.1rem" }, minWidth: 0 }}>
          {video.title}
        </Typography>
        {isDone ? (
          uploadedAt ? (
            <Typography
              sx={{ flexShrink: 0, fontWeight: 700, fontSize: "0.8rem", color: "#2e7d32", whiteSpace: "nowrap" }}
            >
              {dayjs(uploadedAt).format("D MMM YYYY")}
            </Typography>
          ) : null
        ) : (
          <Chip
            size="small"
            label={`${done}/${total}`}
            sx={{
              fontWeight: 800,
              backgroundColor: "rgba(214,123,31,0.14)",
              color: "#8a4b00",
            }}
          />
        )}
      </Stack>

      {isDone ? null : (
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            mt: 1.25,
            height: 7,
            borderRadius: 4,
            backgroundColor: "rgba(160,103,38,0.14)",
            "& .MuiLinearProgress-bar": { backgroundColor: "#2e7d32", borderRadius: 4 },
          }}
        />
      )}
    </Paper>
  );
};

export default VideoCard;
