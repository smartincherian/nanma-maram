import React, { useMemo } from "react";
import { Autocomplete, Box, Stack, TextField, Typography } from "@mui/material";

const hasAnySkill = (member, skills) =>
  (member.skills || []).some((s) => skills.includes(s));

// Select a crew member for a step. When the step maps to skill(s)
// (relevantSkills), only crew who have one of those skills are shown — skills
// aren't listed since every option already qualifies. A step with no mapped
// skill shows everyone. Either way, available crew come first and each row
// shows availability + paused state.
const CrewPicker = ({ crew, value, onChange, label = "Assignee", relevantSkills = [] }) => {
  const options = useMemo(() => {
    // Inactive crew are soft-deleted — never assignable.
    const active = crew.filter((c) => c.active !== false);
    const filtered =
      relevantSkills.length > 0 ? active.filter((c) => hasAnySkill(c, relevantSkills)) : active;
    // Available first, then by name — keeps the likely picks at the top.
    return filtered.sort((a, b) => {
      const aFree = a.available !== false ? 0 : 1;
      const bFree = b.available !== false ? 0 : 1;
      if (aFree !== bFree) return aFree - bFree;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [crew, relevantSkills]);

  const selected = options.find((c) => c.id === value) || null;

  return (
    <Autocomplete
      options={options}
      value={selected}
      onChange={(_e, next) => onChange(next ? next.id : null, next ? next.name : null)}
      getOptionLabel={(o) => o.name || ""}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      noOptionsText={relevantSkills.length > 0 ? "No crew with this skill" : "No crew"}
      renderOption={(props, option) => {
        const { key, ...liProps } = props;
        const unavailable = option.available === false;
        return (
          <Box component="li" key={key} {...liProps} sx={{ display: "block !important", py: 1 }}>
            <Stack direction="row" alignItems="center" gap={1} sx={{ flexWrap: "wrap" }}>
              {/* Presence dot — green when available, hollow grey when not */}
              <Box
                aria-label={unavailable ? "Not available" : "Available"}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  flexShrink: 0,
                  backgroundColor: unavailable ? "transparent" : "#2e9e5b",
                  border: unavailable ? "2px solid #b6bcc4" : "none",
                }}
              />
              <Typography sx={{ fontWeight: 700, color: "#3b2a13" }}>{option.name}</Typography>
            </Stack>
          </Box>
        );
      }}
      renderInput={(params) => <TextField {...params} label={label} placeholder="Search crew…" />}
      fullWidth
      // Keep the dropdown usable on small screens.
      slotProps={{ paper: { sx: { "& .MuiAutocomplete-listbox": { maxHeight: { xs: "50vh", sm: 320 } } } } }}
    />
  );
};

export default CrewPicker;
