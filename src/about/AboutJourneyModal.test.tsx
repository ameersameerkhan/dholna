import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AboutJourneyModal } from "./AboutJourneyModal";

function renderOpenModal(onClose = vi.fn()) {
  const triggerRef = createRef<HTMLButtonElement>();
  const trigger = document.createElement("button");
  trigger.textContent = "open";
  document.body.append(trigger);
  triggerRef.current = trigger;

  render(<AboutJourneyModal open onClose={onClose} triggerRef={triggerRef} />);
  return { onClose, triggerRef };
}

describe("AboutJourneyModal", () => {
  it("renders the approved story and release links as an accessible modal dialog", () => {
    renderOpenModal();

    expect(screen.getByRole("dialog", { name: "About this journey" })).toHaveAttribute(
      "aria-modal",
      "true",
    );
    expect(
      screen.getByText("Dholna is a small experiment in music, motion and nostalgia."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Built by Ameer on X" })).toHaveAttribute(
      "href",
      "https://x.com/AmeerSameerKhan",
    );
    expect(screen.getByRole("link", { name: "View Dholna source on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/ameersameerkhan/dholna",
    );
    expect(screen.queryByText(/saloon\.wtf/i)).not.toBeInTheDocument();
  });

  it("focuses the close button on open and closes with Escape", () => {
    const { onClose } = renderOpenModal();
    const close = screen.getByRole("button", { name: "Close about this journey" });

    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes only when the backdrop itself is activated", () => {
    const { onClose } = renderOpenModal();
    const backdrop = screen.getByTestId("about-journey-backdrop");
    const dialog = screen.getByRole("dialog", { name: "About this journey" });

    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps Tab focus inside the modal", () => {
    renderOpenModal();
    const close = screen.getByRole("button", { name: "Close about this journey" });
    const github = screen.getByRole("link", { name: "View Dholna source on GitHub" });

    github.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    close.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(github).toHaveFocus();
  });
});
