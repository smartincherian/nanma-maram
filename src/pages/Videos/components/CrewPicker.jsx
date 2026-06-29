import React, { useMemo } from "react";
import { Autocomplete, Box, Stack, TextField, Typography } from "@mui/material";

const hasAnySkill = (member, skills) =>
  (member.skills || []).some((s) => skills.includes(s));

// Select a crew member for a step. When the step maps to skill(s)
// (relevantSkills), only crew who have one of those skills are shown — skills
// aren't listed since every option already qualifies. A step with no mapped
// skill shows everyone. Crew who marked themselves not-available are hidden
// entirely. Free crew come first; those already occupied show an orange dot and
// a small badge with how many open works they currently hold.
const CrewPicker = ({ crew, value, onChange, label = "Assignee", relevantSkills = [], workCounts = {} }) => {
  const options = useMemo(() => {
    // Inactive crew are soft-deleted; not-available crew opt out — neither is shown.
    // The already-assigned member is kept regardless, so the field still shows them.
    const assignable = crew.filter(
      (c) => c.id === value || (c.active !== false && c.available !== false)
    );
    const filtered =
      relevantSkills.length > 0
        ? assignable.filter((c) => c.id === value || hasAnySkill(c, relevantSkills))
        : assignable;
    // Free crew first, then by current load, then by name — keeps the best picks at the top.
    return filtered.sort((a, b) => {
      const aLoad = workCounts[a.id] || 0;
      const bLoad = workCounts[b.id] || 0;
      if (aLoad !== bLoad) return aLoad - bLoad;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [crew, relevantSkills, workCounts, value]);

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
        const load = workCounts[option.id] || 0;
        const occupied = load > 0;
        return (
          <Box component="li" key={key} {...liProps} sx={{ display: "block !important", py: 0.75, px: 1.5 }}>
            <Stack direction="row" alignItems="center" gap={1.25} sx={{ flexWrap: "nowrap" }}>
              {/* Presence dot — green when free, orange when occupied */}
              <Box
                aria-label={occupied ? `Occupied (${load} ${load === 1 ? "task" : "tasks"})` : "Free"}
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  flexShrink: 0,
                  backgroundColor: occupied ? "#ed6c02" : "#2e9e5b",
                }}
              />
              <Typography noWrap sx={{ fontWeight: 600, color: "#3b2a13", flexGrow: 1, minWidth: 0 }}>
                {option.name}
              </Typography>
              {occupied ? (
                <Box
                  aria-hidden
                  sx={{
                    flexShrink: 0,
                    px: 0.85,
                    height: 20,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.4,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    lineHeight: 1,
                    color: "#ed6c02",
                    backgroundColor: "#ed6c021f",
                  }}
                >
                  {load} {load === 1 ? "task" : "tasks"}
                </Box>
              ) : null}
            </Stack>
          </Box>
        );
      }}
      renderInput={(params) => <TextField {...params} label={label} placeholder="Search crew…" />}
      fullWidth
      slotProps={{
        // A rounded, raised card that sits just below the input — not flush
        // against it — so the dropdown reads as its own surface on mobile.
        popper: { modifiers: [{ name: "offset", options: { offset: [0, 6] } }] },
        paper: {
          elevation: 0,
          sx: {
            borderRadius: 3,
            border: "1px solid rgba(147,81,0,0.14)",
            boxShadow: "0 12px 32px rgba(59,42,19,0.16)",
            overflow: "hidden",
            "& .MuiAutocomplete-listbox": {
              maxHeight: { xs: "50vh", sm: 320 },
              py: 0.5,
              "& .MuiAutocomplete-option": {
                borderRadius: 2,
                mx: 0.5,
                "&.Mui-focused, &[aria-selected='true']": {
                  backgroundColor: "rgba(147,81,0,0.08)",
                },
              },
            },
          },
        },
      }}
    />
  );
};

export default CrewPicker;
