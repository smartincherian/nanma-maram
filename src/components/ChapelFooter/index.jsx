import React, { useState } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { MARIAN } from "../../utils/chapelTheme";
import TauCrossIcon from "../TauCrossIcon";
import CreditsSheet from "../../pages/SlotBookingEvent/CreditsSheet";

// Shared chapel footer: "© <year> Nanma Maram" plus a Credits button that
// opens the bottom credits sheet. Used across the booking and admin pages.
const ChapelFooter = () => {
  const [showCredits, setShowCredits] = useState(false);
  const year = new Date().getFullYear();
  const version = process.env.REACT_APP_VERSION;

  return (
    <Box component="footer" sx={{ textAlign: "center", mt: 3, pb: 2 }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="center"
      >
        <Typography sx={{ fontSize: "0.8rem", color: MARIAN.inkSoft }}>
          {version ? (
            <Box
              component="span"
              sx={{ ml: 0.75, opacity: 0.7, fontSize: "0.72rem" }}
            >
              v{version}
            </Box>
          ) : null} © {year} Nanma Maram
          
        </Typography>
        <IconButton
          onClick={() => setShowCredits(true)}
          aria-label="Credits"
          title="Credits"
          size="small"
          sx={{
            p: 0.25,
            color: "rgba(27, 42, 74, 0.22)",
            "&:hover": { color: "rgba(27, 42, 74, 0.5)" },
          }}
        >
          <TauCrossIcon sx={{ fontSize: 13 }} />
        </IconButton>
      </Stack>

      <CreditsSheet open={showCredits} onClose={() => setShowCredits(false)} />
    </Box>
  );
};

export default ChapelFooter;
