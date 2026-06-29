import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { signInWithGoogle, signOutUser } from "../../firebase/auth";
import { useAuth } from "../AuthProvider";
import AdminRouteGate from "./index";

jest.mock("../../firebase/auth", () => ({
  signInWithGoogle: jest.fn(),
  signOutUser: jest.fn(),
}));

jest.mock("../AuthProvider", () => ({
  useAuth: jest.fn(),
}));

const renderGate = () =>
  render(
    <MemoryRouter>
      <AdminRouteGate />
    </MemoryRouter>
  );

describe("AdminRouteGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // default: nobody signed in
    useAuth.mockReturnValue({ user: null, isAllowed: false, loading: false });
  });

  it("offers a Google sign-in button that triggers sign-in", async () => {
    signInWithGoogle.mockResolvedValue({});
    renderGate();

    await userEvent.click(
      screen.getByRole("button", { name: /sign in with google/i })
    );

    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it("stays silent when the user cancels the popup", async () => {
    signInWithGoogle.mockRejectedValue({
      code: "auth/popup-closed-by-user",
    });
    renderGate();

    await userEvent.click(
      screen.getByRole("button", { name: /sign in with google/i })
    );

    await waitFor(() =>
      expect(signInWithGoogle).toHaveBeenCalledTimes(1)
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("surfaces an error message when sign-in fails for another reason", async () => {
    signInWithGoogle.mockRejectedValue({
      code: "auth/network-request-failed",
      message: "Network error",
    });
    renderGate();

    await userEvent.click(
      screen.getByRole("button", { name: /sign in with google/i })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/sign in/i);
  });

  it("keeps the public app link", () => {
    renderGate();
    expect(
      screen.getByRole("button", { name: /go to nanmamaram app/i })
    ).toBeInTheDocument();
  });

  describe("when signed in but not allowlisted", () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { email: "stranger@example.com" },
        isAllowed: false,
        loading: false,
      });
    });

    it("shows the account email and a no-access message instead of the sign-in button", () => {
      renderGate();
      expect(screen.getByText(/stranger@example.com/)).toBeInTheDocument();
      expect(screen.getByText(/access/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /sign in with google/i })
      ).not.toBeInTheDocument();
    });

    it("still offers the public app link", () => {
      renderGate();
      expect(
        screen.getByRole("button", { name: /go to nanmamaram app/i })
      ).toBeInTheDocument();
    });

    it("lets the user sign out", async () => {
      signOutUser.mockResolvedValue();
      renderGate();
      await userEvent.click(
        screen.getByRole("button", { name: /sign out/i })
      );
      expect(signOutUser).toHaveBeenCalledTimes(1);
    });
  });
});
