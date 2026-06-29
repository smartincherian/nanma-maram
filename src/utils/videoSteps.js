import { getEditingSkillForType } from "./mediaTypes";

// The fixed production steps every video goes through, in order. Hardcoded
// (not stored in Firestore) — new videos snapshot these into their own
// stages[] so changing this list never mutates existing videos.
export const VIDEO_STEPS = [
  { id: "video_collection", name: "Video Collection" },
  { id: "content_check_before_editing", name: "Content Check" },
  { id: "caption_creation", name: "Caption" },
  { id: "assign_for_editing", name: "Editing" },
  { id: "collect_edited_videos", name: "Collect Edited Video" },
  { id: "quality_check_edited_videos", name: "Quality Check" },
  { id: "thumbnail", name: "Thumbnail" },
  { id: "uploading", name: "Uploading" },
];

// Which crew skill(s) (values from crewSkills.js) are relevant to each step.
// When a step lists skill(s), the assignee dropdown shows only crew with one of
// them; steps mapped to [] show everyone.
export const STEP_SKILLS = {
  video_collection: [],
  content_check_before_editing: ["content_checking", "before_editing_content_checking"],
  caption_creation: ["caption_video"],
  assign_for_editing: ["shorts_video_editing", "long_video_editing", "promo_video_editing"],
  collect_edited_videos: [],
  quality_check_edited_videos: ["content_checking", "after_editing_content_checking"],
  thumbnail: ["thumbnail_video"],
  uploading: [],
};

export const getStepSkills = (stageId) => STEP_SKILLS[stageId] || [];

// Like getStepSkills, but narrowed by the media's type: the Editing step lists
// all three editing skills by default, and a known type pins it to just one
// (short → Shorts, long → Long, promo → Promo). Every other step — and any
// video with no/unknown type — keeps the default skills, so this is backward
// compatible and extensible to other type-specific steps later.
export const getStepSkillsForType = (stageId, type) => {
  if (stageId === "assign_for_editing") {
    const editingSkill = getEditingSkillForType(type);
    if (editingSkill) return [editingSkill];
  }
  return getStepSkills(stageId);
};

// Resolve a step's display name from the master list by id, so renames here
// show on every video immediately. Falls back to the name snapshotted on the
// video (covers any legacy step id no longer in the list).
const STEP_NAMES = Object.fromEntries(VIDEO_STEPS.map((s) => [s.id, s.name]));

export const getStepName = (stageId, fallback = "") => STEP_NAMES[stageId] || fallback;
