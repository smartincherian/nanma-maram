import React from "react";
import { render, screen, act } from "@testing-library/react";
import { onAuthStateChanged } from "firebase/auth";
import { fetchAdmin } from "../../firebase/auth";
import { AuthProvider, useAuth } from "./index";

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock("../../firebase/auth", () => ({
  fetchAdmin: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
  AUTH: { __auth: true },
}));

function Consumer() {
  const { user, isAllowed, isOwner, loading } = useAuth();
  if (loading) {
    return <div>state: loading</div>;
  }
  return (
    <div>
      state: ready user:{user ? user.email : "none"} allowed:
      {String(isAllowed)} owner:{String(isOwner)}
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
    onAuthStateChanged.mockImplementation((auth, cb) => {
      authCallback = cb;
      return jest.fn();
    });
  });

  it("starts in a loading state until the first auth event resolves", () => {
    renderProvider();
    expect(screen.getByText(/state: loading/)).toBeInTheDocument();
  });

  it("resolves to signed-out when there is no user", async () => {
    renderProvider();
    await act(async () => {
      authCallback(null);
    });
    expect(
      screen.getByText(/state: ready user:none allowed:false owner:false/)
    ).toBeInTheDocument();
  });

  it("resolves to allowed (non-owner) when the email is a plain admin", async () => {
    fetchAdmin.mockResolvedValue({
      email: "admin@example.com",
      role: "admin",
    });
    renderProvider();
    await act(async () => {
      authCallback({ email: "admin@example.com" });
    });
    expect(fetchAdmin).toHaveBeenCalledWith("admin@example.com");
    expect(
      screen.getByText(
        /state: ready user:admin@example.com allowed:true owner:false/
      )
    ).toBeInTheDocument();
  });

  it("resolves to owner when the admin record has role owner", async () => {
    fetchAdmin.mockResolvedValue({
      email: "owner@example.com",
      role: "owner",
    });
    renderProvider();
    await act(async () => {
      authCallback({ email: "owner@example.com" });
    });
    expect(
      screen.getByText(
        /state: ready user:owner@example.com allowed:true owner:true/
      )
    ).toBeInTheDocument();
  });

  it("resolves to denied when the email is not on the allowlist", async () => {
    fetchAdmin.mockResolvedValue(null);
    renderProvider();
    await act(async () => {
      authCallback({ email: "stranger@example.com" });
    });
    expect(
      screen.getByText(
        /state: ready user:stranger@example.com allowed:false owner:false/
      )
    ).toBeInTheDocument();
  });

  it("treats a failed allowlist lookup as not allowed", async () => {
    fetchAdmin.mockRejectedValue(new Error("network"));
    renderProvider();
    await act(async () => {
      authCallback({ email: "admin@example.com" });
    });
    expect(
      screen.getByText(
        /state: ready user:admin@example.com allowed:false owner:false/
      )
    ).toBeInTheDocument();
  });
});
