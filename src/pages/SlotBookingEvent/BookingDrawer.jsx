import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { MARIAN, MARIAN_BUTTON_BG } from "../../utils/chapelTheme";

const inputTypeFor = (type) => {
  if (type === "number") return "number";
  if (type === "phone") return "tel";
  return "text";
};

// Generic bottom-sheet form. Two modes:
//   - "book": collect details, save them, and book the given slot
//   - "profile": just add / edit the saved name (no slot)
const BookingDrawer = ({
  open,
  mode,
  slot,
  forOthers,
  fields,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const { showSnackbar } = useContext(SnackbarContext);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const prefilled = {};
      fields.forEach((field) => {
        prefilled[field.id] = initialValues?.[field.id] || "";
      });
      setValues(prefilled);
      setErrors({});
    }
  }, [open, fields, initialValues]);

  const handleChange = (id, value) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleSubmit = async () => {
    const nextErrors = {};
    fields.forEach((field) => {
      if (field.required && !String(values[field.id] || "").trim()) {
        nextErrors[field.id] = `${field.label} is required`;
      }
    });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const trimmed = {};
    fields.forEach((field) => {
      trimmed[field.id] = String(values[field.id] || "").trim();
    });

    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      showSnackbar(
        mode === "book" ? "Slot booked. Thank you!" : "Name saved.",
        SNACK_BAR_SEVERITY_TYPES.SUCCESS
      );
      onClose();
    } catch (err) {
      console.error(err);
      showSnackbar(
        "Something went wrong. Please try again.",
        SNACK_BAR_SEVERITY_TYPES.ERROR
      );
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    mode === "book" && slot
      ? `${slot.label} to ${slot.endLabel}`
      : "Your details";
  const subtitle = forOthers ? "Booking for someone else" : null;

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          px: { xs: 2, sm: 3 },
          pt: 2,
          pb: 3,
          maxWidth: 600,
          mx: "auto",
          width: "100%",
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 4,
          borderRadius: 2,
          background: "rgba(0,0,0,0.18)",
          mx: "auto",
          mb: 1.5,
        }}
      />
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: MARIAN.deep }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" sx={{ color: MARIAN.inkSoft }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MARIAN.blue }}>
          <CloseRoundedIcon />
        </IconButton>
      </Stack>

      <Stack spacing={1.75} sx={{ mt: 2 }}>
        {fields.map((field) => (
          <TextField
            key={field.id}
            label={field.label + (field.required ? " *" : "")}
            type={inputTypeFor(field.type)}
            value={values[field.id] || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            error={Boolean(errors[field.id])}
            helperText={errors[field.id] || " "}
            size="small"
            fullWidth
          />
        ))}
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            alignSelf: "flex-end",
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            py: 0.9,
            background: MARIAN_BUTTON_BG,
            boxShadow: "0 10px 22px rgba(21, 50, 122, 0.24)",
          }}
        >
          {submitting
            ? "Saving…"
            : mode === "book"
            ? "Book this slot"
            : "Save"}
        </Button>
      </Stack>
    </Drawer>
  );
};

export default BookingDrawer;
