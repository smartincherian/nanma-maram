const keyFor = (slug) => `orgVoter:${String(slug || "").trim().toLowerCase()}`;

export const getOrgVoterName = (slug) => {
  if (typeof window === "undefined" || !slug) return "";
  return localStorage.getItem(keyFor(slug)) || "";
};

export const setOrgVoterName = (slug, name) => {
  if (typeof window === "undefined" || !slug) return;
  const cleaned = String(name || "").trim();
  if (cleaned) {
    localStorage.setItem(keyFor(slug), cleaned);
  } else {
    localStorage.removeItem(keyFor(slug));
  }
};
