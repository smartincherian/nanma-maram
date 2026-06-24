import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import CrewHome from "./index";

jest.mock("../../components/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("../../firebase/auth", () => ({ signOutUser: jest.fn() }));
jest.mock("../../firebase/video/crew", () => ({ setCrewAvailability: jest.fn() }));
jest.mock("../../components/Snackbar", () => {
  const React = require("react");
  return {
    SnackbarContext: React.createContext({ showSnackbar: jest.fn(), hideSnackbar: jest.fn() }),
    SNACK_BAR_SEVERITY_TYPES: { ERROR: "error", SUCCESS: "success" },
  };
});

const activeCrew = {
  user: { photoURL: "" },
  crew: { id: "p@example.com", name: "Person", email: "p@example.com", phone: "999", skills: ["Shorts", "Promo"], available: true },
  isCrew: true, loading: false, refreshCrew: jest.fn(),
};

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={["/crew"]}>
      <CrewHome />
    </MemoryRouter>
  );

describe("CrewHome", () => {
  beforeEach(() => jest.clearAllMocks());

  it("redirects to join when the user is not crew", () => {
    useAuth.mockReturnValue({ crew: null, isCrew: false, loading: false });
    renderHome();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  it("renders the crew profile for an active crew member", () => {
    useAuth.mockReturnValue(activeCrew);
    renderHome();
    expect(screen.getByText(/Welcome, Person/i)).toBeInTheDocument();
    expect(screen.getByText(/Jesus Loves You/i)).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("shows the availability toggle as available by default", () => {
    useAuth.mockReturnValue(activeCrew);
    renderHome();
    expect(screen.getByText(/you're available for new work/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("opens the account menu with Profile and Logout", () => {
    useAuth.mockReturnValue(activeCrew);
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
    expect(screen.getByRole("menuitem", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /logout/i })).toBeInTheDocument();
  });

  it("shows a spinner while loading", () => {
    useAuth.mockReturnValue({ crew: null, isCrew: false, loading: true });
    renderHome();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });
});
