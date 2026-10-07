import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./test-utils";

const { pushMock, loginMock, getCurrentUserMock, searchParams } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  loginMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  searchParams: { value: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  useSearchParams: () => searchParams.value,
}));

vi.mock("@/lib/api/auth", () => ({
  login: loginMock,
  register: vi.fn(),
  getCurrentUser: getCurrentUserMock,
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

import SignInForm from "@/components/auth/SignInForm";

const user = { id: "u1", userName: "jane_doe", displayName: "Jane Doe", email: "jane@example.test" };

describe("SignInForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    loginMock.mockReset();
    getCurrentUserMock.mockReset();
    searchParams.value = new URLSearchParams();
  });

  it("asks for username and password instead of calling the API", async () => {
    renderWithProviders(<SignInForm />);

    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByText("Username is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("signs in with the entered credentials and navigates to the chat", async () => {
    loginMock.mockResolvedValue({ isSuccess: true, statusCode: 200, error: null, data: "token-123" });
    getCurrentUserMock.mockResolvedValue({ data: user });
    renderWithProviders(<SignInForm />);

    await userEvent.type(screen.getByLabelText(/^username/i), "jane_doe");
    await userEvent.type(screen.getByLabelText(/^password/i), "Secret123");
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/chat"));
    expect(loginMock).toHaveBeenCalledWith({ userName: "jane_doe", password: "Secret123" });
    expect(screen.getByText("Logged in successfully!")).toBeInTheDocument();
  });

  it("returns to a safe redirect target from the URL after signing in", async () => {
    searchParams.value = new URLSearchParams("redirect=/profile");
    loginMock.mockResolvedValue({ isSuccess: true, statusCode: 200, error: null, data: "token-123" });
    getCurrentUserMock.mockResolvedValue({ data: user });
    renderWithProviders(<SignInForm />);

    await userEvent.type(screen.getByLabelText(/^username/i), "jane_doe");
    await userEvent.type(screen.getByLabelText(/^password/i), "Secret123");
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/profile"));
  });

  it("shows the server's message when the credentials are rejected", async () => {
    loginMock.mockResolvedValue({ isSuccess: false, statusCode: 400, error: "Invalid Username or password", data: null });
    renderWithProviders(<SignInForm />);

    await userEvent.type(screen.getByLabelText(/^username/i), "jane_doe");
    await userEvent.type(screen.getByLabelText(/^password/i), "WrongPass1");
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Invalid Username or password")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
