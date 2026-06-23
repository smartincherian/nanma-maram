import {
  STAGE_STATUS,
  VIDEO_STATUS,
  advancePipeline,
  buildStagesFromList,
  deriveStatus,
  progress,
  currentStage,
  computeCrewWorkload,
} from "./videoWorkflow";

describe("advancePipeline", () => {
  it("makes the first not-done stage in_progress and the rest pending", () => {
    const result = advancePipeline([
      { stageId: "a", status: STAGE_STATUS.PENDING },
      { stageId: "b", status: STAGE_STATUS.PENDING },
      { stageId: "c", status: STAGE_STATUS.PENDING },
    ]);
    expect(result.map((s) => s.status)).toEqual([
      STAGE_STATUS.IN_PROGRESS,
      STAGE_STATUS.PENDING,
      STAGE_STATUS.PENDING,
    ]);
  });

  it("keeps done stages and activates the first stage after them", () => {
    const result = advancePipeline([
      { stageId: "a", status: STAGE_STATUS.DONE },
      { stageId: "b", status: STAGE_STATUS.PENDING },
      { stageId: "c", status: STAGE_STATUS.PENDING },
    ]);
    expect(result.map((s) => s.status)).toEqual([
      STAGE_STATUS.DONE,
      STAGE_STATUS.IN_PROGRESS,
      STAGE_STATUS.PENDING,
    ]);
  });

  it("normalizes a mid-pipeline in_progress back to the earliest unfinished stage", () => {
    const result = advancePipeline([
      { stageId: "a", status: STAGE_STATUS.PENDING },
      { stageId: "b", status: STAGE_STATUS.IN_PROGRESS },
    ]);
    expect(result.map((s) => s.status)).toEqual([
      STAGE_STATUS.IN_PROGRESS,
      STAGE_STATUS.PENDING,
    ]);
  });

  it("leaves an all-done pipeline untouched (no active stage)", () => {
    const result = advancePipeline([
      { stageId: "a", status: STAGE_STATUS.DONE },
      { stageId: "b", status: STAGE_STATUS.DONE },
    ]);
    expect(result.map((s) => s.status)).toEqual([
      STAGE_STATUS.DONE,
      STAGE_STATUS.DONE,
    ]);
  });

  it("returns an empty array unchanged", () => {
    expect(advancePipeline([])).toEqual([]);
  });
});

describe("buildStagesFromList", () => {
  const steps = [
    { id: "s1", name: "Source" },
    { id: "s2", name: "Edit" },
    { id: "s3", name: "Upload" },
  ];

  it("builds stages in order, snapshotting names, with the first step active", () => {
    const result = buildStagesFromList(steps);

    expect(result).toEqual([
      {
        stageId: "s1",
        name: "Source",
        order: 0,
        assigneeId: null,
        assigneeName: null,
        status: STAGE_STATUS.IN_PROGRESS,
        note: "",
        completedAt: null,
      },
      {
        stageId: "s2",
        name: "Edit",
        order: 1,
        assigneeId: null,
        assigneeName: null,
        status: STAGE_STATUS.PENDING,
        note: "",
        completedAt: null,
      },
      {
        stageId: "s3",
        name: "Upload",
        order: 2,
        assigneeId: null,
        assigneeName: null,
        status: STAGE_STATUS.PENDING,
        note: "",
        completedAt: null,
      },
    ]);
  });

  it("returns an empty array when there are no steps", () => {
    expect(buildStagesFromList([])).toEqual([]);
  });
});

describe("deriveStatus", () => {
  it("returns completed only when every stage is done", () => {
    expect(
      deriveStatus([
        { status: STAGE_STATUS.DONE },
        { status: STAGE_STATUS.DONE },
      ])
    ).toBe(VIDEO_STATUS.COMPLETED);
  });

  it("returns active when any stage is not done", () => {
    expect(
      deriveStatus([
        { status: STAGE_STATUS.DONE },
        { status: STAGE_STATUS.IN_PROGRESS },
      ])
    ).toBe(VIDEO_STATUS.ACTIVE);
  });

  it("returns active for an empty stage list", () => {
    expect(deriveStatus([])).toBe(VIDEO_STATUS.ACTIVE);
  });
});

describe("progress", () => {
  it("counts done and total stages", () => {
    const video = {
      stages: [
        { status: STAGE_STATUS.DONE },
        { status: STAGE_STATUS.PENDING },
        { status: STAGE_STATUS.DONE },
      ],
    };
    expect(progress(video)).toEqual({ done: 2, total: 3 });
  });

  it("handles a missing stages array", () => {
    expect(progress({})).toEqual({ done: 0, total: 0 });
  });
});

describe("currentStage", () => {
  it("returns the first non-done stage", () => {
    const video = {
      stages: [
        { stageId: "a", status: STAGE_STATUS.DONE },
        { stageId: "b", status: STAGE_STATUS.IN_PROGRESS },
        { stageId: "c", status: STAGE_STATUS.PENDING },
      ],
    };
    expect(currentStage(video).stageId).toBe("b");
  });

  it("returns null when all stages are done", () => {
    const video = {
      stages: [{ status: STAGE_STATUS.DONE }],
    };
    expect(currentStage(video)).toBeNull();
  });
});
