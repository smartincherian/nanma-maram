import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Container,
  TextField,
  Button,
  MenuItem,
  Typography,
  Paper,
  Box,
  Grid,
  InputAdornment,
  Skeleton,
  Stack,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  ADMIN_CODE,
  COMMON_PRAYER_TYPES,
  MOTHER_PRAYER_TYPES,
} from "./constants";
import {
  addCounter,
  addIntention,
  updateIntention,
} from "../../firebase/intention/add";
import { useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { DB } from "../../config/firebase";

function PrayerForm({ path = "" }) {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      prayerType: path === "mother" ? "rosary" : "hailMary",
      name: "",
      intention: "",
      bibleVerse: "",
      displayTitlePrefix: "",
      displayTitleHighlight: "",
      displayTitleSuffix: "",
      featuredVerse: "",
      instruction: "",
      featuredQuote: "",
      maxCount: "",
      showLast5AndTop5: false,
      collectionName: "",
      adminCode: "",
    },
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [existingIntention, setExistingIntention] = useState(null);
  const [countActionValue, setCountActionValue] = useState(1);
  const [countActionLoading, setCountActionLoading] = useState(false);
  const selectedPrayerType = watch("prayerType");
  const effectivePath = isEditMode
    ? existingIntention?.isMotherIntention
      ? "mother"
      : ""
    : path;

  useEffect(() => {
    if (!isEditMode) {
      return undefined;
    }

    const unsubscribe = onSnapshot(
      doc(DB, "intentions", id),
      (snapshot) => {
        if (!snapshot.exists()) {
          alert("Intention not found");
          navigate("/intention-list");
          return;
        }

        const data = snapshot.data();
        const isMotherIntention = Boolean(data?.isMotherIntention);

        setExistingIntention(data);
        reset({
          prayerType:
            data?.prayerType || (isMotherIntention ? "rosary" : "hailMary"),
          name: data?.name || "",
          intention: data?.intention || "",
          bibleVerse: data?.bibleVerse || "",
          displayTitlePrefix: data?.displayTitlePrefix || "",
          displayTitleHighlight: data?.displayTitleHighlight || "",
          displayTitleSuffix: data?.displayTitleSuffix || "",
          featuredVerse: data?.featuredVerse || "",
          instruction: data?.instruction || "",
          featuredQuote: data?.featuredQuote || "",
          maxCount:
            data?.maxCount === 0 && isMotherIntention ? "" : data?.maxCount || "",
          showLast5AndTop5: Boolean(data?.showLast5AndTop5),
          collectionName: data?.collectionName || "",
          adminCode: "",
        });
        setPageLoading(false);
      },
      (error) => {
        console.error("Error loading intention :", error);
        alert(error?.message || "Something went wrong");
        setPageLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, isEditMode, navigate, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const updatedData = { ...data, path: effectivePath };

      if (isEditMode) {
        await updateIntention(id, updatedData);
      } else {
        await addIntention(updatedData);
      }

      navigate("/intention-list");
    } catch (error) {
      console.error("Error onSubmit :", error);
      alert(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const PRAYER_TYPES =
    effectivePath === "mother" ? MOTHER_PRAYER_TYPES : COMMON_PRAYER_TYPES;

  const handleCountAction = async (direction = 1) => {
    try {
      const numericValue = Number(countActionValue);

      if (!isEditMode) {
        return;
      }

      if (numericValue <= 0) {
        throw new Error("Please enter a count greater than zero");
      }

      setCountActionLoading(true);
      await addCounter({
        id,
        value: numericValue * direction,
        user: "Leader edit",
      });
      setCountActionValue(1);
    } catch (error) {
      alert(error?.message || "Something went wrong");
    } finally {
      setCountActionLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
          <Skeleton variant="text" height={48} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={420} sx={{ borderRadius: 2 }} />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          {effectivePath === "mother"
            ? isEditMode
              ? "Edit Mother Mary Intention"
              : "Mother Mary Intentions"
            : isEditMode
            ? "Edit Prayer Intention"
            : "Prayer Intention"}
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="textSecondary"
          gutterBottom
        >
          {isEditMode
            ? "Update the fields below to edit this prayer intention."
            : "Please fill out the form below to submit your prayer intention."}
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ mt: 3 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="prayerType"
                control={control}
                defaultValue=""
                rules={{ required: "Prayer type is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Type of Prayer"
                    fullWidth
                    variant="outlined"
                    error={!!errors.prayerType}
                    helperText={errors.prayerType?.message}
                  >
                    {PRAYER_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Name / Person"
                    fullWidth
                    variant="outlined"
                    placeholder="Optional name"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="intention"
                control={control}
                defaultValue=""
                rules={{ required: "Intention is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Intention"
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    error={!!errors.intention}
                    helperText={errors.intention?.message}
                  />
                )}
              />
            </Grid>
            {selectedPrayerType === "bibleVerse" ? (
              <Grid item xs={12}>
                <Controller
                  name="bibleVerse"
                  control={control}
                  defaultValue=""
                  rules={{ required: "Bible verse is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Bible Verse"
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                      placeholder="Example: John 3:16"
                      error={!!errors.bibleVerse}
                      helperText={errors.bibleVerse?.message}
                    />
                  )}
                />
              </Grid>
            ) : null}
            {selectedPrayerType === "bibleVerse" ? (
              <Grid item xs={12}>
                <Controller
                  name="displayTitlePrefix"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Display Title Prefix"
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                      placeholder="Top title first part"
                    />
                  )}
                />
              </Grid>
            ) : null}
            {selectedPrayerType === "bibleVerse" ? (
              <Grid item xs={12} sm={6}>
                <Controller
                  name="displayTitleHighlight"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Display Title Highlight"
                      fullWidth
                      variant="outlined"
                      placeholder="Colored middle part"
                    />
                  )}
                />
              </Grid>
            ) : null}
            {selectedPrayerType === "bibleVerse" ? (
              <Grid item xs={12} sm={6}>
                <Controller
                  name="displayTitleSuffix"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Display Title Suffix"
                      fullWidth
                      variant="outlined"
                      placeholder="Top title last part"
                    />
                  )}
                />
              </Grid>
            ) : null}
            {selectedPrayerType === "bibleVerse" ? (
              <Grid item xs={12}>
                <Controller
                  name="featuredVerse"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Featured Verse Box"
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                      placeholder="Text for the first highlighted verse box"
                    />
                  )}
                />
              </Grid>
            ) : null}
            <Grid item xs={12}>
              <Controller
                name="instruction"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Instruction"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    placeholder="Optional instruction"
                  />
                )}
              />
            </Grid>
            {selectedPrayerType === "bibleVerse" ? (
              <Grid item xs={12}>
                <Controller
                  name="featuredQuote"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Bottom Highlight Quote"
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                      placeholder="Text for the bottom highlight box"
                    />
                  )}
                />
              </Grid>
            ) : null}
            {effectivePath === "mother" ? null : (
              <Grid item xs={12}>
                <Controller
                  name="maxCount"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Target Count"
                      fullWidth
                      placeholder="This Field is Optional"
                      type="number"
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">#</InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Controller
                name="showLast5AndTop5"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(field.value)}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label="Show last 5 & top 5"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="collectionName"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Collection Name"
                    fullWidth
                    variant="outlined"
                    placeholder="Optional collection name"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="adminCode"
                control={control}
                defaultValue=""
                rules={{
                  required: "Admin code is required",
                  validate: (value) =>
                    value === ADMIN_CODE || "Admin code is wrong",
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Leader Code"
                    fullWidth
                    variant="outlined"
                    error={!!errors.adminCode}
                    helperText={errors.adminCode?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: "20px",
                textTransform: "none",
                boxShadow: "0 3px 5px rgba(0, 0, 0, 0.2)",
              }}
            >
              {isEditMode ? "Update" : "Submit"}
            </Button>
          </Box>
        </Box>
      </Paper>
      {isEditMode ? (
        <Paper elevation={4} sx={{ p: 4, borderRadius: 4, mt: 3, mb: 6 }}>
          <Typography variant="h6" gutterBottom>
            Update Count
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Use this section to increment or decrement the current intention
            count.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
            Current Count: {Number(existingIntention?.count || 0).toLocaleString("en-IN")}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Count Value"
              type="number"
              value={countActionValue}
              onChange={(event) => setCountActionValue(event.target.value)}
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                onClick={() => handleCountAction(1)}
                disabled={countActionLoading}
                sx={{
                  minWidth: "140px",
                  borderRadius: "16px",
                  textTransform: "none",
                }}
              >
                {countActionLoading ? "Updating..." : "Add Count"}
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleCountAction(-1)}
                disabled={
                  countActionLoading ||
                  Number(existingIntention?.count || 0) <= 0
                }
                sx={{
                  minWidth: "160px",
                  borderRadius: "16px",
                  textTransform: "none",
                }}
              >
                {countActionLoading ? "Updating..." : "Reduce Count"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}
    </Container>
  );
}

export default PrayerForm;
