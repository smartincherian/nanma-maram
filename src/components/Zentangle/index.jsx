import React, { useId } from "react";
import { Box } from "@mui/material";

// Zentangle theme — hand-drawn repetitive line motifs (a "crescent-and-dot"
// tangle) used as section strings/borders and a faint card texture. Ink tones
// stay within the app's warm palette.
const INK = "#9a6a2f";

const cleanId = (raw) => raw.replace(/:/g, "");

// A thin repeating tangle strip — the "string" that demarcates sections.
export const ZentangleStrip = ({ height = 16, opacity = 0.85, ink = INK, sx }) => {
  const id = cleanId(useId());
  return (
    <Box
      component="svg"
      width="100%"
      height={height}
      aria-hidden="true"
      sx={{ display: "block", opacity, ...sx }}
    >
      <defs>
        <pattern id={id} width="20" height={height} patternUnits="userSpaceOnUse">
          <path d={`M1 ${height - 4} q9 -11 18 0`} fill="none" stroke={ink} strokeWidth="1.1" />
          <circle cx="10" cy={height - 9} r="1.15" fill={ink} />
          <circle cx="0.5" cy={height - 4} r="0.8" fill={ink} />
          <circle cx="19.5" cy={height - 4} r="0.8" fill={ink} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </Box>
  );
};

// Faint full-card tangle texture shared by every crew page.
export const CrewWatermark = () => {
  const id = cleanId(useId());
  return (
    <Box
      component="svg"
      aria-hidden="true"
      sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05, pointerEvents: "none" }}
    >
      <defs>
        <pattern id={id} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
          <path d="M4 25 q13 -15 26 0" fill="none" stroke="#7a4d12" strokeWidth="1" />
          <circle cx="17" cy="10" r="1.4" fill="#7a4d12" />
          <circle cx="2" cy="6" r="1" fill="#7a4d12" />
          <circle cx="31" cy="30" r="1" fill="#7a4d12" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </Box>
  );
};

export default ZentangleStrip;
