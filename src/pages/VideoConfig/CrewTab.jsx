import React, { useContext, useEffect, useState } from "react";
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

const availabilityChipSx = (member) => ({
  fontWeight: 700,
  backgroundColor: member.available === false ? "rgba(91,100,114,0.14)" : "rgba(46,125,50,0.14)",
  color: member.available === false ? "#5b6472" : "#2e7d32",
});

const CrewTab = () => {
  const { showSnackbar } = useContext(SnackbarContext);
  const [crew, setCrew] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = async () => {
    try {
      // Soft-deleted (inactive) crew are hidden from the management list.
      const all = await listCrew();
      setCrew(all.filter((m) => m.active !== false));
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

  return (
    <Box>
      <Stack spacing={1.25}>
        {crew.length === 0 ? <Typography sx={{ color: "#8a6a36" }}>No crew yet. Tap “New” to add the team.</Typography> : null}
        {crew.map((member) => (
          <Paper key={member.id} elevation={0} sx={{ ...cardSx, display: "flex", alignItems: "center", gap: 0.5 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box
                aria-label={member.available === false ? "Not available" : "Available"}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  flexShrink: 0,
                  backgroundColor: member.available === false ? "transparent" : "#2e9e5b",
                  border: member.available === false ? "2px solid #b6bcc4" : "none",
                }}
              />
              <Typography noWrap sx={{ fontWeight: 700, color: "#3b2a13" }}>{member.name}</Typography>
            </Stack>
            <IconButton aria-label={`View ${member.name}`} onClick={() => setViewTarget(member)} sx={{ color: "#5b6472" }}><VisibilityRoundedIcon /></IconButton>
            <IconButton aria-label={`Edit ${member.name}`} onClick={() => openDialog(member)} sx={{ color: "#935100" }}><EditRoundedIcon /></IconButton>
            <IconButton aria-label={`Delete ${member.name}`} onClick={() => setDeleteTarget(member)} sx={{ color: "#b3261e" }}><DeleteOutlineRoundedIcon /></IconButton>
          </Paper>
        ))}
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
              <Chip size="small" label={viewTarget.available === false ? "Not available" : "Available"} sx={availabilityChipSx(viewTarget)} />
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
