import React, { useState } from "react";
import { Box, Button, Container, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import StagesTab from "./StagesTab";
import SkillsTab from "./SkillsTab";
import TypesTab from "./TypesTab";
import CrewTab from "./CrewTab";

const VideoConfig = () => {
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const [tab, setTab] = useState(0);

  if (!isOwner) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 6 } }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: "center", border: "1px solid rgba(160, 103, 38, 0.16)" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#6f3a00", mb: 1 }}>
            Owners only
          </Typography>
          <Typography sx={{ color: "#5b6472", mb: 3 }}>
            Only owner accounts can manage video stages, types, skills and crew.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/videos")} sx={{ textTransform: "none", fontWeight: 700 }}>
            Back to Video Tracking
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate("/videos")}
          sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600 }}
        >
          Video Tracking
        </Button>
      </Stack>

      <Typography variant="h4" sx={{ fontWeight: 800, color: "#1f2937", mb: 0.5 }}>
        Video Configuration
      </Typography>
      <Typography sx={{ color: "#5b6472", mb: 2 }}>
        Manage the stages, video types, work skills and the production crew.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          textColor="inherit"
          TabIndicatorProps={{ sx: { backgroundColor: "#d67b1f" } }}
          sx={{ "& .Mui-selected": { color: "#8a4b00" }, "& .MuiTab-root": { textTransform: "none", fontWeight: 700 } }}
        >
          <Tab label="Stages" />
          <Tab label="Video Types" />
          <Tab label="Skills" />
          <Tab label="Crew" />
        </Tabs>
      </Box>

      {tab === 0 ? <StagesTab /> : null}
      {tab === 1 ? <TypesTab /> : null}
      {tab === 2 ? <SkillsTab /> : null}
      {tab === 3 ? <CrewTab /> : null}
    </Container>
  );
};

export default VideoConfig;
