import ChurchIcon from "@mui/icons-material/Church";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
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

const sacredPattern =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23628fc2' stroke-width='1.3' stroke-linecap='round' opacity='0.42'%3E%3Cpath d='M120 28v48M96 52h48'/%3E%3Cpath d='M120 164c-13-23-44-31-44-62 0-20 16-34 36-34 10 0 17 4 24 12 7-8 14-12 24-12 20 0 36 14 36 34 0 31-31 39-44 62'/%3E%3Ccircle cx='120' cy='120' r='76' stroke-dasharray='2.6 8'/%3E%3Ccircle cx='120' cy='120' r='96' stroke-dasharray='1.8 7'/%3E%3Cpath d='M44 90c16 0 30 14 30 30-16 0-30-14-30-30Z'/%3E%3Cpath d='M196 90c-16 0-30 14-30 30 16 0 30-14 30-30Z'/%3E%3C/g%3E%3C/svg%3E\")";

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
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,251,255,0.96) 100%)",
          boxShadow: "0 24px 70px rgba(76, 50, 20, 0.12)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top left, rgba(37,99,235,0.12), transparent 26%), radial-gradient(circle at bottom right, rgba(245,158,11,0.12), transparent 22%)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: -18,
            left: -18,
            width: { xs: 150, sm: 220 },
            height: { xs: 150, sm: 220 },
            opacity: 0.28,
            backgroundImage: sacredPattern,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            transform: "rotate(-8deg)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            right: -22,
            bottom: -18,
            width: { xs: 150, sm: 230 },
            height: { xs: 150, sm: 230 },
            opacity: 0.22,
            backgroundImage: sacredPattern,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            transform: "rotate(16deg) scaleX(-1)",
            pointerEvents: "none",
          }}
        />
        <Stack
          spacing={1}
          sx={{ position: "relative", alignItems: "center", textAlign: "center", mb: 4 }}
        >
          <Typography
            variant="overline"
            sx={{
              letterSpacing: "0.22em",
              color: "#a16207",
              fontWeight: 700,
            }}
          >
            Prayer Count
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
              fontSize: { xs: "1.7rem", sm: "2.1rem" },
            }}
          >
            Choose an intention
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 700,
              color: "#5b6472",
              lineHeight: 1.7,
            }}
          >
            Open a mission counter to add prayer counts, or use the edit action
            to update the intention details.
          </Typography>
        </Stack>
        <Grid container spacing={2.5} justifyContent="center" sx={{ position: "relative" }}>
          {loading
            ? Array.from(new Array(6)).map((_, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={132}
                    sx={{ borderRadius: 4 }}
                  />
                </Grid>
              ))
            : intentions.map((item) => (
                <Grid item xs={12} md={6} key={item.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1,
                      borderRadius: 4,
                      border: "1px solid rgba(37, 99, 235, 0.12)",
                      backgroundColor: "rgba(255,255,255,0.82)",
                      boxShadow: "0 14px 30px rgba(37, 99, 235, 0.08)",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="stretch">
                      <Button
                        variant="contained"
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
                          position: "relative",
                          overflow: "hidden",
                          display: "flex",
                          justifyContent: "flex-start",
                          alignItems: "flex-start",
                          minHeight: 122,
                          px: 2.25,
                          py: 2.1,
                          textTransform: "none",
                          borderRadius: 3,
                          background: item?.isMotherIntention
                            ? "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)"
                            : "linear-gradient(135deg, #7da8d8 0%, #4e88c6 100%)",
                          boxShadow: item?.isMotherIntention
                            ? "0 16px 26px rgba(30, 58, 138, 0.24)"
                            : "0 16px 26px rgba(78, 136, 198, 0.22)",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            backgroundImage:
                              "repeating-radial-gradient(circle at top left, rgba(255,255,255,0.14) 0 2px, transparent 2px 11px), linear-gradient(135deg, transparent 0 58%, rgba(255,255,255,0.08) 58% 60%, transparent 60% 100%), radial-gradient(circle at bottom right, rgba(255,255,255,0.18) 0 1.5px, transparent 1.5px)",
                          },
                          "&:hover": {
                            background: item?.isMotherIntention
                              ? "linear-gradient(135deg, #1e40af 0%, #172554 100%)"
                              : "linear-gradient(135deg, #6899d0 0%, #3979bd 100%)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            zIndex: 1,
                            width: "100%",
                            textAlign: "left",
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: "1rem", sm: "1.1rem" },
                              lineHeight: 1.45,
                              mb: 1,
                            }}
                          >
                            {item.name || "Prayer Intention"}
                          </Typography>
                          <Typography
                            sx={{
                              color: "rgba(255,255,255,0.9)",
                              lineHeight: 1.7,
                              fontSize: "0.95rem",
                              display: "-webkit-box",
                              overflow: "hidden",
                              WebkitLineClamp: 4,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {item.intention}
                          </Typography>
                        </Box>
                      </Button>
                      <IconButton
                        color="primary"
                        aria-label={`Edit ${item.intention}`}
                        onClick={() => navigate(`/intention-edit/${item.id}`)}
                        sx={{
                          borderRadius: 3,
                          border: "1px solid rgba(37, 99, 235, 0.16)",
                          alignSelf: "stretch",
                          width: 58,
                          backgroundColor: "rgba(255,255,255,0.92)",
                          "&:hover": {
                            backgroundColor: "#eff6ff",
                          },
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
