import React from "react";
import {
  Box,
  Button,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { MARIAN } from "../../utils/chapelTheme";

// Saved-name bar with a "My name / Book for others" toggle.
//   - "self":   book in one tap using the saved name (add / edit / delete here)
//   - "others": each slot tap opens a fresh form to enter someone else's details
const ProfileBar = ({
  name,
  showBookForOthers,
  bookFor,
  onBookForChange,
  onAdd,
  onEdit,
  onDelete,
}) => {
  // "Book for others" is a leader-only tool (/power pages). Elsewhere the
  // toggle is hidden and only the saved-name bar shows.
  const others = showBookForOthers && bookFor === "others";

  return (
    <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 1.5 }}>
      {showBookForOthers ? (
        <ToggleButtonGroup
          value={bookFor}
          exclusive
          fullWidth
          size="small"
          onChange={(_, value) => value && onBookForChange(value)}
          sx={{
            mb: 1.25,
            "& .MuiToggleButton-root": {
              textTransform: "none",
              fontWeight: 700,
              color: MARIAN.inkSoft,
              borderColor: MARIAN.border,
              py: 0.6,
              gap: 0.75,
              "&.Mui-selected": {
                color: MARIAN.white,
                background: MARIAN.blue,
                "&:hover": { background: MARIAN.deep },
              },
            },
          }}
        >
          <ToggleButton value="self">
            <PersonRoundedIcon sx={{ fontSize: 18 }} />
            My name
          </ToggleButton>
          <ToggleButton value="others">
            <GroupAddRoundedIcon sx={{ fontSize: 18 }} />
            Book for others
          </ToggleButton>
        </ToggleButtonGroup>
      ) : null}

      {others ? (
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            background: MARIAN.skySoft,
            border: `1px solid ${MARIAN.border}`,
          }}
        >
          <Typography variant="body2" sx={{ color: MARIAN.inkSoft }}>
            Tap a slot, then enter that person's name and details. Your own saved
            name stays untouched.
          </Typography>
        </Box>
      ) : !name ? (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<PersonAddAlt1RoundedIcon />}
          onClick={onAdd}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            py: 1,
            borderColor: MARIAN.border,
            color: MARIAN.blue,
            background: MARIAN.skySoft,
            "&:hover": {
              borderColor: MARIAN.blue,
              background: MARIAN.sky,
            },
          }}
        >
          Add your name to book faster
        </Button>
      ) : (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            background: MARIAN.sky,
            border: `1px solid ${MARIAN.border}`,
          }}
        >
          <PersonRoundedIcon sx={{ color: MARIAN.blue }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{ color: MARIAN.inkSoft, display: "block" }}
            >
              Booking as
            </Typography>
            <Typography sx={{ fontWeight: 700, color: MARIAN.deep }} noWrap>
              {name}
            </Typography>
          </Box>
          <Tooltip title="Edit name">
            <IconButton
              size="small"
              onClick={onEdit}
              sx={{ color: MARIAN.blue }}
            >
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove saved name">
            <IconButton size="small" color="error" onClick={onDelete}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Box>
  );
};

export default ProfileBar;
