import React from "react";
import { Box, Drawer, IconButton, Stack, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { MARIAN, MARIAN_HEADER_BG } from "../../utils/chapelTheme";

// A single table row: label on the left, value on the right.
const Row = ({ icon, label, value, accent }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1.25}
    sx={{
      px: 1.75,
      py: 1.1,
      borderBottom: `1px solid ${MARIAN.border}`,
      "&:last-of-type": { borderBottom: "none" },
    }}
  >
    <Box sx={{ fontSize: "1rem", lineHeight: 1, width: 20, textAlign: "center" }}>
      {icon}
    </Box>
    <Typography
      sx={{
        flex: 1,
        fontSize: "0.6rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: MARIAN.inkSoft,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontWeight: 700,
        fontSize: "0.85rem",
        color: accent || MARIAN.deep,
        textAlign: "right",
      }}
    >
      {value}
    </Typography>
  </Stack>
);

const CreditsSheet = ({ open, onClose }) => (
  <Drawer
    anchor="bottom"
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxWidth: 600,
        mx: "auto",
        width: "100%",
        overflow: "hidden",
      },
    }}
  >
    {/* Header — "All Glory to God" flanked left and right by a cross */}
    <Box
      sx={{
        position: "relative",
        background: MARIAN_HEADER_BG,
        color: MARIAN.white,
        px: 2.5,
        pt: 1.25,
        pb: 1.5,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 4,
          borderRadius: 2,
          background: "rgba(255,255,255,0.55)",
          mx: "auto",
          mb: 1,
        }}
      />
      <IconButton
        size="small"
        onClick={onClose}
        sx={{ position: "absolute", top: 4, right: 6, color: "rgba(255,255,255,0.9)" }}
      >
        <CloseRoundedIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={1.25}
      >
        <Typography sx={{ fontSize: "1.05rem", lineHeight: 1, opacity: 0.9 }}>
          ✝
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "0.02em" }}>
          All Glory to God
        </Typography>
        <Typography sx={{ fontSize: "1.05rem", lineHeight: 1, opacity: 0.9 }}>
          ✝
        </Typography>
      </Stack>
    </Box>

    {/* Body — table of credits */}
    <Box sx={{ px: 2, py: 2, background: MARIAN.white }}>
      <Box
        sx={{
          borderRadius: 2,
          border: `1px solid ${MARIAN.border}`,
          overflow: "hidden",
          background: MARIAN.skySoft,
        }}
      >
        <Row icon="🕊" label="Patron Saint" value="St. Carlo Acutis" />
        <Row
          icon="🕯️"
          label="In loving memory of"
          value="Sonia Shaji"
          accent={MARIAN.deep}
        />
        <Row icon="💻" label="Built with" value="Anthropic" />
      </Box>

      
    </Box>
  </Drawer>
);

export default CreditsSheet;
