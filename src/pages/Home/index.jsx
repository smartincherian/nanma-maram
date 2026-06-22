import ContactMailIcon from "@mui/icons-material/ContactMail";
import ChurchIcon from "@mui/icons-material/Church";
import AddIcon from "@mui/icons-material/Add";
import FilterVintageIcon from "@mui/icons-material/FilterVintage";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import { signOutUser } from "../../firebase/auth";

const sacredPattern =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23b8892d' stroke-width='1.4' stroke-linecap='round' opacity='0.44'%3E%3Cpath d='M120 28v48M96 52h48'/%3E%3Cpath d='M120 164c-13-23-44-31-44-62 0-20 16-34 36-34 10 0 17 4 24 12 7-8 14-12 24-12 20 0 36 14 36 34 0 31-31 39-44 62'/%3E%3Ccircle cx='120' cy='120' r='76' stroke-dasharray='2.6 8'/%3E%3Ccircle cx='120' cy='120' r='96' stroke-dasharray='1.8 7'/%3E%3Cpath d='M30 120c18-16 42-24 66-24'/%3E%3Cpath d='M210 120c-18-16-42-24-66-24'/%3E%3Cpath d='M56 188c8-20 24-34 44-42'/%3E%3Cpath d='M184 188c-8-20-24-34-44-42'/%3E%3C/g%3E%3C/svg%3E\")";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    {
      text: "Add Prayer Count",
      helper: "Update existing mission counters",
      icon: <AddIcon />,
      path: "/intention-list",
    },
    {
      text: "Mother Mary Intentions",
      helper: "Open Marian prayer collections",
      icon: <FilterVintageIcon />,
      path: "/intention-mother",
    },
    {
      text: "New Prayer Intention",
      helper: "Create a fresh prayer mission",
      icon: <ChurchIcon />,
      path: "/intention-add",
    },
    {
      text: "1000 Beads - Extra Mysteries",
      helper: "Manage beads and extra mysteries",
      icon: <FilterVintageIcon />,
      path: "/1000-beads-extra",
    },
    {
      text: "Teens - Personal Prayer",
      helper: "Track personal prayer responses",
      icon: <FilterVintageIcon />,
      path: "/teens-personal-prayer",
    },
    {
      text: "Chapel Slot Booking",
      helper: "Create & manage prayer slot events",
      icon: <ContactMailIcon />,
      path: "/chapel-slot",
    },
    {
      text: "Register Prayer Bank",
      helper: "Create or login to your personal prayer bank",
      icon: <AccountCircleIcon />,
      path: "/register-prayer-bank",
    },
    {
      text: "Video Tracking",
      helper: "Track video production stages & crew",
      icon: <MovieFilterIcon />,
      path: "/videos",
    },
    {
      text: "Manage Admins",
      helper: "Add, edit, or remove admin accounts",
      icon: <ManageAccountsIcon />,
      path: "/admins",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          p: { xs: 3, sm: 5 },
          borderRadius: 6,
          border: "1px solid rgba(139, 103, 54, 0.16)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(252,248,242,0.96) 100%)",
          boxShadow: "0 24px 70px rgba(76, 50, 20, 0.12)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top right, rgba(202,138,4,0.14), transparent 26%), radial-gradient(circle at bottom left, rgba(37,99,235,0.1), transparent 24%)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: -18,
            right: -10,
            width: { xs: 150, sm: 220 },
            height: { xs: 150, sm: 220 },
            opacity: 0.3,
            backgroundImage: sacredPattern,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            transform: "rotate(12deg)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -26,
            left: -26,
            width: { xs: 170, sm: 250 },
            height: { xs: 170, sm: 250 },
            opacity: 0.23,
            backgroundImage: sacredPattern,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            transform: "rotate(-18deg) scaleX(-1)",
            pointerEvents: "none",
          }}
        />
        {user ? (
          <Box
            sx={{
              position: "relative",
              display: "flex",
              justifyContent: "flex-end",
              mb: { xs: 1, sm: 0 },
            }}
          >
            <Button
              size="small"
              onClick={() => signOutUser()}
              startIcon={<LogoutRoundedIcon />}
              sx={{
                textTransform: "none",
                color: "#8a6a36",
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Sign out
            </Button>
          </Box>
        ) : null}
        <Stack
          spacing={1.5}
          sx={{ position: "relative", alignItems: "center", textAlign: "center", mb: 4 }}
        >
          <img
            src="/images/logo.jpg"
            alt="Nanma Maram"
            style={{
              maxWidth: "100%",
              height: "auto",
              maxHeight: "148px",
            }}
          />
          <Typography
            variant="overline"
            sx={{
              letterSpacing: "0.22em",
              color: "#a16207",
              fontWeight: 700,
            }}
          >
            Prayer Dashboard
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
              fontSize: { xs: "1.8rem", sm: "2.2rem" },
            }}
          >
            Choose where you want to serve next
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 640,
              color: "#5b6472",
              lineHeight: 1.7,
            }}
          >
            Manage prayer counts, open special devotion pages, and reach admin
            tools from one place.
          </Typography>
        </Stack>
        <Grid container spacing={2.5} justifyContent="center" sx={{ position: "relative" }}>
          {menuItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.text}>
              <Button
                variant="contained"
                onClick={() => navigate(item.path)}
                fullWidth
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  minHeight: 116,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  gap: 2,
                  px: 2.5,
                  py: 2.25,
                  textTransform: "none",
                  borderRadius: 4,
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #1d4ed8 44%, #153eaf 100%)",
                  boxShadow: "0 16px 28px rgba(37, 99, 235, 0.2)",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                      "radial-gradient(circle at 16px 16px, rgba(255,255,255,0.24) 0 2px, transparent 2px), repeating-radial-gradient(circle at top right, rgba(255,255,255,0.12) 0 2px, transparent 2px 12px), linear-gradient(120deg, transparent 0 65%, rgba(255,255,255,0.08) 65% 67%, transparent 67% 100%)",
                    opacity: 0.9,
                  },
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #1d4ed8 0%, #1e40af 44%, #1e3a8a 100%)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 20px 34px rgba(30, 64, 175, 0.26)",
                  },
                }}
                >
                <Box
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    mt: 0.5,
                    display: "grid",
                    placeItems: "center",
                    minWidth: 44,
                    width: 44,
                    height: 44,
                    borderRadius: "14px",
                    backgroundColor: "rgba(255,255,255,0.18)",
                    color: "#fff",
                  }}
                >
                  {item.icon}
                </Box>
                <Box sx={{ position: "relative", zIndex: 1, textAlign: "left" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.02rem", mb: 0.5 }}>
                    {item.text}
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.84)",
                      fontSize: "0.9rem",
                      lineHeight: 1.55,
                    }}
                  >
                    {item.helper}
                  </Typography>
                </Box>
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default Home;
