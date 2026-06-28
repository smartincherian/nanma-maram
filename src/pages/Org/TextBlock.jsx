import React from "react";
import { Typography } from "@mui/material";

const VARIANT_MAP = {
  heading: "h5",
  subheading: "h6",
  paragraph: "body1",
  verse: "body1",
};

const TextBlock = ({ block }) => {
  if (!block || !String(block.text || "").trim()) return null;

  const variant = VARIANT_MAP[block.variant] || "body1";
  const isVerse = block.variant === "verse";

  return (
    <Typography
      variant={variant}
      sx={{
        color: block.color || "#311b45",
        fontSize: block.fontSize || undefined,
        fontWeight: block.weight || (isVerse ? 700 : 500),
        textAlign: block.align || "center",
        fontStyle: isVerse ? "italic" : "normal",
        lineHeight: 1.7,
        whiteSpace: "pre-line",
        my: 1.5,
      }}
    >
      {block.text}
    </Typography>
  );
};

export default TextBlock;
