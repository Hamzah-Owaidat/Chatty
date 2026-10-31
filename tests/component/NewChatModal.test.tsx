import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./test-utils";

const { searchUsersMock, sendChatRequestMock } = vi.hoisted(() => ({
  searchUsersMock: vi.fn(),
  sendChatRequestMock: vi.fn(),
}));

vi.mock("@/lib/api/user", () => ({ searchUsers: searchUsersMock }));
vi.mock("@/lib/api/chatRequest", () => ({ sendChatRequest: sendChatRequestMock }));

import NewChatModal from "@/components/common/NewChatModal";

const bob = { id: "user-bob", userName: "e2e_bob", displayName: "Bob Builder", image: null };

describe("NewChatModal", () => {
  beforeEach(() => {
    searchUsersMock.mockReset();
    sendChatRequestMock.mockReset();
  });

  it("asks for at least two characters before searching", async () => {
    renderWithProviders(<NewChatModal isOpen onClose={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText("Search by name or email"), "b");

    expect(screen.getByText("Type at least 2 characters to search.")).toBeInTheDocument();
    expect(searchUsersMock).not.toHaveBeenCalled();
  });

  it("lists matching people and sends a chat request to the chosen one", async () => {
    searchUsersMock.mockResolvedValue([bob]);
    sendChatRequestMock.mockResolvedValue(undefined);
    const onClose = vi.fn();
    renderWithProviders(<NewChatModal isOpen onClose={onClose} />);

    await userEvent.type(screen.getByPlaceholderText("Search by name or email"), "bob");
    await userEvent.click(await screen.findByRole("button", { name: /Bob Builder/ }));

    await waitFor(() => expect(sendChatRequestMock).toHaveBeenCalledWith("user-bob"));
    expect(await screen.findByText("Chat request sent to Bob Builder")).toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();
  });

  it("shows an empty state when nobody matches", async () => {
    searchUsersMock.mockResolvedValue([]);
    renderWithProviders(<NewChatModal isOpen onClose={() => {}} />);

    await userEvent.type(screen.getByPlaceholderText("Search by name or email"), "zzz");

    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("reports a failed request and keeps the dialog open", async () => {
    searchUsersMock.mockResolvedValue([bob]);
    sendChatRequestMock.mockRejectedValue(new Error("You already have a pending request"));
    const onClose = vi.fn();
    renderWithProviders(<NewChatModal isOpen onClose={onClose} />);

    await userEvent.type(screen.getByPlaceholderText("Search by name or email"), "bob");
    await userEvent.click(await screen.findByRole("button", { name: /Bob Builder/ }));

    expect(await screen.findByText("You already have a pending request")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
