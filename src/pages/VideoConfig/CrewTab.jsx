import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { addCrew, deleteCrew, listCrew, updateCrew } from "../../firebase/video/crew";
import { listOccupiedAssigneeIds } from "../../firebase/video/works";
import { getCrewSkillLabel } from "../../utils/crewSkills";
import SkillsSelect from "../../components/SkillsSelect";
import { amberButtonSx, cardSx } from "../Videos/ui";

const EMPTY = { name: "", active: true, skills: [] };

// Shared bottom-sheet chrome — rounded top, centered on wider screens.
const sheetPaperSx = {
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  maxWidth: 600,
  width: "100%",
  mx: "auto",
  px: { xs: 2, sm: 3 },
  pt: 1.5,
  pb: 3,
  background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(252,248,242,0.99) 100%)",
};

const SheetHandle = () => (
  <Box sx={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(160,103,38,0.3)", mx: "auto", mb: 1.5 }} />
);

// Three-state availability used across the dot, the chip and the legend.
//   unavailable → red, occupied → orange, free (available, no open work) → green.
const STATUS = {
  unavailable: { color: "#d32f2f", label: "Not available" },
  occupied: { color: "#ed6c02", label: "Available · occupied" },
  free: { color: "#2e9e5b", label: "Available · free" },
};

const memberStatusKey = (member, occupiedIds) => {
  if (member.available === false) return "unavailable";
  return occupiedIds.has(member.id) ? "occupied" : "free";
};

const availabilityChipSx = (statusKey) => {
  const color = STATUS[statusKey].color;
  return {
    fontWeight: 700,
    backgroundColor: `${color}22`,
    color,
  };
};

const CrewTab = () => {
  const { showSnackbar } = useContext(SnackbarContext);
  const [crew, setCrew] = useState([]);
  const [occupiedIds, setOccupiedIds] = useState(() => new Set());
  const [statusFilter, setStatusFilter] = useState(null); // one status key, or null = all
  const [skillFilter, setSkillFilter] = useState([]); // skill values; empty = all
  const [dialog, setDialog] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = async () => {
    try {
      // Soft-deleted (inactive) crew are hidden from the management list.
      const [all, occupied] = await Promise.all([listCrew(), listOccupiedAssigneeIds()]);
      setCrew(all.filter((m) => m.active !== false));
      setOccupiedIds(occupied);
    } catch (e) {
      showSnackbar("Could not load crew.", SNACK_BAR_SEVERITY_TYPES.ERROR);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDialog = (member) =>
    setDialog(
      member
        ? { id: member.id, name: member.name, active: member.active !== false, skills: member.skills || [] }
        : { ...EMPTY }
    );

  const handleEditFromView = () => {
    const member = viewTarget;
    setViewTarget(null);
    openDialog(member);
  };

  const handleSave = async () => {
    const name = (dialog.name || "").trim();
    if (!name) return;
    setSaving(true);
    try {
      const existing = crew.find((m) => m.id === dialog.id) || {};
      const skills = dialog.skills || [];
      const payload = dialog.id
        ? { name, active: dialog.active, skills, email: existing.email || existing.linkedEmail || "", phone: existing.phone || "" }
        : { name, active: dialog.active, skills };
      if (dialog.id) {
        await updateCrew(dialog.id, payload);
      } else {
        await addCrew(payload);
      }
    } catch (e) {
      showSnackbar(e?.message || "Could not save.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setSaving(false);
      return;
    }
    await reload();
    setSaving(false);
    setDialog(null);
    showSnackbar("Saved", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
  };

  const handleDelete = async () => {
    try {
      await deleteCrew(deleteTarget.id);
    } catch (e) {
      showSnackbar("Could not delete.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    setDeleteTarget(null);
    await reload();
    showSnackbar("Crew member removed", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
  };

  // Single-select status: tapping the active chip clears it.
  const toggleStatus = (key) => setStatusFilter((cur) => (cur === key ? null : key));

  // Filters combine with AND; a null/empty filter means "no constraint".
  // Skill match is ANY-of-selected (e.g. "show everyone who can edit").
  const filtered = useMemo(
    () =>
      crew.filter((m) => {
        if (statusFilter && statusFilter !== memberStatusKey(m, occupiedIds)) return false;
        if (skillFilter.length && !(m.skills || []).some((s) => skillFilter.includes(s))) return false;
        return true;
      }),
    [crew, occupiedIds, statusFilter, skillFilter]
  );

  return (
    <Box>
      {/* Filter bar — the colour chips double as the dot legend. Tap to filter
          by status; the skill picker narrows by what a member can do. */}
      {crew.length > 0 ? (
        <Box sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 1.25 }}>
            <Chip
              size="small"
              clickable
              onClick={() => setStatusFilter(null)}
              label="All"
              sx={{
                fontWeight: 700,
                backgroundColor: statusFilter === null ? "#935100" : "#9351001f",
                color: statusFilter === null ? "#fff" : "#935100",
                "&:hover": { backgroundColor: statusFilter === null ? "#935100" : "#93510033" },
              }}
            />
            {Object.entries(STATUS).map(([key, s]) => {
              const on = statusFilter === key;
              return (
                <Chip
                  key={key}
                  size="small"
                  clickable
                  onClick={() => toggleStatus(key)}
                  icon={<Box sx={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: on ? "#fff" : s.color, ml: 1 }} />}
                  label={s.label}
                  sx={{
                    fontWeight: 700,
                    backgroundColor: on ? s.color : `${s.color}1f`,
                    color: on ? "#fff" : s.color,
                    "&:hover": { backgroundColor: on ? s.color : `${s.color}33` },
                  }}
                />
              );
            })}
          </Stack>
          <SkillsSelect
            label="Filter by skill"
            placeholder="Any skill"
            value={skillFilter}
            onChange={setSkillFilter}
          />
          <Typography sx={{ fontSize: "0.75rem", color: "#8a6a36", mt: 1 }}>
            Showing {filtered.length} of {crew.length}
          </Typography>
        </Box>
      ) : null}

      <Stack spacing={1.25}>
        {crew.length === 0 ? <Typography sx={{ color: "#8a6a36" }}>No crew yet. Tap “New” to add the team.</Typography> : null}
        {crew.length > 0 && filtered.length === 0 ? (
          <Typography sx={{ color: "#8a6a36" }}>No crew match these filters.</Typography>
        ) : null}
        {filtered.map((member) => {
          const statusKey = memberStatusKey(member, occupiedIds);
          return (
          <Paper key={member.id} elevation={0} sx={{ ...cardSx, display: "flex", alignItems: "center", gap: 0.5 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box
                aria-label={STATUS[statusKey].label}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  flexShrink: 0,
                  backgroundColor: STATUS[statusKey].color,
                }}
              />
              <Typography noWrap sx={{ fontWeight: 700, color: "#3b2a13" }}>{member.name}</Typography>
            </Stack>
            <IconButton aria-label={`View ${member.name}`} onClick={() => setViewTarget(member)} sx={{ color: "#5b6472" }}><VisibilityRoundedIcon /></IconButton>
            <IconButton aria-label={`Edit ${member.name}`} onClick={() => openDialog(member)} sx={{ color: "#935100" }}><EditRoundedIcon /></IconButton>
            <IconButton aria-label={`Delete ${member.name}`} onClick={() => setDeleteTarget(member)} sx={{ color: "#b3261e" }}><DeleteOutlineRoundedIcon /></IconButton>
          </Paper>
          );
        })}
      </Stack>

      {/* Floating New button — matches the Videos dashboard. */}
      <Button
        variant="contained"
        startIcon={<AddRoundedIcon />}
        onClick={() => openDialog(null)}
        sx={{
          ...amberButtonSx,
          position: "fixed",
          bottom: { xs: 20, sm: 32 },
          right: { xs: 20, sm: 32 },
          py: 1.25,
          px: 2.5,
          boxShadow: "0 10px 24px rgba(147,81,0,0.35)",
          zIndex: 10,
        }}
      >
        New
      </Button>

      {/* View bottom sheet — read-only details. */}
      <Drawer anchor="bottom" open={viewTarget !== null} onClose={() => setViewTarget(null)} PaperProps={{ sx: sheetPaperSx }}>
        <SheetHandle />
        {viewTarget ? (
          <Stack spacing={1.75}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Typography sx={{ fontWeight: 800, color: "#3b2a13", fontSize: "1.25rem" }}>{viewTarget.name}</Typography>
              <Chip size="small" label={STATUS[memberStatusKey(viewTarget, occupiedIds)].label} sx={availabilityChipSx(memberStatusKey(viewTarget, occupiedIds))} />
            </Stack>

            <Divider />

            {(viewTarget.email || viewTarget.linkedEmail) ? (
              <Box>
                <Typography variant="caption" sx={{ color: "#8a6a36", fontWeight: 700, letterSpacing: 0.3 }}>EMAIL</Typography>
                <Typography sx={{ color: "#3b2a13", overflowWrap: "anywhere" }}>{viewTarget.email || viewTarget.linkedEmail}</Typography>
              </Box>
            ) : null}
            {viewTarget.phone ? (
              <Box>
                <Typography variant="caption" sx={{ color: "#8a6a36", fontWeight: 700, letterSpacing: 0.3 }}>PHONE</Typography>
                <Typography sx={{ color: "#3b2a13", overflowWrap: "anywhere" }}>{viewTarget.phone}</Typography>
              </Box>
            ) : null}

            <Box>
              <Typography variant="caption" sx={{ color: "#8a6a36", fontWeight: 700, letterSpacing: 0.3 }}>SKILLS</Typography>
              {(viewTarget.skills || []).length > 0 ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                  {viewTarget.skills.map((s) => (
                    <Chip key={s} size="small" label={getCrewSkillLabel(s)} sx={{ backgroundColor: "rgba(147,81,0,0.10)", color: "#935100" }} />
                  ))}
                </Box>
              ) : (
                <Typography sx={{ color: "#8a6a36" }}>No skills set.</Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 0.5 }}>
              <Button onClick={() => setViewTarget(null)} sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600 }}>Close</Button>
              <Button variant="contained" startIcon={<EditRoundedIcon />} onClick={handleEditFromView} sx={amberButtonSx}>Edit</Button>
            </Stack>
          </Stack>
        ) : null}
      </Drawer>

      {/* Add / edit bottom sheet — Active toggle lives here. */}
      <Drawer anchor="bottom" open={dialog !== null} onClose={() => setDialog(null)} PaperProps={{ sx: sheetPaperSx }}>
        <SheetHandle />
        <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#3b2a13", mb: 2 }}>{dialog?.id ? "Edit crew member" : "Add crew member"}</Typography>
        <Stack spacing={2}>
          <TextField label="Name" value={dialog?.name || ""} onChange={(e) => setDialog((d) => ({ ...d, name: e.target.value }))} fullWidth required autoFocus />
          <SkillsSelect
            label="Skills"
            placeholder="Choose what they can do"
            value={dialog?.skills || []}
            onChange={(skills) => setDialog((d) => ({ ...d, skills }))}
          />
        </Stack>
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button onClick={() => setDialog(null)} sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !(dialog?.name || "").trim()} sx={amberButtonSx}>Save</Button>
        </Stack>
      </Drawer>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Remove crew member?</DialogTitle>
        <DialogContent>
          <DialogContentText>{deleteTarget ? `${deleteTarget.name} will no longer be assignable. Existing assignments keep their name.` : ""}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ textTransform: "none", fontWeight: 700 }}>Confirm delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CrewTab;
