import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { fetchCrewByEmail, registerCrew, setCrewActive } from "./crew";

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: () => "SERVER_TS",
  updateDoc: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({ DB: { __db: true } }));

describe("crew accounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    doc.mockReturnValue("crewRef");
  });

  describe("fetchCrewByEmail", () => {
    it("returns the record keyed by lowercased email", async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        id: "person@example.com",
        data: () => ({ name: "Person", phone: "999", skills: ["Shorts"], active: true }),
      });
      const result = await fetchCrewByEmail("Person@Example.com");
      expect(doc).toHaveBeenCalledWith({ __db: true }, "videoCrew", "person@example.com");
      expect(result).toEqual({
        id: "person@example.com",
        name: "Person",
        phone: "999",
        skills: ["Shorts"],
        active: true,
      });
    });

    it("returns null when the doc is missing", async () => {
      getDoc.mockResolvedValue({ exists: () => false });
      expect(await fetchCrewByEmail("nobody@example.com")).toBeNull();
    });

    it("returns null for a falsy email without querying", async () => {
      expect(await fetchCrewByEmail("")).toBeNull();
      expect(getDoc).not.toHaveBeenCalled();
    });
  });

  describe("registerCrew", () => {
    it("writes an active record keyed by lowercased, trimmed email", async () => {
      await registerCrew({
        email: " Person@Example.com ",
        name: "  Person  ",
        phone: " 99999 ",
        skills: ["Shorts", "Promo"],
      });
      expect(doc).toHaveBeenCalledWith({ __db: true }, "videoCrew", "person@example.com");
      expect(setDoc).toHaveBeenCalledWith("crewRef", {
        name: "Person",
        email: "person@example.com",
        phone: "99999",
        skills: ["Shorts", "Promo"],
        active: true,
        createdAt: "SERVER_TS",
      });
    });

    it("throws when name, phone, email, or skills are missing", async () => {
      await expect(registerCrew({ email: "", name: "A", phone: "1", skills: ["Shorts"] })).rejects.toThrow();
      await expect(registerCrew({ email: "a@b.com", name: " ", phone: "1", skills: ["Shorts"] })).rejects.toThrow();
      await expect(registerCrew({ email: "a@b.com", name: "A", phone: " ", skills: ["Shorts"] })).rejects.toThrow();
      await expect(registerCrew({ email: "a@b.com", name: "A", phone: "1", skills: [] })).rejects.toThrow();
      expect(setDoc).not.toHaveBeenCalled();
    });
  });

  describe("setCrewActive", () => {
    it("updates only the active flag", async () => {
      await setCrewActive("person@example.com", false);
      expect(doc).toHaveBeenCalledWith({ __db: true }, "videoCrew", "person@example.com");
      expect(updateDoc).toHaveBeenCalledWith("crewRef", { active: false });
    });
  });
});
