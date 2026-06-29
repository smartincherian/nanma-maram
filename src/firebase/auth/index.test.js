import { doc, getDoc } from "firebase/firestore";
import { fetchAdmin } from "./index";

jest.mock("firebase/auth", () => ({
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
  DB: { __db: true },
  AUTH: { __auth: true },
  googleProvider: { __provider: true },
}));

describe("fetchAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    doc.mockReturnValue("adminDocRef");
  });

  it("returns the admin record (with lowercased email as id) when present", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      id: "admin@example.com",
      data: () => ({ name: "Admin", contact: "123", role: "owner" }),
    });

    const result = await fetchAdmin("Admin@Example.com");

    expect(doc).toHaveBeenCalledWith(
      { __db: true },
      "admins",
      "admin@example.com"
    );
    expect(getDoc).toHaveBeenCalledWith("adminDocRef");
    expect(result).toEqual({
      email: "admin@example.com",
      name: "Admin",
      contact: "123",
      role: "owner",
    });
  });

  it("returns null when the admin doc does not exist", async () => {
    getDoc.mockResolvedValue({ exists: () => false });

    expect(await fetchAdmin("nobody@example.com")).toBeNull();
  });

  it("returns null for a falsy email without querying Firestore", async () => {
    expect(await fetchAdmin("")).toBeNull();
    expect(await fetchAdmin(undefined)).toBeNull();
    expect(getDoc).not.toHaveBeenCalled();
  });
});
