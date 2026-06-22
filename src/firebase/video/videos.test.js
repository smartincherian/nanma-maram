import { doc, runTransaction } from "firebase/firestore";
import { updateVideoStage } from "./videos";
import { STAGE_STATUS, VIDEO_STATUS } from "../../utils/videoWorkflow";

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => "TS"),
  updateDoc: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
  DB: { __db: true },
}));

describe("updateVideoStage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    doc.mockReturnValue("videoRef");
  });

  const run = (initialStages, stageId, patch) => {
    let written = null;
    runTransaction.mockImplementation(async (_db, cb) => {
      const tx = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ stages: initialStages, status: VIDEO_STATUS.ACTIVE }),
        }),
        update: jest.fn((_ref, payload) => {
          written = payload;
        }),
      };
      return cb(tx);
    });
    return updateVideoStage("v1", stageId, patch, "admin@x.com").then(
      () => written
    );
  };

  it("sets completedAt and flips video to completed when the last stage is done", async () => {
    const stages = [
      { stageId: "s1", name: "Edit", status: STAGE_STATUS.DONE, completedAt: 1 },
      {
        stageId: "s2",
        name: "Upload",
        status: STAGE_STATUS.IN_PROGRESS,
        completedAt: null,
      },
    ];

    const written = await run(stages, "s2", { status: STAGE_STATUS.DONE });

    const updated = written.stages.find((s) => s.stageId === "s2");
    expect(updated.status).toBe(STAGE_STATUS.DONE);
    expect(updated.completedAt).not.toBeNull();
    expect(updated.updatedBy).toBe("admin@x.com");
    expect(written.status).toBe(VIDEO_STATUS.COMPLETED);
  });

  it("clears completedAt when a stage moves back from done", async () => {
    const stages = [
      {
        stageId: "s1",
        name: "Edit",
        status: STAGE_STATUS.DONE,
        completedAt: 123,
      },
    ];

    const written = await run(stages, "s1", {
      status: STAGE_STATUS.IN_PROGRESS,
    });

    const updated = written.stages.find((s) => s.stageId === "s1");
    expect(updated.completedAt).toBeNull();
    expect(written.status).toBe(VIDEO_STATUS.ACTIVE);
  });
});
