import React, { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Box, Button, Card, CardContent, CircularProgress, Container, Stack, TextField, Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useAuth } from "../../components/AuthProvider";
import { updateCrewProfile } from "../../firebase/video/crew";
import SkillsSelect from "../../components/SkillsSelect";
import ChapelFooter from "../../components/ChapelFooter";
import { SnackbarContext, SNACK_BAR_SEVERITY_TYPES } from "../../components/Snackbar";
import { amberButtonSx, cardSx } from "../Videos/ui";

const pageSx = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  py: { xs: 3, sm: 5 },
  background:
    "radial-gradient(circle at top, rgba(255, 232, 208, 0.95) 0%, rgba(255, 247, 236, 0.96) 34%, #fffdf8 100%)",
};

const CrewProfile = () => {
  const { crew, isCrew, loading, refreshCrew } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);
  const navigate = useNavigate();
  const [name, setName] = useState(crew?.name || "");
  const [phone, setPhone] = useState(crew?.phone || "");
  const [skills, setSkills] = useState(crew?.skills || []);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <Box sx={{ ...pageSx, justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isCrew) return <Navigate to="/crew/join" replace />;

  const canSave = name.trim().length > 0 && skills.length > 0 && !saving;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCrewProfile(crew.id, { name, phone, skills });
      await refreshCrew();
      showSnackbar("Your details are updated. 🙏", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      navigate("/crew");
    } catch (e) {
      showSnackbar(e?.message || "Could not save. Please try again.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setSaving(false);
    }
  };

  return (
    <Box sx={pageSx}>
      <Container maxWidth="sm">
        <Card elevation={0} sx={{ ...cardSx, borderRadius: { xs: 4, sm: 5 } }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Stack spacing={2.25}>
              <Button
                onClick={() => navigate("/crew")}
                startIcon={<ArrowBackRoundedIcon />}
                sx={{ textTransform: "none", fontWeight: 700, color: "#935100", alignSelf: "flex-start", px: 0 }}
              >
                Back
              </Button>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#3b2a13" }}>
                Edit your details
              </Typography>
              <TextField
                label="Name" value={name} onChange={(e) => setName(e.target.value)}
                fullWidth size="small" required
              />
              <TextField label="Email" value={crew?.email || ""} fullWidth size="small" InputProps={{ readOnly: true }} />
              <TextField
                label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)}
                fullWidth size="small"
              />
              <SkillsSelect value={skills} onChange={setSkills} />
              <Button variant="contained" onClick={handleSave} disabled={!canSave} sx={amberButtonSx}>
                Save changes
              </Button>
            </Stack>
          </CardContent>
        </Card>
        <ChapelFooter />
      </Container>
    </Box>
  );
};

export default CrewProfile;
