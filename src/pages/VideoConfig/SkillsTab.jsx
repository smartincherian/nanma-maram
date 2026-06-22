import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
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
import { addSkill, deleteSkill, listSkills, updateSkill } from "../../firebase/video/skills";
import { amberButtonSx, cardSx } from "../Videos/ui";

const SkillsTab = () => {
  const { showSnackbar } = useContext(SnackbarContext);
  const [skills, setSkills] = useState([]);
  const [dialog, setDialog] = useState(null); // { id?, name }
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = async () => {
    try {
      setSkills(await listSkills());
    } catch (e) {
      showSnackbar("Could not load skills.", SNACK_BAR_SEVERITY_TYPES.ERROR);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    const name = (dialog.name || "").trim();
    if (!name) return;
    setSaving(true);
    try {
      if (dialog.id) {
        await updateSkill(dialog.id, { name });
      } else {
        await addSkill({ name });
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
      await deleteSkill(deleteTarget.id);
    } catch (e) {
      showSnackbar("Could not delete.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    setDeleteTarget(null);
    await reload();
    showSnackbar("Skill removed", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography sx={{ color: "#5b6472" }}>Types of work crew can do.</Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog({ name: "" })} sx={amberButtonSx}>
          Add skill
        </Button>
      </Stack>

      <Stack spacing={1.5}>
        {skills.length === 0 ? <Typography sx={{ color: "#8a6a36" }}>No skills yet.</Typography> : null}
        {skills.map((skill) => (
          <Paper key={skill.id} elevation={0} sx={{ ...cardSx, display: "flex", alignItems: "center", gap: 2 }}>
            <Typography sx={{ flexGrow: 1, fontWeight: 700, color: "#3b2a13" }}>{skill.name}</Typography>
            <IconButton aria-label={`Edit ${skill.name}`} onClick={() => setDialog({ id: skill.id, name: skill.name })} sx={{ color: "#935100" }}>
              <EditRoundedIcon />
            </IconButton>
            <IconButton aria-label={`Delete ${skill.name}`} onClick={() => setDeleteTarget(skill)} sx={{ color: "#b3261e" }}>
              <DeleteOutlineRoundedIcon />
            </IconButton>
          </Paper>
        ))}
      </Stack>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{dialog?.id ? "Edit skill" : "Add skill"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Skill name"
            value={dialog?.name || ""}
            onChange={(e) => setDialog((d) => ({ ...d, name: e.target.value }))}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !(dialog?.name || "").trim()} sx={amberButtonSx}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Remove skill?</DialogTitle>
        <DialogContent>
          <DialogContentText>{deleteTarget ? `"${deleteTarget.name}" will be removed.` : ""}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ textTransform: "none", fontWeight: 700 }}>Confirm delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SkillsTab;
