// src/pages/CrewJoin/index.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import CrewJoin from "./index";

jest.mock("../../components/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("../../firebase/auth", () => ({ signInWithGoogle: jest.fn() }));
jest.mock("../../firebase/video/crew", () => ({ registerCrew: jest.fn() }));
jest.mock("../../components/Snackbar", () => {
  const React = require("react");
  return {
    SnackbarContext: React.createContext({ showSnackbar: jest.fn(), hideSnackbar: jest.fn() }),
    SNACK_BAR_SEVERITY_TYPES: { ERROR: "error", SUCCESS: "success" },
  };
});

const renderJoin = () =>
  render(
    <MemoryRouter initialEntries={["/crew/join"]}>
      <CrewJoin />
    </MemoryRouter>
  );

describe("CrewJoin", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the Google sign-in prompt when signed out", () => {
    useAuth.mockReturnValue({ user: null, isAllowed: false, isCrew: false, crew: null, loading: false });
    renderJoin();
    expect(screen.getByRole("button", { name: /sign in with google/i })).toBeInTheDocument();
  });

  it("shows the register form (with prefilled name) for a signed-in non-crew user", () => {
    useAuth.mockReturnValue({
      user: { displayName: "New Person", email: "new@example.com" },
      isAllowed: false, isCrew: false, crew: null, loading: false,
    });
    renderJoin();
    expect(screen.getByDisplayValue("New Person")).toBeInTheDocument();
    expect(screen.getByDisplayValue("new@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });

  it("shows a paused message for a deactivated crew member", () => {
    useAuth.mockReturnValue({
      user: { email: "old@example.com" },
      isAllowed: false, isCrew: false, crew: { id: "old@example.com", active: false }, loading: false,
    });
    renderJoin();
    expect(screen.getByText(/paused/i)).toBeInTheDocument();
  });

  it("redirects active crew to the crew home", () => {
    useAuth.mockReturnValue({
      user: { email: "c@example.com" },
      isAllowed: false, isCrew: true, crew: { id: "c@example.com", active: true }, loading: false,
    });
    renderJoin();
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
  });
});
