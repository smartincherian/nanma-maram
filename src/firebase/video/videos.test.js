import { getDocs, limit, startAfter, where } from "firebase/firestore";
import { listVideosPage } from "./videos";
import { VIDEO_STATUS } from "../../utils/videoWorkflow";

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(() => "COL"),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn((n) => ({ limit: n })),
  onSnapshot: jest.fn(),
  orderBy: jest.fn((f, d) => ({ orderBy: [f, d] })),
  query: jest.fn((...args) => args),
  serverTimestamp: jest.fn(() => "TS"),
  startAfter: jest.fn((c) => ({ startAfter: c })),
  updateDoc: jest.fn(),
  where: jest.fn((f, op, v) => ({ where: [f, op, v] })),
}));

jest.mock("../../config/firebase", () => ({ DB: { __db: true } }));

// Build a fake Firestore snapshot from a list of { id, ...fields } objects.
const snap = (items) => ({
  docs: items.map((it) => ({ id: it.id, data: () => it })),
});
const mk = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `v${i}`, title: `t${i}` }));

beforeEach(() => jest.clearAllMocks());

describe("listVideosPage", () => {
  it("returns only pageSize videos and hasMore=true when an extra doc is fetched", async () => {
    getDocs.mockResolvedValue(snap(mk(4))); // pageSize 3 → fetches 4
    const res = await listVideosPage({ filter: "pending", pageSize: 3 });
    expect(res.videos.map((v) => v.id)).toEqual(["v0", "v1", "v2"]);
    expect(res.hasMore).toBe(true);
    expect(limit).toHaveBeenCalledWith(4);
  });

  it("returns all docs and hasMore=false when fewer than pageSize+1 fetched", async () => {
    getDocs.mockResolvedValue(snap(mk(2)));
    const res = await listVideosPage({ filter: "pending", pageSize: 3 });
    expect(res.videos).toHaveLength(2);
    expect(res.hasMore).toBe(false);
  });

  it("cursor is the snapshot of the last returned doc", async () => {
    getDocs.mockResolvedValue(snap(mk(4)));
    const res = await listVideosPage({ filter: "pending", pageSize: 3 });
    expect(res.cursor.id).toBe("v2");
  });

  it("returns a null cursor for an empty page", async () => {
    getDocs.mockResolvedValue(snap([]));
    const res = await listVideosPage({ filter: "done", pageSize: 3 });
    expect(res.videos).toEqual([]);
    expect(res.cursor).toBeNull();
    expect(res.hasMore).toBe(false);
  });

  it("pending filter queries status == active", async () => {
    getDocs.mockResolvedValue(snap([]));
    await listVideosPage({ filter: "pending", pageSize: 3 });
    expect(where).toHaveBeenCalledWith("status", "==", VIDEO_STATUS.ACTIVE);
  });

  it("done filter queries status in [completed, rejected]", async () => {
    getDocs.mockResolvedValue(snap([]));
    await listVideosPage({ filter: "done", pageSize: 3 });
    expect(where).toHaveBeenCalledWith("status", "in", [
      VIDEO_STATUS.COMPLETED,
      VIDEO_STATUS.REJECTED,
    ]);
  });

  it("appends startAfter when a cursor is supplied", async () => {
    getDocs.mockResolvedValue(snap(mk(1)));
    const cursorDoc = { id: "prev" };
    await listVideosPage({ filter: "pending", pageSize: 3, cursor: cursorDoc });
    expect(startAfter).toHaveBeenCalledWith(cursorDoc);
  });

  it("omits startAfter on the first page", async () => {
    getDocs.mockResolvedValue(snap(mk(1)));
    await listVideosPage({ filter: "pending", pageSize: 3 });
    expect(startAfter).not.toHaveBeenCalled();
  });
});
