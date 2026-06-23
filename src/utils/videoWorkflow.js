// Pure, framework-free helpers for the video tracking pipeline.
// Kept side-effect free so they are trivial to unit test.

export const STAGE_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

export const VIDEO_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  ON_HOLD: "on_hold",
};

export const PRIORITY = {
  NORMAL: "normal",
  HIGH: "high",
};

// Normalize a pipeline so exactly one stage is active: the first not-done stage
// becomes in_progress, every later not-done stage becomes pending, and done
// stages are left as-is. This single rule drives all auto-advancing — on
// create, after a stage is completed, and after a stage is reopened.
export const advancePipeline = (stages = []) => {
  let activated = false;
  return stages.map((stage) => {
    if (stage.status === STAGE_STATUS.DONE) {
      return stage;
    }
    if (!activated) {
      activated = true;
      return { ...stage, status: STAGE_STATUS.IN_PROGRESS };
    }
    return { ...stage, status: STAGE_STATUS.PENDING };
  });
};

// Build the embedded stages[] for a brand new video from the global, ordered
// list of steps. Names are snapshotted so later renames/deletes of a master
// step never mutate existing videos. The pipeline is normalized so the first
// step starts in_progress.
export const buildStagesFromList = (steps = []) => {
  const stages = steps.map((step, index) => ({
    stageId: step.id,
    name: step.name,
    order: index,
    assigneeId: null,
    assigneeName: null,
    status: STAGE_STATUS.PENDING,
    note: "",
    completedAt: null,
  }));
  return advancePipeline(stages);
};

// A video is completed only when it has stages and every one is done.
export const deriveStatus = (stages = []) => {
  if (stages.length > 0 && stages.every((s) => s.status === STAGE_STATUS.DONE)) {
    return VIDEO_STATUS.COMPLETED;
  }
  return VIDEO_STATUS.ACTIVE;
};

export const progress = (video) => {
  const stages = (video && video.stages) || [];
  const done = stages.filter((s) => s.status === STAGE_STATUS.DONE).length;
  return { done, total: stages.length };
};

// The first stage that is not yet done — i.e. where the work currently sits.
export const currentStage = (video) => {
  const stages = (video && video.stages) || [];
  return stages.find((s) => s.status !== STAGE_STATUS.DONE) || null;
};
