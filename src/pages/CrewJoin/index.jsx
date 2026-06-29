// src/pages/CrewJoin/index.jsx
import React, { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Box, Button, Card, CardContent, CircularProgress, Container,
  Stack, TextField, Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useAuth } from "../../components/AuthProvider";
import { signInWithGoogle } from "../../firebase/auth";
import { registerCrew } from "../../firebase/video/crew";
import SkillsSelect from "../../components/SkillsSelect";
import { SnackbarContext, SNACK_BAR_SEVERITY_TYPES } from "../../components/Snackbar";
import ChapelFooter from "../../components/ChapelFooter";
import { amberButtonSx, cardSx } from "../Videos/ui";

const pageSx = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  py: { xs: 3, sm: 5 },
  background:
    "radial-gradient(circle at top, rgba(255, 232, 208, 0.95) 0%, rgba(255, 247, 236, 0.96) 34%, #fffdf8 100%)",
};

const Centered = ({ children }) => (
  <Box sx={pageSx}>
    <Container maxWidth="sm">
      <Card elevation={0} sx={{ ...cardSx, borderRadius: { xs: 4, sm: 5 } }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: { xs: 2, sm: 2.5 } }}>
            <img
              src="/images/logo.jpg"
              alt="Nanma Maram"
              style={{ maxWidth: "100%", height: "auto", maxHeight: "120px" }}
            />
          </Box>
          {children}
        </CardContent>
      </Card>
      <ChapelFooter />
    </Container>
  </Box>
);

const CrewJoin = () => {
  const { user, isCrew, crew, loading, refreshCrew } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);
  const navigate = useNavigate();
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
            Serve Jesus with your gifts
          </Typography>
          <Typography sx={{ color: "#5b6472" }}>
            Sign in with Google to join the media ministry and serve the Lord together.
          </Typography>
          <Typography variant="body2" sx={{ color: "#8a6a36", fontStyle: "italic" }}>
            “Each of you should use whatever gift you have to serve others.” — 1 Peter 4:10
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
          Your place in the ministry is resting for now. Please reach out to an admin — God bless you. 🙏
        </Typography>
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
      if (refreshCrew) {
        await refreshCrew();
      }
      showSnackbar("Welcome to the ministry! May God bless your service. 🙏", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      setRegistered(true);
      navigate("/crew", { replace: true });
    } catch (e) {
      showSnackbar(e?.message || "Something went wrong. Please try again.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setSaving(false);
    }
  };

  const canSubmit = skills.length > 0 && !saving;

  return (
    <Centered>
      <Stack spacing={2.25}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#3b2a13", lineHeight: 1.3 }}>
          Offer your gifts for His glory
        </Typography>
        <TextField label="Name" value={user.displayName || ""} fullWidth size="small" InputProps={{ readOnly: true }} />
        <TextField label="Email" value={user.email || ""} fullWidth size="small" InputProps={{ readOnly: true }} />
        <TextField
          label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)}
          fullWidth size="small" placeholder="A number we can reach you on"
        />
        <SkillsSelect value={skills} onChange={setSkills} />
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit} sx={amberButtonSx}>
          I'll serve for Jesus
        </Button>
        <Typography variant="body2" sx={{ color: "#8a6a36", fontStyle: "italic", textAlign: "center" }}>
          “Serve the Lord with gladness; come into his presence with singing.” — Psalm 100:2
        </Typography>
      </Stack>
    </Centered>
  );
};

export default CrewJoin;
