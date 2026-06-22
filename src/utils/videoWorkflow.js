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

// Build the embedded stages[] for a brand new video from its type's ordered
// stageIds. Names are snapshotted from stagesById so later renames/deletes of
// the master stage never mutate this video.
export const buildStagesForType = (type, stagesById = {}) => {
  const stageIds = (type && type.stageIds) || [];
  return stageIds
    .map((stageId) => stagesById[stageId])
    .filter(Boolean)
    .map((stage, index) => ({
      stageId: stage.id,
      name: stage.name,
      order: index,
      assigneeId: null,
      assigneeName: null,
      status: STAGE_STATUS.PENDING,
      note: "",
      completedAt: null,
    }));
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

// For each crew member, gather their active (non-done) assignments across
// active videos. Busy = at least one such assignment.
export const computeCrewWorkload = (videos = [], crew = []) => {
  return crew.map((member) => {
    const assignments = [];

    videos.forEach((video) => {
      if (video.status !== VIDEO_STATUS.ACTIVE) {
        return;
      }
      (video.stages || []).forEach((stage) => {
        if (
          stage.assigneeId === member.id &&
          stage.status !== STAGE_STATUS.DONE
        ) {
          assignments.push({
            videoId: video.id,
            videoTitle: video.title,
            stageName: stage.name,
            status: stage.status,
          });
        }
      });
    });

    return { ...member, busy: assignments.length > 0, assignments };
  });
};
