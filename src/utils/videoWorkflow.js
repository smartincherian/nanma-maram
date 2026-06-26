// Pure, framework-free helpers for the video tracking pipeline.
// Kept side-effect free so they are trivial to unit test.
import { VIDEO_STEPS } from "./videoSteps";

export const STAGE_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

export const VIDEO_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  REJECTED: "rejected",
};

// Overlay a video's work docs onto the fixed, ordered step list so the timeline
// always shows all steps. Steps with no work doc render as pending/unassigned.
// `nameForId` resolves an assignee's display name (we don't store it on the work).
export const mergeStepsWithWorks = (works = [], nameForId = () => null) => {
  const byStage = {};
  works.forEach((w) => {
    byStage[w.stageId] = w;
  });
  return VIDEO_STEPS.map((step, index) => {
    const w = byStage[step.id];
    return {
      stageId: step.id,
      name: step.name,
      order: index,
      status: w?.status || STAGE_STATUS.PENDING,
      assigneeId: w?.assigneeId || null,
      assigneeName: w?.assigneeId ? nameForId(w.assigneeId) : null,
      note: w?.note || "",
      dueDate: w?.dueDate || null,
      completedAt: w?.completedAt || null,
    };
  });
};

// Done / total for a video. Reads the cheap `doneCount` rollup; falls back to a
// legacy embedded `stages[]` array for any video not yet migrated.
export const progress = (video) => {
  if (video && Array.isArray(video.stages)) {
    const done = video.stages.filter((s) => s.status === STAGE_STATUS.DONE).length;
    return { done, total: video.stages.length };
  }
  return { done: (video && video.doneCount) || 0, total: VIDEO_STEPS.length };
};
