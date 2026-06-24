import React from "react";
import { Box } from "@mui/material";

// Christian rose-window motif — a small radial medallion built from sacred
// geometry (twin rings, twelve tracery spokes, a Latin cross at the centre).
// Used to demarcate sections of the crew portal and carry the mandala theme.
const GOLD = "#b07d33";
const CROSS = "#8a5a1f";
const SPOKES = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);

export const Rosette = ({ size = 40, sx }) => (
  <Box
    component="svg"
    width={size}
    height={size}
    viewBox="0 0 40 40"
    aria-hidden="true"
    sx={{ flexShrink: 0, display: "block", ...sx }}
  >
    <g fill="none" stroke={GOLD} strokeWidth="1">
      <circle cx="20" cy="20" r="18.5" />
      <circle cx="20" cy="20" r="10.5" />
      {SPOKES.map((deg) => (
        <line key={`s${deg}`} x1="20" y1="1.5" x2="20" y2="9.5" transform={`rotate(${deg} 20 20)`} />
      ))}
    </g>
    <g fill={GOLD}>
      {SPOKES.map((deg) => (
        <circle key={`d${deg}`} cx="20" cy="1.5" r="1.1" transform={`rotate(${deg} 20 20)`} />
      ))}
    </g>
    <g stroke={CROSS} strokeWidth="1.6" strokeLinecap="round">
      <line x1="20" y1="14.4" x2="20" y2="25.6" />
      <line x1="16.4" y1="18.6" x2="23.6" y2="18.6" />
    </g>
  </Box>
);

// Faint rose-window watermarks tucked into opposite corners of a card, giving
// every crew page the same quiet mandala atmosphere. The host card must be
// position:relative with overflow:hidden.
export const CrewWatermark = () => (
  <>
    <Rosette
      size={240}
      sx={{ position: "absolute", top: -64, right: -64, opacity: 0.06, pointerEvents: "none" }}
    />
    <Rosette
      size={150}
      sx={{ position: "absolute", bottom: -44, left: -38, opacity: 0.05, pointerEvents: "none" }}
    />
  </>
);

const MandalaDivider = ({ sx }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ...sx }} aria-hidden="true">
    <Box sx={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(176,125,51,0.5))" }} />
    <Rosette />
    <Box sx={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(176,125,51,0.5), transparent)" }} />
  </Box>
);

export default MandalaDivider;
