import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { fetchBookings } from "../../firebase/chapel/bookings";
import {
  formatDateKey,
  formatDateLabel,
  generateSlots,
  getDefaultDate,
  parseDateKey,
} from "../../utils/chapelSlots";
import { MARIAN, MARIAN_BUTTON_BG, MARIAN_HEADER_BG } from "../../utils/chapelTheme";

// ---- export helpers --------------------------------------------------------

const safeFileName = (text) =>
  String(text || "bookings")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const csvCell = (value) => {
  const v = String(value ?? "");
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

const downloadFile = (filename, text, mime) => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ---- component -------------------------------------------------------------

const BookingsSheet = ({ open, event, onClose }) => {
  const fullScreen = useMediaQuery("(max-width:599px)");
  const [dateKey, setDateKey] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const fields = useMemo(() => event?.fields || [], [event]);
  const displayField = useMemo(
    () => fields.find((f) => f.isDisplayName) || fields[0],
    [fields]
  );
  const otherFields = useMemo(
    () => fields.filter((f) => f !== displayField),
    [fields, displayField]
  );

  // When the sheet opens, default the date to the event's natural start date.
  useEffect(() => {
    if (open && event) {
      setDateKey(formatDateKey(getDefaultDate(event)));
    }
  }, [open, event]);

  const load = useCallback(async () => {
    if (!event || !dateKey) return;
    setLoading(true);
    try {
      const rows = await fetchBookings({ eventId: event.id, date: dateKey });
      setBookings(rows);
    } catch (err) {
      console.error("Error fetchBookings:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [event, dateKey]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const fieldValue = useCallback(
    (booking, field) => {
      if (!field) return "";
      const raw = booking.values?.[field.id];
      if (raw != null && String(raw).trim()) return String(raw).trim();
      if (field.isDisplayName) return String(booking.displayName || "").trim();
      return "";
    },
    []
  );

  // Group bookings by slot, ordered by time of day.
  const groups = useMemo(() => {
    const labelByKey = {};
    generateSlots(event?.slotMinutes).forEach((s) => {
      labelByKey[s.key] = `${s.label} to ${s.endLabel}`;
    });
    const byKey = {};
    bookings.forEach((b) => {
      (byKey[b.slotKey] = byKey[b.slotKey] || []).push(b);
    });
    return Object.keys(byKey)
      .sort()
      .map((key) => ({
        key,
        label: labelByKey[key] || key,
        items: byKey[key],
      }));
  }, [bookings, event]);

  const dateLabel = formatDateLabel(parseDateKey(dateKey) || dateKey);
  const total = bookings.length;

  const buildText = useCallback(() => {
    const header = `${event?.heading || "Bookings"}\n${dateLabel}\nTotal bookings: ${total}`;
    if (!groups.length) return `${header}\n\n(No bookings yet.)`;
    const body = groups
      .map((g) => {
        const lines = g.items
          .map((b) => {
            const name = fieldValue(b, displayField) || "Guest";
            const extras = otherFields
              .map((f) => `${f.label}: ${fieldValue(b, f) || "-"}`)
              .join(", ");
            const lock = b.locked ? " [reserved]" : "";
            return `• ${name}${extras ? ` — ${extras}` : ""}${lock}`;
          })
          .join("\n");
        return `${g.label} (${g.items.length})\n${lines}`;
      })
      .join("\n\n");
    return `${header}\n\n${body}`;
  }, [event, dateLabel, total, groups, displayField, otherFields, fieldValue]);

  const buildCsv = useCallback(() => {
    const head = ["Slot", ...fields.map((f) => f.label), "Reserved"];
    const rows = [head.map(csvCell).join(",")];
    groups.forEach((g) => {
      g.items.forEach((b) => {
        const cells = [
          g.label,
          ...fields.map((f) => fieldValue(b, f)),
          b.locked ? "Yes" : "No",
        ];
        rows.push(cells.map(csvCell).join(","));
      });
    });
    return rows.join("\n");
  }, [fields, groups, fieldValue]);

  const baseName = `${safeFileName(event?.heading)}-${dateKey}`;

  const handleCsv = () =>
    downloadFile(`${baseName}.csv`, buildCsv(), "text/csv;charset=utf-8");
  const handleTxt = () =>
    downloadFile(`${baseName}.txt`, buildText(), "text/plain;charset=utf-8");
  const handleWhatsApp = () =>
    window.open(
      `https://wa.me/?text=${encodeURIComponent(buildText())}`,
      "_blank",
      "noopener,noreferrer"
    );

  const exportDisabled = loading || total === 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 }, m: { xs: 0, sm: 2 } } }}
      fullScreen={fullScreen}
    >
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          background: MARIAN_HEADER_BG,
          color: MARIAN.white,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800 }} noWrap>
              {event?.heading || "Bookings"}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>
              All bookings · leader view
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: MARIAN.white }} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Controls */}
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 2 }}>
        <TextField
          label="Date"
          type="date"
          value={dateKey}
          onChange={(e) => setDateKey(e.target.value)}
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1.5, flexWrap: "wrap" }}
          useFlexGap
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadRoundedIcon />}
            onClick={handleCsv}
            disabled={exportDisabled}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            CSV
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DescriptionRoundedIcon />}
            onClick={handleTxt}
            disabled={exportDisabled}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            TXT
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<WhatsAppIcon />}
            onClick={handleWhatsApp}
            disabled={exportDisabled}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              background: "#25D366",
              "&:hover": { background: "#1ebe5b" },
            }}
          >
            WhatsApp
          </Button>
        </Stack>
        <Typography variant="caption" sx={{ color: MARIAN.inkSoft, mt: 1, display: "block" }}>
          {dateLabel} · {total} booking{total === 1 ? "" : "s"}
        </Typography>
      </Box>

      <Divider sx={{ mt: 1.5 }} />

      {/* Body */}
      <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2, minHeight: 160 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : total === 0 ? (
          <Typography sx={{ color: MARIAN.inkSoft, textAlign: "center", py: 4 }}>
            No bookings for this date yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {groups.map((g) => (
              <Box key={g.key}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                  <Typography sx={{ fontWeight: 800, color: MARIAN.deep }}>
                    {g.label}
                  </Typography>
                  <Chip
                    size="small"
                    label={g.items.length}
                    sx={{ background: MARIAN.goldSoft, color: "#8a6d1f", fontWeight: 700 }}
                  />
                </Stack>
                <Stack spacing={1}>
                  {g.items.map((b) => (
                    <Box
                      key={b.id}
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        border: `1px solid ${MARIAN.border}`,
                        background: b.locked ? MARIAN.goldSoft : MARIAN.skySoft,
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                      >
                        <Typography sx={{ fontWeight: 700, color: MARIAN.deep }}>
                          {fieldValue(b, displayField) || "Guest"}
                        </Typography>
                        {b.locked ? (
                          <LockRoundedIcon sx={{ fontSize: 15, color: "#8a6d1f" }} />
                        ) : null}
                        <Typography
                          sx={{
                            ml: "auto",
                            pl: 1,
                            fontSize: "0.6rem",
                            color: MARIAN.inkSoft,
                            opacity: 0.5,
                            fontFamily: "monospace",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {b.id}
                        </Typography>
                      </Stack>
                      {otherFields.map((f) => (
                        <Typography
                          key={f.id}
                          variant="body2"
                          sx={{ color: MARIAN.inkSoft }}
                        >
                          {f.label}: {fieldValue(b, f) || "—"}
                        </Typography>
                      ))}
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <Divider />
      <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5, textAlign: "right" }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            color: MARIAN.white,
            background: MARIAN_BUTTON_BG,
          }}
        >
          Done
        </Button>
      </Box>
    </Dialog>
  );
};

export default BookingsSheet;
