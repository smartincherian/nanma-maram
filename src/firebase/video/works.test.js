import { doc, runTransaction } from "firebase/firestore";
import { updateWork } from "./works";
import { STAGE_STATUS, VIDEO_STATUS } from "../../utils/videoWorkflow";
import { VIDEO_STEPS } from "../../utils/videoSteps";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  deleteField: jest.fn(() => "DELETE"),
  doc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => "TS"),
  where: jest.fn(),
  writeBatch: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
  DB: { __db: true },
}));

// doc(DB, collection, id) → return the id so refs are identifiable by key.
const refKey = (_db, _collection, id) => id;

// Run updateWork against a map of { refKey: status } describing the videos +
// existing work docs, and capture what the transaction wrote.
const run = (existing, videoId, stageId, patch) => {
  doc.mockImplementation(refKey);
  const writes = { set: {}, deleted: [], video: null };
  runTransaction.mockImplementation(async (_db, cb) => {
    const tx = {
      get: jest.fn(async (key) => {
        if (key === videoId) {
          return { exists: () => true, data: () => ({ status: VIDEO_STATUS.ACTIVE }) };
        }
        const has = Object.prototype.hasOwnProperty.call(existing, key);
        return {
          exists: () => has,
          data: () => (has ? { status: existing[key] } : {}),
        };
      }),
      set: jest.fn((key, value) => {
        writes.set[key] = value;
      }),
      delete: jest.fn((key) => {
        writes.deleted.push(key);
      }),
      update: jest.fn((key, value) => {
        if (key === videoId) writes.video = value;
      }),
    };
    return cb(tx);
  });
  return updateWork(videoId, stageId, patch, "admin@x.com").then(() => writes);
};

const wid = (videoId, stageId) => `${videoId}_${stageId}`;

beforeEach(() => jest.clearAllMocks());

describe("updateWork", () => {
  it("completing the last remaining step flips the video to completed with full doneCount", async () => {
    // Every step done except the target ("uploading"), which is in progress.
    const existing = {};
    VIDEO_STEPS.forEach((s) => {
      if (s.id !== "uploading") existing[wid("v1", s.id)] = STAGE_STATUS.DONE;
    });
    existing[wid("v1", "uploading")] = STAGE_STATUS.IN_PROGRESS;

    const writes = await run(existing, "v1", "uploading", { status: STAGE_STATUS.DONE });

    const work = writes.set[wid("v1", "uploading")];
    expect(work.status).toBe(STAGE_STATUS.DONE);
    expect(work.completedAt).not.toBeNull();
    expect(writes.video.doneCount).toBe(VIDEO_STEPS.length);
    expect(writes.video.status).toBe(VIDEO_STATUS.COMPLETED);
  });

  it("recomputes doneCount absolutely from all steps, not by incrementing", async () => {
    // Two steps already done; mark a third done → doneCount must be 3.
    const existing = {
      [wid("v1", "video_collection")]: STAGE_STATUS.DONE,
      [wid("v1", "caption_creation")]: STAGE_STATUS.DONE,
      [wid("v1", "assign_for_editing")]: STAGE_STATUS.IN_PROGRESS,
    };

    const writes = await run(existing, "v1", "assign_for_editing", { status: STAGE_STATUS.DONE });

    expect(writes.video.doneCount).toBe(3);
    expect(writes.video.status).toBe(VIDEO_STATUS.ACTIVE);
  });

  it("clears completedAt when a step moves back from done", async () => {
    const existing = { [wid("v1", "caption_creation")]: STAGE_STATUS.DONE };

    const writes = await run(existing, "v1", "caption_creation", {
      status: STAGE_STATUS.IN_PROGRESS,
      assigneeId: "mary@x.com",
    });

    const work = writes.set[wid("v1", "caption_creation")];
    expect(work.completedAt).toBeNull();
    expect(writes.video.doneCount).toBe(0);
  });

  it("deletes the work doc when a step returns to pending with no assignee or note", async () => {
    const existing = { [wid("v1", "caption_creation")]: STAGE_STATUS.IN_PROGRESS };

    const writes = await run(existing, "v1", "caption_creation", {
      status: STAGE_STATUS.PENDING,
      assigneeId: null,
      note: "",
    });

    expect(writes.deleted).toContain(wid("v1", "caption_creation"));
    expect(writes.set[wid("v1", "caption_creation")]).toBeUndefined();
    expect(writes.video.doneCount).toBe(0);
  });
});
