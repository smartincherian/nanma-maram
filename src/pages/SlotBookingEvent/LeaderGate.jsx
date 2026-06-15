import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { MARIAN, MARIAN_HEADER_BG } from "../../utils/chapelTheme";

const ACCESS_WORD = "fire";

// Blocking gate for the leader (/power) page. The dialog cannot be dismissed —
// no backdrop or escape close — until the correct access word is entered.
const LeaderGate = ({ open, onUnlock }) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (value.trim().toLowerCase() === ACCESS_WORD) {
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 3,
          width: "100%",
          maxWidth: 360,
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          background: MARIAN_HEADER_BG,
          color: MARIAN.white,
          px: 3,
          py: 2.5,
          textAlign: "center",
        }}
      >
        <LockRoundedIcon sx={{ fontSize: 30, mb: 0.5 }} />
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
          Leader access
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.85, display: "block" }}>
          Enter the access word to manage slots
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            autoFocus
            fullWidth
            label="Access word"
            value={value}
            error={error}
            helperText={error ? "Incorrect. Please try again." : " "}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={submit}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2.5,
              py: 1.1,
              background: "linear-gradient(135deg, #3a6abf 0%, #2c54a6 100%)",
              boxShadow: "0 12px 26px rgba(58, 106, 191, 0.26)",
            }}
          >
            Unlock
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
};

export default LeaderGate;
