import {
  STAGE_STATUS,
  mergeStepsWithWorks,
  progress,
} from "./videoWorkflow";
import { VIDEO_STEPS } from "./videoSteps";

describe("mergeStepsWithWorks", () => {
  it("overlays works onto every step, in order, defaulting untouched steps to pending", () => {
    const works = [
      {
        stageId: "caption_creation",
        status: STAGE_STATUS.DONE,
        assigneeId: "mary@x.com",
        note: "done it",
        completedAt: 123,
      },
    ];
    const result = mergeStepsWithWorks(works, (id) =>
      id === "mary@x.com" ? "Mary" : null
    );

    expect(result).toHaveLength(VIDEO_STEPS.length);
    expect(result.map((s) => s.stageId)).toEqual(VIDEO_STEPS.map((s) => s.id));

    const caption = result.find((s) => s.stageId === "caption_creation");
    expect(caption.status).toBe(STAGE_STATUS.DONE);
    expect(caption.assigneeName).toBe("Mary");
    expect(caption.note).toBe("done it");
    expect(caption.completedAt).toBe(123);

    const untouched = result.find((s) => s.stageId === "uploading");
    expect(untouched.status).toBe(STAGE_STATUS.PENDING);
    expect(untouched.assigneeId).toBeNull();
    expect(untouched.assigneeName).toBeNull();
  });

  it("returns all-pending steps when there are no works", () => {
    const result = mergeStepsWithWorks([]);
    expect(result).toHaveLength(VIDEO_STEPS.length);
    expect(result.every((s) => s.status === STAGE_STATUS.PENDING)).toBe(true);
  });
});

describe("progress", () => {
  it("reads the doneCount rollup against the fixed step count", () => {
    expect(progress({ doneCount: 3 })).toEqual({ done: 3, total: VIDEO_STEPS.length });
  });

  it("defaults to zero done for a video with no rollup", () => {
    expect(progress({})).toEqual({ done: 0, total: VIDEO_STEPS.length });
    expect(progress(null)).toEqual({ done: 0, total: VIDEO_STEPS.length });
  });

  it("falls back to a legacy embedded stages[] array", () => {
    const video = {
      stages: [
        { status: STAGE_STATUS.DONE },
        { status: STAGE_STATUS.PENDING },
        { status: STAGE_STATUS.DONE },
      ],
    };
    expect(progress(video)).toEqual({ done: 2, total: 3 });
  });
});
