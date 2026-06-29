import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  ListSubheader,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import CheckBoxRoundedIcon from "@mui/icons-material/CheckBoxRounded";
import CheckBoxOutlineBlankRoundedIcon from "@mui/icons-material/CheckBoxOutlineBlankRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { CREW_SKILL_GROUPS, getCrewSkillLabel } from "../../utils/crewSkills";

// Multi-select for crew skills with checkbox affordance on every item (so it
// reads as multi-select) and a sticky Done button to close the menu. Selected
// items show as removable chips. Shared by register and profile-edit forms.
const SkillsSelect = ({
  value,
  onChange,
  label = "How you'd like to serve",
  placeholder = "Choose how you'll serve",
}) => {
  const [open, setOpen] = useState(false);
  return (
  <Box>
    <Typography variant="body2" sx={{ color: "#5b6472", fontWeight: 600, mb: 0.25 }}>
      {label}
    </Typography>
    <Typography variant="caption" sx={{ color: "#8a6a36", display: "block", mb: 0.75 }}>
      Pick all that apply, then tap Done.
    </Typography>
    <Select
      multiple
      displayEmpty
      fullWidth
      size="small"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
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
                label={getCrewSkillLabel(s)}
                size="small"
                onDelete={() => onChange(value.filter((x) => x !== s))}
                deleteIcon={
                  <CancelRoundedIcon
                    aria-label={`Remove ${getCrewSkillLabel(s)}`}
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
      {[
        ...CREW_SKILL_GROUPS.flatMap((group, groupIndex) => [
          groupIndex > 0 ? <Divider key={`${group.label}-divider`} sx={{ my: 0.5 }} /> : null,
          <ListSubheader
            key={`${group.label}-header`}
            sx={{
              color: "#935100",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.12em",
              lineHeight: 2.4,
              textTransform: "uppercase",
            }}
          >
            {group.label}
          </ListSubheader>,
          ...group.skills.map((skill) => {
            const checked = value.includes(skill.value);
            return (
              <MenuItem
                key={skill.value}
                value={skill.value}
                sx={{
                  borderRadius: 1.5,
                  mx: 0.5,
                  my: 0.25,
                  "&.Mui-selected": { backgroundColor: "rgba(46, 125, 50, 0.10)" },
                  "&.Mui-selected:hover": { backgroundColor: "rgba(46, 125, 50, 0.16)" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 1 }}>
                  {checked ? (
                    <CheckBoxRoundedIcon fontSize="small" sx={{ color: "#2e7d32" }} />
                  ) : (
                    <CheckBoxOutlineBlankRoundedIcon fontSize="small" sx={{ color: "#b0b6bd" }} />
                  )}
                  <Typography sx={{ fontWeight: checked ? 700 : 400, color: checked ? "#2e7d32" : "#3b2a13" }}>
                    {skill.label}
                  </Typography>
                </Box>
              </MenuItem>
            );
          }),
        ]),
        <Box
          key="skills-done-footer"
          onMouseDown={(e) => e.stopPropagation()}
          sx={{
            position: "sticky",
            bottom: 0,
            backgroundColor: "#fff",
            borderTop: "1px solid #eee",
            p: 1,
            mt: 0.5,
          }}
        >
          <Button
            fullWidth
            variant="contained"
            disableElevation
            onClick={() => setOpen(false)}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              backgroundColor: "#2e7d32",
              "&:hover": { backgroundColor: "#1b5e20" },
            }}
          >
            Done{value.length > 0 ? ` (${value.length} selected)` : ""}
          </Button>
        </Box>,
      ]}
    </Select>
  </Box>
  );
};

export default SkillsSelect;
