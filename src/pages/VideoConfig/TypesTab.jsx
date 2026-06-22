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
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { addType, deleteType, listTypes, updateType } from "../../firebase/video/types";
import { listStages } from "../../firebase/video/stages";
import { amberButtonSx, cardSx } from "../Videos/ui";

const TypesTab = () => {
  const { showSnackbar } = useContext(SnackbarContext);
  const [types, setTypes] = useState([]);
  const [stages, setStages] = useState([]);
  const [dialog, setDialog] = useState(null); // { id?, name, stageIds: [] }
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addStageId, setAddStageId] = useState("");

  const stagesById = Object.fromEntries(stages.map((s) => [s.id, s]));

  const reload = async () => {
    try {
      const [t, s] = await Promise.all([listTypes(), listStages()]);
      setTypes(t);
      setStages(s);
    } catch (e) {
      showSnackbar("Could not load types.", SNACK_BAR_SEVERITY_TYPES.ERROR);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDialog = (type) =>
    setDialog(type ? { id: type.id, name: type.name, stageIds: [...(type.stageIds || [])] } : { name: "", stageIds: [] });

  const handleSave = async () => {
    const name = (dialog.name || "").trim();
    if (!name) return;
    setSaving(true);
    try {
      const payload = { name, stageIds: dialog.stageIds };
      if (dialog.id) {
        await updateType(dialog.id, payload);
      } else {
        await addType(payload);
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
      await deleteType(deleteTarget.id);
    } catch (e) {
      showSnackbar("Could not delete.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    setDeleteTarget(null);
    await reload();
    showSnackbar("Type removed", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
  };

  const moveStage = (index, delta) =>
    setDialog((d) => {
      const ids = [...d.stageIds];
      const target = index + delta;
      if (target < 0 || target >= ids.length) return d;
      [ids[index], ids[target]] = [ids[target], ids[index]];
      return { ...d, stageIds: ids };
    });

  const removeStage = (id) =>
    setDialog((d) => ({ ...d, stageIds: d.stageIds.filter((s) => s !== id) }));

  const addStageToType = () => {
    if (!addStageId) return;
    setDialog((d) => (d.stageIds.includes(addStageId) ? d : { ...d, stageIds: [...d.stageIds, addStageId] }));
    setAddStageId("");
  };

  const availableStages = dialog ? stages.filter((s) => !dialog.stageIds.includes(s.id)) : [];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography sx={{ color: "#5b6472" }}>Each type defines an ordered pipeline of stages.</Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => openDialog(null)} sx={amberButtonSx}>
          Add type
        </Button>
      </Stack>

      <Stack spacing={1.5}>
        {types.length === 0 ? <Typography sx={{ color: "#8a6a36" }}>No types yet.</Typography> : null}
        {types.map((type) => (
          <Paper key={type.id} elevation={0} sx={{ ...cardSx }}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={{ flexGrow: 1, fontWeight: 800, color: "#3b2a13" }}>{type.name}</Typography>
              <IconButton aria-label={`Edit ${type.name}`} onClick={() => openDialog(type)} sx={{ color: "#935100" }}>
                <EditRoundedIcon />
              </IconButton>
              <IconButton aria-label={`Delete ${type.name}`} onClick={() => setDeleteTarget(type)} sx={{ color: "#b3261e" }}>
                <DeleteOutlineRoundedIcon />
              </IconButton>
            </Stack>
            <Stack direction="row" gap={0.75} sx={{ flexWrap: "wrap", mt: 1 }}>
              {(type.stageIds || []).length === 0 ? (
                <Typography sx={{ color: "#b3261e", fontSize: "0.85rem" }}>No stages set</Typography>
              ) : (
                (type.stageIds || []).map((id, i) => (
                  <Chip key={id} size="small" label={`${i + 1}. ${stagesById[id]?.name || "—"}`}
                    sx={{ backgroundColor: "rgba(214, 123, 31, 0.12)", color: "#8a4b00", fontWeight: 600 }} />
                ))
              )}
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>{dialog?.id ? "Edit type" : "Add type"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Type name" value={dialog?.name || ""} onChange={(e) => setDialog((d) => ({ ...d, name: e.target.value }))} fullWidth />
            <Divider textAlign="left" sx={{ color: "#8a6a36", fontWeight: 700 }}>Pipeline stages</Divider>

            <Stack spacing={1}>
              {(dialog?.stageIds || []).length === 0 ? (
                <Typography sx={{ color: "#8a6a36", fontSize: "0.9rem" }}>No stages added yet.</Typography>
              ) : null}
              {(dialog?.stageIds || []).map((id, index) => (
                <Paper key={id} elevation={0} sx={{ p: 1, borderRadius: 2, border: "1px solid rgba(160,103,38,0.16)", display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography sx={{ flexGrow: 1, fontWeight: 600, color: "#3b2a13", pl: 1 }}>{index + 1}. {stagesById[id]?.name || "—"}</Typography>
                  <IconButton size="small" disabled={index === 0} onClick={() => moveStage(index, -1)} aria-label="Move up"><KeyboardArrowUpRoundedIcon fontSize="small" /></IconButton>
                  <IconButton size="small" disabled={index === dialog.stageIds.length - 1} onClick={() => moveStage(index, 1)} aria-label="Move down"><KeyboardArrowDownRoundedIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => removeStage(id)} aria-label="Remove" sx={{ color: "#b3261e" }}><CloseRoundedIcon fontSize="small" /></IconButton>
                </Paper>
              ))}
            </Stack>

            {availableStages.length > 0 ? (
              <Stack direction="row" gap={1}>
                <Select size="small" displayEmpty value={addStageId} onChange={(e) => setAddStageId(e.target.value)} sx={{ flexGrow: 1 }}>
                  <MenuItem value="" disabled>Add a stage…</MenuItem>
                  {availableStages.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
                <Button variant="outlined" onClick={addStageToType} disabled={!addStageId} sx={{ textTransform: "none", fontWeight: 700, borderColor: "rgba(147,81,0,0.5)", color: "#935100" }}>Add</Button>
              </Stack>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !(dialog?.name || "").trim()} sx={amberButtonSx}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Remove type?</DialogTitle>
        <DialogContent>
          <DialogContentText>{deleteTarget ? `"${deleteTarget.name}" will be removed. Existing videos are unaffected.` : ""}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ textTransform: "none", fontWeight: 700 }}>Confirm delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TypesTab;
