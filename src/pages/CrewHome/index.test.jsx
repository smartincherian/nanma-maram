import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import CrewHome from "./index";

jest.mock("../../components/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("../../firebase/auth", () => ({ signOutUser: jest.fn() }));

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
    useAuth.mockReturnValue({
      crew: { name: "Person", email: "p@example.com", phone: "999", skills: ["Shorts", "Promo"] },
      isCrew: true, loading: false,
    });
    renderHome();
    expect(screen.getByText(/Welcome, Person, Jesus Loves You/i)).toBeInTheDocument();
    expect(screen.getByText("Shorts")).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("shows a spinner while loading", () => {
    useAuth.mockReturnValue({ crew: null, isCrew: false, loading: true });
    renderHome();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });
});
