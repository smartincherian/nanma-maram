import React, { useContext } from "react";
import { Box, Button, Container, IconButton, Paper, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import { SnackbarContext, SNACK_BAR_SEVERITY_TYPES } from "../../components/Snackbar";
import ChapelFooter from "../../components/ChapelFooter";
import CrewTab from "./CrewTab";

const linkIconBtnSx = {
  color: "#935100",
  border: "1px solid rgba(160,103,38,0.4)",
  borderRadius: 2,
};

const VideoConfig = () => {
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);

  // Shareable invite link. Pointing at /crew/join means an already-signed-in crew
  // member who opens it is redirected to their crew home; everyone else gets the
  // sign-in / registration flow.
  const crewLink = `${window.location.origin}/crew/join`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(crewLink);
      showSnackbar("Crew link copied.", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
    } catch (e) {
      showSnackbar("Could not copy the link. Please try again.", SNACK_BAR_SEVERITY_TYPES.ERROR);
    }
  };

  if (!isOwner) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 6 } }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: "center", border: "1px solid rgba(160, 103, 38, 0.16)" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#6f3a00", mb: 1 }}>
            Owners only
          </Typography>
          <Typography sx={{ color: "#5b6472", mb: 3 }}>
            Only owner accounts can manage the crew.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/videos")} sx={{ textTransform: "none", fontWeight: 700 }}>
            Back to Videos
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2.5, sm: 5 }, px: { xs: 1.5, sm: 3 } }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate("/videos")}
          sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600, minWidth: 0 }}
        >
          Videos
        </Button>
      </Stack>

      <Typography sx={{ fontWeight: 800, color: "#1f2937", mb: 1.5, fontSize: { xs: "1.5rem", sm: "2rem" } }}>
        Crew
      </Typography>

      {/* Shareable link for inviting crew — compact, icon-only actions. */}
      <Paper elevation={0} sx={{ p: 1.25, mb: 2.5, borderRadius: 3, border: "1px solid rgba(160,103,38,0.16)", background: "linear-gradient(180deg, rgba(255,250,242,0.97) 0%, rgba(255,242,226,0.97) 100%)" }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <GroupAddRoundedIcon sx={{ color: "#935100" }} fontSize="small" />
          <Typography sx={{ fontWeight: 800, color: "#3b2a13", fontSize: "0.95rem" }}>Crew link</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton aria-label="Copy crew link" onClick={handleCopyLink} size="small" sx={linkIconBtnSx}>
            <ContentCopyRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton aria-label="Open crew link in new tab" onClick={() => window.open(crewLink, "_blank", "noopener")} size="small" sx={linkIconBtnSx}>
            <OpenInNewRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>

      <CrewTab />

      <ChapelFooter />
    </Container>
  );
};

export default VideoConfig;
