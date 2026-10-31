import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./test-utils";

const { pushMock, registerMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  registerMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
  register: registerMock,
  getCurrentUser: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

import SignUpForm from "@/components/auth/SignUpForm";

async function fillForm(overrides: Partial<Record<"userName" | "displayName" | "email" | "password", string>> = {}) {
  const values = {
    userName: "new_user",
    displayName: "New User",
    email: "new.user@example.test",
    password: "Strong123",
    ...overrides,
  };
  await userEvent.type(screen.getByLabelText(/^username/i), values.userName);
  await userEvent.type(screen.getByLabelText(/^display name/i), values.displayName);
  await userEvent.type(screen.getByLabelText(/^email/i), values.email);
  await userEvent.type(screen.getByLabelText(/^password/i), values.password);
}

describe("SignUpForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    registerMock.mockReset();
    localStorage.clear();
  });

  it("shows live password guidance while the password is typed", async () => {
    renderWithProviders(<SignUpForm />);
    const password = screen.getByLabelText(/^password/i);

    await userEvent.type(password, "abc");
    expect(screen.getByText("Add a digit")).toBeInTheDocument();

    await userEvent.clear(password);
    await userEvent.type(password, "abcdefg1");
    expect(screen.getByText("Add an uppercase letter")).toBeInTheDocument();

    await userEvent.clear(password);
    await userEvent.type(password, "Abc1");
    expect(screen.getByText("Use 8+ characters")).toBeInTheDocument();

    await userEvent.clear(password);
    await userEvent.type(password, "Abcdefg1");
    expect(screen.getByText("Strong password")).toBeInTheDocument();
  });

  it("rejects an invalid email without calling the API", async () => {
    renderWithProviders(<SignUpForm />);
    await fillForm({ email: "not-an-email" });
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Please enter a valid email address")).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("requires the terms checkbox before submitting", async () => {
    renderWithProviders(<SignUpForm />);
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("You must agree to the terms conditions and privacy policy")).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("registers, does not keep any session token, and returns to sign in", async () => {
    registerMock.mockResolvedValue({ isSuccess: true, statusCode: 200, error: null, data: null });
    renderWithProviders(<SignUpForm />);

    await fillForm();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/auth/signin"));
    expect(registerMock).toHaveBeenCalledWith(
      expect.objectContaining({ userName: "new_user", email: "new.user@example.test" }),
    );
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("shows the server's message and stays on the page when registration fails", async () => {
    registerMock.mockRejectedValue({ isSuccess: false, error: "Username already exists" });
    renderWithProviders(<SignUpForm />);

    await fillForm();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Username already exists")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
