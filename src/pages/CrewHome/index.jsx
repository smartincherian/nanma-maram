import React from "react";
import { Navigate } from "react-router-dom";
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Container, Divider, Stack, Typography,
} from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useAuth } from "../../components/AuthProvider";
import { signOutUser } from "../../firebase/auth";
import { cardSx } from "../Videos/ui";

const pageSx = {
  minHeight: "100vh",
  py: { xs: 4, sm: 6 },
  background:
    "radial-gradient(circle at top, rgba(255, 232, 208, 0.95) 0%, rgba(255, 247, 236, 0.96) 34%, #fffdf8 100%)",
};

const CrewHome = () => {
  const { crew, isCrew, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ ...pageSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isCrew) return <Navigate to="/crew/join" replace />;

  return (
    <Box sx={pageSx}>
      <Container maxWidth="sm">
        <Card elevation={0} sx={{ ...cardSx, borderRadius: { xs: 4, sm: 5 } }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack spacing={2}>
              <Box sx={{ textAlign: "center" }}>
                <img
                  src="/images/logo.jpg"
                  alt="Nanma Maram"
                  style={{ maxWidth: "100%", height: "auto", maxHeight: "120px" }}
                />
              </Box>
              <Typography variant="overline" sx={{ color: "#935100", fontWeight: 700, letterSpacing: 1 }}>
                Welcome, fellow servant
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#3b2a13", mt: -1 }}>
                {crew?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "#8a6a36", fontStyle: "italic" }}>
                Thank you for serving Jesus with your gifts. 🙏
              </Typography>
              <Typography sx={{ color: "#5b6472" }}>{crew?.email}</Typography>
              <Typography sx={{ color: "#5b6472" }}>{crew?.phone}</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {(crew?.skills || []).map((s) => (
                  <Chip key={s} label={s} size="small" sx={{ backgroundColor: "rgba(147,81,0,0.10)", color: "#935100" }} />
                ))}
              </Box>
              <Divider />
              <Typography sx={{ color: "#8a6a36", fontWeight: 600 }}>
                Your availability & the works entrusted to you — coming soon.
              </Typography>
              <Button
                variant="outlined" startIcon={<LogoutRoundedIcon />}
                onClick={() => signOutUser()}
                sx={{ textTransform: "none", fontWeight: 700, alignSelf: "flex-start" }}
              >
                Sign out
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default CrewHome;
