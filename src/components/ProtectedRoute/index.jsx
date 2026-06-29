import React from "react";
import { Box, CircularProgress } from "@mui/material";
import { useLocation } from "react-router-dom";
import AdminRouteGate from "../AdminRouteGate";
import { useAuth } from "../AuthProvider";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAllowed, loading } = useAuth();

  const isPrayerBankPublicRoute =
    location.pathname === "/register-prayer-bank" ||
    location.pathname.startsWith("/prayer-bank/");

  if (isPrayerBankPublicRoute) {
    return children;
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Not allowlisted (signed in or not): show the gate so the visitor can
  // choose to head to the public app. No forced redirect.
  if (!isAllowed) {
    return <AdminRouteGate />;
  }

  return children;
}

export default ProtectedRoute;
