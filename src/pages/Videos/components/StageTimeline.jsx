import React from "react";
import { Box, Button, Link, Stack, Typography } from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import dayjs from "dayjs";
import { STAGE_STATUS } from "../../../utils/videoWorkflow";
import { STAGE_STATUS_META, amberButtonSx } from "../ui";
import StatusChip from "./StatusChip";

const isUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s.trim());

// Vertical timeline of a video's stages, styled after an order-tracking view:
// a coloured dot + connector per stage, with assignee, status, timestamp, note.
// The single active (in_progress) stage gets a prominent "Mark complete"
// button; every stage also has a small "Edit" link for assignee/note/reopen.
const StageTimeline = ({ stages = [], onCompleteStage, onEditStage, canEdit = true }) => {
  return (
    <Stack>
      {stages.map((stage, index) => {
        const meta = STAGE_STATUS_META[stage.status] || STAGE_STATUS_META.pending;
        const isLast = index === stages.length - 1;
        const done = stage.status === STAGE_STATUS.DONE;
        const active = stage.status === STAGE_STATUS.IN_PROGRESS;
        return (
          <Box key={stage.stageId} sx={{ display: "flex", gap: 2 }}>
            {/* Rail */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: meta.dot, mt: 0.5, boxShadow: `0 0 0 4px ${meta.bg}` }} />
              {!isLast ? (
                <Box sx={{ flexGrow: 1, width: 3, my: 0.5, borderRadius: 2, backgroundColor: done ? meta.dot : "rgba(160,103,38,0.2)" }} />
              ) : null}
            </Box>

            {/* Content */}
            <Box sx={{ flexGrow: 1, pb: isLast ? 0 : 3, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" gap={1} sx={{ flexWrap: "wrap" }}>
                <Typography sx={{ fontWeight: 800, color: "#1f2937", fontSize: { xs: "0.98rem", sm: "1.05rem" } }}>{stage.name}</Typography>
                <StatusChip status={stage.status} />
              </Stack>

              <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.5, color: stage.assigneeName ? "#3b2a13" : "#a08a63" }}>
                <PersonRoundedIcon sx={{ fontSize: 18 }} />
                <Typography sx={{ fontSize: "0.95rem", fontWeight: stage.assigneeName ? 600 : 400 }}>
                  {stage.assigneeName || "Unassigned"}
                </Typography>
              </Stack>

              {stage.completedAt ? (
                <Typography sx={{ color: "#8a6a36", fontSize: "0.85rem", mt: 0.25 }}>
                  Done {dayjs(stage.completedAt).format("ddd, D MMM YYYY · h:mm A")}
                </Typography>
              ) : null}

              {stage.note ? (
                <Typography sx={{ color: "#5b6472", fontSize: "0.9rem", mt: 0.5, wordBreak: "break-word" }}>
                  {isUrl(stage.note) ? (
                    <Link href={stage.note.trim()} target="_blank" rel="noopener" sx={{ color: "#1d4ed8" }}>
                      {stage.note.trim()}
                    </Link>
                  ) : (
                    stage.note
                  )}
                </Typography>
              ) : null}

              {canEdit ? (
                <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 1, flexWrap: "wrap" }}>
                  {active ? (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CheckRoundedIcon />}
                      onClick={() => onCompleteStage(stage)}
                      sx={{ ...amberButtonSx, px: 2 }}
                    >
                      Mark complete
                    </Button>
                  ) : null}
                  <Button
                    size="small"
                    onClick={() => onEditStage(stage)}
                    sx={{ textTransform: "none", fontWeight: 700, color: "#935100", px: 0, minWidth: 0 }}
                  >
                    Edit
                  </Button>
                </Stack>
              ) : null}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
};

export default StageTimeline;
