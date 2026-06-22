import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { addStage, listStages } from "./stages";

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(),
  updateDoc: jest.fn(),
  writeBatch: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
  DB: { __db: true },
}));

describe("listStages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    collection.mockReturnValue("stagesRef");
  });

  it("maps docs and sorts by order ascending", async () => {
    getDocs.mockResolvedValue({
      docs: [
        { id: "b", data: () => ({ name: "Edit", order: 1 }) },
        { id: "a", data: () => ({ name: "Source", order: 0 }) },
      ],
    });

    const result = await listStages();

    expect(collection).toHaveBeenCalledWith({ __db: true }, "videoStages");
    expect(result).toEqual([
      { id: "a", name: "Source", order: 0 },
      { id: "b", name: "Edit", order: 1 },
    ]);
  });
});

describe("addStage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    collection.mockReturnValue("stagesRef");
    serverTimestamp.mockReturnValue("TS");
    getDocs.mockResolvedValue({ size: 2, docs: [] });
  });

  it("adds a stage with a name, next order and a timestamp", async () => {
    await addStage({ name: "Thumbnail" });

    expect(addDoc).toHaveBeenCalledWith("stagesRef", {
      name: "Thumbnail",
      order: 2,
      createdAt: "TS",
    });
  });

  it("rejects an empty name", async () => {
    await expect(addStage({ name: "  " })).rejects.toThrow();
    expect(addDoc).not.toHaveBeenCalled();
  });
});
