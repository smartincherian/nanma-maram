import React, { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { getOrgBySlug } from "../../firebase/org/orgs";
import { listOrgIntentions } from "../../firebase/intention/get";
import TextBlock from "./TextBlock";

const OrgLanding = () => {
  const { orgSlug } = useParams();
  const [org, setOrg] = useState(null);
  const [intentions, setIntentions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const found = await getOrgBySlug(orgSlug);
      if (!active) return;
      setOrg(found);
      if (found) {
        const list = await listOrgIntentions(found.id);
        if (active) setIntentions(list);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [orgSlug]);

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
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Organization not found
        </Typography>
      </Container>
    );
  }

  const accent = org.primaryColor || "#4a148c";

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography
        variant="h4"
        align="center"
        sx={{ fontWeight: 800, color: accent, mb: 2 }}
      >
        {org.name}
      </Typography>

      {(org.textBlocks || []).map((block) => (
        <TextBlock key={block.id} block={block} />
      ))}

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {intentions.length === 0 ? (
          <Grid item xs={12}>
            <Typography align="center" color="text.secondary">
              No prayers yet.
            </Typography>
          </Grid>
        ) : (
          intentions.map((item) => (
            <Grid item xs={12} sm={6} key={item.id}>
              <Card
                variant="outlined"
                sx={{ borderRadius: 3, borderColor: `${accent}33` }}
              >
                <CardActionArea
                  component={RouterLink}
                  to={`/${org.slug}/counter/${item.id}`}
                >
                  <CardContent>
                    <Typography sx={{ fontWeight: 700, color: accent }}>
                      {item.name || "Prayer"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {Number(item.count || 0).toLocaleString("en-IN")}
                      {Number(item.maxCount) > 0
                        ? ` / ${Number(item.maxCount).toLocaleString("en-IN")}`
                        : ""}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default OrgLanding;
