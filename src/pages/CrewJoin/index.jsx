// src/pages/CrewJoin/index.jsx
import React, { useContext, useState } from "react";
import { Navigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Container,
  MenuItem, OutlinedInput, Select, Stack, TextField, Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useAuth } from "../../components/AuthProvider";
import { signInWithGoogle } from "../../firebase/auth";
import { registerCrew } from "../../firebase/video/crew";
import { CREW_SKILLS } from "../../utils/crewSkills";
import { SnackbarContext, SNACK_BAR_SEVERITY_TYPES } from "../../components/Snackbar";
import { amberButtonSx, cardSx } from "../Videos/ui";

const pageSx = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  py: { xs: 4, sm: 6 },
  background:
    "radial-gradient(circle at top, rgba(255, 232, 208, 0.95) 0%, rgba(255, 247, 236, 0.96) 34%, #fffdf8 100%)",
};

const Centered = ({ children }) => (
  <Box sx={pageSx}>
    <Container maxWidth="sm">
      <Card elevation={0} sx={{ ...cardSx, borderRadius: { xs: 4, sm: 5 } }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>{children}</CardContent>
      </Card>
    </Container>
  </Box>
);

const CrewJoin = () => {
  const { user, isAllowed, isCrew, crew, loading } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState([]);
  const [signingIn, setSigningIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registered, setRegistered] = useState(false);

  if (loading) {
    return (
      <Box sx={{ ...pageSx, justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isCrew || registered) return <Navigate to="/crew" replace />;

  if (!user) {
    const handleSignIn = async () => {
      setSigningIn(true);
      try {
        await signInWithGoogle();
      } catch (err) {
        if (err?.code !== "auth/popup-closed-by-user") {
          showSnackbar("Could not sign in. Please try again.", SNACK_BAR_SEVERITY_TYPES.ERROR);
        }
        setSigningIn(false);
      }
    };
    return (
      <Centered>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#3b2a13" }}>
            Join the video crew
          </Typography>
          <Typography sx={{ color: "#5b6472" }}>
            Sign in with your Google account to register.
          </Typography>
          <Button
            variant="contained" startIcon={<GoogleIcon />} disabled={signingIn}
            onClick={handleSignIn} sx={amberButtonSx} fullWidth
          >
            Sign in with Google
          </Button>
        </Stack>
      </Centered>
    );
  }

  if (crew && crew.active === false) {
    return (
      <Centered>
        <Typography sx={{ color: "#8a6a36", textAlign: "center", fontWeight: 600 }}>
          Your crew access is paused. Please contact an admin.
        </Typography>
      </Centered>
    );
  }

  if (isAllowed) {
    return (
      <Centered>
        <Stack spacing={1.5} textAlign="center">
          <Typography sx={{ color: "#3b2a13", fontWeight: 700 }}>
            You're an admin — no need to register as crew.
          </Typography>
          <Button component={RouterLink} to="/videos" variant="contained" sx={amberButtonSx}>
            Go to Videos
          </Button>
        </Stack>
      </Centered>
    );
  }

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await registerCrew({
        email: user.email,
        name: user.displayName || user.email,
        phone,
        skills,
      });
      showSnackbar("You're registered!", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      setRegistered(true);
    } catch (e) {
      showSnackbar(e?.message || "Could not register.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setSaving(false);
    }
  };

  const canSubmit = phone.trim().length > 0 && skills.length > 0 && !saving;

  return (
    <Centered>
      <Stack spacing={2.5}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#3b2a13" }}>
          Register as crew
        </Typography>
        <TextField label="Name" value={user.displayName || ""} fullWidth InputProps={{ readOnly: true }} />
        <TextField label="Email" value={user.email || ""} fullWidth InputProps={{ readOnly: true }} />
        <TextField
          label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)}
          fullWidth required placeholder="Your contact number"
        />
        <Select
          multiple displayEmpty value={skills}
          onChange={(e) => setSkills(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)}
          input={<OutlinedInput />}
          renderValue={(selected) =>
            selected.length === 0 ? (
              <Typography sx={{ color: "#9aa0a6" }}>Select your skills</Typography>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((s) => <Chip key={s} label={s} size="small" />)}
              </Box>
            )
          }
        >
          {CREW_SKILLS.map((skill) => (
            <MenuItem key={skill} value={skill}>{skill}</MenuItem>
          ))}
        </Select>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit} sx={amberButtonSx}>
          Complete signup
        </Button>
      </Stack>
    </Centered>
  );
};

export default CrewJoin;
