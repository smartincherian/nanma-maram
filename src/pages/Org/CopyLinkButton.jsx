import React, { useState } from "react";
import { Button, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

// Copies an absolute link to the clipboard. `path` is the route part
// (e.g. "/grace-sisters/counter/abc"); the current site origin is prepended
// so copied links match wherever the page is served.
const CopyLinkButton = ({ path, label = "Copy link", size = "small", sx }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Tooltip title={copied ? "Copied!" : "Copy link"} arrow>
      <Button
        size={size}
        onClick={handleCopy}
        startIcon={copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
        sx={{ textTransform: "none", ...sx }}
      >
        {copied ? "Copied!" : label}
      </Button>
    </Tooltip>
  );
};

export default CopyLinkButton;
