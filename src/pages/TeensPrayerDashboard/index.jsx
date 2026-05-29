import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  IconButton,
  Button,
} from "@mui/material";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import dayjs from "dayjs";
import { DB } from "../../config/firebase"; // Adjust this to your Firebase config path
import { formatPhoneForWhatsApp } from "../../utils/helpers";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PhoneIcon from "@mui/icons-material/Phone";
import {
  prayerDisplayInfo,
  prayerShortLabels,
} from "../TeensPersonalPrayer/constants";

function TeensPersonalPrayerDashboard() {
  const TODAY = dayjs().format("YYYY-MM-DD");
  const VALID_CODE = "13051917";

  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accessCode, setAccessCode] = useState(
    localStorage.getItem("accessCode") || ""
  );
  const [codeVerified, setCodeVerified] = useState(!!accessCode);

  const fetchEntries = async (date) => {
    setLoading(true);
    const colRef = collection(DB, "teensPrayerLogs");
    const q = query(colRef, where("date", "==", date), orderBy("prayerTime"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => doc.data());
    setEntries(data);
    setLoading(false);
  };

  const handleCodeSubmit = () => {
    if (accessCode === VALID_CODE) {
      localStorage.setItem("accessCode", accessCode);
      setCodeVerified(true);
    } else {
      alert("Invalid code");
    }
  };

  useEffect(() => {
    fetchEntries(selectedDate);
  }, [selectedDate]);

  const getFormattedPhoneLink = (phone) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return null; // too short
    return formatPhoneForWhatsApp(phone);
  };

  if (!codeVerified) {
    return (
      <Container maxWidth="xs" sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Enter Access Code
        </Typography>
        <TextField
          fullWidth
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          label="Access Code"
          variant="outlined"
        />
        <Button variant="contained" sx={{ mt: 2 }} onClick={handleCodeSubmit}>
          Submit
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h5" fontWeight="bold" align="center" gutterBottom>
        📋 Teens Prayer Submissions Dashboard
      </Typography>

      <TextField
        type="date"
        label="Select Date"
        fullWidth
        inputProps={{ max: TODAY }}
        InputLabelProps={{ shrink: true }}
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : entries.length === 0 ? (
        <Typography align="center" color="text.secondary">
          No submissions found for this date.
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell>
                    <strong>Name</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Prayer Time (mts)</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Bible Verse Study</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Phone</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>
                      {prayerDisplayInfo[entry.prayerTime] ? (
                        <Box
                          component="span"
                          sx={{
                            color: prayerDisplayInfo[entry.prayerTime].color,
                            fontWeight: "bold",
                          }}
                        >
                          {prayerDisplayInfo[entry.prayerTime].label}
                        </Box>
                      ) : (
                        entry.prayerTime
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.bibleStudy === "Able to study Bible verse" ? (
                        <CheckCircleIcon sx={{ color: "green" }} />
                      ) : entry.bibleStudy ===
                        "Not able to study Bible verse" ? (
                        <CancelIcon sx={{ color: "red" }} />
                      ) : (
                        entry.bibleStudy || "-"
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        maxWidth: { xs: 40, sm: 60 },
                        textAlign: "center",
                      }}
                    >
                      {entry.phone
                        ? (() => {
                            const formattedPhone = getFormattedPhoneLink(
                              entry.phone
                            );
                            return formattedPhone ? (
                              <Tooltip
                                title={
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexDirection: "column",
                                      p: 1,
                                    }}
                                  >
                                    <span>{entry.phone}</span>
                                    <a
                                      href={`https://wa.me/${formattedPhone}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: "#25D366",
                                        fontWeight: 500,
                                      }}
                                    >
                                      Chat on WhatsApp
                                    </a>
                                  </Box>
                                }
                                arrow
                                enterTouchDelay={0} // Enables touch tooltip
                              >
                                <IconButton>
                                  <PhoneIcon sx={{ color: "#1976d2" }} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              "-"
                            );
                          })()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Container>
  );
}

export default TeensPersonalPrayerDashboard;
