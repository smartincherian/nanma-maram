import { Alert, IconButton, Snackbar } from "@mui/material";
import React, { createContext, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
export const SnackbarContext = createContext();

export const SNACK_BAR_SEVERITY_TYPES = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  SUCCESS: "success",
};

export const SNACK_BAR_POSITIONS = {
  TOP_LEFT: { vertical: "top", horizontal: "left" },
  TOP_CENTER: { vertical: "top", horizontal: "center" },
  TOP_RIGHT: { vertical: "top", horizontal: "right" },
  BOTTOM_LEFT: { vertical: "bottom", horizontal: "left" },
  BOTTOM_CENTER: { vertical: "bottom", horizontal: "center" },
  BOTTOM_RIGHT: { vertical: "bottom", horizontal: "right" },
};

export const SnackbarProvider = ({ children }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState(
    SNACK_BAR_SEVERITY_TYPES.INFO
  );

  const [position, setPosition] = useState(SNACK_BAR_POSITIONS.TOP_RIGHT);

  const showSnackbar = (
    message,
    severity,
    position = SNACK_BAR_POSITIONS.TOP_RIGHT
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setPosition(position);
    setSnackbarOpen(true);
  };
  const hideSnackbar = () => {
    setSnackbarOpen(false);
  };
  const contextValue = {
    showSnackbar,
    hideSnackbar,
  };
  const action = (
    <React.Fragment>
      {/* <Button color="secondary" size="small" onClick={hideSnackbar}>
        UNDO
      </Button> */}
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={hideSnackbar}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );
  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
      <Snackbar
        autoHideDuration={2500}
        open={snackbarOpen}
        onClose={hideSnackbar}
        action={action}
        anchorOrigin={position}
        // The Snackbar root is a full-width fixed container on mobile; let taps
        // pass through it so it can't block buttons underneath. The Alert itself
        // re-enables pointer events so its close button still works.
        sx={{ mt: 1, pointerEvents: "none" }}
      >
        <Alert severity={snackbarSeverity} sx={{ pointerEvents: "auto" }}>{snackbarMessage}</Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};
