import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import ProtectedRoute from "./index";

jest.mock("../AuthProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../AdminRouteGate", () => () => <div>admin route gate</div>);

const Protected = () => <div>protected content</div>;

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ProtectedRoute>
        <Protected />
      </ProtectedRoute>
    </MemoryRouter>
  );

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children on public prayer-bank routes regardless of auth", () => {
    useAuth.mockReturnValue({ user: null, isAllowed: false, loading: true });
    renderAt("/prayer-bank/abc");
    expect(screen.getByText("protected content")).toBeInTheDocument();
  });

  it("renders a loading indicator while auth is resolving", () => {
    useAuth.mockReturnValue({ user: null, isAllowed: false, loading: true });
    renderAt("/intention-list");
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("renders the sign-in gate when there is no user", () => {
    useAuth.mockReturnValue({ user: null, isAllowed: false, loading: false });
    renderAt("/intention-list");
    expect(screen.getByText("admin route gate")).toBeInTheDocument();
  });

  it("shows the gate (no redirect) when the user is signed in but not allowlisted", () => {
    useAuth.mockReturnValue({
      user: { email: "stranger@example.com" },
      isAllowed: false,
      loading: false,
    });
    renderAt("/intention-list");
    expect(screen.getByText("admin route gate")).toBeInTheDocument();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("renders children when the user is allowlisted", () => {
    useAuth.mockReturnValue({
      user: { email: "admin@example.com" },
      isAllowed: true,
      loading: false,
    });
    renderAt("/intention-list");
    expect(screen.getByText("protected content")).toBeInTheDocument();
  });
});
