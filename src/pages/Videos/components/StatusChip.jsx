import React from "react";
import { Chip } from "@mui/material";
import { STAGE_STATUS_META } from "../ui";

// Small coloured chip for a stage status (pending / in_progress / done).
const StatusChip = ({ status, size = "small" }) => {
  const meta = STAGE_STATUS_META[status] || STAGE_STATUS_META.pending;
  return (
    <Chip
      label={meta.label}
      size={size}
      sx={{
        fontWeight: 700,
        color: meta.color,
        backgroundColor: meta.bg,
      }}
    />
  );
};

export default StatusChip;
