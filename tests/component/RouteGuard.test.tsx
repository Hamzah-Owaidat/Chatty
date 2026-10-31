import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "./test-utils";

const { replaceMock, pathname } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  pathname: { value: "/chat" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock }),
  usePathname: () => pathname.value,
}));

import RouteGuard from "@/components/providers/RouteGuard";

describe("RouteGuard", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    pathname.value = "/chat";
  });

  it("sends a signed-out visitor from a protected page to sign in and hides the page", async () => {
    renderWithProviders(
      <RouteGuard>
        <p>Private chat</p>
      </RouteGuard>,
      { auth: { token: null, initialized: true } },
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/auth/signin"));
    expect(screen.queryByText("Private chat")).not.toBeInTheDocument();
  });

  it("shows a protected page to a signed-in user", () => {
    renderWithProviders(
      <RouteGuard>
        <p>Private chat</p>
      </RouteGuard>,
      { auth: { token: "token-123", initialized: true } },
    );

    expect(screen.getByText("Private chat")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("keeps public auth pages available without a session", () => {
    pathname.value = "/auth/signin";
    renderWithProviders(
      <RouteGuard>
        <p>Sign in form</p>
      </RouteGuard>,
      { auth: { token: null, initialized: true } },
    );

    expect(screen.getByText("Sign in form")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("keeps invite links available without a session", () => {
    pathname.value = "/invite/abc";
    renderWithProviders(
      <RouteGuard>
        <p>Invite page</p>
      </RouteGuard>,
      { auth: { token: null, initialized: true } },
    );

    expect(screen.getByText("Invite page")).toBeInTheDocument();
  });

  it("waits for the session to initialize before deciding", () => {
    renderWithProviders(
      <RouteGuard>
        <p>Private chat</p>
      </RouteGuard>,
      { auth: { token: null, initialized: false } },
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
