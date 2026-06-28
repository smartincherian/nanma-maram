import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { getOrgBySlug } from "../../firebase/org/orgs";
import { listOrgVotes } from "../../firebase/org/votes";
import { groupVotesByDay } from "../../utils/groupVotesByDay";

const OrgAdmin = () => {
  const { orgSlug } = useParams();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [days, setDays] = useState([]);
  const [loadingVotes, setLoadingVotes] = useState(false);

  useEffect(() => {
    let active = true;
    getOrgBySlug(orgSlug).then((found) => {
      if (!active) return;
      setOrg(found);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [orgSlug]);

  const handleUnlock = async () => {
    if (!org) return;
    if (code.trim() !== String(org.adminCode || "")) {
      setError("Incorrect code");
      return;
    }
    setError("");
    setUnlocked(true);
    setLoadingVotes(true);
    const votes = await listOrgVotes(org.id);
    setDays(groupVotesByDay(votes));
    setLoadingVotes(false);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!org) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Organization not found</Typography>
      </Container>
    );
  }

  const accent = org.primaryColor || "#4a148c";

  if (!unlocked) {
    return (
      <Container maxWidth="xs" sx={{ py: 8 }}>
        <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 2 }}>
          {org.name} — Admin
        </Typography>
        <TextField
          label="Admin code"
          type="password"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUnlock();
          }}
        />
        <Button fullWidth variant="contained" onClick={handleUnlock} sx={{ bgcolor: accent, "&:hover": { bgcolor: accent } }}>
          View voters
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: accent, mb: 2 }}>
        {org.name} — Daily voters
      </Typography>
      {loadingVotes ? (
        <CircularProgress />
      ) : days.length === 0 ? (
        <Typography color="text.secondary">No votes yet.</Typography>
      ) : (
        days.map((day) => (
          <Card key={day.date} variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <Typography sx={{ fontWeight: 700 }}>{day.date}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {day.totalValue.toLocaleString("en-IN")} total · {day.totalCount} entries
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <List disablePadding>
                {day.voters.map((voter) => (
                  <ListItem key={voter.name} disableGutters sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={voter.name}
                      secondary={`${voter.value.toLocaleString("en-IN")} · ${voter.count} ${voter.count === 1 ? "entry" : "entries"}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ))
      )}
    </Container>
  );
};

export default OrgAdmin;
