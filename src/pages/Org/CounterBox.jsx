import React from "react";
import { Box, Typography } from "@mui/material";
import RichContent from "./RichContent";

// One content panel on a counter (the intention, or an extra box).
// background=true -> accent gradient panel with white text.
// background=false -> plain text, no panel (sits directly on the card).
const CounterBox = ({ text, background = true, accent = "#4a148c", sx }) => {
  if (!String(text || "").trim()) return null;
  return (
    <Box
      sx={{
        mb: 2,
        p: background ? 2 : 0.5,
        borderRadius: 3,
        textAlign: "center",
        color: background ? "#fff" : "#311b45",
        backgroundImage: background
          ? `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`
          : "none",
        ...sx,
      }}
    >
      <Typography
        component="div"
        sx={{ fontWeight: 500, lineHeight: 1.7, "& strong, & b": { fontWeight: 800 } }}
      >
        <RichContent text={text} />
      </Typography>
    </Box>
  );
};

export default CounterBox;
