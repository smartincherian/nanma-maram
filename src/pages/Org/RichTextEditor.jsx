import React, { useEffect, useRef, useState } from "react";
import { Box, Divider, IconButton, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import FormatSizeIcon from "@mui/icons-material/FormatSize";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";

// WYSIWYG editor over a contentEditable region. Produces HTML using inline
// styles (styleWithCSS), which RichContent sanitizes before rendering. Selection
// is saved on every interaction so toolbar controls that steal focus (color
// pickers, menus) can restore it before applying a command.
const FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "Heading", value: "7" },
];

const RichTextEditor = ({ label, value, onChange, minRows = 4 }) => {
  const editorRef = useRef(null);
  const savedRange = useRef(null);
  const [sizeAnchor, setSizeAnchor] = useState(null);

  // Sync external value in (initial load / edit mode) without disturbing the
  // caret while typing — during typing value already equals innerHTML.
  useEffect(() => {
    const el = editorRef.current;
    if (el && value !== el.innerHTML) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const syncChange = () => {
    const el = editorRef.current;
    if (!el) return;
    // Collapse the browser's empty-state placeholder so the CSS placeholder shows.
    if (el.innerHTML === "<br>") el.innerHTML = "";
    onChange(el.innerHTML);
  };

  const exec = (command, arg) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    restoreSelection();
    try {
      document.execCommand("styleWithCSS", false, true);
    } catch (e) {
      /* not supported — fall back to default markup */
    }
    document.execCommand(command, false, arg);
    saveSelection();
    syncChange();
  };

  const applyHighlight = (color) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    restoreSelection();
    try {
      document.execCommand("styleWithCSS", false, true);
    } catch (e) {
      /* ignore */
    }
    if (!document.execCommand("hiliteColor", false, color)) {
      document.execCommand("backColor", false, color);
    }
    saveSelection();
    syncChange();
  };

  const preventBlur = (e) => e.preventDefault();

  const btnSx = { color: "#4a148c", borderRadius: 1.5 };

  return (
    <Box>
      {label ? (
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#6b7280", mb: 0.75 }}>
          {label}
        </Typography>
      ) : null}

      <Box
        sx={{
          border: "1px solid rgba(0,0,0,0.23)",
          borderRadius: 2,
          overflow: "hidden",
          "&:focus-within": {
            borderColor: "#4a148c",
            boxShadow: "0 0 0 1px #4a148c",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 0.25,
            px: 0.5,
            py: 0.5,
            bgcolor: "#faf8ff",
            borderBottom: "1px solid rgba(74,20,140,0.12)",
          }}
        >
          <Tooltip title="Bold">
            <IconButton size="small" sx={btnSx} onMouseDown={preventBlur} onClick={() => exec("bold")}>
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic">
            <IconButton size="small" sx={btnSx} onMouseDown={preventBlur} onClick={() => exec("italic")}>
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline">
            <IconButton size="small" sx={btnSx} onMouseDown={preventBlur} onClick={() => exec("underline")}>
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Strikethrough">
            <IconButton size="small" sx={btnSx} onMouseDown={preventBlur} onClick={() => exec("strikeThrough")}>
              <StrikethroughSIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

          <Tooltip title="Text color">
            <IconButton size="small" component="label" sx={btnSx}>
              <FormatColorTextIcon fontSize="small" />
              <input
                type="color"
                style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
                onChange={(e) => exec("foreColor", e.target.value)}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Highlight">
            <IconButton size="small" component="label" sx={btnSx}>
              <FormatColorFillIcon fontSize="small" />
              <input
                type="color"
                style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
                onChange={(e) => applyHighlight(e.target.value)}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Font size">
            <IconButton
              size="small"
              sx={btnSx}
              onMouseDown={preventBlur}
              onClick={(e) => setSizeAnchor(e.currentTarget)}
            >
              <FormatSizeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={sizeAnchor} open={Boolean(sizeAnchor)} onClose={() => setSizeAnchor(null)}>
            {FONT_SIZES.map((s) => (
              <MenuItem
                key={s.value}
                onClick={() => {
                  exec("fontSize", s.value);
                  setSizeAnchor(null);
                }}
              >
                {s.label}
              </MenuItem>
            ))}
          </Menu>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

          <Tooltip title="Align left">
            <IconButton size="small" sx={btnSx} onMouseDown={preventBlur} onClick={() => exec("justifyLeft")}>
              <FormatAlignLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Align center">
            <IconButton size="small" sx={btnSx} onMouseDown={preventBlur} onClick={() => exec("justifyCenter")}>
              <FormatAlignCenterIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Align right">
            <IconButton size="small" sx={btnSx} onMouseDown={preventBlur} onClick={() => exec("justifyRight")}>
              <FormatAlignRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box
          ref={editorRef}
          component="div"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Write the intention. Select text, then apply a style."
          onInput={syncChange}
          onBlur={saveSelection}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          sx={{
            p: 1.75,
            minHeight: minRows * 26,
            outline: "none",
            lineHeight: 1.7,
            fontSize: "1rem",
            "& strong, & b": { fontWeight: 800 },
            "&:empty:before": {
              content: "attr(data-placeholder)",
              color: "#9ca3af",
            },
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ color: "#9ca3af", mt: 0.5, display: "block" }}>
        Select text, then apply a style. Press Enter for a new line.
      </Typography>
    </Box>
  );
};

export default RichTextEditor;
