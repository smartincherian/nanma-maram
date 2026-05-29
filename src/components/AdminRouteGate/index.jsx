import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import { useLocation } from "react-router-dom";

export const LEADER_CODE = "1305";
export const LEADER_ACCESS_STORAGE_KEY = "leaderCodeAccess";

export const hasLeaderAccess = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(LEADER_ACCESS_STORAGE_KEY) === LEADER_CODE;
};

const AdminRouteGate = () => {
  const location = useLocation();
  const [leaderCode, setLeaderCode] = useState("");
  const [error, setError] = useState("");

  const targetPath = useMemo(
    () => `${location.pathname}${location.search}${location.hash}`,
    [location.pathname, location.search, location.hash]
  );

  const handleLeaderAccess = () => {
    if (leaderCode.trim() !== LEADER_CODE) {
      setError("Leader code is invalid");
      return;
    }

    localStorage.setItem(LEADER_ACCESS_STORAGE_KEY, LEADER_CODE);
    window.location.replace(targetPath);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          "radial-gradient(circle at top, rgba(255, 232, 208, 0.95) 0%, rgba(255, 247, 236, 0.96) 34%, #fffdf8 100%)",
        position: "relative",
        overflow: "hidden",
        py: { xs: 4, sm: 6 },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -80,
          left: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, rgba(255, 193, 118, 0.42) 0%, rgba(255, 224, 178, 0.12) 100%)",
          filter: "blur(4px)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -100,
          right: -40,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, rgba(255, 171, 145, 0.22) 0%, rgba(255, 204, 128, 0.08) 100%)",
          filter: "blur(6px)",
        }}
      />

      <Container maxWidth="sm" sx={{ position: "relative" }}>
        <Card
          elevation={0}
          sx={{
            borderRadius: { xs: 4, sm: 5 },
            border: "1px solid rgba(160, 103, 38, 0.14)",
            boxShadow: "0 24px 60px rgba(93, 53, 17, 0.12)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,250,244,0.98) 100%)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: { xs: 2.5, sm: 4 },
              pt: { xs: 3, sm: 4 },
              pb: 2,
              textAlign: "center",
              background:
                "linear-gradient(135deg, rgba(123, 63, 0, 0.92) 0%, rgba(198, 122, 31, 0.90) 100%)",
              color: "#fffaf2",
            }}
          >
            <Box
              component="img"
              src="/images/logo.jpg"
              alt="Nanma Maram"
              sx={{
                width: { xs: 92, sm: 108 },
                height: { xs: 92, sm: 108 },
                objectFit: "cover",
                borderRadius: "24px",
                border: "4px solid rgba(255,255,255,0.24)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                mb: 2,
              }}
            />
            
            <Typography
              variant="h4"
              sx={{
                mt: 1,
                fontWeight: 800,
                lineHeight: 1.15,
                fontSize: { xs: "1.8rem", sm: "2.2rem" },
              }}
            >
              Nanma Maram
            </Typography>
            <Typography
              sx={{
                mt: 1.25,
                maxWidth: 420,
                mx: "auto",
                color: "rgba(255,250,242,0.86)",
                lineHeight: 1.7,
                fontSize: { xs: "0.96rem", sm: "1rem" },
              }}
            >
              Visit our nanmamaram app below.
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Stack spacing={2.25}>
              <Button
                variant="contained"
                fullWidth
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => {
                  window.location.href = "https://nanmamaram.in/";
                }}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "1rem",
                  background:
                    "linear-gradient(135deg, #1f6fb2 0%, #2c93d8 100%)",
                  boxShadow: "0 14px 28px rgba(44, 147, 216, 0.24)",
                }}
              >
                Go to Nanmamaram App
              </Button>

              <Box
                sx={{
                  borderRadius: 3,
                  border: "1px solid rgba(197, 142, 76, 0.22)",
                  background: "rgba(255, 247, 236, 0.92)",
                  p: { xs: 2, sm: 2.5 },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: "#6f3a00",
                    fontSize: { xs: "1.05rem", sm: "1.15rem" },
                  }}
                >
                  For Admin
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                  <TextField
                    value={leaderCode}
                    onChange={(event) => {
                      setLeaderCode(event.target.value);
                      if (error) {
                        setError("");
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleLeaderAccess();
                      }
                    }}
                    fullWidth
                    label="Leader Code"
                    type="password"
                    size="medium"
                    error={Boolean(error)}
                    helperText={error || " "}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2.5,
                        backgroundColor: "#fff",
                      },
                    }}
                  />

                  <Button
                    variant="contained"
                    onClick={handleLeaderAccess}
                    startIcon={<LockOpenRoundedIcon />}
                    sx={{
                      minWidth: { xs: "100%", sm: 160 },
                      height: { xs: 52, sm: 56 },
                      borderRadius: 2.5,
                      textTransform: "none",
                      fontWeight: 800,
                      background:
                        "linear-gradient(135deg, #935100 0%, #d67b1f 100%)",
                      boxShadow: "0 14px 28px rgba(147, 81, 0, 0.22)",
                    }}
                  >
                    Enter
                  </Button>
                </Stack>
              </Box>

              {targetPath !== "/" ? (
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: 3,
                    alignItems: "center",
                    backgroundColor: "rgba(229, 242, 253, 0.72)",
                  }}
                >
                  Requested page: {targetPath}
                </Alert>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default AdminRouteGate;
