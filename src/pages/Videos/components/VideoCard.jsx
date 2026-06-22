import React from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import dayjs from "dayjs";
import { currentStage, progress } from "../../../utils/videoWorkflow";
import { PRIORITY_META, VIDEO_STATUS_META, cardSx } from "../ui";

const VideoCard = ({ video, onOpen }) => {
  const { done, total } = progress(video);
  const current = currentStage(video);
  const statusMeta = VIDEO_STATUS_META[video.status] || VIDEO_STATUS_META.active;
  const priorityMeta = PRIORITY_META[video.priority] || PRIORITY_META.normal;

  return (
    <Paper
      elevation={0}
      onClick={() => onOpen(video.id)}
      sx={{ ...cardSx, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 14px 28px rgba(93,53,17,0.1)" } }}
    >
      <Stack direction="row" alignItems="flex-start" gap={1}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: "#1f2937", fontSize: "1.05rem", mb: 0.75 }}>{video.title}</Typography>
          <Stack direction="row" gap={0.5} sx={{ flexWrap: "wrap" }}>
            {video.typeName ? <Chip size="small" label={video.typeName} sx={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#1d4ed8", fontWeight: 700 }} /> : null}
            <Chip size="small" label={statusMeta.label} sx={{ backgroundColor: statusMeta.bg, color: statusMeta.color, fontWeight: 700 }} />
            {video.priority === "high" ? <Chip size="small" label="High" sx={{ backgroundColor: priorityMeta.bg, color: priorityMeta.color, fontWeight: 700 }} /> : null}
          </Stack>
        </Box>
        <ArrowForwardRoundedIcon sx={{ color: "#c79a55" }} />
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.25, flexWrap: "wrap", gap: 1 }}>
        <Chip
          size="small"
          label={current ? `${current.name} • ${done}/${total}` : `Completed • ${done}/${total}`}
          sx={{ backgroundColor: "rgba(214,123,31,0.12)", color: "#8a4b00", fontWeight: 700 }}
        />
        {current?.assigneeName ? (
          <Typography sx={{ color: "#5b6472", fontSize: "0.85rem" }}>👤 {current.assigneeName}</Typography>
        ) : current ? (
          <Typography sx={{ color: "#b3261e", fontSize: "0.85rem" }}>Unassigned</Typography>
        ) : null}
      </Stack>

      {video.targetDate ? (
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1, color: "#8a6a36" }}>
          <EventRoundedIcon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: "0.82rem" }}>{dayjs(video.targetDate).format("D MMM YYYY")}</Typography>
        </Stack>
      ) : null}
    </Paper>
  );
};

export default VideoCard;
