import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SnackbarProvider } from "../../components/Snackbar";
import { useAuth } from "../../components/AuthProvider";
import {
  addAdmin,
  deleteAdmin,
  listAdmins,
  updateAdmin,
} from "../../firebase/admins";
import Admins from "./index";

jest.mock("../../components/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../firebase/admins", () => ({
  listAdmins: jest.fn(),
  addAdmin: jest.fn(),
  updateAdmin: jest.fn(),
  deleteAdmin: jest.fn(),
}));

const SAMPLE_ADMINS = [
  {
    email: "owner@example.com",
    name: "The Owner",
    contact: "111",
    role: "owner",
  },
  {
    email: "helper@example.com",
    name: "Helper",
    contact: "222",
    role: "admin",
  },
];

const renderPage = ({ isOwner = false, admins = SAMPLE_ADMINS } = {}) => {
  useAuth.mockReturnValue({
    user: { email: "owner@example.com" },
    isAllowed: true,
    isOwner,
    loading: false,
  });
  listAdmins.mockResolvedValue(admins);
  return render(
    <SnackbarProvider>
      <MemoryRouter>
        <Admins />
      </MemoryRouter>
    </SnackbarProvider>
  );
};

describe("Admins page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists admins with their details", async () => {
    renderPage();
    expect(await screen.findByText("The Owner")).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByText("Helper")).toBeInTheDocument();
    expect(screen.getByText("helper@example.com")).toBeInTheDocument();
  });

  it("marks the owner row with an Owner badge", async () => {
    renderPage();
    expect(await screen.findByText("Owner")).toBeInTheDocument();
  });

  it("hides delete controls from non-owners", async () => {
    renderPage({ isOwner: false });
    await screen.findByText("Helper");
    expect(
      screen.queryByRole("button", { name: /delete helper@example.com/i })
    ).not.toBeInTheDocument();
  });

  it("lets the owner delete an admin after confirming", async () => {
    deleteAdmin.mockResolvedValue();
    renderPage({ isOwner: true });

    await userEvent.click(
      await screen.findByRole("button", { name: /delete helper@example.com/i })
    );

    const dialog = screen.getByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /confirm delete/i })
    );

    expect(await screen.findByText("Admin removed")).toBeInTheDocument();
    expect(deleteAdmin).toHaveBeenCalledWith("helper@example.com");
  });

  it("adds a new admin from the add dialog", async () => {
    addAdmin.mockResolvedValue();
    renderPage({ isOwner: true });
    await screen.findByText("The Owner"); // let the initial load settle

    await userEvent.click(
      screen.getByRole("button", { name: /add admin/i })
    );

    const dialog = screen.getByRole("dialog");
    await userEvent.type(
      within(dialog).getByLabelText(/email/i),
      "New@Example.com"
    );
    await userEvent.type(within(dialog).getByLabelText(/name/i), "New Person");
    await userEvent.type(
      within(dialog).getByLabelText(/contact/i),
      "333"
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: /save/i })
    );

    expect(await screen.findByText("Admin added")).toBeInTheDocument();
    expect(addAdmin).toHaveBeenCalledWith({
      email: "New@Example.com",
      name: "New Person",
      contact: "333",
    });
  });

  it("edits an existing admin with the email field locked", async () => {
    updateAdmin.mockResolvedValue();
    renderPage({ isOwner: true });

    await userEvent.click(
      await screen.findByRole("button", { name: /edit helper@example.com/i })
    );

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText(/email/i)).toBeDisabled();

    const nameField = within(dialog).getByLabelText(/name/i);
    await userEvent.clear(nameField);
    await userEvent.type(nameField, "Helper Renamed");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /save/i })
    );

    expect(await screen.findByText("Admin updated")).toBeInTheDocument();
    expect(updateAdmin).toHaveBeenCalledWith("helper@example.com", {
      name: "Helper Renamed",
      contact: "222",
    });
  });
});
