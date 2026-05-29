import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Grid,
  IconButton,
  Box,
  Card,
  Avatar,
  Skeleton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { DB } from "../../config/firebase";
import {
  minusCounter,
  plusCounter,
  addCustomPrayer,
  deleteCustomPrayer,
  updateCustomPrayerCounter,
} from "../../firebase/prayerBank/counter";
import { defaultPrayers } from "./constants";
import { registerUser, verifyUserPasscode } from "./checkUser";

function PrayerBank() {
  const { id } = useParams();
  const [counts, setCounts] = useState({});
  const [customPrayers, setCustomPrayers] = useState({});
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newPrayerName, setNewPrayerName] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(null); // null = checking, true = authorized, false = not authorized
  const [passcode, setPasscode] = useState("");
  const [openPasscodeDialog, setOpenPasscodeDialog] = useState(false);
  const [passcodeError, setPasscodeError] = useState("");
  const [userExists, setUserExists] = useState(null); // null = checking, true = exists, false = new user

  useEffect(() => {
    let unsubscribe = null;

    const setupPrayerBank = async () => {
      if (!id) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      // Check if user document exists
      const userDocRef = doc(DB, "prayerBank", id);
      const userDoc = await getDoc(userDocRef);

      const userExistsInDb = userDoc.exists();
      setUserExists(userExistsInDb);

      if (!userExistsInDb) {
        // User doesn't exist, redirect to registration
        setLoading(false);
        setTimeout(() => {
          window.location.href = `/register-prayer-bank?userId=${id}`;
        }, 2000);
        return;
      }

      // User exists, check for passcode in localStorage
      const storedPasscode = localStorage.getItem(`passcode_${id}`);

      if (storedPasscode) {
        // Verify stored passcode
        const isValid = await verifyUserPasscode(id, storedPasscode);

        if (isValid) {
          setIsAuthorized(true);
          setLoading(true);

          // Set up snapshot listener
          unsubscribe = onSnapshot(
            userDocRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const firebaseData = docSnap.data();

                // Set counts for default prayers
                const newCounts = {};
                defaultPrayers.forEach(({ key }) => {
                  newCounts[key] = firebaseData[key] ?? 0;
                });
                setCounts(newCounts);

                // Set custom prayers
                setCustomPrayers(firebaseData.customPrayers || {});
              } else {
                // Initialize with zeros if document doesn't exist
                const newCounts = {};
                defaultPrayers.forEach(({ key }) => {
                  newCounts[key] = 0;
                });
                setCounts(newCounts);
                setCustomPrayers({});
              }
              setLoading(false);
            },
            (error) => {
              console.error("Error fetching document:", error);
              setLoading(false);
            }
          );
        } else {
          // Invalid stored passcode, remove it
          localStorage.removeItem(`passcode_${id}`);
          setIsAuthorized(false);
          setOpenPasscodeDialog(true);
          setLoading(false);
        }
      } else {
        // No passcode in localStorage, show dialog
        setIsAuthorized(false);
        setOpenPasscodeDialog(true);
        setLoading(false);
      }
    };

    setupPrayerBank();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [id]);

  const handleAdd = async (key) => {
    const payload = { key, id };
    await plusCounter(payload);
  };

  const handleReduce = async (key) => {
    if (counts[key] <= 0) {
      return;
    }
    const payload = { key, id };
    await minusCounter(payload);
  };

  const handleCustomAdd = async (customKey) => {
    const payload = { customKey, id, action: "increment" };
    await updateCustomPrayerCounter(payload);
  };

  const handleCustomReduce = async (customKey) => {
    const currentCount = customPrayers[customKey]?.count || 0;
    if (currentCount <= 0) {
      return;
    }
    const payload = { customKey, id, action: "decrement" };
    await updateCustomPrayerCounter(payload);
  };

  const handleAddCustomPrayer = async () => {
    if (!newPrayerName.trim()) {
      return;
    }

    const payload = { prayerName: newPrayerName.trim(), id };
    await addCustomPrayer(payload);
    setNewPrayerName("");
    setOpenAddDialog(false);
  };

  const handleDeleteCustomPrayer = async (customKey) => {
    if (window.confirm("Are you sure you want to delete this prayer?")) {
      const payload = { customKey, id };
      await deleteCustomPrayer(payload);
    }
  };

  const handlePasscodeSubmit = async () => {
    if (!passcode.trim()) {
      setPasscodeError("Please enter a passcode");
      return;
    }

    setPasscodeError("");

    // Verify passcode (user already exists, checked in useEffect)
    const isValid = await verifyUserPasscode(id, passcode);

    if (isValid) {
      // Correct passcode
      localStorage.setItem(`passcode_${id}`, passcode);
      setIsAuthorized(true);
      setOpenPasscodeDialog(false);
      setPasscode("");
      // Trigger re-render by reloading or refetching
      window.location.reload();
    } else {
      // Wrong passcode
      setPasscodeError("Incorrect passcode");
    }
  };

  // Group prayers by category
  const rosaryPrayers = defaultPrayers.filter((p) => p.category === "Rosary");
  const specialPrayers = defaultPrayers.filter((p) => p.category === "Special");
  const customPrayersArray = Object.entries(customPrayers).filter(
    ([_, value]) => value !== null
  );

  if (!id) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper
          elevation={6}
          sx={{ p: 4, borderRadius: 4, textAlign: "center" }}
        >
          <Typography variant="h5" color="error">
            Please provide a user ID in the URL
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (userExists === false) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper
          elevation={6}
          sx={{ p: 4, borderRadius: 4, textAlign: "center" }}
        >
          <Typography variant="h5" color="primary" gutterBottom>
            New User Detected
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Redirecting to registration page...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (isAuthorized === null || loading || userExists === null) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper
          elevation={6}
          sx={{ p: 4, borderRadius: 4, textAlign: "center" }}
        >
          <Typography variant="h5">Loading...</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Avatar
            src={"/images/MotherMary.jpg"}
            alt="Prayer Bank"
            sx={{
              width: { xs: 150, md: 180 },
              height: { xs: 150, md: 180 },
              mb: 2,
            }}
          />
          <Typography
            fontWeight="bold"
            align="center"
            sx={{
              background: "linear-gradient(45deg, #d32f2f, #ff7043)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: { xs: "1.75rem", md: "2rem" },
              letterSpacing: 0.5,
              fontFamily: "'Poppins', sans-serif",
              mb: 1,
            }}
          >
            {id ? `${id}'s Prayer Bank` : "Prayer Bank"}
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            Keep track of your prayers and build your spiritual treasure
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Skeleton variant="rectangular" width="100%" height={300} />
          </Box>
        ) : (
          <>
            {/* Rosary Mysteries Section */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  color: "#1976d2",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                Rosary Mysteries
              </Typography>
              <Grid container spacing={2}>
                {rosaryPrayers.map(({ name, key }) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Card
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#f3f6f9",
                        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.08)",
                      }}
                    >
                      <IconButton
                        color="error"
                        disabled={counts[key] === 0}
                        onClick={() => handleReduce(key)}
                        size="small"
                      >
                        <RemoveCircleOutlineIcon />
                      </IconButton>

                      <Box sx={{ textAlign: "center", flexGrow: 1, px: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ fontSize: "0.9rem" }}
                        >
                          {name}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            color: "#1976d2",
                            fontWeight: "bold",
                          }}
                        >
                          {counts[key] || 0}
                        </Typography>
                      </Box>

                      <IconButton
                        color="success"
                        onClick={() => handleAdd(key)}
                        size="small"
                      >
                        <AddCircleOutlineIcon />
                      </IconButton>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Special Prayers Section */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  color: "#d32f2f",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                ✨ Special Prayers
              </Typography>
              <Grid container spacing={2}>
                {specialPrayers.map(({ name, key }) => (
                  <Grid item xs={12} key={key}>
                    <Card
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#fff3e0",
                        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.08)",
                      }}
                    >
                      <IconButton
                        color="error"
                        disabled={counts[key] === 0}
                        onClick={() => handleReduce(key)}
                      >
                        <RemoveCircleOutlineIcon fontSize="large" />
                      </IconButton>

                      <Box sx={{ textAlign: "center", flexGrow: 1 }}>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{
                            fontSize: "1.1rem",
                          }}
                        >
                          {name}
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            mt: 1,
                            color: "#d32f2f",
                            fontWeight: "bold",
                          }}
                        >
                          {counts[key] || 0}
                        </Typography>
                      </Box>

                      <IconButton
                        color="success"
                        onClick={() => handleAdd(key)}
                      >
                        <AddCircleOutlineIcon fontSize="large" />
                      </IconButton>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Custom Prayers Section */}
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    color: "#6a1b9a",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  💜 Your Custom Prayers
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddDialog(true)}
                  sx={{
                    background: "linear-gradient(45deg, #6a1b9a, #ab47bc)",
                    color: "white",
                  }}
                >
                  Add Prayer
                </Button>
              </Box>

              {customPrayersArray.length === 0 ? (
                <Card
                  sx={{
                    p: 3,
                    textAlign: "center",
                    backgroundColor: "#f5f5f5",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1" color="textSecondary">
                    No custom prayers yet. Click "Add Prayer" to create one!
                  </Typography>
                </Card>
              ) : (
                <Grid container spacing={2}>
                  {customPrayersArray.map(([customKey, prayerData]) => (
                    <Grid item xs={12} key={customKey}>
                      <Card
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "#f3e5f5",
                          boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.08)",
                        }}
                      >
                        <IconButton
                          color="error"
                          disabled={prayerData.count === 0}
                          onClick={() => handleCustomReduce(customKey)}
                        >
                          <RemoveCircleOutlineIcon fontSize="large" />
                        </IconButton>

                        <Box sx={{ textAlign: "center", flexGrow: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{
                                fontSize: "1.1rem",
                              }}
                            >
                              {prayerData.name}
                            </Typography>
                            <Chip
                              label="Custom"
                              size="small"
                              sx={{
                                backgroundColor: "#6a1b9a",
                                color: "white",
                                fontSize: "0.7rem",
                              }}
                            />
                          </Box>
                          <Typography
                            variant="h5"
                            sx={{
                              mt: 1,
                              color: "#6a1b9a",
                              fontWeight: "bold",
                            }}
                          >
                            {prayerData.count || 0}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton
                            color="success"
                            onClick={() => handleCustomAdd(customKey)}
                          >
                            <AddCircleOutlineIcon fontSize="large" />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteCustomPrayer(customKey)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </>
        )}
      </Paper>

      {/* Add Custom Prayer Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Custom Prayer</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Prayer Name"
            fullWidth
            variant="outlined"
            value={newPrayerName}
            onChange={(e) => setNewPrayerName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddCustomPrayer();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddCustomPrayer}
            variant="contained"
            disabled={!newPrayerName.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openPasscodeDialog}
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>{id ? "Enter Passcode" : "Access Required"}</DialogTitle>
        <DialogContent>
          {!id ? (
            <Typography color="error">
              Please provide a user ID in the URL
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Enter your passcode to access the Prayer Bank. If you're a new
                user, create a passcode to register.
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Passcode"
                type="password"
                fullWidth
                variant="outlined"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPasscodeError("");
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handlePasscodeSubmit();
                  }
                }}
                error={!!passcodeError}
                helperText={passcodeError}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handlePasscodeSubmit}
            variant="contained"
            disabled={!passcode.trim() || loading}
            fullWidth
          >
            {loading ? "Verifying..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default PrayerBank;
