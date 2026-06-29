import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useAuth } from "../../components/AuthProvider";
import { getOrgById } from "../../firebase/org/orgs";
import { addIntention, updateIntention } from "../../firebase/intention/add";
import { getIntentionById } from "../../firebase/intention/get";
import RichTextEditor from "./RichTextEditor";
import CounterBox from "./CounterBox";
import {
  SNACK_BAR_SEVERITY_TYPES,
  SnackbarContext,
} from "../../components/Snackbar";

const EMPTY = { name: "", intention: "", maxCount: 0, boxes: [] };

const makeBox = () => ({
  id: `box_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  content: "",
  background: true,
});

const OrgCounterForm = () => {
  const { orgId, counterId } = useParams();
  const isEdit = Boolean(counterId);
  const navigate = useNavigate();
  const { isSuperAdmin, loading } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);

  const [org, setOrg] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let active = true;
    (async () => {
      setLoadingData(true);
      try {
        const orgData = await getOrgById(orgId);
        if (!active) return;
        setOrg(orgData);
        if (isEdit) {
          const counter = await getIntentionById(counterId);
          if (active && counter) {
            setForm({
              name: counter.name || "",
              intention: counter.intention || "",
              maxCount: Number(counter.maxCount) || 0,
              boxes: Array.isArray(counter.boxes) ? counter.boxes : [],
            });
          }
        }
      } finally {
        if (active) setLoadingData(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isSuperAdmin, orgId, counterId, isEdit]);

  const goBack = () => navigate(`/org-manage?org=${orgId}`);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addBox = () => setForm((f) => ({ ...f, boxes: [...f.boxes, makeBox()] }));
  const removeBox = (id) =>
    setForm((f) => ({ ...f, boxes: f.boxes.filter((b) => b.id !== id) }));
  const moveBox = (index, dir) =>
    setForm((f) => {
      const target = index + dir;
      if (target < 0 || target >= f.boxes.length) return f;
      const next = [...f.boxes];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, boxes: next };
    });
  const setBoxField = (id, key, value) =>
    setForm((f) => ({
      ...f,
      boxes: f.boxes.map((b) => (b.id === id ? { ...b, [key]: value } : b)),
    }));

  // Persisted boxes drop empty ones so a blank box never renders on the counter.
  const cleanBoxes = (boxes) =>
    boxes
      .filter((b) => String(b.content || "").trim())
      .map((b) => ({ id: b.id, content: b.content, background: b.background !== false }));

  const save = async () => {
    try {
      if (!form.name.trim()) throw new Error("Counter name is required");
      setSaving(true);
      if (isEdit) {
        await updateIntention(counterId, {
          name: form.name,
          intention: form.intention,
          maxCount: Number(form.maxCount) || 0,
          boxes: cleanBoxes(form.boxes),
        });
        showSnackbar("Counter updated", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      } else {
        await addIntention({
          name: form.name,
          intention: form.intention,
          maxCount: Number(form.maxCount) || 0,
          orgId,
          boxes: cleanBoxes(form.boxes),
        });
        showSnackbar("Counter added", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      }
      goBack();
    } catch (error) {
      showSnackbar(error?.message || "Save failed", SNACK_BAR_SEVERITY_TYPES.ERROR);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;
  if (!isSuperAdmin) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#311b45" }}>
          Access denied
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280", mt: 1 }}>
          This area is reserved for superadmins.
        </Typography>
      </Container>
    );
  }

  const accent = org?.primaryColor || "#4a148c";
  const fmt = (v) => Number(v || 0).toLocaleString("en-IN");
  const targetCount = Number(form.maxCount) || 0;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={goBack}
        sx={{ textTransform: "none", fontWeight: 700, color: "#6b7280", mb: 2 }}
      >
        Back to organization
      </Button>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#2e1065", lineHeight: 1.2 }}>
          {isEdit ? "Edit counter" : "New counter"}
        </Typography>
        {org ? (
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            {org.name}
          </Typography>
        ) : null}
      </Box>

      <Grid container spacing={3} alignItems="flex-start">
        {/* Editor */}
        <Grid item xs={12} md={7}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: "1px solid rgba(74,20,140,0.12)",
              boxShadow: "0 16px 44px rgba(49,27,69,0.08)",
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <TextField
                label="Counter name"
                fullWidth
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                disabled={loadingData}
                sx={{ mb: 2.5 }}
              />
              <RichTextEditor
                label="Intention text"
                value={form.intention}
                onChange={(v) => setField("intention", v)}
                minRows={5}
              />

              <Divider sx={{ my: 3 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#311b45", mb: 0.5 }}>
                Content boxes
              </Typography>
              <Typography variant="caption" sx={{ color: "#9ca3af", display: "block", mb: 2 }}>
                Add extra styled boxes shown under the intention on the counter page.
              </Typography>

              {form.boxes.map((box, index) => (
                <Box
                  key={box.id}
                  sx={{
                    border: "1px solid rgba(74,20,140,0.14)",
                    borderRadius: 3,
                    p: 2,
                    mb: 2,
                    bgcolor: "#fcfaff",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#a16207", letterSpacing: "0.08em" }}>
                      BOX {index + 1}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => moveBox(index, -1)}
                        aria-label="Move box up"
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={index === form.boxes.length - 1}
                        onClick={() => moveBox(index, 1)}
                        aria-label="Move box down"
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                      <FormControlLabel
                        sx={{ mr: 0 }}
                        control={
                          <Switch
                            size="small"
                            checked={box.background !== false}
                            onChange={(e) => setBoxField(box.id, "background", e.target.checked)}
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ color: "#6b7280" }}>
                            Background
                          </Typography>
                        }
                      />
                      <IconButton size="small" onClick={() => removeBox(box.id)} aria-label="Remove box">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <RichTextEditor
                    value={box.content}
                    onChange={(v) => setBoxField(box.id, "content", v)}
                    minRows={3}
                  />
                </Box>
              ))}
              <Button
                onClick={addBox}
                size="small"
                startIcon={<AddIcon />}
                sx={{ textTransform: "none", fontWeight: 700, color: "#4a148c" }}
              >
                Add box
              </Button>

              <Box sx={{ mt: 3 }}>
                <TextField
                  label="Target (0 = none)"
                  type="number"
                  value={form.maxCount}
                  onChange={(e) => setField("maxCount", e.target.value)}
                  disabled={loadingData}
                  sx={{ width: { xs: "100%", sm: 240 } }}
                />
              </Box>

              <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={save}
                  disabled={saving || loadingData}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    px: 3,
                    borderRadius: 2,
                    background: "linear-gradient(135deg, #6d28d9 0%, #4a148c 100%)",
                    boxShadow: "0 10px 22px rgba(74,20,140,0.28)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #5b21b6 0%, #3b0f70 100%)",
                    },
                  }}
                >
                  {isEdit ? "Save changes" : "Add counter"}
                </Button>
                <Button
                  onClick={goBack}
                  disabled={saving}
                  sx={{ textTransform: "none", fontWeight: 600, color: "#6b7280" }}
                >
                  Cancel
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Live preview */}
        <Grid item xs={12} md={5}>
          <Box sx={{ position: { md: "sticky" }, top: { md: 24 } }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", ml: 0.5 }}
            >
              LIVE PREVIEW
            </Typography>
            <Card
              variant="outlined"
              sx={{ mt: 1, borderRadius: 4, borderColor: `${accent}33` }}
            >
              <CardContent>
                <Typography align="center" sx={{ fontWeight: 800, color: accent, mb: 0.5 }}>
                  {org?.name}
                </Typography>
                <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 2 }}>
                  {form.name || "Prayer"}
                </Typography>

                <CounterBox text={form.intention} accent={accent} />

                {form.boxes.map((box) => (
                  <CounterBox
                    key={box.id}
                    text={box.content}
                    background={box.background !== false}
                    accent={accent}
                  />
                ))}

                <Grid container spacing={2} justifyContent="center" sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: "center", p: 2, borderRadius: 3, bgcolor: "#faf7ff" }}>
                      <Typography variant="caption" color="text.secondary">CURRENT</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: accent }}>
                        {fmt(0)}
                      </Typography>
                    </Box>
                  </Grid>
                  {targetCount > 0 ? (
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: "center", p: 2, borderRadius: 3, bgcolor: "#faf7ff" }}>
                        <Typography variant="caption" color="text.secondary">TARGET</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "#1976D2" }}>
                          {fmt(targetCount)}
                        </Typography>
                      </Box>
                    </Grid>
                  ) : null}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrgCounterForm;
