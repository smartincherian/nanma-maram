import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import { updateCrewProfile } from "../../firebase/video/crew";
import CrewProfile from "./index";

jest.mock("../../components/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("../../firebase/video/crew", () => ({ updateCrewProfile: jest.fn() }));

const mockShowSnackbar = jest.fn();
jest.mock("../../components/Snackbar", () => {
  const React = require("react");
  return {
    SnackbarContext: React.createContext({ showSnackbar: (...a) => mockShowSnackbar(...a), hideSnackbar: jest.fn() }),
    SNACK_BAR_SEVERITY_TYPES: { ERROR: "error", SUCCESS: "success" },
  };
});

const crew = { id: "p@example.com", name: "Person", email: "p@example.com", phone: "999", skills: ["shorts_video_editing"] };

const renderProfile = () =>
  render(
    <MemoryRouter initialEntries={["/crew/profile"]}>
      <CrewProfile />
    </MemoryRouter>
  );

describe("CrewProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("redirects to join when not crew", () => {
    useAuth.mockReturnValue({ crew: null, isCrew: false, loading: false, refreshCrew: jest.fn() });
    renderProfile();
    expect(screen.queryByText(/edit your details/i)).not.toBeInTheDocument();
  });

  it("prefills the form with the crew member's current details", () => {
    useAuth.mockReturnValue({ crew, isCrew: true, loading: false, refreshCrew: jest.fn() });
    renderProfile();
    expect(screen.getByDisplayValue("Person")).toBeInTheDocument();
    expect(screen.getByDisplayValue("999")).toBeInTheDocument();
    expect(screen.getByDisplayValue("p@example.com")).toBeInTheDocument();
  });

  it("saves edited details via updateCrewProfile", async () => {
    updateCrewProfile.mockResolvedValueOnce();
    const refreshCrew = jest.fn().mockResolvedValue();
    useAuth.mockReturnValue({ crew, isCrew: true, loading: false, refreshCrew });
    renderProfile();

    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateCrewProfile).toHaveBeenCalledWith(
        "p@example.com",
        expect.objectContaining({ name: "Person", phone: "12345", skills: ["shorts_video_editing"] })
      );
    });
  });
});
