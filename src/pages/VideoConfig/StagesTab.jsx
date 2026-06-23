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
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import {
  addStage,
  deleteStage,
  listStages,
  reorderStages,
  updateStage,
} from "../../firebase/video/stages";
import { amberButtonSx, cardSx } from "../Videos/ui";

const StagesTab = () => {
  const { showSnackbar } = useContext(SnackbarContext);
  const [stages, setStages] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = async () => {
    try {
      setStages(await listStages());
    } catch (e) {
      showSnackbar("Could not load stages.", SNACK_BAR_SEVERITY_TYPES.ERROR);
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
        await updateStage(dialog.id, { name });
      } else {
        await addStage({ name });
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
      await deleteStage(deleteTarget.id);
    } catch (e) {
      showSnackbar("Could not delete.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    setDeleteTarget(null);
    await reload();
    showSnackbar("Step removed", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
  };

  const move = async (index, delta) => {
    const next = [...stages];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setStages(next); // optimistic
    try {
      await reorderStages(next.map((s) => s.id));
    } catch (e) {
      showSnackbar("Could not reorder.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      reload();
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography sx={{ color: "#5b6472" }}>The steps every video goes through, in order.</Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog({ name: "" })} sx={amberButtonSx}>
          Add step
        </Button>
      </Stack>

      <Stack spacing={1.5}>
        {stages.length === 0 ? <Typography sx={{ color: "#8a6a36" }}>No steps yet.</Typography> : null}
        {stages.map((stage, index) => (
          <Paper key={stage.id} elevation={0} sx={{ ...cardSx, display: "flex", alignItems: "center", gap: 1 }}>
            <Stack>
              <IconButton size="small" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${stage.name} up`}>
                <KeyboardArrowUpRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" disabled={index === stages.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${stage.name} down`}>
                <KeyboardArrowDownRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Typography sx={{ flexGrow: 1, fontWeight: 700, color: "#3b2a13" }}>
              {index + 1}. {stage.name}
            </Typography>
            <IconButton aria-label={`Edit ${stage.name}`} onClick={() => setDialog({ id: stage.id, name: stage.name })} sx={{ color: "#935100" }}>
              <EditRoundedIcon />
            </IconButton>
            <IconButton aria-label={`Delete ${stage.name}`} onClick={() => setDeleteTarget(stage)} sx={{ color: "#b3261e" }}>
              <DeleteOutlineRoundedIcon />
            </IconButton>
          </Paper>
        ))}
      </Stack>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{dialog?.id ? "Edit step" : "Add step"}</DialogTitle>
        <DialogContent>
          <TextField autoFocus label="Step name" value={dialog?.name || ""} onChange={(e) => setDialog((d) => ({ ...d, name: e.target.value }))} fullWidth sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !(dialog?.name || "").trim()} sx={amberButtonSx}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Remove step?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget ? `"${deleteTarget.name}" will be removed. Existing videos keep their own steps.` : ""}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ textTransform: "none", fontWeight: 700 }}>Confirm delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StagesTab;
