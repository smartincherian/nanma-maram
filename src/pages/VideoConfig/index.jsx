import React, { useState } from "react";
import { Box, Button, Container, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import StagesTab from "./StagesTab";
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
            Only owner accounts can manage video steps and crew.
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

      <Typography sx={{ fontWeight: 800, color: "#1f2937", mb: 0.5, fontSize: { xs: "1.5rem", sm: "2rem" } }}>
        Manage
      </Typography>
      <Typography sx={{ color: "#5b6472", mb: 2 }}>
        Set the production steps and the crew.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}
          textColor="inherit"
          TabIndicatorProps={{ sx: { backgroundColor: "#d67b1f" } }}
          sx={{ "& .Mui-selected": { color: "#8a4b00" }, "& .MuiTab-root": { textTransform: "none", fontWeight: 700 } }}
        >
          <Tab label="Steps" />
          <Tab label="Crew" />
        </Tabs>
      </Box>

      {tab === 0 ? <StagesTab /> : <CrewTab />}
    </Container>
  );
};

export default VideoConfig;
