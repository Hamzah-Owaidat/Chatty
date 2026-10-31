import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./test-utils";

const { getOrCreateInviteLinkMock } = vi.hoisted(() => ({
  getOrCreateInviteLinkMock: vi.fn(),
}));

vi.mock("@/lib/api/invite", () => ({ getOrCreateInviteLink: getOrCreateInviteLinkMock }));

import InviteLinkModal from "@/components/common/InviteLinkModal";

describe("InviteLinkModal", () => {
  beforeEach(() => {
    getOrCreateInviteLinkMock.mockReset();
  });

  it("shows a shareable link for the current user", async () => {
    getOrCreateInviteLinkMock.mockResolvedValue({ token: "tok-abc123" });
    renderWithProviders(<InviteLinkModal isOpen onClose={() => {}} />);

    const link = await screen.findByDisplayValue(/\/invite\/tok-abc123$/);
    expect(link).toHaveAttribute("readonly");
  });

  it("copies the link to the clipboard and confirms", async () => {
    getOrCreateInviteLinkMock.mockResolvedValue({ token: "tok-abc123" });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderWithProviders(<InviteLinkModal isOpen onClose={() => {}} />);

    await screen.findByDisplayValue(/\/invite\/tok-abc123$/);
    await userEvent.click(screen.getByRole("button", { name: "Copy invite link" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/invite\/tok-abc123$/)));
    expect(await screen.findByText("Invite link copied!")).toBeInTheDocument();
  });

  it("closes and reports the problem when a link cannot be created", async () => {
    getOrCreateInviteLinkMock.mockRejectedValue(new Error("Service unavailable"));
    const onClose = vi.fn();
    renderWithProviders(<InviteLinkModal isOpen onClose={onClose} />);

    expect(await screen.findByText("Service unavailable")).toBeInTheDocument();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
