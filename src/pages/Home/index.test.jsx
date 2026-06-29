import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import { signOutUser } from "../../firebase/auth";
import Home from "./index";

jest.mock("../../components/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../firebase/auth", () => ({
  signOutUser: jest.fn(),
}));

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe("Home sign-out", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a sign-out control for a signed-in admin and signs out on click", async () => {
    signOutUser.mockResolvedValue();
    useAuth.mockReturnValue({
      user: { email: "admin@example.com" },
      isAllowed: true,
      loading: false,
    });

    renderHome();

    await userEvent.click(
      screen.getByRole("button", { name: /sign out/i })
    );

    expect(signOutUser).toHaveBeenCalledTimes(1);
  });

  it("does not render a sign-out control when there is no user", () => {
    useAuth.mockReturnValue({ user: null, isAllowed: false, loading: false });

    renderHome();

    expect(
      screen.queryByRole("button", { name: /sign out/i })
    ).not.toBeInTheDocument();
  });
});
