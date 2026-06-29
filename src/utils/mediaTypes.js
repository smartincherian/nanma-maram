// Canonical base path for the media (formerly "videos") section. One source of
// truth so links stay consistent; old /videos URLs redirect here.
export const MEDIA_BASE = "/admin/media";

// The kinds of media a production can be. `value` is stored on the video doc;
// `label` is shown in the UI; `editingSkill` maps the type to the single crew
// editing skill its Editing step should filter by. Adding a type here is the
// only change needed to support a new one.
export const MEDIA_TYPES = [
  { value: "short", label: "Short Video", letter: "S", editingSkill: "shorts_video_editing" },
  { value: "long", label: "Long Video", letter: "L", editingSkill: "long_video_editing" },
  { value: "promo", label: "Promo Video", letter: "P", editingSkill: "promo_video_editing" },
];

const BY_VALUE = Object.fromEntries(MEDIA_TYPES.map((t) => [t.value, t]));

export const getMediaTypeLabel = (value) => BY_VALUE[value]?.label || "";

// A single-letter badge (S/L/P) for compact listing display, or "" if unset.
export const getMediaTypeLetter = (value) => BY_VALUE[value]?.letter || "";

// The editing skill for a media type, or null if the type is unknown/unset
// (legacy videos created before types existed).
export const getEditingSkillForType = (type) => BY_VALUE[type]?.editingSkill || null;
