import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { getOrgBySlug } from "../../firebase/org/orgs";
import { listOrgVotes } from "../../firebase/org/votes";
import { groupVotesByDay } from "../../utils/groupVotesByDay";

const DAYS_PAGE = 7;
const VOTERS_PREVIEW = 10;

const OrgAdmin = () => {
  const { orgSlug } = useParams();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [days, setDays] = useState([]);
  const [loadingVotes, setLoadingVotes] = useState(false);
  const [visibleDayCount, setVisibleDayCount] = useState(DAYS_PAGE);
  const [expandedDays, setExpandedDays] = useState({});

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

  useEffect(() => { if (org?.name) document.title = `${org.name} — Admin`; }, [org]);

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
        <>
          {days.slice(0, visibleDayCount).map((day) => {
            const expanded = !!expandedDays[day.date];
            const shownVoters = expanded
              ? day.voters
              : day.voters.slice(0, VOTERS_PREVIEW);
            const hiddenCount = day.voters.length - shownVoters.length;

            return (
              <Card key={day.date} variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>{day.date}</Typography>
                    <Box sx={{ display: "flex", gap: 0.75 }}>
                      <Chip
                        size="small"
                        label={`Total ${day.totalValue.toLocaleString("en-IN")}`}
                        sx={{ bgcolor: `${accent}14`, color: accent, fontWeight: 700 }}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${day.totalCount} ${day.totalCount === 1 ? "entry" : "entries"}`}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.25 }} />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      px: 0.5,
                      pb: 0.5,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: "0.06em" }}>
                      VOTER
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: "0.06em" }}>
                      COUNT · ENTRIES
                    </Typography>
                  </Box>

                  {shownVoters.map((voter, index) => (
                    <Box
                      key={voter.name}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        py: 1,
                        px: 0.5,
                        borderTop: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                        <Typography
                          sx={{ color: "text.secondary", fontWeight: 700, minWidth: 22, textAlign: "right" }}
                        >
                          {index + 1}
                        </Typography>
                        <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                          {voter.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexShrink: 0 }}>
                        <Typography sx={{ fontWeight: 800, color: accent, fontSize: "1.15rem", lineHeight: 1 }}>
                          {voter.value.toLocaleString("en-IN")}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {voter.count} {voter.count === 1 ? "entry" : "entries"}
                        </Typography>
                      </Box>
                    </Box>
                  ))}

                  {day.voters.length > VOTERS_PREVIEW ? (
                    <Button
                      size="small"
                      onClick={() =>
                        setExpandedDays((prev) => ({ ...prev, [day.date]: !expanded }))
                      }
                      sx={{ mt: 1, textTransform: "none", color: accent }}
                    >
                      {expanded ? "Show fewer" : `Show all ${day.voters.length} voters (${hiddenCount} more)`}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}

          {days.length > visibleDayCount ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setVisibleDayCount((c) => c + DAYS_PAGE)}
                sx={{ borderColor: accent, color: accent }}
              >
                Show more days ({days.length - visibleDayCount} left)
              </Button>
            </Box>
          ) : null}
        </>
      )}
    </Container>
  );
};

export default OrgAdmin;
