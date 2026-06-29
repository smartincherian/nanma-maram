// The fixed set of skills a crew member can declare at signup/profile edit.
// Store `value` in Firestore; render `label` in the UI.
export const CREW_SKILL_GROUPS = [
  {
    label: "Video editing",
    skills: [
      { value: "shorts_video_editing", label: "Shorts" },
      { value: "long_video_editing", label: "Long" },
      { value: "promo_video_editing", label: "Promo" },
    ],
  },
  {
    label: "Video assets",
    skills: [
      { value: "thumbnail_video", label: "Thumbnail" },
      { value: "caption_video", label: "Caption" },
    ],
  },
  {
    label: "Checking",
    skills: [
      { value: "content_checking", label: "Content checking" },
    ],
  },
  {
    label: "Design and text",
    skills: [
      { value: "poster", label: "Poster" },
      { value: "video_descriptions", label: "Video descriptions" },
    ],
  },
];

export const CREW_SKILLS = CREW_SKILL_GROUPS.flatMap((group) => group.skills);

// The two checking skills were merged into a single "Content checking". Crew
// saved with either old value still render the merged label.
const LEGACY_SKILL_LABELS = {
  before_editing_content_checking: "Content checking",
  after_editing_content_checking: "Content checking",
};

export const getCrewSkillLabel = (value) => {
  const skill = CREW_SKILLS.find((item) => item.value === value);
  return skill?.label || LEGACY_SKILL_LABELS[value] || value;
};
