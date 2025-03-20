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
  styled,
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
import { Controller, useForm } from "react-hook-form";
import { fetchUpdates } from "../../firebase/intention/get";

const Counter = () => {
  const { id } = useParams();
  const [counterData, setCounterData] = useState({});
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useContext(SnackbarContext);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      inputValue: 1,
    },
  });

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

  const onSubmit = async (data) => {
    try {
      const { inputValue, username } = data || {};
      const res = await addCounter({ id, value: inputValue, user: username });
      showSnackbar(res?.message, SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      reset({ username: "", inputValue: 1 });
    } catch (error) {
      console.error("Error in handleAdd :", error);
      showSnackbar(
        error?.message || "Something went wrong",
        SNACK_BAR_SEVERITY_TYPES.ERROR
      );
    }
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
                  variant="h5"
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
                <Box
                  sx={{
                    mb: 4,
                    textAlign: "center",
                    backgroundColor: "#4a148c", // Deep purple background
                    backgroundImage:
                      "linear-gradient(135deg, #4a148c 0%, #7c43bd 100%)", // Gradient effect
                    borderRadius: "15px", // Rounded corners
                    padding: "10px",
                    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 1,
                      color: "#fff", // White text color
                      textShadow: "2px 2px 4px rgba(0,0,0,0.3)", // Text shadow for better readability
                      fontWeight: "bold",
                      letterSpacing: "1px",
                    }}
                  >
                    {getCounterLabel()}
                  </Typography>
                </Box>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs mb={3}>
                      <Controller
                        name="username"
                        control={control}
                        rules={{
                          required: "Full name is required",
                          minLength: {
                            value: 3,
                            message:
                              "Name should be at least 3 characters long",
                          },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Full Name"
                            fullWidth
                            error={!!errors.username}
                            helperText={errors.username?.message}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs>
                      <Controller
                        name="inputValue"
                        control={control}
                        rules={{
                          required: "Value is required",
                          validate: {
                            isPositiveInteger: (value) =>
                              (Number.isInteger(Number(value)) &&
                                Number(value) > 0) ||
                              "Value must be a positive integer",
                            maxValue: (value) =>
                              Number(value) <= 1000 ||
                              "Value must not exceed 1000",
                          },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Value to Add"
                            type="number"
                            fullWidth
                            error={!!errors.inputValue}
                            helperText={errors.inputValue?.message}
                            sx={{
                              mb: 2,
                              "& .MuiOutlinedInput-root": {
                                height: commonHeight,
                              },
                              "& .MuiInputLabel-outlined": {
                                transform: "translate(14px, 16px) scale(1)",
                              },
                              "& .MuiInputLabel-outlined.MuiInputLabel-shrink":
                                {
                                  transform:
                                    "translate(14px, -6px) scale(0.75)",
                                },
                            }}
                            variant="outlined"
                            InputProps={{
                              sx: {
                                borderRadius: 1,
                                bgcolor: "background.paper",
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item>
                      <Button
                        variant="contained"
                        color="primary"
                        type="submit"
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
                </form>
              </Grid>
              <Box sx={{ mt: 4, textAlign: "center", ml: 1 }}>
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
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Counter;
