import ChurchIcon from "@mui/icons-material/Church";
import EditIcon from "@mui/icons-material/Edit";
import {
  Button,
  Container,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchIntentions } from "../../firebase/intention/get";
import FilterVintageIcon from "@mui/icons-material/FilterVintage";

const IntentionsList = () => {
  const navigate = useNavigate();

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
                <Grid item xs={12} sm={6} key={item.id}>
                  <Paper elevation={2} sx={{ p: 1, borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="stretch">
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
                              : "#6EAEDB",
                          },
                        }}
                      >
                        {item.intention}
                      </Button>
                      <IconButton
                        color="primary"
                        aria-label={`Edit ${item.intention}`}
                        onClick={() => navigate(`/intention-edit/${item.id}`)}
                        sx={{
                          borderRadius: 2,
                          border: "1px solid rgba(25, 118, 210, 0.25)",
                          alignSelf: "stretch",
                          px: 1.5,
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default IntentionsList;
