import React from "react";
import { render, screen, act } from "@testing-library/react";
import { onAuthStateChanged } from "firebase/auth";
import { fetchAdmin } from "../../firebase/auth";
import { fetchCrewByEmail } from "../../firebase/video/crew";
import { AuthProvider, useAuth } from "./index";

jest.mock("firebase/auth", () => ({ onAuthStateChanged: jest.fn() }));
jest.mock("../../firebase/auth", () => ({ fetchAdmin: jest.fn() }));
jest.mock("../../firebase/video/crew", () => ({ fetchCrewByEmail: jest.fn() }));
jest.mock("../../config/firebase", () => ({ AUTH: { __auth: true } }));

function Consumer() {
  const { user, isAllowed, isOwner, isCrew, loading } = useAuth();
  if (loading) return <div>state: loading</div>;
  return (
    <div>
      state: ready user:{user ? user.email : "none"} allowed:{String(isAllowed)}{" "}
      owner:{String(isOwner)} crew:{String(isCrew)}
    </div>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );

describe("AuthProvider", () => {
  let authCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    authCallback = null;
    fetchAdmin.mockResolvedValue(null);
    fetchCrewByEmail.mockResolvedValue(null);
    onAuthStateChanged.mockImplementation((auth, cb) => {
      authCallback = cb;
      return jest.fn();
    });
  });

  it("starts loading until the first auth event resolves", () => {
    renderProvider();
    expect(screen.getByText(/state: loading/)).toBeInTheDocument();
  });

  it("resolves to signed-out when there is no user", async () => {
    renderProvider();
    await act(async () => authCallback(null));
    expect(
      screen.getByText(/state: ready user:none allowed:false owner:false crew:false/)
    ).toBeInTheDocument();
  });

  it("flags an allowlisted admin", async () => {
    fetchAdmin.mockResolvedValue({ email: "owner@example.com", role: "owner" });
    renderProvider();
    await act(async () => authCallback({ email: "owner@example.com" }));
    expect(fetchCrewByEmail).toHaveBeenCalledWith("owner@example.com");
    expect(
      screen.getByText(/allowed:true owner:true crew:false/)
    ).toBeInTheDocument();
  });

  it("flags an active crew member", async () => {
    fetchCrewByEmail.mockResolvedValue({ id: "c@example.com", active: true });
    renderProvider();
    await act(async () => authCallback({ email: "c@example.com" }));
    expect(screen.getByText(/allowed:false owner:false crew:true/)).toBeInTheDocument();
  });

  it("does not flag a deactivated crew member as crew", async () => {
    fetchCrewByEmail.mockResolvedValue({ id: "c@example.com", active: false });
    renderProvider();
    await act(async () => authCallback({ email: "c@example.com" }));
    expect(screen.getByText(/crew:false/)).toBeInTheDocument();
  });

  it("treats a failed lookup as not allowed and not crew", async () => {
    fetchAdmin.mockRejectedValue(new Error("network"));
    renderProvider();
    await act(async () => authCallback({ email: "x@example.com" }));
    expect(
      screen.getByText(/allowed:false owner:false crew:false/)
    ).toBeInTheDocument();
  });
});
