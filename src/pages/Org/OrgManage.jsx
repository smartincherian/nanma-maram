import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ApartmentIcon from "@mui/icons-material/Apartment";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useAuth } from "../../components/AuthProvider";
import {
  createOrg,
  getOrgById,
  listOrgs,
  updateOrg,
} from "../../firebase/org/orgs";
import { listOrgIntentions } from "../../firebase/intention/get";
import CopyLinkButton from "./CopyLinkButton";
import {
  SNACK_BAR_SEVERITY_TYPES,
  SnackbarContext,
} from "../../components/Snackbar";

const ACCENT = "#4a148c";
const GOLD = "#a16207";

const SectionLabel = ({ children, sx }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, ...sx }}>
    <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: GOLD }} />
    <Typography sx={{ fontWeight: 800, letterSpacing: "0.01em", color: "#311b45" }}>
      {children}
    </Typography>
  </Box>
);

const cardSx = {
  borderRadius: 4,
  mb: 3,
  border: "1px solid rgba(74,20,140,0.12)",
  boxShadow: "0 16px 44px rgba(49,27,69,0.08)",
};

// A single shareable link with its full URL, a copy button, and an open-in-tab.
const LinkRow = ({ label, path }) => {
  const url = `${window.location.origin}${path}`;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 1.5,
        py: 1.25,
        mb: 1,
        borderRadius: 2.5,
        bgcolor: "#faf8ff",
        border: "1px solid rgba(74,20,140,0.08)",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "#311b45" }}>
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "#6b7280", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {url}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <CopyLinkButton path={path} sx={{ color: ACCENT, fontWeight: 600 }} />
        <Tooltip title="Open in new tab" arrow>
          <IconButton size="small" component="a" href={url} target="_blank" rel="noopener noreferrer" sx={{ color: ACCENT }}>
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

const EMPTY_ORG = {
  slug: "",
  name: "",
  adminCode: "",
  primaryColor: "#4a148c",
};

const OrgManage = () => {
  const { isSuperAdmin, loading } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orgs, setOrgs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ORG);
  const [intentions, setIntentions] = useState([]);

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
    });
    setIntentions(await listOrgIntentions(id));
  };

  // Auto-open an org when arriving with ?org=ID (e.g. returning from the
  // counter editor), so the right org and its counter list stay in view.
  useEffect(() => {
    const orgParam = searchParams.get("org");
    if (isSuperAdmin && orgParam && orgParam !== editingId) {
      loadOrgForEdit(orgParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, searchParams]);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_ORG);
    setIntentions([]);
    if (searchParams.get("org")) setSearchParams({}, { replace: true });
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

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

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "16px",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            background: `linear-gradient(135deg, #6d28d9 0%, ${ACCENT} 100%)`,
            boxShadow: "0 12px 26px rgba(74,20,140,0.32)",
            flexShrink: 0,
          }}
        >
          <ApartmentIcon />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#2e1065", lineHeight: 1.2 }}>
            Organizations
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Create and manage organizations, branding, and prayer counters.
          </Typography>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 3,
          mb: 3,
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          alignItems: "center",
          border: "1px solid rgba(74,20,140,0.16)",
          bgcolor: "rgba(250,247,255,0.7)",
        }}
      >
        {orgs.length === 0 ? (
          <Typography variant="body2" sx={{ color: "#9ca3af", px: 1, py: 0.5 }}>
            No organizations yet — create your first one.
          </Typography>
        ) : (
          orgs.map((org) => {
            const selected = editingId === org.id;
            return (
              <Chip
                key={org.id}
                label={org.name}
                clickable
                onClick={() => loadOrgForEdit(org.id)}
                variant={selected ? "filled" : "outlined"}
                sx={
                  selected
                    ? {
                        bgcolor: ACCENT,
                        color: "#fff",
                        fontWeight: 700,
                        "&:hover": { bgcolor: "#5b21b6" },
                      }
                    : {
                        color: ACCENT,
                        borderColor: "rgba(74,20,140,0.3)",
                        fontWeight: 600,
                      }
                }
              />
            );
          })
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={resetForm}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            color: editingId ? GOLD : "#fff",
            bgcolor: editingId ? "transparent" : ACCENT,
            borderRadius: 2,
            px: 1.5,
            "&:hover": { bgcolor: editingId ? "rgba(161,98,7,0.08)" : "#5b21b6" },
          }}
        >
          New
        </Button>
      </Paper>

      <Card elevation={0} sx={cardSx}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <SectionLabel>{editingId ? "Edit organization" : "New organization"}</SectionLabel>
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
              <TextField
                label="Primary color"
                fullWidth
                value={form.primaryColor}
                onChange={(e) => setField("primaryColor", e.target.value)}
                helperText="hex e.g. #4a148c"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: "6px",
                        mr: 1,
                        flexShrink: 0,
                        bgcolor: form.primaryColor || "transparent",
                        border: "1px solid rgba(0,0,0,0.15)",
                      }}
                    />
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              onClick={saveOrg}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                px: 3,
                borderRadius: 2,
                background: `linear-gradient(135deg, #6d28d9 0%, ${ACCENT} 100%)`,
                boxShadow: "0 10px 22px rgba(74,20,140,0.28)",
                "&:hover": { background: "linear-gradient(135deg, #5b21b6 0%, #3b0f70 100%)" },
              }}
            >
              {editingId ? "Update" : "Create"}
            </Button>
            {editingId ? (
              <Button onClick={resetForm} sx={{ textTransform: "none", fontWeight: 600, color: "#6b7280" }}>
                Done
              </Button>
            ) : null}
          </Box>
        </CardContent>
      </Card>

      {editingId && form.slug ? (
        <Card elevation={0} sx={cardSx}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <SectionLabel>Links</SectionLabel>
            <LinkRow label="Organization page" path={`/${form.slug}`} />
            <LinkRow label="Admin page" path={`/${form.slug}/admin`} />
          </CardContent>
        </Card>
      ) : null}

      {editingId ? (
        <Card elevation={0} sx={{ ...cardSx, mb: 0 }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <SectionLabel>Counters</SectionLabel>
            {intentions.length === 0 ? (
              <Typography variant="body2" sx={{ color: "#9ca3af", mb: 1 }}>
                No counters yet. Add one below.
              </Typography>
            ) : null}
            {intentions.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  px: 1.5,
                  py: 1.25,
                  mb: 1,
                  borderRadius: 2.5,
                  bgcolor: "#faf8ff",
                  border: "1px solid rgba(74,20,140,0.08)",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#311b45", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.name || "Prayer"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#6b7280" }}>
                    {Number(item.count || 0).toLocaleString("en-IN")}
                    {Number(item.maxCount) > 0 ? ` / ${Number(item.maxCount).toLocaleString("en-IN")}` : ""}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                  {form.slug ? (
                    <CopyLinkButton path={`/${form.slug}/counter/${item.id}`} label="Copy link" />
                  ) : null}
                  <Button
                    size="small"
                    startIcon={<EditOutlinedIcon fontSize="small" />}
                    onClick={() => navigate(`/org-manage/${editingId}/counter/${item.id}/edit`)}
                    sx={{ textTransform: "none", fontWeight: 600, color: ACCENT }}
                  >
                    Edit
                  </Button>
                </Box>
              </Box>
            ))}
            <Divider sx={{ my: 2.5 }} />
            <Button
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                px: 2.5,
                borderColor: "rgba(74,20,140,0.4)",
                color: ACCENT,
                "&:hover": { borderColor: ACCENT, bgcolor: "rgba(74,20,140,0.04)" },
              }}
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/org-manage/${editingId}/counter/new`)}
            >
              Add counter
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </Container>
  );
};

export default OrgManage;
