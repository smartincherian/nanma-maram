// src/Counter.js

import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Skeleton,
} from "@mui/material";
import { useParams, useSearchParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { DB } from "../../config/firebase";
import { addCounter } from "../../firebase/intention/add";
import { COMMON_PRAYER_TYPES } from "../PrayerForm/constants";
import AddIcon from "@mui/icons-material/Add";
import {
  SNACK_BAR_SEVERITY_TYPES,
  SnackbarContext,
} from "../../components/Snackbar";

const Counter = () => {
  const { id } = useParams();
  const [inputValue, setInputValue] = useState(1);
  const [counterData, setCounterData] = useState({});
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useContext(SnackbarContext);

  useEffect(() => {
    const docRef = doc(DB, "intentions", id);
    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setCounterData(doc.data());
          setLoading(false);
        } else {
          console.log("No such document!");
          setLoading(false);
        }
      },
      (error) => {
        console.log("Error getting document:", error);
        alert(error?.message || "Something went wrong");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [id]);

  const handleAdd = async () => {
    try {
      const res = await addCounter({ id, value: inputValue });
      showSnackbar(res?.message, SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      setInputValue(1);
    } catch (error) {
      console.error("Error in handleAdd :", error);
      showSnackbar(
        error?.message || "Something went wrong",
        SNACK_BAR_SEVERITY_TYPES.ERROR
      );
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const getCounterLabel = () => {
    const item = COMMON_PRAYER_TYPES.find(
      (prayer) => prayer.value === counterData?.prayerType
    );
    return item?.label || "";
  };

  const commonHeight = "50px";

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Card variant="outlined" sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          {loading ? (
            <Skeleton
              variant="text"
              width="60%"
              height={40}
              sx={{ mb: 2, mx: "auto" }}
            />
          ) : (
            <>
              <Grid container justifyContent={"center"}>
                <Typography
                  variant="h4"
                  align="center"
                  gutterBottom
                  sx={{ mb: 2, color: "primary.main" }}
                >
                  {`${
                    counterData?.isMotherIntention
                      ? `Mother Mary Intentions`
                      : `Intention`
                  } : ${counterData?.intention}`}
                </Typography>
                <Box sx={{ mb: 4, textAlign: "center" }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {getCounterLabel()}
                  </Typography>
                </Box>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs>
                    <TextField
                      label="Value to Add"
                      type="number"
                      value={inputValue}
                      onChange={handleInputChange}
                      fullWidth
                      sx={{
                        mb: 2,
                        "& .MuiOutlinedInput-root": {
                          height: commonHeight,
                        },
                        "& .MuiInputLabel-outlined": {
                          transform: "translate(14px, 16px) scale(1)",
                        },
                        "& .MuiInputLabel-outlined.MuiInputLabel-shrink": {
                          transform: "translate(14px, -6px) scale(0.75)",
                        },
                      }}
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: 1, bgcolor: "background.paper" },
                      }}
                    />
                  </Grid>
                  <Grid item>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAdd}
                      fullWidth
                      startIcon={<AddIcon />}
                      sx={{
                        minWidth: "100px",
                      }}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 4, textAlign: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: "text.secondary" }}
                  >
                    Current Count: {counterData?.count}
                  </Typography>
                  {counterData?.maxCount ? (
                    <>
                      <Typography
                        variant="body2"
                        sx={{ mb: 1, color: "text.secondary" }}
                      >
                        Maximum Count: {counterData?.maxCount}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ mb: 2, color: "text.secondary" }}
                      >
                        Remaining Count:{" "}
                        {counterData?.maxCount - counterData?.count}
                      </Typography>
                    </>
                  ) : null}
                </Box>
              </Grid>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Counter;
