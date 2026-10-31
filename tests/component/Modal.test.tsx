import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { Modal } from "@/components/ui/modal";

describe("Modal", () => {
  it("renders its content only while open", () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <p>Dialog body</p>
      </Modal>,
    );
    expect(screen.queryByText("Dialog body")).not.toBeInTheDocument();

    rerender(
      <Modal isOpen onClose={() => {}}>
        <p>Dialog body</p>
      </Modal>,
    );
    expect(screen.getByText("Dialog body")).toBeVisible();
  });

  it("closes from its close button", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Dialog body</p>
      </Modal>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Dialog body</p>
      </Modal>,
    );

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when the user clicks inside the dialog", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Dialog body</p>
      </Modal>,
    );

    await userEvent.click(screen.getByText("Dialog body"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
