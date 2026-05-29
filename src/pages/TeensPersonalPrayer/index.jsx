import {
  Avatar,
  Box,
  Button,
  Container,
  FormControlLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { DB } from "../../config/firebase";
import QuoteCarousel from "../../components/Snackbar/Carousel";
import { bibleOptions, prayerOptions, prayerQoutes } from "./constants";

function TeensPersonalPrayer() {
  const TODAY = dayjs().format("YYYY-MM-DD");

  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [phone, setPhone] = useState(localStorage.getItem("phone") || "");
  const [date, setDate] = useState(TODAY);
  const [prayerTime, setPrayerTime] = useState("");
  const [bibleStudy, setBibleStudy] = useState("");
  const [saving, setSaving] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    const savedPhone = localStorage.getItem("phone");
    if (savedPhone) {
      setPhone(savedPhone);
    }
    const savedName = localStorage.getItem("name");
    if (savedName) {
      setName(savedName);
    }
  }, []);

  useEffect(() => {
    const checkIfSubmitted = async () => {
      if (!phone || !date) return;
      const docRef = doc(DB, "teensPrayerLogs", `${phone}_${date}`);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPrayerTime(data.prayerTime || "");
        setBibleStudy(data.bibleStudy || "");
        setAlreadySubmitted(true);
      } else {
        setPrayerTime("");
        setBibleStudy("");
        setAlreadySubmitted(false);
      }
    };

    checkIfSubmitted();
  }, [phone, date]);

  const handleSubmit = async () => {
    setSaving(true);
    const docId = `${phone}_${date}`;
    await setDoc(doc(DB, "teensPrayerLogs", docId), {
      name,
      phone,
      date,
      prayerTime,
      bibleStudy,
      timestamp: Date.now(),
    });
    setSaving(false);
    alert("Ave Maria 🙏 Saved successfully!");
  };

  const isValid =
    prayerTime && bibleStudy && name && date && phone && !alreadySubmitted;

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 4, textAlign: "center" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar
            src={"/images/logo.jpg"}
            alt="Nanma Maram"
            sx={{
              width: 150,
              height: 150,
              mb: 2,
              border: "2px solid #e0e0e0",
            }}
          />
        </Box>

        <QuoteCarousel quotes={prayerQoutes} interval={30000} />

        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Teens Personal Prayer
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Phone"
              fullWidth
              value={phone}
              onChange={(e) => {
                const input = e.target.value;
                const digitsOnly = input.replace(/\D/g, "");
                setPhone(digitsOnly);
              }}
            />
            {(!localStorage.getItem("phone") ||
              !localStorage.getItem("name")) && (
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
                onClick={() => {
                  localStorage.setItem("phone", phone);
                  localStorage.setItem("name", name);
                }}
                disabled={!phone}
              >
                Confirm Name and Phone
              </Button>
            )}
          </Grid>

          <Grid item xs={12}>
            <TextField
              type="date"
              label="Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: TODAY }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="medium">
              Personal Prayer Duration
            </Typography>
            <RadioGroup
              value={prayerTime}
              onChange={(e) => setPrayerTime(e.target.value)}
            >
              {prayerOptions.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                  disabled={alreadySubmitted}
                />
              ))}
            </RadioGroup>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="medium">
              Bible Verse Study
            </Typography>
            <RadioGroup
              value={bibleStudy}
              onChange={(e) => setBibleStudy(e.target.value)}
            >
              {bibleOptions.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                  disabled={alreadySubmitted}
                />
              ))}
            </RadioGroup>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={!isValid || saving}
              onClick={handleSubmit}
            >
              {alreadySubmitted
                ? "Already Submitted"
                : saving
                ? "Saving..."
                : "Save"}
            </Button>
            {alreadySubmitted && (
              <>
                <Typography color="success.main" variant="body2" sx={{ mt: 1 }}>
                  You have already submitted for this date.
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    color: "primary.main",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontWeight: 500,
                    "&:hover": {
                      opacity: 0.8,
                    },
                  }}
                  onClick={() => setAlreadySubmitted(false)}
                >
                  Resubmit
                </Typography>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default TeensPersonalPrayer;
