import React from "react";
import { Box, Chip, MenuItem, OutlinedInput, Select, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { CREW_SKILLS } from "../../utils/crewSkills";

// Multi-select for crew skills with green check/highlight on selected items
// and removable chips. Shared by the crew register and profile-edit forms.
const SkillsSelect = ({
  value,
  onChange,
  label = "How you'd like to serve",
  placeholder = "Choose how you'll serve",
}) => (
  <Box>
    <Typography variant="body2" sx={{ color: "#5b6472", fontWeight: 600, mb: 0.5 }}>
      {label}
    </Typography>
    <Select
      multiple
      displayEmpty
      fullWidth
      size="small"
      value={value}
      onChange={(e) =>
        onChange(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)
      }
      input={<OutlinedInput />}
      renderValue={(selected) =>
        selected.length === 0 ? (
          <Typography sx={{ color: "#9aa0a6" }}>{placeholder}</Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.map((s) => (
              <Chip
                key={s}
                label={s}
                size="small"
                onDelete={() => onChange(value.filter((x) => x !== s))}
                deleteIcon={
                  <CancelRoundedIcon
                    aria-label={`Remove ${s}`}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                }
                sx={{
                  backgroundColor: "rgba(46, 125, 50, 0.12)",
                  color: "#2e7d32",
                  fontWeight: 600,
                  "& .MuiChip-deleteIcon": {
                    color: "#2e7d32",
                    "&:hover": { color: "#1b5e20" },
                  },
                }}
              />
            ))}
          </Box>
        )
      }
    >
      {CREW_SKILLS.map((skill) => {
        const checked = value.includes(skill);
        return (
          <MenuItem
            key={skill}
            value={skill}
            sx={{
              borderRadius: 1.5,
              mx: 0.5,
              my: 0.25,
              "&.Mui-selected": { backgroundColor: "rgba(46, 125, 50, 0.10)" },
              "&.Mui-selected:hover": { backgroundColor: "rgba(46, 125, 50, 0.16)" },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1 }}>
              <Typography sx={{ fontWeight: checked ? 700 : 400, color: checked ? "#2e7d32" : "#3b2a13" }}>
                {skill}
              </Typography>
              {checked ? <CheckRoundedIcon fontSize="small" sx={{ color: "#2e7d32" }} /> : null}
            </Box>
          </MenuItem>
        );
      })}
    </Select>
  </Box>
);

export default SkillsSelect;
