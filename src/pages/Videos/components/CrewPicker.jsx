import React, { useMemo } from "react";
import { Autocomplete, Box, Chip, TextField } from "@mui/material";

// Select a crew member for a stage. Crew whose skills match the stage's
// suggested skill are floated to the top, but any active member can be picked.
const CrewPicker = ({ crew, skills = [], value, onChange, label = "Assignee", suggestedSkillId }) => {
  const skillName = (id) => skills.find((s) => s.id === id)?.name;

  const options = useMemo(() => {
    const active = crew.filter((c) => c.active !== false);
    if (!suggestedSkillId) return active;
    return [...active].sort((a, b) => {
      const am = (a.skills || []).includes(suggestedSkillId) ? 0 : 1;
      const bm = (b.skills || []).includes(suggestedSkillId) ? 0 : 1;
      return am - bm;
    });
  }, [crew, suggestedSkillId]);

  const selected = options.find((c) => c.id === value) || null;

  return (
    <Autocomplete
      options={options}
      value={selected}
      onChange={(_e, next) => onChange(next ? next.id : null, next ? next.name : null)}
      getOptionLabel={(o) => o.name || ""}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id}>
          <Box sx={{ flexGrow: 1 }}>{option.name}</Box>
          {(option.skills || []).slice(0, 3).map((id) => (
            <Chip key={id} size="small" label={skillName(id)} sx={{ ml: 0.5, backgroundColor: "rgba(37,99,235,0.1)", color: "#1d4ed8" }} />
          ))}
        </Box>
      )}
      renderInput={(params) => <TextField {...params} label={label} />}
      fullWidth
    />
  );
};

export default CrewPicker;
