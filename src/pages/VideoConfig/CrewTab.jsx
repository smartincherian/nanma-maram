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
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { addCrew, deleteCrew, listCrew, setCrewActive, updateCrew } from "../../firebase/video/crew";
import { amberButtonSx, cardSx } from "../Videos/ui";

const EMPTY = { name: "", active: true };

const CrewTab = () => {
  const { showSnackbar } = useContext(SnackbarContext);
  const [crew, setCrew] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = async () => {
    try {
      setCrew(await listCrew());
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
        ? { id: member.id, name: member.name, active: member.active !== false }
        : { ...EMPTY }
    );

  const handleSave = async () => {
    const name = (dialog.name || "").trim();
    if (!name) return;
    setSaving(true);
    try {
      const existing = crew.find((m) => m.id === dialog.id) || {};
      const payload = dialog.id
        ? { name, active: dialog.active, skills: existing.skills || [], email: existing.email || existing.linkedEmail || "", phone: existing.phone || "" }
        : { name, active: dialog.active };
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

  const handleToggleActive = async (member) => {
    try {
      await setCrewActive(member.id, member.active === false);
    } catch (e) {
      showSnackbar("Could not update.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    await reload();
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography sx={{ color: "#5b6472" }}>People who do the work.</Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => openDialog(null)} sx={amberButtonSx}>
          Add crew
        </Button>
      </Stack>

      <Stack spacing={1.25}>
        {crew.length === 0 ? <Typography sx={{ color: "#8a6a36" }}>No crew yet. Tap “Add crew” to add the team.</Typography> : null}
        {crew.map((member) => (
          <Paper key={member.id} elevation={0} sx={{ ...cardSx, display: "flex", alignItems: "center", gap: 1, opacity: member.active === false ? 0.55 : 1 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: "#3b2a13" }}>{member.name}</Typography>
              {(member.email || member.linkedEmail) ? <Typography variant="body2" sx={{ color: "#5b6472" }}>{member.email || member.linkedEmail}</Typography> : null}
              {member.phone ? <Typography variant="body2" sx={{ color: "#5b6472" }}>{member.phone}</Typography> : null}
              {(member.skills || []).length > 0 ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                  {member.skills.map((s) => (
                    <Chip key={s} size="small" label={s} sx={{ backgroundColor: "rgba(147,81,0,0.10)", color: "#935100" }} />
                  ))}
                </Box>
              ) : null}
            </Box>
            <FormControlLabel
              control={<Switch checked={member.active !== false} onChange={() => handleToggleActive(member)} />}
              label={member.active === false ? "Paused" : "Active"}
              sx={{ mr: 0, "& .MuiFormControlLabel-label": { fontSize: 13, color: "#5b6472" } }}
            />
            <IconButton aria-label={`Edit ${member.name}`} onClick={() => openDialog(member)} sx={{ color: "#935100" }}><EditRoundedIcon /></IconButton>
            <IconButton aria-label={`Delete ${member.name}`} onClick={() => setDeleteTarget(member)} sx={{ color: "#b3261e" }}><DeleteOutlineRoundedIcon /></IconButton>
          </Paper>
        ))}
      </Stack>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{dialog?.id ? "Edit crew member" : "Add crew member"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={dialog?.name || ""} onChange={(e) => setDialog((d) => ({ ...d, name: e.target.value }))} fullWidth required autoFocus />
            <FormControlLabel control={<Switch checked={dialog?.active !== false} onChange={(e) => setDialog((d) => ({ ...d, active: e.target.checked }))} />} label="Active (assignable)" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !(dialog?.name || "").trim()} sx={amberButtonSx}>Save</Button>
        </DialogActions>
      </Dialog>

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
