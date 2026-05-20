import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import HistoryIcon from "@mui/icons-material/History";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { Controller, useForm } from "react-hook-form";
import { DB } from "../../config/firebase";
import { addCounter } from "../../firebase/intention/add";
import {
  SNACK_BAR_SEVERITY_TYPES,
  SnackbarContext,
} from "../../components/Snackbar";

const COUNTER_USERNAME_STORAGE_KEY = "counterUsername";

const getStoredCounterUsername = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(COUNTER_USERNAME_STORAGE_KEY) || "";
};

const getDisplayValue = (value, fallback = "") => {
  if (value === "-") {
    return "";
  }

  return value || fallback;
};

const getUpdateCollectionName = (id, intentionData = {}) => {
  const configuredCollectionName = String(
    intentionData?.collectionName || ""
  ).trim();

  if (configuredCollectionName) {
    return configuredCollectionName;
  }

  if (id === "MLN45oPgcMqOzdgxXLmI") {
    return "rosaryUpdates";
  }

  if (id === "rTZBd2UGY1ZL5eYZuDsP") {
    return "hailMaryUpdates";
  }

  return "otherUpdates";
};

const Counter = () => {
  const { id } = useParams();
  const [counterData, setCounterData] = useState({});
  const [latestLogs, setLatestLogs] = useState([]);
  const [topLogs, setTopLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useContext(SnackbarContext);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: getStoredCounterUsername(),
      inputValue: 1,
    },
  });

  const username = watch("username");

  useEffect(() => {
    const docRef = doc(DB, "intentions", id);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setCounterData(snapshot.data());
        }
        setLoading(false);
      },
      (error) => {
        alert(error?.message || "Something went wrong");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (typeof window === "undefined" || username === undefined) {
      return;
    }

    if (username.trim()) {
      localStorage.setItem(COUNTER_USERNAME_STORAGE_KEY, username);
      return;
    }

    localStorage.removeItem(COUNTER_USERNAME_STORAGE_KEY);
  }, [username]);

  const shouldShowLogs =
    Boolean(counterData?.showLast5AndTop5) &&
    Boolean(String(counterData?.collectionName || "").trim());
  const updateCollectionName = getUpdateCollectionName(id, counterData);

  const fetchUpdateLogs = useCallback(async () => {
    if (!id || !shouldShowLogs) {
      setLatestLogs([]);
      setTopLogs([]);
      return;
    }

    setLogsLoading(true);

    try {
      const latestQuery = query(
        collection(DB, updateCollectionName),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const topQuery = query(
        collection(DB, updateCollectionName),
        orderBy("newCount", "desc"),
        limit(5)
      );
      const [latestSnapshot, topSnapshot] = await Promise.all([
        getDocs(latestQuery),
        getDocs(topQuery),
      ]);

      setLatestLogs(
        latestSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
      setTopLogs(
        topSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
    } catch (error) {
      setLatestLogs([]);
      setTopLogs([]);
      showSnackbar(
        error?.message || "Unable to fetch values",
        SNACK_BAR_SEVERITY_TYPES.ERROR
      );
    } finally {
      setLogsLoading(false);
    }
  }, [id, shouldShowLogs, showSnackbar, updateCollectionName]);

  useEffect(() => {
    if (!shouldShowLogs) {
      setLatestLogs([]);
      setTopLogs([]);
      return;
    }

    fetchUpdateLogs();
  }, [fetchUpdateLogs, shouldShowLogs]);

  const onSubmit = async (data) => {
    try {
      const { inputValue, username } = data || {};
      const numericValue = Number(inputValue);

      if (numericValue <= 0) {
        throw new Error("Please enter a count greater than zero");
      }

      const res = await addCounter({
        id,
        value: numericValue,
        user: username,
      });
      showSnackbar(res?.message, SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      reset({ username, inputValue: 1 });
    } catch (error) {
      showSnackbar(
        error?.message || "Something went wrong",
        SNACK_BAR_SEVERITY_TYPES.ERROR
      );
    }
  };

  const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");

  const hasTargetCount = Number(counterData?.maxCount) > 0;
  const isBibleVerseType = counterData?.prayerType === "bibleVerse";
  const currentCount = counterData?.count || 0;
  const targetCount = counterData?.maxCount || 0;
  const remainingCount = Math.max(0, targetCount - currentCount);
  const defaultFeaturedQuote =
    "പരിശുദ്ധാത്മാവ് എന്റെ മേല്‍ വരും; അത്യുന്നതന്റെ ശക്തി എന്റെ മേല്‍ ആവസിക്കും";
  const displayTitlePrefix = getDisplayValue(
    counterData?.displayTitlePrefix,
    "മെയ് 24 പെന്തക്കുസ്താ ദിനത്തിന് ഒരുക്കമായി ലുക്കാ1:35"
  );
  const displayTitleHighlight = getDisplayValue(
    counterData?.displayTitleHighlight,
    "ഒരു കോടി"
  );
  const displayTitleSuffix = getDisplayValue(
    counterData?.displayTitleSuffix,
    "പ്രാവശ്യം ചൊല്ലാം"
  );
  const featuredVerse = getDisplayValue(
    counterData?.featuredVerse,
    getDisplayValue(counterData?.bibleVerse, "")
  );
  const featuredQuote = getDisplayValue(
    counterData?.featuredQuote,
    defaultFeaturedQuote
  );
  const titleExists =
    Boolean(displayTitlePrefix) ||
    Boolean(displayTitleHighlight) ||
    Boolean(displayTitleSuffix);
  const formattedBibleVerse = isBibleVerseType
    ? featuredVerse.replace(/\s*ലുക്കാ 1:35\s*$/u, " ലുക്കാ 1:35")
    : getDisplayValue(counterData?.bibleVerse, "");
  const sanitizedIntention = isBibleVerseType
    ? (counterData?.intention || "")
        .replace(`"${featuredQuote}"`, "")
        .replace(`"${featuredQuote}."`, "")
        .replace(`${featuredQuote}.`, "")
        .replace(featuredQuote, "")
        .replace(/\.{4,}/g, "...")
        .replace(/\s{2,}/g, " ")
        .trim()
    : counterData?.intention;
  const commonHeight = "50px";
  const statCardSx = {
    height: "100%",
    textAlign: "center",
    p: { xs: 2, sm: 2.25 },
    borderRadius: 3,
    border: "1px solid rgba(124, 67, 189, 0.18)",
    backgroundColor: "#faf7ff",
    boxShadow: "0 8px 22px rgba(95, 39, 145, 0.06)",
  };
  const logCardSx = {
    ...statCardSx,
    textAlign: "left",
    borderRadius: 5,
    p: { xs: 2.25, sm: 2.75 },
    border: "1px solid rgba(76, 110, 245, 0.22)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(240,247,255,0.95) 100%)",
    boxShadow: "0 16px 34px rgba(76, 110, 245, 0.10)",
  };
  const statValueSx = {
    fontWeight: 700,
    color: "#311b45",
    fontSize: { xs: "2rem", sm: "1.8rem", md: "2.125rem" },
    lineHeight: 1.15,
    overflowWrap: "anywhere",
  };
  const currentStatValueSx = {
    ...statValueSx,
    color: "#2E7D32",
  };
  const targetStatValueSx = {
    ...statValueSx,
    color: "#1976D2",
  };
  const remainingStatValueSx = {
    ...statValueSx,
    color: "#F57C00",
  };
  const lastFiveEntries = latestLogs;
  const topFiveEntries = topLogs;
  const renderLogList = (entries) => {
    if (!entries.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          No values recorded yet.
        </Typography>
      );
    }

    return (
      <List disablePadding>
        {entries.map((entry, index) => (
          <ListItem
            key={`${entry.id}-${index}`}
            disableGutters
            sx={{ py: 0.75, borderBottom: "1px solid rgba(124, 67, 189, 0.08)" }}
          >
            <ListItemText
              primary={`#${index + 1}  ${formatCount(entry?.newCount)}`}
              secondary={entry?.user || ""}
              primaryTypographyProps={{ fontWeight: 700, color: "#311b45" }}
              secondaryTypographyProps={{ color: "text.secondary" }}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const renderLogHeader = (title) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 1.25,
        px: 0.25,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          display: "block",
          color: "#3f2b63",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontWeight: 800,
        }}
      >
        {title}
      </Typography>
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Card
        variant="outlined"
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          borderRadius: 4,
          boxShadow: "0 18px 40px rgba(72, 35, 113, 0.10)",
          borderColor: "rgba(124, 67, 189, 0.16)",
          background:
            "linear-gradient(180deg, #ffffff 0%, rgba(250,247,255,0.9) 100%)",
        }}
      >
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
              <Grid container justifyContent="center">
                <Typography
                  variant="overline"
                  align="center"
                  gutterBottom
                  sx={{
                    mb: 1.5,
                    color: "primary.main",
                    letterSpacing: "0.12em",
                    fontWeight: 700,
                  }}
                >
                  {counterData?.isMotherIntention
                    ? "Mother Mary Intention"
                    : "Prayer Intention"}
                </Typography>

                {counterData?.name || (isBibleVerseType && titleExists) ? (
                  <Grid item xs={12}>
                    <Typography
                      component="div"
                      align="center"
                      sx={{
                        mb: 1.5,
                        color: "text.primary",
                        fontWeight: 700,
                        fontSize: { xs: "1.05rem", sm: "1.25rem" },
                      }}
                    >
                      {isBibleVerseType ? (
                        <>
                          {displayTitlePrefix ? (
                            <Box component="span" sx={{ color: "#7b1fa2" }}>
                              {displayTitlePrefix}
                            </Box>
                          ) : null}{" "}
                          {displayTitleHighlight ? (
                            <Box component="span" sx={{ color: "#1976D2" }}>
                              {displayTitleHighlight}
                            </Box>
                          ) : null}{" "}
                          {displayTitleSuffix ? (
                            <Box component="span" sx={{ color: "#F57C00" }}>
                              {displayTitleSuffix}
                            </Box>
                          ) : null}
                        </>
                      ) : (
                        counterData?.name
                      )}
                    </Typography>
                  </Grid>
                ) : null}

                {isBibleVerseType && formattedBibleVerse ? (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        mb: 2,
                        textAlign: "center",
                        borderRadius: 3,
                        padding: { xs: "14px 16px", sm: "18px 22px" },
                        border: "1px solid rgba(124, 67, 189, 0.18)",
                        background:
                          "linear-gradient(135deg, rgba(247,240,255,0.96) 0%, rgba(237,224,255,0.92) 100%)",
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          color: "#4a148c",
                          fontWeight: 700,
                          lineHeight: 1.8,
                          fontSize: { xs: "0.98rem", sm: "1.05rem" },
                          whiteSpace: "pre-line",
                        }}
                      >
                        {formattedBibleVerse}
                      </Typography>
                    </Box>
                  </Grid>
                ) : null}

                <Grid item xs={12}>
                  <Box
                    sx={{
                      mb: 3,
                      textAlign: "center",
                      backgroundColor: "#4a148c",
                      backgroundImage:
                        "linear-gradient(135deg, #4a148c 0%, #7c43bd 100%)",
                      borderRadius: "20px",
                      padding: { xs: "18px 18px", sm: "22px 26px" },
                      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        color: "#fff",
                        fontWeight: 700,
                        lineHeight: 1.7,
                        fontSize: { xs: "1.1rem", sm: "1.28rem" },
                      }}
                    >
                      {sanitizedIntention}
                    </Typography>

                    {!isBibleVerseType && counterData?.bibleVerse ? (
                      <Typography
                        variant="body1"
                        sx={{
                          mt: 1.5,
                          color: "#f3e5f5",
                          fontWeight: 700,
                          lineHeight: 1.7,
                          fontSize: { xs: "0.96rem", sm: "1rem" },
                        }}
                      >
                        {counterData?.bibleVerse}
                      </Typography>
                    ) : null}

                    {getDisplayValue(counterData?.instruction, "") ? (
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1.5,
                          color: "#ede7f6",
                          lineHeight: 1.8,
                          fontSize: { xs: "0.92rem", sm: "0.98rem" },
                        }}
                      >
                        {getDisplayValue(counterData?.instruction, "")}
                      </Typography>
                    ) : null}
                  </Box>
                </Grid>

                {isBibleVerseType && featuredQuote ? (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        mb: 2,
                        textAlign: "center",
                        borderRadius: 3,
                        padding: { xs: "14px 16px", sm: "18px 22px" },
                        border: "1px solid rgba(74, 20, 140, 0.28)",
                        background:
                          "linear-gradient(135deg, rgba(227,209,255,0.98) 0%, rgba(196,167,244,0.96) 100%)",
                        boxShadow: "0 10px 24px rgba(74, 20, 140, 0.14)",
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          color: "#2f0a5f",
                          fontWeight: 800,
                          lineHeight: 1.8,
                          fontSize: { xs: "0.98rem", sm: "1.05rem" },
                        }}
                      >
                        "{featuredQuote}."
                      </Typography>
                    </Box>
                  </Grid>
                ) : null}

                <Grid item xs={12}>
                  <Grid
                    container
                    spacing={2}
                    justifyContent="center"
                    sx={{ mb: 3 }}
                  >
                    <Grid item xs={12} sm={hasTargetCount ? 6 : 8} md={hasTargetCount ? 4 : 8}>
                      <Box sx={statCardSx}>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            color: "text.secondary",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            mb: 0.7,
                          }}
                        >
                          Current Count
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={currentStatValueSx}
                        >
                          {formatCount(currentCount)}
                        </Typography>
                      </Box>
                    </Grid>

                    {hasTargetCount ? (
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={statCardSx}>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              color: "text.secondary",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              mb: 0.5,
                            }}
                          >
                            Target Count
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={targetStatValueSx}
                          >
                            {formatCount(targetCount)}
                          </Typography>
                        </Box>
                      </Grid>
                    ) : null}

                    {hasTargetCount ? (
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={statCardSx}>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              color: "text.secondary",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              mb: 0.5,
                            }}
                          >
                            Remaining Count
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={remainingStatValueSx}
                          >
                            {formatCount(remainingCount)}
                          </Typography>
                        </Box>
                      </Grid>
                    ) : null}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Box
                    component="form"
                    onSubmit={handleSubmit(onSubmit)}
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 3,
                      bgcolor: "rgba(250,247,255,0.7)",
                      border: "1px solid rgba(124, 67, 189, 0.12)",
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} mb={1}>
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
                              label="Count Value"
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
                      <Grid item xs={12} sm="auto">
                        <Button
                          variant="contained"
                          color="primary"
                          type="submit"
                          fullWidth
                          startIcon={<AddIcon />}
                          sx={{
                            minWidth: "120px",
                            height: 50,
                            borderRadius: "12px",
                            px: 2.5,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            boxShadow:
                              "0 10px 24px rgba(33, 150, 243, 0.28)",
                          }}
                        >
                          Add
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {shouldShowLogs ? (
  <Grid item xs={12}>
    {/* Header */}
    <Box
      sx={{
        mt: 6,
        mb: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#2d1b69",
            letterSpacing: "0.02em",
          }}
        >
        Every prayer matters ✨
        </Typography>
      </Box>

      <Button
        size="small"
        startIcon={<RefreshIcon />}
        onClick={fetchUpdateLogs}
        disabled={logsLoading}
        variant="outlined"
        sx={{
          borderRadius: "999px",
          textTransform: "none",
          px: 2,
          borderColor: "rgba(76,110,245,0.25)",
          color: "#4c6ef5",
          bgcolor: "rgba(76,110,245,0.04)",

          "&:hover": {
            borderColor: "#4c6ef5",
            bgcolor: "rgba(76,110,245,0.08)",
          },
        }}
      >
        {logsLoading ? "Refreshing..." : "Refresh"}
      </Button>
    </Box>

    {/* Cards */}
    <Grid container spacing={3} sx={{ pb: 2 }}>
      {/* Latest Entries */}
      <Grid item xs={12} md={6}>
        <Box
          sx={{
            borderRadius: "24px",
            border: "1px solid rgba(76,110,245,0.12)",
            bgcolor: "#fff",
            p: 3,
            height: "100%",
            transition: "all 0.2s ease",

            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 10px 24px rgba(76,110,245,0.08)",
            },
          }}
        >
          {/* Card Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 3,
            }}
          >
            <AccessTimeIcon
              sx={{
                fontSize: 20,
                color: "#4c6ef5",
              }}
            />

            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "0.95rem",
                letterSpacing: "0.08em",
                color: "#2d1b69",
                textTransform: "uppercase",
              }}
            >
              Latest 5 Entries
            </Typography>
          </Box>

          {/* List */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {lastFiveEntries?.map((entry, index) => (
              <Box
                key={index}
                sx={{
                  pb: 2,
                  borderBottom:
                    index !== lastFiveEntries.length - 1
                      ? "1px solid rgba(0,0,0,0.06)"
                      : "none",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Typography
                    sx={{
                       fontSize: "0.78rem",
                      color: "text.secondary",
                         fontWeight: 600,
                    }}
                  >
                    #{index + 1}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      color: "#2d1b69",
                      lineHeight: 1,
                    }}
                  >
{entry?.newCount}                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.85rem",
                  }}
                >
                  {entry?.user}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Grid>

      {/* Top Entries */}
      <Grid item xs={12} md={6}>
        <Box
          sx={{
            borderRadius: "24px",
            border: "1px solid rgba(76,110,245,0.12)",
            bgcolor: "#fff",
            p: 3,
            height: "100%",
            transition: "all 0.2s ease",

            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 10px 24px rgba(76,110,245,0.08)",
            },
          }}
        >
          {/* Card Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 3,
            }}
          >
            <EmojiEventsIcon
              sx={{
                fontSize: 20,
                color: "#f59f00",
              }}
            />

            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "0.95rem",
                letterSpacing: "0.08em",
                color: "#2d1b69",
                textTransform: "uppercase",
              }}
            >
              Top 5 Entries
            </Typography>
          </Box>

          {/* List */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {topFiveEntries?.map((entry, index) => (
              <Box
                key={index}
                sx={{
                  pb: 2,
                  borderBottom:
                    index !== topFiveEntries.length - 1
                      ? "1px solid rgba(0,0,0,0.06)"
                      : "none",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                     alignItems: "baseline",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      color: "text.secondary",
                      fontWeight: 600,
                    }}
                  >
                    #{index + 1}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      color: "#2d1b69",
                      lineHeight: 1,
                    }}
                  >
                
{entry?.newCount}  
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.85rem",
                  }}
                >
                  {entry?.user}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Grid>
    </Grid>
  </Grid>
) : null}
              </Grid>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Counter;
