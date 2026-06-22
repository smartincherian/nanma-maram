import React, { useMemo, useState } from "react";
import {
  Box,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { computeCrewWorkload } from "../../../utils/videoWorkflow";
import { cardSx } from "../ui";

// Shows each crew member as Busy (with their active assignments) or Free.
const TeamWorkload = ({ videos, crew, skills }) => {
  const [skillFilter, setSkillFilter] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);

  const workload = useMemo(() => computeCrewWorkload(videos, crew), [videos, crew]);

  const visible = workload.filter((m) => {
    if (m.active === false) return false;
    if (skillFilter && !(m.skills || []).includes(skillFilter)) return false;
    if (freeOnly && m.busy) return false;
    return true;
  });

  const busyCount = workload.filter((m) => m.busy && m.active !== false).length;
  const freeCount = workload.filter((m) => !m.busy && m.active !== false).length;

  return (
    <Box>
      <Stack direction="row" gap={1.5} sx={{ mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <Chip label={`${busyCount} busy`} sx={{ backgroundColor: "rgba(214,123,31,0.16)", color: "#8a4b00", fontWeight: 700 }} />
        <Chip label={`${freeCount} free`} sx={{ backgroundColor: "rgba(46,125,50,0.16)", color: "#1b5e20", fontWeight: 700 }} />
        <Box sx={{ flexGrow: 1 }} />
        <Select size="small" displayEmpty value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All skills</MenuItem>
          {skills.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
        </Select>
        <FormControlLabel control={<Switch checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} />} label="Free only" />
      </Stack>

      <Stack spacing={1.5}>
        {visible.length === 0 ? <Typography sx={{ color: "#8a6a36" }}>No crew match this filter.</Typography> : null}
        {visible.map((member) => (
          <Paper key={member.id} elevation={0} sx={{ ...cardSx }}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={{ flexGrow: 1, fontWeight: 800, color: "#3b2a13" }}>{member.name}</Typography>
              <Chip
                size="small"
                label={member.busy ? "Busy" : "Free"}
                sx={{ fontWeight: 700, backgroundColor: member.busy ? "rgba(214,123,31,0.16)" : "rgba(46,125,50,0.16)", color: member.busy ? "#8a4b00" : "#1b5e20" }}
              />
            </Stack>
            {member.busy ? (
              <Stack spacing={0.25} sx={{ mt: 1 }}>
                {member.assignments.map((a, i) => (
                  <Typography key={`${a.videoId}-${i}`} sx={{ color: "#5b6472", fontSize: "0.88rem" }}>
                    {a.stageName} — <strong style={{ color: "#3b2a13" }}>{a.videoTitle}</strong>
                  </Typography>
                ))}
              </Stack>
            ) : null}
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default TeamWorkload;
