import React, { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Avatar, Box, Chip, CircularProgress, Container, FormControlLabel,
  IconButton, Menu, MenuItem, Paper, Stack, Switch, Typography,
} from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import { useAuth } from "../../components/AuthProvider";
import { signOutUser } from "../../firebase/auth";
import { setCrewAvailability } from "../../firebase/video/crew";
import { SnackbarContext, SNACK_BAR_SEVERITY_TYPES } from "../../components/Snackbar";
import { cardSx } from "../Videos/ui";

const eyebrowSx = {
  display: "block",
  fontWeight: 700,
  letterSpacing: "0.18em",
  color: "#935100",
  textTransform: "uppercase",
  fontSize: "0.72rem",
};

const sectionSx = { ...cardSx, borderRadius: { xs: 3, sm: 4 } };

const availabilitySx = { ...cardSx, borderRadius: { xs: 3, sm: 4 }, py: 1.25 };

const heroSx = {
  ...cardSx,
  borderRadius: { xs: 3, sm: 4 },
  border: "1.5px solid rgba(147, 81, 0, 0.32)",
  boxShadow: "0 14px 32px rgba(147, 81, 0, 0.12)",
  background: "linear-gradient(180deg, rgba(255,250,242,0.97) 0%, rgba(255,242,226,0.97) 100%)",
};

const pageSx = {
  minHeight: "100vh",
  py: { xs: 4, sm: 6 },
  background:
    "radial-gradient(circle at top, rgba(255, 232, 208, 0.95) 0%, rgba(255, 247, 236, 0.96) 34%, #fffdf8 100%)",
};

const CrewHome = () => {
  const { user, crew, isCrew, loading, refreshCrew } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [available, setAvailable] = useState(crew?.available !== false);
  const [savingAvailability, setSavingAvailability] = useState(false);

  // No work-assignment system exists yet; this stays false so the availability
  // toggle is always shown. Once works are assigned, set this from the
  // member's open assignments to hide the toggle while they have work.
  const hasAssignedWork = false;

  if (loading) {
    return (
      <Box sx={{ ...pageSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isCrew) return <Navigate to="/crew/join" replace />;

  const toggleAvailability = async () => {
    const next = !available;
    setAvailable(next);
    setSavingAvailability(true);
    try {
      await setCrewAvailability(crew.id, next);
      await refreshCrew();
    } catch (e) {
      setAvailable(!next);
      showSnackbar("Could not update availability.", SNACK_BAR_SEVERITY_TYPES.ERROR);
    } finally {
      setSavingAvailability(false);
    }
  };

  return (
    <Box sx={{ ...pageSx, display: "flex", flexDirection: "column" }}>
      <Container maxWidth="sm">
        <Stack spacing={2}>
          {/* Section 1 — identity */}
          <Paper elevation={0} sx={sectionSx}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontStyle: "italic", fontWeight: 700, color: "#3b2a13", minWidth: 0 }}>
                Welcome, {(crew?.name || "").split(" ")[0]}
              </Typography>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Account menu" sx={{ p: 0.5 }}>
                <Avatar src={user?.photoURL || undefined} alt={crew?.name} sx={{ width: 40, height: 40 }}>
                  {crew?.name?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { setAnchorEl(null); navigate("/crew/profile"); }}>
                  <PersonRoundedIcon fontSize="small" sx={{ mr: 1, color: "#935100" }} /> Profile
                </MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); signOutUser(); }}>
                  <LogoutRoundedIcon fontSize="small" sx={{ mr: 1, color: "#b3261e" }} /> Logout
                </MenuItem>
              </Menu>
            </Stack>
          </Paper>

          {/* Section 2 — availability (only when no work is assigned) */}
          {!hasAssignedWork ? (
            <Paper elevation={0} sx={availabilitySx}>
              <Typography variant="overline" sx={eyebrowSx}>Availability</Typography>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mt: 0.25 }}>
                <Typography variant="body2" sx={{ color: "#5b6472" }}>
                  {available ? "You're available for new work." : "You're marked as not available."}
                </Typography>
                <FormControlLabel
                  sx={{ mr: 0 }}
                  control={
                    <Switch
                      checked={available}
                      onChange={toggleAvailability}
                      disabled={savingAvailability}
                      color="success"
                    />
                  }
                  label={
                    <Chip
                      size="small"
                      label={available ? "Available" : "Not available"}
                      sx={{
                        fontWeight: 700,
                        backgroundColor: available ? "rgba(46,125,50,0.14)" : "rgba(91,100,114,0.14)",
                        color: available ? "#2e7d32" : "#5b6472",
                      }}
                    />
                  }
                />
              </Stack>
            </Paper>
          ) : null}

          {/* Section 3 — pending works (the focus) */}
          <Paper elevation={0} sx={heroSx}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AssignmentRoundedIcon sx={{ color: "#935100" }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#3b2a13" }}>
                Your works
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "#8a6a36", mt: 1 }}>
              No works assigned yet — your pending works will appear here. (Coming soon)
            </Typography>
          </Paper>
        </Stack>
      </Container>
      <Box sx={{ flexGrow: 1 }} />
      <Typography variant="caption" sx={{ textAlign: "center", color: "#8a6a36", fontStyle: "italic", pt: 3, pb: 3 }}>
        Jesus Loves You 🙏
      </Typography>
    </Box>
  );
};

export default CrewHome;
