// Superadmin allowlist. Superadmin is the top tier — currently a single
// hardcoded account, not driven by the Firestore `role` field. An array so
// adding another superadmin later is a one-line change.
export const SUPERADMIN_EMAILS = ["smartin.cherian@gmail.com"];

export const isSuperAdminEmail = (email) =>
  !!email && SUPERADMIN_EMAILS.includes(email.toLowerCase());
