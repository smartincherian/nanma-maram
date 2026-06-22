import {
  STAGE_STATUS,
  VIDEO_STATUS,
  buildStagesForType,
  deriveStatus,
  progress,
  currentStage,
  computeCrewWorkload,
} from "./videoWorkflow";

describe("buildStagesForType", () => {
  const stagesById = {
    s1: { id: "s1", name: "Source", order: 0 },
    s2: { id: "s2", name: "Edit", order: 1 },
    s3: { id: "s3", name: "Upload", order: 2 },
  };

  it("builds stages in the order given by type.stageIds, pulling names", () => {
    const type = { id: "t1", name: "Short", stageIds: ["s3", "s1"] };

    const result = buildStagesForType(type, stagesById);

    expect(result).toEqual([
      {
        stageId: "s3",
        name: "Upload",
        order: 0,
        assigneeId: null,
        assigneeName: null,
        status: STAGE_STATUS.PENDING,
        note: "",
        completedAt: null,
      },
      {
        stageId: "s1",
        name: "Source",
        order: 1,
        assigneeId: null,
        assigneeName: null,
        status: STAGE_STATUS.PENDING,
        note: "",
        completedAt: null,
      },
    ]);
  });

  it("skips stage ids that are missing from stagesById", () => {
    const type = { id: "t1", name: "Short", stageIds: ["s1", "missing", "s2"] };

    const result = buildStagesForType(type, stagesById);

    expect(result.map((s) => s.stageId)).toEqual(["s1", "s2"]);
  });

  it("returns an empty array when the type has no stageIds", () => {
    expect(buildStagesForType({ name: "X" }, stagesById)).toEqual([]);
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

describe("computeCrewWorkload", () => {
  const crew = [
    { id: "c1", name: "Binla" },
    { id: "c2", name: "Feba" },
    { id: "c3", name: "Hima" },
  ];

  it("marks crew busy for non-done stages on active videos, free otherwise", () => {
    const videos = [
      {
        id: "v1",
        title: "Easter Short",
        status: VIDEO_STATUS.ACTIVE,
        stages: [
          {
            stageId: "s1",
            name: "Edit",
            assigneeId: "c1",
            status: STAGE_STATUS.IN_PROGRESS,
          },
          {
            stageId: "s2",
            name: "Upload",
            assigneeId: "c2",
            status: STAGE_STATUS.DONE,
          },
        ],
      },
    ];

    const result = computeCrewWorkload(videos, crew);
    const byId = Object.fromEntries(result.map((r) => [r.id, r]));

    expect(byId.c1.busy).toBe(true);
    expect(byId.c1.assignments).toEqual([
      {
        videoId: "v1",
        videoTitle: "Easter Short",
        stageName: "Edit",
        status: STAGE_STATUS.IN_PROGRESS,
      },
    ]);
    // c2 only has a done stage -> free
    expect(byId.c2.busy).toBe(false);
    expect(byId.c2.assignments).toEqual([]);
    // c3 has nothing -> free
    expect(byId.c3.busy).toBe(false);
  });

  it("ignores completed videos when computing busyness", () => {
    const videos = [
      {
        id: "v1",
        title: "Done One",
        status: VIDEO_STATUS.COMPLETED,
        stages: [
          {
            stageId: "s1",
            name: "Edit",
            assigneeId: "c1",
            status: STAGE_STATUS.IN_PROGRESS,
          },
        ],
      },
    ];

    const result = computeCrewWorkload(videos, crew);
    const c1 = result.find((r) => r.id === "c1");
    expect(c1.busy).toBe(false);
  });
});
