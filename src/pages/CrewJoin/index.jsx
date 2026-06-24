// src/pages/CrewJoin/index.jsx
import React, { useContext, useState } from "react";
import { Navigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Container,
  MenuItem, OutlinedInput, Select, Stack, TextField, Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
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
  py: { xs: 2.5, sm: 5 },
  background:
    "radial-gradient(circle at top, rgba(255, 232, 208, 0.95) 0%, rgba(255, 247, 236, 0.96) 34%, #fffdf8 100%)",
};

const Centered = ({ children }) => (
  <Box sx={pageSx}>
    <Container maxWidth="sm">
      <Card elevation={0} sx={{ ...cardSx, borderRadius: { xs: 4, sm: 5 } }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>{children}</CardContent>
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
      showSnackbar("Welcome to the ministry! May God bless your service. 🙏", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      setRegistered(true);
    } catch (e) {
      showSnackbar(e?.message || "Something went wrong. Please try again.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setSaving(false);
    }
  };

  const canSubmit = phone.trim().length > 0 && skills.length > 0 && !saving;

  return (
    <Centered>
      <Stack spacing={1.75}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#3b2a13", lineHeight: 1.3 }}>
          Offer your gifts for His glory and serve the Lord with gladness.
        </Typography>
        {isAllowed ? (
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ flexWrap: "wrap", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "#5b6472" }}>
              You're an admin — serving as crew keeps your video access.
            </Typography>
            <Button component={RouterLink} to="/videos" size="small" sx={{ textTransform: "none", fontWeight: 700, color: "#935100" }}>
              Go to Videos
            </Button>
          </Stack>
        ) : null}
        <TextField label="Name" value={user.displayName || ""} fullWidth size="small" InputProps={{ readOnly: true }} />
        <TextField label="Email" value={user.email || ""} fullWidth size="small" InputProps={{ readOnly: true }} />
        <TextField
          label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)}
          fullWidth size="small" required placeholder="A number we can reach you on"
        />
        <Box>
          <Typography variant="body2" sx={{ color: "#5b6472", fontWeight: 600, mb: 0.5 }}>
            How you'd like to serve
          </Typography>
          <Select
            multiple displayEmpty fullWidth size="small" value={skills}
            onChange={(e) => setSkills(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)}
            input={<OutlinedInput />}
            renderValue={(selected) =>
              selected.length === 0 ? (
                <Typography sx={{ color: "#9aa0a6" }}>Choose how you'll serve</Typography>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      size="small"
                      onDelete={() => setSkills((prev) => prev.filter((x) => x !== s))}
                      deleteIcon={
                        <CancelRoundedIcon
                          aria-label={`Remove ${s}`}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      }
                      sx={{
                        backgroundColor: "rgba(46, 125, 50, 0.12)",
                        color: "#2e7d32",
                        fontWeight: 600,
                        "& .MuiChip-deleteIcon": {
                          color: "#2e7d32",
                          "&:hover": { color: "#1b5e20" },
                        },
                      }}
                    />
                  ))}
                </Box>
              )
            }
          >
            {CREW_SKILLS.map((skill) => {
              const checked = skills.includes(skill);
              return (
                <MenuItem
                  key={skill}
                  value={skill}
                  sx={{
                    borderRadius: 1.5,
                    mx: 0.5,
                    my: 0.25,
                    "&.Mui-selected": { backgroundColor: "rgba(46, 125, 50, 0.10)" },
                    "&.Mui-selected:hover": { backgroundColor: "rgba(46, 125, 50, 0.16)" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1 }}>
                    <Typography sx={{ fontWeight: checked ? 700 : 400, color: checked ? "#2e7d32" : "#3b2a13" }}>
                      {skill}
                    </Typography>
                    {checked ? <CheckRoundedIcon fontSize="small" sx={{ color: "#2e7d32" }} /> : null}
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </Box>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit} sx={amberButtonSx}>
          Yes, I'll serve
        </Button>
      </Stack>
    </Centered>
  );
};

export default CrewJoin;
