import React, { useRef } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormattedText from "./FormattedText";

// A multiline text field with a Bold helper. Stores lightweight markup
// (newlines + **bold**) rendered by FormattedText. The Bold button wraps the
// current selection in ** (or inserts a placeholder when nothing is selected).
const RichTextField = ({ label, value, onChange, minRows = 2 }) => {
  const inputRef = useRef(null);
  const text = value || "";

  const applyBold = () => {
    const el = inputRef.current;
    const start = el ? el.selectionStart : text.length;
    const end = el ? el.selectionEnd : text.length;
    const selected = text.slice(start, end) || "bold text";
    const next = `${text.slice(0, start)}**${selected}**${text.slice(end)}`;
    onChange(next);
    window.setTimeout(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + 2, start + 2 + selected.length);
    }, 0);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.5 }}>
        <Button
          size="small"
          startIcon={<FormatBoldIcon fontSize="small" />}
          onClick={applyBold}
          sx={{ textTransform: "none", minWidth: 0 }}
        >
          Bold
        </Button>
      </Box>
      <TextField
        label={label}
        fullWidth
        multiline
        minRows={minRows}
        value={text}
        inputRef={inputRef}
        onChange={(e) => onChange(e.target.value)}
        helperText="Press Enter for a new line. Select text, then Bold."
      />
      {text.trim() ? (
        <Box sx={{ mt: 1, p: 1.25, bgcolor: "#faf7ff", borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            Preview
          </Typography>
          <Typography sx={{ lineHeight: 1.7, "& strong": { fontWeight: 800 } }}>
            <FormattedText text={text} />
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
};

export default RichTextField;
