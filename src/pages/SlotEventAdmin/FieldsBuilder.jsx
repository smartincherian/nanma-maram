import React from "react";
import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import { FIELD_TYPES } from "../../utils/chapelSlots";
import { MARIAN } from "../../utils/chapelTheme";

export const makeField = (overrides = {}) => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  type: "text",
  required: false,
  isDisplayName: false,
  locked: false,
  ...overrides,
});

// The Name field is always present, always the display name, always required,
// and cannot be removed, reordered, or retyped.
export const makeNameField = () =>
  makeField({
    label: "Name",
    type: "text",
    required: true,
    isDisplayName: true,
    locked: true,
  });

const FieldsBuilder = ({ fields, onChange }) => {
  const update = (id, patch) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const remove = (id) => onChange(fields.filter((f) => f.id !== id));

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    if (fields[index].locked || fields[target].locked) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () => onChange([...fields, makeField()]);

  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontWeight: 700, color: MARIAN.ink }}>
        Booking form fields
      </Typography>
      <Typography variant="body2" sx={{ color: MARIAN.inkSoft, mt: -0.5 }}>
        Name is always collected and shown in the slot list. Add any extra
        fields you need below.
      </Typography>

      {fields.map((field, index) => (
        <Box
          key={field.id}
          sx={{
            border: `1px solid ${MARIAN.border}`,
            borderRadius: 2.5,
            p: { xs: 1.5, sm: 2 },
            background: field.locked ? MARIAN.sky : MARIAN.skySoft,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ sm: "center" }}
          >
            <TextField
              label="Field label"
              value={field.label}
              onChange={(e) => update(field.id, { label: e.target.value })}
              size="small"
              fullWidth
              disabled={field.locked}
            />
            {field.locked ? (
              <Chip
                label="Name · shown in list"
                size="small"
                sx={{
                  background: MARIAN.goldSoft,
                  color: "#8a6d1f",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              />
            ) : (
              <TextField
                select
                label="Type"
                value={field.type}
                onChange={(e) => update(field.id, { type: e.target.value })}
                size="small"
                sx={{ minWidth: { xs: "100%", sm: 130 } }}
              >
                {FIELD_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type[0].toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>

          {!field.locked ? (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              sx={{ mt: 1 }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.required}
                    onChange={(e) =>
                      update(field.id, { required: e.target.checked })
                    }
                    size="small"
                  />
                }
                label="Required"
              />
              <Stack direction="row">
                <Tooltip title="Move up">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => move(index, -1)}
                      disabled={index <= 1}
                    >
                      <ArrowUpwardRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Move down">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => move(index, 1)}
                      disabled={index === fields.length - 1}
                    >
                      <ArrowDownwardRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Remove field">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => remove(field.id)}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          ) : null}
        </Box>
      ))}

      <FormControlLabel
        sx={{ alignSelf: "flex-start", m: 0 }}
        control={
          <IconButton onClick={add} color="primary">
            <AddRoundedIcon />
          </IconButton>
        }
        label="Add field"
      />
    </Stack>
  );
};

export default FieldsBuilder;
