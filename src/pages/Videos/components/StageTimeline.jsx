import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import RadioButtonCheckedRoundedIcon from "@mui/icons-material/RadioButtonCheckedRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import dayjs from "dayjs";
import { STAGE_STATUS } from "../../../utils/videoWorkflow";
import { getStepName } from "../../../utils/videoSteps";
import { getDueMeta } from "../../../utils/dueDate";
import { STAGE_STATUS_META } from "../ui";
import StatusChip from "./StatusChip";

// The circle icon for a step, by status: hollow (pending) → orange ring
// (in progress) → green check (done).
const StageIcon = ({ status }) => {
  if (status === STAGE_STATUS.DONE) {
    return <CheckCircleRoundedIcon sx={{ color: "#2e7d32", fontSize: 26 }} />;
  }
  if (status === STAGE_STATUS.IN_PROGRESS) {
    return <RadioButtonCheckedRoundedIcon sx={{ color: "#d67b1f", fontSize: 26 }} />;
  }
  return <RadioButtonUncheckedRoundedIcon sx={{ color: "#bfae8e", fontSize: 26 }} />;
};

// Vertical timeline of a video's steps. The left circle is the status control:
// tapping it cycles the step (pending → in progress → done → reopen). Tapping a
// step's body selects it and reveals its Edit button — so the timeline stays
// clean instead of showing an edit affordance on every row. Steps are
// independent, so any step can be advanced in any order.
const StageTimeline = ({ stages = [], onCycleStage, onEditStage, canEdit = true }) => {
  const [selectedId, setSelectedId] = useState(null);
  const rootRef = useRef(null);

  // Tapping anywhere outside the timeline clears the selection (and its Edit button).
  useEffect(() => {
    if (!selectedId) return undefined;
    const handlePointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setSelectedId(null);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [selectedId]);

  return (
    <Stack ref={rootRef}>
      {stages.map((stage, index) => {
        const meta = STAGE_STATUS_META[stage.status] || STAGE_STATUS_META.pending;
        const isLast = index === stages.length - 1;
        const done = stage.status === STAGE_STATUS.DONE;
        const selected = selectedId === stage.stageId;
        const stageName = getStepName(stage.stageId, stage.name);
        const due = !done ? getDueMeta(stage.dueDate) : null;
        return (
          <Box key={stage.stageId} sx={{ display: "flex", gap: 1.5 }}>
            {/* Rail — the circle doubles as the status control, but only until the
                step is done. Once done it's locked (no accidental reopen on tap);
                to change a completed step, select the row and use Edit → Reopen. */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 36 }}>
              {canEdit && !done ? (
                <Box
                  component="button"
                  type="button"
                  aria-label={`Advance ${stageName}`}
                  onClick={() => onCycleStage(stage)}
                  sx={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    p: 0.25,
                    mt: 0.25,
                    display: "inline-flex",
                    borderRadius: "50%",
                  }}
                >
                  <StageIcon status={stage.status} />
                </Box>
              ) : (
                <Box sx={{ mt: 0.5 }}>
                  <StageIcon status={stage.status} />
                </Box>
              )}
              {!isLast ? (
                <Box sx={{ flexGrow: 1, width: 3, my: 0.5, borderRadius: 2, backgroundColor: done ? meta.dot : "rgba(160,103,38,0.2)" }} />
              ) : null}
            </Box>

            {/* Content — tap to select, which reveals the Edit button */}
            <Box
              onClick={canEdit ? () => setSelectedId(selected ? null : stage.stageId) : undefined}
              sx={{
                flexGrow: 1,
                mb: isLast ? 0 : 3,
                minWidth: 0,
                px: 1,
                py: 0.75,
                ml: -1,
                borderRadius: 2,
                cursor: canEdit ? "pointer" : "default",
                transition: "background-color 0.15s",
                backgroundColor: selected ? "rgba(214,123,31,0.08)" : "transparent",
                "&:hover": canEdit ? { backgroundColor: selected ? "rgba(214,123,31,0.10)" : "rgba(160,103,38,0.05)" } : undefined,
              }}
            >
              {/* Name on the left, status chip pinned to the right extreme */}
              <Stack direction="row" alignItems="flex-start" gap={1}>
                <Typography
                  sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    fontWeight: 800,
                    color: done ? "#6b6256" : "#1f2937",
                    fontSize: { xs: "0.95rem", sm: "1.02rem" },
                    lineHeight: 1.3,
                  }}
                >
                  {stageName}
                </Typography>
                <Box sx={{ flexShrink: 0 }}>
                  <StatusChip status={stage.status} />
                </Box>
              </Stack>

              {/* Assignee on the left, done-time pinned to the right extreme */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mt: 0.25 }}>
                <Stack direction="row" alignItems="center" gap={0.5} sx={{ minWidth: 0, color: stage.assigneeName ? "#3b2a13" : "#a08a63" }}>
                  <PersonRoundedIcon sx={{ fontSize: 16 }} />
                  <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: stage.assigneeName ? 600 : 400 }}>
                    {stage.assigneeName || "Unassigned"}
                  </Typography>
                </Stack>
                {stage.completedAt ? (
                  <Typography sx={{ color: "#8a6a36", fontSize: "0.76rem", flexShrink: 0 }}>
                    {dayjs(stage.completedAt).format("D MMM · h:mm A")}
                  </Typography>
                ) : due ? (
                  <Typography sx={{ color: due.color, fontSize: "0.76rem", fontWeight: 700, flexShrink: 0 }}>
                    {due.label}
                  </Typography>
                ) : null}
              </Stack>

              {canEdit && selected ? (
                <Button
                  size="small"
                  startIcon={<EditRoundedIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditStage(stage);
                  }}
                  sx={{ mt: 0.5, textTransform: "none", fontWeight: 700, color: "#935100", px: 1, ml: -0.5 }}
                >
                  Edit assignee / note
                </Button>
              ) : null}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
};

export default StageTimeline;
