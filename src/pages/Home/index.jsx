import ContactMailIcon from "@mui/icons-material/ContactMail";
import ChurchIcon from "@mui/icons-material/Church";
import AddIcon from "@mui/icons-material/Add";
import FilterVintageIcon from "@mui/icons-material/FilterVintage";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";

const Home = ({ onNavigate }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const menuItems = [
    { text: "Add Prayer Count", icon: <AddIcon />, path: "/intention-list" },
    {
      text: "Mother Mary Intentions",
      icon: <FilterVintageIcon />,
      path: "/intention-mother",
    },
    {
      text: "New Prayer Intention",
      icon: <ChurchIcon />,
      path: "/intention-add",
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <img
            src="/images/logo.jpg"
            alt="My Beautiful App Logo"
            style={{
              maxWidth: "100%",
              height: "auto",
              maxHeight: "150px", // Adjust this value as needed
            }}
          />
        </Box>
        <Typography variant="body1" paragraph align="center">
          Choose a page to navigate:
        </Typography>
        <Grid container spacing={2} justifyContent="center">
          {menuItems.map((item) => (
            <Grid item xs={12} sm={4} key={item.text}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                fullWidth
                sx={{
                  py: 2,
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                {item.text}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default Home;
