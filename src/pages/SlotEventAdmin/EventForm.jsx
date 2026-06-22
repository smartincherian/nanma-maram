import React, { useContext, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import {
  SLOT_LENGTH_OPTIONS,
  formatSlotLength,
  isDateReservationComplete,
} from "../../utils/chapelSlots";
import { MARIAN, MARIAN_BUTTON_BG } from "../../utils/chapelTheme";
import { createEvent, updateEvent } from "../../firebase/chapel/events";
import FieldsBuilder, { makeField, makeNameField } from "./FieldsBuilder";
import ReservationsBuilder, { makeReservation } from "./ReservationsBuilder";
import DateReservationsBuilder, {
  makeDateReservation,
} from "./DateReservationsBuilder";
import ImageCropDialog from "./ImageCropDialog";

const DEFAULT_BADGE = "/images/chapel-banner.png";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB input cap

const defaultFields = () => [
  makeNameField(),
  makeField({ label: "Phone", type: "phone" }),
];

// Guarantee the saved fields start with a single locked Name display field
// (covers brand-new events and any older data without one).
const normalizeFields = (saved) => {
  if (!saved?.length) return defaultFields();
  const existingName = saved.find((f) => f.locked || f.isDisplayName);
  const nameField = {
    ...makeNameField(),
    ...(existingName ? { id: existingName.id } : {}),
  };
  const extras = saved
    .filter((f) => f.id !== nameField.id && !f.locked && !f.isDisplayName)
    .map((f) => ({ ...makeField(), ...f, isDisplayName: false, locked: false }));
  return [nameField, ...extras];
};

// Rebuild saved reservations into editable entries (guarantees id + shape).
const normalizeReservations = (saved) =>
  (saved || []).map((r) =>
    makeReservation({
      id: r.id,
      name: r.name || "",
      slotKeys: Array.isArray(r.slotKeys) ? r.slotKeys : [],
      days: Array.isArray(r.days) ? r.days : [],
    })
  );

// Rebuild saved date-range reservations into editable entries.
const normalizeDateReservations = (saved) =>
  (saved || []).map((r) =>
    makeDateReservation({
      id: r.id,
      reason: r.reason || "",
      startDate: r.startDate || "",
      endDate: r.endDate || "",
      startSlotKey: r.startSlotKey || "",
      endSlotKey: r.endSlotKey || "",
    })
  );

const EventForm = ({ event, onBack, onSaved }) => {
  const isEdit = Boolean(event?.id);
  const { showSnackbar } = useContext(SnackbarContext);

  const [heading, setHeading] = useState(event?.heading || "");
  const [description, setDescription] = useState(event?.description || "");
  const [mode, setMode] = useState(event?.mode || "daily");
  const [startDate, setStartDate] = useState(event?.startDate || "");
  const [endDate, setEndDate] = useState(event?.endDate || "");
  const [slotMinutes, setSlotMinutes] = useState(event?.slotMinutes || 30);
  const [active, setActive] = useState(event?.active ?? true);
  const [fields, setFields] = useState(() => normalizeFields(event?.fields));
  const [reservations, setReservations] = useState(() =>
    normalizeReservations(event?.reservations)
  );
  const [dateReservations, setDateReservations] = useState(() =>
    normalizeDateReservations(event?.dateReservations)
  );
  const [image, setImage] = useState(event?.image || "");
  const [cropSrc, setCropSrc] = useState(""); // source for the crop dialog
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showSnackbar(
        "Please choose an image file.",
        SNACK_BAR_SEVERITY_TYPES.ERROR
      );
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showSnackbar(
        "Please choose an image under 5 MB.",
        SNACK_BAR_SEVERITY_TYPES.ERROR
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (!heading.trim()) return "Please enter a heading.";
    if (fields.some((f) => !f.label.trim()))
      return "Every field needs a label.";
    if (mode === "range") {
      if (!startDate || !endDate) return "Pick a start and end date.";
      if (startDate > endDate) return "Start date must be on or before end date.";
    }
    // Any date-range reservation the leader started must be fully specified
    // before saving — a half-filled one is almost certainly a mistake.
    const partialDateRes = dateReservations.find((r) => {
      const filled =
        r.reason.trim() ||
        r.startDate ||
        r.endDate ||
        r.startSlotKey ||
        r.endSlotKey;
      return filled && !isDateReservationComplete(r);
    });
    if (partialDateRes)
      return "Finish each date-range reservation: add a reason, then a start date & time before the end date & time.";
    return "";
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = {
        heading: heading.trim(),
        description: description.trim(),
        mode,
        startDate: mode === "range" ? startDate : null,
        endDate: mode === "range" ? endDate : null,
        slotMinutes,
        active,
        image, // base64 data-URL, or "" to fall back to the default badge
        fields: fields.map((f) => ({
          id: f.id,
          label: f.label.trim(),
          type: f.type,
          required: Boolean(f.required),
          isDisplayName: Boolean(f.isDisplayName),
          locked: Boolean(f.locked),
        })),
        // Drop blank/incomplete reservations (needs both a name and ≥1 slot).
        reservations: reservations
          .map((r) => ({
            id: r.id,
            name: r.name.trim(),
            slotKeys: r.slotKeys || [],
            days: r.days || [],
          }))
          .filter((r) => r.name && r.slotKeys.length),
        // Drop incomplete date-range reservations (need reason + dates + times).
        dateReservations: dateReservations
          .map((r) => ({
            id: r.id,
            reason: r.reason.trim(),
            startDate: r.startDate,
            endDate: r.endDate,
            startSlotKey: r.startSlotKey,
            endSlotKey: r.endSlotKey,
          }))
          .filter(isDateReservationComplete),
      };

      if (isEdit) {
        await updateEvent(event.id, payload);
      } else {
        await createEvent(payload);
      }
      showSnackbar(
        "Event saved — God bless 🙏",
        SNACK_BAR_SEVERITY_TYPES.SUCCESS
      );
      onSaved();
    } catch (err) {
      console.error(err);
      setError("Could not save the event. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: 4,
        border: `1px solid ${MARIAN.border}`,
        background: "linear-gradient(180deg, #ffffff 0%, #f5f8fe 100%)",
        boxShadow: "0 20px 50px rgba(21, 50, 122, 0.1)",
      }}
    >
      <Stack spacing={2.5}>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={onBack}
          sx={{
            alignSelf: "flex-start",
            textTransform: "none",
            color: MARIAN.blue,
          }}
        >
          Back to events
        </Button>

        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: MARIAN.deep }}
        >
          {isEdit ? "Edit event" : "New event"}
        </Typography>

        {error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        ) : null}

        <TextField
          label="Heading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
        />

        <Box>
          <Typography sx={{ fontWeight: 700, color: MARIAN.ink, mb: 1 }}>
            Badge image
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={image || DEFAULT_BADGE}
              alt="Event badge"
              sx={{
                width: 64,
                height: 64,
                border: `2px solid ${MARIAN.border}`,
              }}
            />
            <Stack spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PhotoCameraRoundedIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  color: MARIAN.blue,
                  borderColor: MARIAN.border,
                }}
              >
                Upload image
              </Button>
              {image ? (
                <Button
                  size="small"
                  onClick={() => setImage("")}
                  sx={{ textTransform: "none", color: MARIAN.inkSoft }}
                >
                  Remove
                </Button>
              ) : null}
            </Stack>
          </Stack>
          <Typography
            variant="caption"
            sx={{ color: MARIAN.inkSoft, display: "block", mt: 1 }}
          >
            Square crop, up to 5 MB. Leave empty to use the default image.
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handlePickFile}
          />
        </Box>

        <Divider />

        <FormControl>
          <Typography sx={{ fontWeight: 700, color: MARIAN.ink, mb: 0.5 }}>
            When can people book?
          </Typography>
          <RadioGroup
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <FormControlLabel
              value="daily"
              control={<Radio />}
              label="Daily"
            />
            <FormControlLabel
              value="range"
              control={<Radio />}
              label="Specific date range"
            />
          </RadioGroup>
        </FormControl>

        {mode === "range" ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        ) : null}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <TextField
            select
            label="Slot length"
            value={slotMinutes}
            onChange={(e) => setSlotMinutes(Number(e.target.value))}
            sx={{ minWidth: { xs: "100%", sm: 180 } }}
          >
            {SLOT_LENGTH_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {formatSlotLength(option)}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
            }
            label="Active"
          />
        </Stack>

        <Divider />

        <FieldsBuilder fields={fields} onChange={setFields} />

        <Divider />

        <ReservationsBuilder
          reservations={reservations}
          slotMinutes={slotMinutes}
          onChange={setReservations}
        />

        <Divider />

        <DateReservationsBuilder
          dateReservations={dateReservations}
          slotMinutes={slotMinutes}
          onChange={setDateReservations}
        />

        <Box>
          <Button
            variant="contained"
            startIcon={<SaveRoundedIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              px: 4,
              py: 1.25,
              borderRadius: 2.5,
              background: MARIAN_BUTTON_BG,
              boxShadow: "0 12px 26px rgba(21, 50, 122, 0.22)",
            }}
          >
            {saving ? "Saving…" : "Save event"}
          </Button>
        </Box>
      </Stack>

      <ImageCropDialog
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        onCancel={() => setCropSrc("")}
        onConfirm={(dataUrl) => {
          setImage(dataUrl);
          setCropSrc("");
        }}
      />
    </Paper>
  );
};

export default EventForm;
