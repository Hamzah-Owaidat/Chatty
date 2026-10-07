import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./test-utils";

const { pushMock, resetParams, requestResetMock, resetPasswordMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  resetParams: { value: new URLSearchParams() },
  requestResetMock: vi.fn(),
  resetPasswordMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  useSearchParams: () => resetParams.value,
}));

vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
  register: vi.fn(),
  getCurrentUser: vi.fn(),
  requestPasswordReset: requestResetMock,
  resetPassword: resetPasswordMock,
}));

import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

describe("ResetPasswordForm — request step", () => {
  beforeEach(() => {
    pushMock.mockReset();
    requestResetMock.mockReset();
    resetPasswordMock.mockReset();
    resetParams.value = new URLSearchParams();
  });

  it("requires an email before sending a reset link", async () => {
    renderWithProviders(<ResetPasswordForm />);
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(requestResetMock).not.toHaveBeenCalled();
  });

  it("confirms the request and masks the email address", async () => {
    requestResetMock.mockResolvedValue({ isSuccess: true, statusCode: 200, error: null, data: null });
    renderWithProviders(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText(/^email/i), "jane.doe@example.test");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("heading", { name: "Reset link sent" })).toBeInTheDocument();
    expect(requestResetMock).toHaveBeenCalledWith("jane.doe@example.test");
    expect(screen.getByText(/ja\*+@example\.test/)).toBeInTheDocument();
    expect(screen.queryByText("jane.doe@example.test")).not.toBeInTheDocument();
  });

  it("disables resend during the cooldown", async () => {
    requestResetMock.mockResolvedValue({ isSuccess: true, statusCode: 200, error: null, data: null });
    renderWithProviders(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText(/^email/i), "jane.doe@example.test");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    const resend = await screen.findByRole("button", { name: /resend in \d+s/i });
    expect(resend).toBeDisabled();
  });
});

describe("ResetPasswordForm — new password step", () => {
  beforeEach(() => {
    pushMock.mockReset();
    resetPasswordMock.mockReset();
    resetParams.value = new URLSearchParams("token=reset-token-123");
  });

  it("rejects mismatched passwords without calling the API", async () => {
    renderWithProviders(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText(/^new password/i), "Strong123");
    await userEvent.type(screen.getByLabelText(/^confirm new password/i), "Different123");
    await userEvent.click(screen.getByRole("button", { name: "Save new password" }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it("rejects a password that does not meet the policy", async () => {
    renderWithProviders(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText(/^new password/i), "weak");
    await userEvent.type(screen.getByLabelText(/^confirm new password/i), "weak");
    await userEvent.click(screen.getByRole("button", { name: "Save new password" }));

    expect(await screen.findByText(/Password must be at least 8 characters/)).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it("saves the new password with the reset token and returns to sign in", async () => {
    resetPasswordMock.mockResolvedValue({ isSuccess: true, statusCode: 200, error: null, data: null });
    renderWithProviders(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText(/^new password/i), "Strong123");
    await userEvent.type(screen.getByLabelText(/^confirm new password/i), "Strong123");
    await userEvent.click(screen.getByRole("button", { name: "Save new password" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/auth/signin"));
    expect(resetPasswordMock).toHaveBeenCalledWith({ token: "reset-token-123", password: "Strong123" });
  });
});
