import React from "react";
import { SvgIcon } from "@mui/material";

// Tau (Franciscan) cross — flared crossbar ends and a widening foot. MUI has no
// religious-cross icon, so we draw the silhouette as a single path. Shared
// across the chapel footer and credits sheet so the symbol stays consistent.
const TauCrossIcon = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M2.5 4 Q12 6 21.5 4 L21 11 Q16.5 9.5 14 9 C13.2 13 14 18 16 21.5 Q12 22.5 8 21.5 C10 18 10.8 13 10 9 Q7.5 9.5 3 11 Z" />
  </SvgIcon>
);

export default TauCrossIcon;
