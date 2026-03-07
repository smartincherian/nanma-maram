import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
} from "@mui/material";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { DB } from "../../config/firebase";

function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get("userId");
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [userName, setUserName] = useState(userId);
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");

    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!passcode.trim()) {
      setError("Please enter a passcode");
      return;
    }

    if (passcode !== confirmPasscode) {
      setError("Passcodes do not match");
      return;
    }

    if (passcode.length < 4) {
      setError("Passcode must be at least 4 characters");
      return;
    }

    setLoading(true);

    try {
      console.log({ userId });
      const userDocRef = doc(DB, "prayerBank", userName);
      const userDoc = await getDoc(userDocRef);

      // Check if user already exists
      if (userDoc.exists()) {
        setError("User ID already exists. Please login instead.");
        setLoading(false);
        return;
      }

      // Register new user - create user document
      await setDoc(userDocRef, {
        name: userName.trim(),
        passcode: passcode,
        createdAt: new Date().toISOString(),
        customPrayers: {},
      });

      // Store passcode in localStorage
      localStorage.setItem(`passcode_${userName}`, passcode);

      // Navigate to prayer bank
      navigate(`/prayer-bank/${userName}`);
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to register. Please try again.");
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError("");

    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!passcode.trim()) {
      setError("Please enter a passcode");
      return;
    }

    setLoading(true);

    try {
      const userDocRef = doc(DB, "prayerBank", userName);
      const userDoc = await getDoc(userDocRef);

      // Check if user exists
      if (!userDoc.exists()) {
        setError("User not found. Please register first.");
        setLoading(false);
        return;
      }

      // Verify passcode
      const userData = userDoc.data();
      if (userData.passcode !== passcode) {
        setError("Incorrect passcode");
        setLoading(false);
        return;
      }

      // Correct passcode - store and navigate
      localStorage.setItem(`passcode_${userName}`, passcode);
      navigate(`/prayer-bank/${userName}`);
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to login. Please try again.");
      setLoading(false);
    }
  };

  //   return (
  //     <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
  //       <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
  //         <Box
  //           sx={{
  //             display: "flex",
  //             flexDirection: "column",
  //             alignItems: "center",
  //             mb: 3,
  //           }}
  //         >
  //           <Avatar
  //             src={"/images/MotherMary.jpg"}
  //             alt="Prayer Bank"
  //             sx={{ width: 120, height: 120, mb: 2 }}
  //           />
  //           <Typography
  //             variant="h4"
  //             fontWeight="bold"
  //             align="center"
  //             sx={{
  //               background: "linear-gradient(45deg, #d32f2f, #ff7043)",
  //               WebkitBackgroundClip: "text",
  //               WebkitTextFillColor: "transparent",
  //               mb: 1,
  //             }}
  //           >
  //             Register New User
  //           </Typography>
  //           <Typography variant="body2" color="textSecondary" align="center">
  //             User ID: <strong>{userName}</strong>
  //           </Typography>
  //         </Box>

  //         <Box component="form" sx={{ mt: 3 }}>
  //           <TextField
  //             fullWidth
  //             label="Your Name"
  //             variant="outlined"
  //             value={userName}
  //             onChange={(e) => {
  //               setUserName(e.target.value);
  //               setError("");
  //             }}
  //             sx={{ mb: 2 }}
  //           />

  //           <TextField
  //             fullWidth
  //             label="Create Passcode"
  //             type="password"
  //             variant="outlined"
  //             value={passcode}
  //             onChange={(e) => {
  //               setPasscode(e.target.value);
  //               setError("");
  //             }}
  //             sx={{ mb: 2 }}
  //           />

  //           <TextField
  //             fullWidth
  //             label="Confirm Passcode"
  //             type="password"
  //             variant="outlined"
  //             value={confirmPasscode}
  //             onChange={(e) => {
  //               setConfirmPasscode(e.target.value);
  //               setError("");
  //             }}
  //             onKeyPress={(e) => {
  //               if (e.key === "Enter") {
  //                 handleRegister();
  //               }
  //             }}
  //             sx={{ mb: 2 }}
  //           />

  //           {error && (
  //             <Typography color="error" variant="body2" sx={{ mb: 2 }}>
  //               {error}
  //             </Typography>
  //           )}

  //           <Button
  //             fullWidth
  //             variant="contained"
  //             onClick={handleRegister}
  //             disabled={loading}
  //             sx={{
  //               background: "linear-gradient(45deg, #d32f2f, #ff7043)",
  //               color: "white",
  //               py: 1.5,
  //             }}
  //           >
  //             {loading ? "Registering..." : "Register"}
  //           </Button>
  //         </Box>
  //       </Paper>
  //     </Container>
  //   );

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
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
            sx={{ width: 120, height: 120, mb: 2 }}
          />
          <Typography
            variant="h4"
            fontWeight="bold"
            align="center"
            sx={{
              background: "linear-gradient(45deg, #d32f2f, #ff7043)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
            }}
          >
            {isLoginMode ? "Login" : "Register New User"}
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            {isLoginMode
              ? "Enter your credentials to access Prayer Bank"
              : `User ID: ${userName}`}
          </Typography>
        </Box>

        <Box component="form" sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Your Name"
            variant="outlined"
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              setError("");
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label={isLoginMode ? "Enter Passcode" : "Create Passcode"}
            type="password"
            variant="outlined"
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              setError("");
            }}
            sx={{ mb: 2 }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && isLoginMode) {
                handleLogin();
              }
            }}
          />

          {!isLoginMode && (
            <TextField
              fullWidth
              label="Confirm Passcode"
              type="password"
              variant="outlined"
              value={confirmPasscode}
              onChange={(e) => {
                setConfirmPasscode(e.target.value);
                setError("");
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleRegister();
                }
              }}
              sx={{ mb: 2 }}
            />
          )}

          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            fullWidth
            variant="contained"
            onClick={isLoginMode ? handleLogin : handleRegister}
            disabled={loading}
            sx={{
              background: "linear-gradient(45deg, #d32f2f, #ff7043)",
              color: "white",
              py: 1.5,
              mb: 2,
            }}
          >
            {loading
              ? isLoginMode
                ? "Logging in..."
                : "Registering..."
              : isLoginMode
              ? "Login"
              : "Register"}
          </Button>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              {isLoginMode
                ? "Don't have an account?"
                : "Already have an account?"}
            </Typography>
            <Button
              variant="text"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError("");
                setPasscode("");
                setConfirmPasscode("");
              }}
              sx={{
                color: "#d32f2f",
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              {isLoginMode ? "Register here" : "Login here"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default Register;
