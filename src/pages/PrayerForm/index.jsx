import React, { useState } from "react";
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
} from "@mui/material";
import {
  ADMIN_CODE,
  COMMON_PRAYER_TYPES,
  MOTHER_PRAYER_TYPES,
  PRAYER_TYPES,
} from "./constants";
import { addIntention } from "../../firebase/intention/add";
import { useNavigate } from "react-router-dom";

function PrayerForm({ path = "" }) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      prayerType: path === "mother" ? "rosary" : "hailMary",
    },
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const updatedData = { ...data, path };
      await addIntention(updatedData);
      navigate("/intention-list");
    } catch (error) {
      console.error("Error onSubmit :", error);
      alert(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const PRAYER_TYPES =
    path === "mother" ? MOTHER_PRAYER_TYPES : COMMON_PRAYER_TYPES;

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          {path === "mother" ? "Mother Mary Intentions" : "Prayer Intention"}
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="textSecondary"
          gutterBottom
        >
          Please fill out the form below to submit your prayer intention.
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
            {path === "mother" ? null : (
              <Grid item xs={12}>
                <Controller
                  name="maxCount"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Maximum Count"
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
              Submit
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default PrayerForm;
