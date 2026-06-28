import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../../components/AuthProvider";
import {
  createOrg,
  getOrgById,
  listOrgs,
  updateOrg,
} from "../../firebase/org/orgs";
import { addIntention, updateIntention } from "../../firebase/intention/add";
import { listOrgIntentions } from "../../firebase/intention/get";
import TextBlock from "./TextBlock";
import {
  SNACK_BAR_SEVERITY_TYPES,
  SnackbarContext,
} from "../../components/Snackbar";

const EMPTY_BLOCK = () => ({
  id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  text: "",
  variant: "paragraph",
  color: "#311b45",
  fontSize: "1rem",
  weight: 500,
  align: "center",
});

const EMPTY_ORG = {
  slug: "",
  name: "",
  adminCode: "",
  primaryColor: "#4a148c",
  textBlocks: [],
};

const OrgManage = () => {
  const { isSuperAdmin, loading } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);
  const [orgs, setOrgs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ORG);
  const [intentions, setIntentions] = useState([]);
  const [newIntention, setNewIntention] = useState({ name: "", intention: "", maxCount: 0 });
  const [editingCounterId, setEditingCounterId] = useState(null);
  const [counterForm, setCounterForm] = useState({ name: "", intention: "", maxCount: 0 });

  const refreshOrgs = async () => setOrgs(await listOrgs());

  useEffect(() => {
    if (isSuperAdmin) refreshOrgs();
  }, [isSuperAdmin]);

  const loadOrgForEdit = async (id) => {
    const org = await getOrgById(id);
    if (!org) return;
    setEditingId(id);
    setForm({
      slug: org.slug || "",
      name: org.name || "",
      adminCode: org.adminCode || "",
      primaryColor: org.primaryColor || "#4a148c",
      textBlocks: org.textBlocks || [],
    });
    setIntentions(await listOrgIntentions(id));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_ORG);
    setIntentions([]);
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setBlock = (index, key, value) =>
    setForm((f) => ({
      ...f,
      textBlocks: f.textBlocks.map((b, i) => (i === index ? { ...b, [key]: value } : b)),
    }));

  const addBlock = () => setForm((f) => ({ ...f, textBlocks: [...f.textBlocks, EMPTY_BLOCK()] }));
  const removeBlock = (index) =>
    setForm((f) => ({ ...f, textBlocks: f.textBlocks.filter((_, i) => i !== index) }));

  const saveOrg = async () => {
    try {
      if (!form.slug.trim() || !form.name.trim()) throw new Error("Slug and name are required");
      if (editingId) {
        await updateOrg(editingId, form);
        showSnackbar("Organization updated", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      } else {
        const id = await createOrg(form);
        showSnackbar("Organization created", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
        await loadOrgForEdit(id);
      }
      await refreshOrgs();
    } catch (error) {
      showSnackbar(error?.message || "Save failed", SNACK_BAR_SEVERITY_TYPES.ERROR);
    }
  };

  const addCounterToOrg = async () => {
    try {
      if (!editingId) throw new Error("Save the organization first");
      if (!newIntention.name.trim()) throw new Error("Counter name is required");
      await addIntention({
        name: newIntention.name,
        intention: newIntention.intention,
        maxCount: Number(newIntention.maxCount) || 0,
        orgId: editingId,
      });
      showSnackbar("Counter added", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      setNewIntention({ name: "", intention: "", maxCount: 0 });
      setIntentions(await listOrgIntentions(editingId));
    } catch (error) {
      showSnackbar(error?.message || "Failed to add counter", SNACK_BAR_SEVERITY_TYPES.ERROR);
    }
  };

  const startEditCounter = (item) => {
    setEditingCounterId(item.id);
    setCounterForm({
      name: item.name || "",
      intention: item.intention || "",
      maxCount: Number(item.maxCount) || 0,
    });
  };

  const cancelEditCounter = () => {
    setEditingCounterId(null);
    setCounterForm({ name: "", intention: "", maxCount: 0 });
  };

  const saveCounterEdit = async () => {
    try {
      if (!counterForm.name.trim()) throw new Error("Counter name is required");
      await updateIntention(editingCounterId, {
        name: counterForm.name,
        intention: counterForm.intention,
        maxCount: Number(counterForm.maxCount) || 0,
      });
      showSnackbar("Counter updated", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      cancelEditCounter();
      setIntentions(await listOrgIntentions(editingId));
    } catch (error) {
      showSnackbar(error?.message || "Failed to update counter", SNACK_BAR_SEVERITY_TYPES.ERROR);
    }
  };

  if (loading) return null;
  if (!isSuperAdmin) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h6">Access denied</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Organizations</Typography>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
        {orgs.map((org) => (
          <Button key={org.id} size="small" variant={editingId === org.id ? "contained" : "outlined"} onClick={() => loadOrgForEdit(org.id)}>
            {org.name}
          </Button>
        ))}
        <Button size="small" color="secondary" onClick={resetForm}>+ New</Button>
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 700, mb: 2 }}>
            {editingId ? "Edit organization" : "New organization"}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Name" fullWidth value={form.name} onChange={(e) => setField("name", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Slug (URL)" fullWidth value={form.slug} onChange={(e) => setField("slug", e.target.value)} helperText="e.g. grace-sisters" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Admin code" fullWidth value={form.adminCode} onChange={(e) => setField("adminCode", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Primary color" fullWidth value={form.primaryColor} onChange={(e) => setField("primaryColor", e.target.value)} helperText="hex e.g. #4a148c" />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Text blocks</Typography>
          {form.textBlocks.map((block, index) => (
            <Box key={block.id} sx={{ border: "1px solid #eee", borderRadius: 2, p: 2, mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <IconButton size="small" onClick={() => removeBlock(index)} aria-label="Remove block">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              <TextField label="Text" fullWidth multiline minRows={2} value={block.text} onChange={(e) => setBlock(index, "text", e.target.value)} sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <TextField select label="Variant" fullWidth value={block.variant} onChange={(e) => setBlock(index, "variant", e.target.value)}>
                    {["heading", "subheading", "paragraph", "verse"].map((v) => (
                      <MenuItem key={v} value={v}>{v}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField label="Color" fullWidth value={block.color} onChange={(e) => setBlock(index, "color", e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField label="Font size" fullWidth value={block.fontSize} onChange={(e) => setBlock(index, "fontSize", e.target.value)} helperText="e.g. 1.25rem" />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField select label="Align" fullWidth value={block.align} onChange={(e) => setBlock(index, "align", e.target.value)}>
                    {["left", "center", "right"].map((a) => (
                      <MenuItem key={a} value={a}>{a}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, p: 1, bgcolor: "#faf7ff", borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Preview</Typography>
                <TextBlock block={block} />
              </Box>
            </Box>
          ))}
          <Button onClick={addBlock} size="small">+ Add text block</Button>

          <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
            <Button variant="contained" onClick={saveOrg}>{editingId ? "Update" : "Create"}</Button>
            {editingId ? <Button onClick={resetForm}>Done</Button> : null}
          </Box>
        </CardContent>
      </Card>

      {editingId ? (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 2 }}>Counters</Typography>
            {intentions.map((item) =>
              editingCounterId === item.id ? (
                <Box key={item.id} sx={{ border: "1px solid #eee", borderRadius: 2, p: 2, mb: 1.5 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={5}>
                      <TextField label="Counter name" fullWidth value={counterForm.name} onChange={(e) => setCounterForm((c) => ({ ...c, name: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField label="Intention text" fullWidth value={counterForm.intention} onChange={(e) => setCounterForm((c) => ({ ...c, intention: e.target.value }))} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField label="Target (0 = none)" type="number" fullWidth value={counterForm.maxCount} onChange={(e) => setCounterForm((c) => ({ ...c, maxCount: e.target.value }))} />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 1.5, display: "flex", gap: 1 }}>
                    <Button size="small" variant="contained" onClick={saveCounterEdit}>Save</Button>
                    <Button size="small" onClick={cancelEditCounter}>Cancel</Button>
                  </Box>
                </Box>
              ) : (
                <Box key={item.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2">
                    • {item.name || "Prayer"} — {Number(item.count || 0).toLocaleString("en-IN")}
                    {Number(item.maxCount) > 0 ? ` / ${Number(item.maxCount).toLocaleString("en-IN")}` : ""}
                  </Typography>
                  <Button size="small" onClick={() => startEditCounter(item)}>Edit</Button>
                </Box>
              )
            )}
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <TextField label="Counter name" fullWidth value={newIntention.name} onChange={(e) => setNewIntention((n) => ({ ...n, name: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Intention text" fullWidth value={newIntention.intention} onChange={(e) => setNewIntention((n) => ({ ...n, intention: e.target.value }))} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="Target (0 = none)" type="number" fullWidth value={newIntention.maxCount} onChange={(e) => setNewIntention((n) => ({ ...n, maxCount: e.target.value }))} />
              </Grid>
            </Grid>
            <Button sx={{ mt: 2 }} variant="outlined" onClick={addCounterToOrg}>Add counter</Button>
          </CardContent>
        </Card>
      ) : null}
    </Container>
  );
};

export default OrgManage;
