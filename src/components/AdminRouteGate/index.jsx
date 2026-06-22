import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import GoogleIcon from "@mui/icons-material/Google";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { signInWithGoogle, signOutUser } from "../../firebase/auth";
import { useAuth } from "../AuthProvider";

const AdminRouteGate = () => {
  const { user, isAllowed } = useAuth();
  const isSignedInButDenied = Boolean(user) && !isAllowed;
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setError("");
    setSigningIn(true);
    try {
      await signInWithGoogle();
      // On success, AuthProvider's onAuthStateChanged fires and
      // ProtectedRoute re-evaluates — no navigation needed here.
    } catch (err) {
      // The user simply closing the popup is not an error worth showing.
      if (err?.code !== "auth/popup-closed-by-user") {
        setError("Could not sign in. Please try again.");
      }
      setSigningIn(false);
    }
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
                    mb: 1.5,
                  }}
                >
                  For Admin
                </Typography>

                {isSignedInButDenied ? (
                  <Stack spacing={1.5}>
                    <Typography sx={{ color: "#6f3a00", lineHeight: 1.6 }}>
                      Signed in as <strong>{user.email}</strong>. This account
                      doesn&apos;t have admin access. If you need access, ask an
                      existing admin to add you.
                    </Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => signOutUser()}
                      startIcon={<LogoutRoundedIcon />}
                      sx={{
                        height: { xs: 52, sm: 56 },
                        borderRadius: 2.5,
                        textTransform: "none",
                        fontWeight: 800,
                        borderColor: "rgba(147, 81, 0, 0.5)",
                        color: "#935100",
                      }}
                    >
                      Sign out
                    </Button>
                  </Stack>
                ) : (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleGoogleSignIn}
                    disabled={signingIn}
                    startIcon={<GoogleIcon />}
                    sx={{
                      height: { xs: 52, sm: 56 },
                      borderRadius: 2.5,
                      textTransform: "none",
                      fontWeight: 800,
                      background:
                        "linear-gradient(135deg, #935100 0%, #d67b1f 100%)",
                      boxShadow: "0 14px 28px rgba(147, 81, 0, 0.22)",
                    }}
                  >
                    {signingIn ? "Signing in…" : "Sign in with Google"}
                  </Button>
                )}
              </Box>

              {error ? (
                <Alert
                  severity="error"
                  onClose={() => setError("")}
                  sx={{
                    borderRadius: 3,
                    alignItems: "center",
                  }}
                >
                  {error}
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
