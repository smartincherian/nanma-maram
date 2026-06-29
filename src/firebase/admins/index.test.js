import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  addAdmin,
  deleteAdmin,
  listAdmins,
  updateAdmin,
} from "./index";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
  DB: { __db: true },
}));

describe("listAdmins", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    collection.mockReturnValue("adminsCollectionRef");
  });

  it("maps documents to records and sorts them by createdAt ascending", async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: "b@example.com",
          data: () => ({ name: "B", contact: "2", createdAt: 200 }),
        },
        {
          id: "a@example.com",
          data: () => ({ name: "A", contact: "1", createdAt: 100 }),
        },
      ],
    });

    const result = await listAdmins();

    expect(collection).toHaveBeenCalledWith({ __db: true }, "admins");
    expect(result).toEqual([
      { email: "a@example.com", name: "A", contact: "1", createdAt: 100 },
      { email: "b@example.com", name: "B", contact: "2", createdAt: 200 },
    ]);
  });
});

describe("addAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    doc.mockReturnValue("adminDocRef");
    serverTimestamp.mockReturnValue("SERVER_TS");
  });

  it("creates a new admin with a lowercased email id, role admin and a timestamp", async () => {
    getDoc.mockResolvedValue({ exists: () => false });

    await addAdmin({
      email: "New@Example.com",
      name: "New Admin",
      contact: "555",
    });

    expect(doc).toHaveBeenCalledWith(
      { __db: true },
      "admins",
      "new@example.com"
    );
    expect(setDoc).toHaveBeenCalledWith("adminDocRef", {
      name: "New Admin",
      contact: "555",
      role: "admin",
      createdAt: "SERVER_TS",
    });
  });

  it("stores an empty string when no contact is provided", async () => {
    getDoc.mockResolvedValue({ exists: () => false });

    await addAdmin({ email: "x@example.com", name: "X" });

    expect(setDoc).toHaveBeenCalledWith(
      "adminDocRef",
      expect.objectContaining({ contact: "" })
    );
  });

  it("rejects a duplicate email without writing", async () => {
    getDoc.mockResolvedValue({ exists: () => true });

    await expect(
      addAdmin({ email: "dup@example.com", name: "Dup" })
    ).rejects.toThrow(/already exists/i);
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("rejects when email or name is missing", async () => {
    await expect(addAdmin({ email: "", name: "X" })).rejects.toThrow();
    await expect(
      addAdmin({ email: "x@example.com", name: "" })
    ).rejects.toThrow();
    expect(setDoc).not.toHaveBeenCalled();
  });
});

describe("updateAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    doc.mockReturnValue("adminDocRef");
  });

  it("updates only name and contact on the lowercased doc", async () => {
    await updateAdmin("Admin@Example.com", {
      name: "Renamed",
      contact: "999",
    });

    expect(doc).toHaveBeenCalledWith(
      { __db: true },
      "admins",
      "admin@example.com"
    );
    expect(updateDoc).toHaveBeenCalledWith("adminDocRef", {
      name: "Renamed",
      contact: "999",
    });
  });
});

describe("deleteAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    doc.mockReturnValue("adminDocRef");
  });

  it("deletes the lowercased doc", async () => {
    await deleteAdmin("Admin@Example.com");

    expect(doc).toHaveBeenCalledWith(
      { __db: true },
      "admins",
      "admin@example.com"
    );
    expect(deleteDoc).toHaveBeenCalledWith("adminDocRef");
  });
});
