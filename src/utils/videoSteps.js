// The fixed production steps every video goes through, in order. Hardcoded
// (not stored in Firestore) — new videos snapshot these into their own
// stages[] so changing this list never mutates existing videos.
export const VIDEO_STEPS = [
  { id: "video_collection", name: "Video Collection" },
  { id: "content_check_before_editing", name: "Content Check Before Editing" },
  { id: "caption_creation", name: "Caption Creation" },
  { id: "assign_for_editing", name: "Assign for Editing & Update Editor Details" },
  { id: "collect_edited_videos", name: "Collect Edited Videos" },
];
