// src/pages/CrewJoin/index.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import { registerCrew } from "../../firebase/video/crew";
import CrewJoin from "./index";

jest.mock("../../components/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("../../firebase/auth", () => ({ signInWithGoogle: jest.fn() }));
jest.mock("../../firebase/video/crew", () => ({ registerCrew: jest.fn() }));

const mockShowSnackbar = jest.fn();
jest.mock("../../components/Snackbar", () => {
  const React = require("react");
  return {
    SnackbarContext: React.createContext({ showSnackbar: (...args) => mockShowSnackbar(...args), hideSnackbar: jest.fn() }),
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

  it("shows an admin note and a link to /videos for allowed users", () => {
    useAuth.mockReturnValue({
      user: { displayName: "Admin User", email: "admin@example.com" },
      isAllowed: true, isCrew: false, crew: null, loading: false,
    });
    renderJoin();
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to videos/i })).toHaveAttribute("href", "/videos");
  });

  it("shows a spinner and hides the form while loading", () => {
    useAuth.mockReturnValue({ user: null, isAllowed: false, isCrew: false, crew: null, loading: true });
    renderJoin();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByLabelText(/phone/i)).toBeNull();
  });

  describe("submit flow", () => {
    const signedInNonCrew = {
      user: { displayName: "Test User", email: "test@example.com" },
      isAllowed: false, isCrew: false, crew: null, loading: false,
    };

    beforeEach(() => {
      mockShowSnackbar.mockClear();
    });

    it("calls registerCrew with email, phone, and skills on successful submit", async () => {
      registerCrew.mockResolvedValueOnce();
      useAuth.mockReturnValue(signedInNonCrew);
      renderJoin();

      // Fill the phone field
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "9876543210" } });

      // Open the MUI Select and pick "Shorts"
      fireEvent.mouseDown(screen.getByText("Select your skills"));
      const option = await screen.findByRole("option", { name: "Shorts" });
      fireEvent.click(option);

      // Close the MUI Select dropdown (Escape closes the popover)
      fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });

      // Click submit
      fireEvent.click(screen.getByRole("button", { name: /complete signup/i }));

      await waitFor(() => {
        expect(registerCrew).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "test@example.com",
            phone: "9876543210",
            skills: ["Shorts"],
          })
        );
      });
    });

    it("keeps the form visible when registerCrew rejects", async () => {
      registerCrew.mockRejectedValueOnce(new Error("boom"));
      useAuth.mockReturnValue(signedInNonCrew);
      renderJoin();

      // Fill the phone field
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "9876543210" } });

      // Open the MUI Select and pick "Shorts"
      fireEvent.mouseDown(screen.getByText("Select your skills"));
      const option = await screen.findByRole("option", { name: "Shorts" });
      fireEvent.click(option);

      // Close the MUI Select dropdown (Escape closes the popover)
      fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });

      // Click submit
      fireEvent.click(screen.getByRole("button", { name: /complete signup/i }));

      // Wait for the rejection to propagate and snackbar to be called
      await waitFor(() => {
        expect(mockShowSnackbar).toHaveBeenCalledWith("boom", "error");
      });

      // Form should still be visible (not navigated away)
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    });
  });
});
