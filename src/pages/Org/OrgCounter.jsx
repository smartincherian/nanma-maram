import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DB } from "../../config/firebase";
import { addCounter } from "../../firebase/intention/add";
import { getOrgBySlug } from "../../firebase/org/orgs";
import { getOrgVoterName, setOrgVoterName } from "../../utils/orgVoter";
import FormattedText from "./FormattedText";
import {
  SNACK_BAR_SEVERITY_TYPES,
  SnackbarContext,
} from "../../components/Snackbar";

const OrgCounter = () => {
  const { orgSlug, id } = useParams();
  const { showSnackbar } = useContext(SnackbarContext);
  const [org, setOrg] = useState(null);
  const [counterData, setCounterData] = useState({});
  const [loading, setLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { username: getOrgVoterName(orgSlug), inputValue: "" },
  });
  const username = watch("username");

  useEffect(() => {
    let active = true;
    getOrgBySlug(orgSlug).then((found) => {
      if (active) setOrg(found);
    });
    return () => {
      active = false;
    };
  }, [orgSlug]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(DB, "intentions", id), (snap) => {
      if (snap.exists()) setCounterData(snap.data());
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (username !== undefined) setOrgVoterName(orgSlug, username);
  }, [orgSlug, username]);

  useEffect(() => { if (org?.name) document.title = org.name; }, [org]);

  const onSubmit = async (data) => {
    try {
      const numericValue = Number(data.inputValue);
      if (numericValue <= 0) throw new Error("Please enter a count greater than zero");
      if (!org) throw new Error("Organization not found");
      const res = await addCounter({
        id,
        value: numericValue,
        user: data.username,
        orgId: org.id,
      });
      showSnackbar(res?.message || "Count added", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      reset({ username: data.username, inputValue: "" });
    } catch (error) {
      showSnackbar(error?.message || "Something went wrong", SNACK_BAR_SEVERITY_TYPES.ERROR);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (org && counterData && counterData.orgId !== org.id) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Prayer not found
        </Typography>
      </Container>
    );
  }

  const accent = org?.primaryColor || "#4a148c";
  const currentCount = Number(counterData?.count || 0);
  const targetCount = Number(counterData?.maxCount || 0);
  const fmt = (v) => Number(v || 0).toLocaleString("en-IN");

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>
      <Card variant="outlined" sx={{ borderRadius: 4, borderColor: `${accent}33` }}>
        <CardContent>
          <Typography align="center" sx={{ fontWeight: 800, color: accent, mb: 0.5 }}>
            {org?.name}
          </Typography>
          <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 2 }}>
            {counterData?.name || "Prayer"}
          </Typography>

          {counterData?.intention ? (
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 3,
                textAlign: "center",
                color: "#fff",
                backgroundImage: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
              }}
            >
              <Typography sx={{ fontWeight: 500, lineHeight: 1.7, "& strong": { fontWeight: 800 } }}>
                <FormattedText text={counterData.intention} />
              </Typography>
            </Box>
          ) : null}

          <Grid container spacing={2} justifyContent="center" sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: "center", p: 2, borderRadius: 3, bgcolor: "#faf7ff" }}>
                <Typography variant="caption" color="text.secondary">CURRENT</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: accent }}>{fmt(currentCount)}</Typography>
              </Box>
            </Grid>
            {targetCount > 0 ? (
              <Grid item xs={6}>
                <Box sx={{ textAlign: "center", p: 2, borderRadius: 3, bgcolor: "#faf7ff" }}>
                  <Typography variant="caption" color="text.secondary">TARGET</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#1976D2" }}>{fmt(targetCount)}</Typography>
                </Box>
              </Grid>
            ) : null}
          </Grid>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="username"
              control={control}
              rules={{ required: "Name is required", minLength: { value: 3, message: "At least 3 characters" } }}
              render={({ field }) => (
                <TextField {...field} label="Name" fullWidth sx={{ mb: 2 }} error={!!errors.username} helperText={errors.username?.message} />
              )}
            />
            <Controller
              name="inputValue"
              control={control}
              rules={{
                required: "Value is required",
                validate: {
                  isPositiveInteger: (v) => (Number.isInteger(Number(v)) && Number(v) > 0) || "Must be a positive integer",
                  maxValue: (v) => Number(v) <= 1000 || "Must not exceed 1000",
                },
              }}
              render={({ field }) => (
                <TextField {...field} label="Recite & Enter Count" type="number" fullWidth sx={{ mb: 2 }} error={!!errors.inputValue} helperText={errors.inputValue?.message} inputProps={{ min: 1, max: 1000 }} />
              )}
            />
            <Button type="submit" variant="contained" fullWidth startIcon={<AddIcon />} sx={{ height: 50, borderRadius: 3, fontWeight: 700, bgcolor: accent, "&:hover": { bgcolor: accent } }}>
              Add
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default OrgCounter;
