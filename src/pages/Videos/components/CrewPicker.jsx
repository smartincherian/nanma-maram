import React, { useMemo } from "react";
import { Autocomplete, TextField } from "@mui/material";

// Select an active crew member for a step.
const CrewPicker = ({ crew, value, onChange, label = "Assignee" }) => {
  const options = useMemo(() => crew.filter((c) => c.active !== false), [crew]);
  const selected = options.find((c) => c.id === value) || null;

  return (
    <Autocomplete
      options={options}
      value={selected}
      onChange={(_e, next) => onChange(next ? next.id : null, next ? next.name : null)}
      getOptionLabel={(o) => o.name || ""}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      renderInput={(params) => <TextField {...params} label={label} />}
      fullWidth
    />
  );
};

export default CrewPicker;
