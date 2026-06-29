import { addDoc, collection, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  addCrew,
  fetchCrewByEmail,
  registerCrew,
  setCrewActive,
  setCrewAvailability,
  updateCrew,
  updateCrewProfile,
} from "./crew";

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

    it("trims whitespace before lowercasing the doc id", async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        id: "person@example.com",
        data: () => ({ name: "Person" }),
      });
      await fetchCrewByEmail("  Person@Example.com  ");
      expect(doc).toHaveBeenCalledWith({ __db: true }, "videoCrew", "person@example.com");
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

    it("throws when name, email, or skills are missing (phone is optional)", async () => {
      await expect(registerCrew({ email: "", name: "A", phone: "1", skills: ["Shorts"] })).rejects.toThrow();
      await expect(registerCrew({ email: "a@b.com", name: " ", phone: "1", skills: ["Shorts"] })).rejects.toThrow();
      await expect(registerCrew({ email: "a@b.com", name: "A", phone: "1", skills: [] })).rejects.toThrow();
      expect(setDoc).not.toHaveBeenCalled();
    });

    it("registers when phone is empty", async () => {
      await registerCrew({ email: "a@b.com", name: "A", phone: "", skills: ["Shorts"] });
      expect(setDoc).toHaveBeenCalled();
    });
  });

  describe("setCrewActive", () => {
    it("updates only the active flag", async () => {
      await setCrewActive("person@example.com", false);
      expect(doc).toHaveBeenCalledWith({ __db: true }, "videoCrew", "person@example.com");
      expect(updateDoc).toHaveBeenCalledWith("crewRef", { active: false });
    });
  });

  describe("addCrew", () => {
    it("writes email (trimmed+lowercased) and has NO linkedEmail key", async () => {
      collection.mockReturnValue("crewCollection");
      addDoc.mockResolvedValue({});
      await addCrew({ name: "Alice", skills: ["Shorts"], email: "  Alice@Example.COM  " });
      expect(addDoc).toHaveBeenCalledWith("crewCollection", expect.objectContaining({
        name: "Alice",
        skills: ["Shorts"],
        email: "alice@example.com",
        active: true,
        createdAt: "SERVER_TS",
      }));
      const written = addDoc.mock.calls[0][1];
      expect(written).not.toHaveProperty("linkedEmail");
    });
  });

  describe("updateCrew", () => {
    it("writes email, phone (trimmed) and has NO linkedEmail key", async () => {
      updateDoc.mockResolvedValue({});
      await updateCrew("abc123", {
        name: "  Bob  ",
        skills: ["Long"],
        email: "  Bob@Example.COM  ",
        phone: "  1234  ",
        active: true,
      });
      expect(updateDoc).toHaveBeenCalledWith("crewRef", {
        name: "Bob",
        skills: ["Long"],
        email: "bob@example.com",
        phone: "1234",
        active: true,
      });
      const written = updateDoc.mock.calls[0][1];
      expect(written).not.toHaveProperty("linkedEmail");
    });
  });

  describe("setCrewAvailability", () => {
    it("updates only the available flag", async () => {
      await setCrewAvailability("person@example.com", false);
      expect(doc).toHaveBeenCalledWith({ __db: true }, "videoCrew", "person@example.com");
      expect(updateDoc).toHaveBeenCalledWith("crewRef", { available: false });
    });
  });

  describe("updateCrewProfile", () => {
    it("updates only name/phone/skills (no email/active/createdAt)", async () => {
      await updateCrewProfile("person@example.com", {
        name: "  New Name  ",
        phone: "  555  ",
        skills: ["Promo", "Caption"],
      });
      expect(updateDoc).toHaveBeenCalledWith("crewRef", {
        name: "New Name",
        phone: "555",
        skills: ["Promo", "Caption"],
      });
      const written = updateDoc.mock.calls[0][1];
      expect(written).not.toHaveProperty("email");
      expect(written).not.toHaveProperty("active");
    });

    it("throws when name or skills are missing (phone is optional)", async () => {
      await expect(updateCrewProfile("id", { name: " ", phone: "1", skills: ["Shorts"] })).rejects.toThrow();
      await expect(updateCrewProfile("id", { name: "A", phone: "1", skills: [] })).rejects.toThrow();
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it("updates when phone is empty", async () => {
      await updateCrewProfile("id", { name: "A", phone: "", skills: ["Shorts"] });
      expect(updateDoc).toHaveBeenCalled();
    });
  });
});
