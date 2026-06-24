import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { VIDEO_STEPS } from "../../utils/videoSteps";
import { cardSx } from "../Videos/ui";

// The production steps are fixed (hardcoded), so this tab just shows them in
// order — there's nothing to add, edit, or reorder.
const StagesTab = () => (
  <Box>
    <Typography sx={{ color: "#5b6472", mb: 2 }}>
      The fixed steps every video goes through, in order.
    </Typography>

    <Stack spacing={1.5}>
      {VIDEO_STEPS.map((step, index) => (
        <Paper key={step.id} elevation={0} sx={{ ...cardSx, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontWeight: 700, color: "#3b2a13" }}>
            {index + 1}. {step.name}
          </Typography>
        </Paper>
      ))}
    </Stack>
  </Box>
);

export default StagesTab;
