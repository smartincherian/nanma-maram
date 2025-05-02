import React, { useEffect, useState } from "react";
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
  CircularProgress,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { doc, onSnapshot } from "firebase/firestore";
import { DB } from "../../config/firebase";
import { minusCounter, plusCounter } from "../../firebase/1000beads/counter";
import ModalWithDatePicker from "./ModalWIthDate";
import { muiDateToDdmmyyyy, muiDateToTimestamp } from "../../utils/helpers";
import { mysteries } from "./constants";
import { checkExisting } from "../../firebase/1000beads/logs";

function ThousandBeads() {
  const [counts, setCounts] = useState(
    mysteries.reduce((acc, { key }) => {
      acc[key] = 0; // Initialize all with 0
      return acc;
    }, {})
  );
  const [openModal, setOpenModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingKey, setPendingKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(DB, "1000beads", "extra");

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          const firebaseData = doc.data();
          setCounts((prevCounts) => {
            return mysteries.reduce((acc, { key }) => {
              acc[key] = firebaseData[key] ?? prevCounts[key] ?? 0;
              return acc;
            }, {});
          });
        }
        setLoading(false); //
      },
      (error) => {
        console.error("Error fetching document:", error);
        setLoading(false); //
      }
    );

    return () => unsubscribe();
  }, []);

  const handleModalConfirm = async (data) => {
    if (pendingAction && pendingKey !== null) {
      if (pendingAction === "add") {
        const payload = { key: pendingKey };
        await plusCounter(payload);
      } else if (pendingAction === "reduce") {
        const { selectedDate, selectedGroup } = data;
        const date = muiDateToDdmmyyyy(selectedDate);
        const payload = { key: pendingKey, group: selectedGroup, date };
        await minusCounter(payload);
      }
      setPendingAction(null);
      setPendingKey(null);
    }
  };

  const handleAdd = async (key) => {
    setPendingAction("add");
    setPendingKey(key);
    const payload = { key };
    await plusCounter(payload);
  };

  const handleReduce = async (key) => {
    if (counts[key] <= 0) {
      return;
    }
    setPendingAction("reduce");
    setPendingKey(key);
    setOpenModal(true);
  };

  const getOrdinalSuffix = (num) => {
    switch (num) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const extraMysteries = mysteries.filter(({ key }) => counts[key] > 0);

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
            src={"/images/MotherMary.jpg"}
            alt="MotherMary"
            sx={{
              width: { xs: 200, md: 250 },
              height: { xs: 200, md: 250 },
            }}
          />
        </Box>
        <Typography
          fontWeight="bold"
          align="center"
          sx={{
            background: "linear-gradient(45deg, #d32f2f, #ff7043)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: { xs: "1.5rem" },
            letterSpacing: 0.5,
            // textTransform: "uppercase",
            fontFamily: "'Poppins', sans-serif",
            mb: 2,
          }}
        >
          Nanma Maram 1000 Beads -<br />
          Extra Mysteries
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Tap '+' to increase if recited more. <br />
          Tap '-' to take extra mystery. <br />
          Ave Maria 🙏
        </Typography>

        {/* Display Active Mysteries if Any */}
        {extraMysteries.length > 0 ? (
          <Box
            sx={{
              mt: 3,
              mb: 3,
              p: 2,
              backgroundColor: "#fce4ec",
              borderRadius: 3,
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ color: "#d81b60" }}
            >
              Extra Mysteries Available:
            </Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {extraMysteries.map(({ type, number, key, typeShort }) => (
                <Grid item xs={6} key={key}>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      background: "linear-gradient(45deg, #6a1b9a, #ab47bc)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {typeShort}
                    {number}
                    {getOrdinalSuffix(number)}:{counts[key]}
                  </Typography>
                </Grid>
              ))}
            </Grid>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mt: 1, fontStyle: "italic", textAlign: "center" }}
            >
              * Don't forget to tap '-' if taking an extra mystery.
            </Typography>
          </Box>
        ) : loading ? (
          <Box
            sx={{
              mt: 3,
              mb: 3,
              backgroundColor: "#fce4ec",
              borderRadius: 3,
            }}
          >
            <Skeleton variant="rectangular" width="100%" height={200} />
          </Box>
        ) : null}

        <Grid container spacing={2} sx={{ mt: 3 }}>
          {mysteries.map(({ type, number, key }) => {
            return (
              <Grid item xs={12} key={key}>
                <Card
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: "#f3f6f9",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
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
                        background: "linear-gradient(45deg, #1976d2, #42a5f5)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        fontSize: "1.3rem",
                      }}
                    >
                      {type} {number}
                      {getOrdinalSuffix(number)}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        mt: 1,
                        color: "#1976d2",
                        fontWeight: "bold",
                      }}
                    >
                      {counts[key]}
                    </Typography>
                  </Box>

                  <IconButton color="success" onClick={() => handleAdd(key)}>
                    <AddCircleOutlineIcon fontSize="large" />
                  </IconButton>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
      <ModalWithDatePicker
        open={openModal}
        setOpen={setOpenModal}
        handleSubmitData={handleModalConfirm}
      />
    </Container>
  );
}

export default ThousandBeads;
