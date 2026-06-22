import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
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
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { useAuth } from "../../components/AuthProvider";
import {
  addAdmin,
  deleteAdmin,
  listAdmins,
  updateAdmin,
} from "../../firebase/admins";

const EMPTY_FORM = { email: "", name: "", contact: "" };

const Admins = () => {
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);

  const [admins, setAdmins] = useState([]);
  const [dialogMode, setDialogMode] = useState(null); // "add" | "edit" | null
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const reload = async () => {
    try {
      setAdmins(await listAdmins());
    } catch (error) {
      showSnackbar(
        "Could not load admins. Please try again.",
        SNACK_BAR_SEVERITY_TYPES.ERROR
      );
    }
  };

  useEffect(() => {
    let active = true;
    listAdmins()
      .then((data) => {
        if (active) {
          setAdmins(data);
        }
      })
      .catch(() => {
        if (active) {
          showSnackbar(
            "Could not load admins. Please try again.",
            SNACK_BAR_SEVERITY_TYPES.ERROR
          );
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddDialog = () => {
    setForm(EMPTY_FORM);
    setDialogMode("add");
  };

  const openEditDialog = (admin) => {
    setForm({
      email: admin.email,
      name: admin.name || "",
      contact: admin.contact || "",
    });
    setDialogMode("edit");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setForm(EMPTY_FORM);
  };

  const setField = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const canSave =
    form.email.trim().length > 0 && form.name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    const isEdit = dialogMode === "edit";
    setSaving(true);
    try {
      if (isEdit) {
        await updateAdmin(form.email, {
          name: form.name,
          contact: form.contact,
        });
      } else {
        await addAdmin({
          email: form.email,
          name: form.name,
          contact: form.contact,
        });
      }
    } catch (error) {
      showSnackbar(
        error?.message || "Could not save admin. Please try again.",
        SNACK_BAR_SEVERITY_TYPES.ERROR
      );
      setSaving(false);
      return;
    }
    await reload();
    setSaving(false);
    closeDialog();
    showSnackbar(
      isEdit ? "Admin updated" : "Admin added",
      SNACK_BAR_SEVERITY_TYPES.SUCCESS
    );
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await deleteAdmin(deleteTarget.email);
    } catch (error) {
      showSnackbar(
        error?.message || "Could not remove admin. Please try again.",
        SNACK_BAR_SEVERITY_TYPES.ERROR
      );
      setDeleting(false);
      return;
    }
    await reload();
    setDeleting(false);
    setDeleteTarget(null);
    showSnackbar("Admin removed", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate("/")}
          sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600 }}
        >
          Home
        </Button>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openAddDialog}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2.5,
            background: "linear-gradient(135deg, #935100 0%, #d67b1f 100%)",
          }}
        >
          Add admin
        </Button>
      </Stack>

      <Typography variant="h4" sx={{ fontWeight: 800, color: "#1f2937", mb: 0.5 }}>
        Manage Admins
      </Typography>
      <Typography sx={{ color: "#5b6472", mb: 3 }}>
        These accounts can sign in and manage the app.
      </Typography>

      <Stack spacing={1.5}>
        {admins.length === 0 ? (
          <Typography sx={{ color: "#8a6a36" }}>No admins yet.</Typography>
        ) : null}

        {admins.map((admin) => {
          const isSelf = user?.email === admin.email;
          return (
            <Paper
              key={admin.email}
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                border: "1px solid rgba(160, 103, 38, 0.16)",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ flexWrap: "wrap" }}
                >
                  <Typography sx={{ fontWeight: 700, color: "#3b2a13" }}>
                    {admin.name || "—"}
                  </Typography>
                  {admin.role === "owner" ? (
                    <Chip
                      label="Owner"
                      size="small"
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "rgba(214, 123, 31, 0.16)",
                        color: "#8a4b00",
                      }}
                    />
                  ) : null}
                </Stack>
                <Typography
                  sx={{
                    color: "#5b6472",
                    fontSize: "0.92rem",
                    wordBreak: "break-all",
                  }}
                >
                  {admin.email}
                </Typography>
                {admin.contact ? (
                  <Typography sx={{ color: "#5b6472", fontSize: "0.92rem" }}>
                    {admin.contact}
                  </Typography>
                ) : null}
              </Box>

              <IconButton
                aria-label={`Edit ${admin.email}`}
                onClick={() => openEditDialog(admin)}
                sx={{ color: "#935100" }}
              >
                <EditRoundedIcon />
              </IconButton>

              {isOwner && !isSelf ? (
                <IconButton
                  aria-label={`Delete ${admin.email}`}
                  onClick={() => setDeleteTarget(admin)}
                  sx={{ color: "#b3261e" }}
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              ) : null}
            </Paper>
          );
        })}
      </Stack>

      <Dialog open={dialogMode !== null} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {dialogMode === "edit" ? "Edit admin" : "Add admin"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={setField("email")}
              disabled={dialogMode === "edit"}
              fullWidth
              required
            />
            <TextField
              label="Name"
              value={form.name}
              onChange={setField("name")}
              fullWidth
              required
            />
            <TextField
              label="Contact number"
              value={form.contact}
              onChange={setField("contact")}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!canSave || saving}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(135deg, #935100 0%, #d67b1f 100%)",
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Remove admin?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget
              ? `${deleteTarget.name || deleteTarget.email} will lose access immediately.`
              : ""}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Confirm delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Admins;
