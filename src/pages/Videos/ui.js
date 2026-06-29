// Shared style tokens + status metadata for the video tracking screens, kept in
// one place so the amber/blue theme stays consistent across pages.
import { STAGE_STATUS, VIDEO_STATUS } from "../../utils/videoWorkflow";

export const AMBER_GRADIENT = "linear-gradient(135deg, #935100 0%, #d67b1f 100%)";
export const AMBER_GRADIENT_HOVER =
  "linear-gradient(135deg, #7d4500 0%, #c06d12 100%)";
export const BLUE_GRADIENT =
  "linear-gradient(135deg, #2563eb 0%, #1d4ed8 44%, #153eaf 100%)";

export const amberButtonSx = {
  textTransform: "none",
  fontWeight: 700,
  borderRadius: 2.5,
  background: AMBER_GRADIENT,
  "&:hover": { background: AMBER_GRADIENT_HOVER },
};

export const cardSx = {
  p: { xs: 2, sm: 2.5 },
  borderRadius: 3,
  border: "1px solid rgba(160, 103, 38, 0.16)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(252,248,242,0.97) 100%)",
};

export const STAGE_STATUS_META = {
  [STAGE_STATUS.PENDING]: { label: "Pending", color: "#8a6a36", bg: "rgba(138, 106, 54, 0.14)", dot: "#bfae8e" },
  [STAGE_STATUS.IN_PROGRESS]: { label: "In progress", color: "#8a4b00", bg: "rgba(214, 123, 31, 0.18)", dot: "#d67b1f" },
  [STAGE_STATUS.DONE]: { label: "Done", color: "#1b5e20", bg: "rgba(46, 125, 50, 0.16)", dot: "#2e7d32" },
};

export const VIDEO_STATUS_META = {
  [VIDEO_STATUS.ACTIVE]: { label: "Active", color: "#8a4b00", bg: "rgba(214, 123, 31, 0.16)" },
  [VIDEO_STATUS.COMPLETED]: { label: "Completed", color: "#1b5e20", bg: "rgba(46, 125, 50, 0.16)" },
  [VIDEO_STATUS.REJECTED]: { label: "Rejected", color: "#b3261e", bg: "rgba(179, 38, 30, 0.12)" },
  [VIDEO_STATUS.ON_HOLD]: { label: "On hold", color: "#5b6472", bg: "rgba(91, 100, 114, 0.14)" },
};
