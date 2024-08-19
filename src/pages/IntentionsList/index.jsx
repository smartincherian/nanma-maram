import ContactMailIcon from "@mui/icons-material/ContactMail";
import ChurchIcon from "@mui/icons-material/Church";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchIntentions } from "../../firebase/intention/get";
import FilterVintageIcon from "@mui/icons-material/FilterVintage";

const IntentionsList = ({ onNavigate }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [intentions, setIntentions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getIntentionsList();
  }, []);

  const getIntentionsList = async () => {
    try {
      const data = await fetchIntentions();
      console.log({ data });
      setIntentions(data);
    } catch (error) {
      console.error("Error getIntentionsList :", error);
      alert(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="body1" paragraph align="center">
          Choose an intention:
        </Typography>
        <Grid container spacing={2} justifyContent="center">
          {loading
            ? Array.from(new Array(2)).map((_, index) => (
                <Grid item xs={12} sm={4} key={index}>
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={56}
                    sx={{ borderRadius: 2 }}
                  />
                </Grid>
              ))
            : intentions.map((item) => (
                <Grid item xs={12} sm={4} key={item.id}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={
                      item?.isMotherIntention ? (
                        <FilterVintageIcon />
                      ) : (
                        <ChurchIcon />
                      )
                    }
                    onClick={() => navigate(`/counter/${item.id}`)}
                    fullWidth
                    sx={{
                      py: 2,
                      textTransform: "none",
                      borderRadius: 2,
                      backgroundColor: item?.isMotherIntention
                        ? "#003366"
                        : "#6699CC",
                      "&:hover": {
                        backgroundColor: item?.isMotherIntention
                          ? "#002244"
                          : "#6EAEDB", // Slightly darker shade for hover
                      },
                    }}
                  >
                    {item.intention}
                  </Button>
                </Grid>
              ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default IntentionsList;
