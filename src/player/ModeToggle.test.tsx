import { render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ModeToggle } from "./ModeToggle";

it("labels the natural upright symbol for the active scene", () => {
  const { container, rerender } = render(
    <ModeToggle mode="day" disabled={false} onToggle={vi.fn()} />,
  );

  expect(container.querySelector(".player-mode-toggle__icon")).toHaveAttribute(
    "data-symbol",
    "sun",
  );

  rerender(<ModeToggle mode="night" disabled={false} onToggle={vi.fn()} />);

  expect(container.querySelector(".player-mode-toggle__icon")).toHaveAttribute(
    "data-symbol",
    "moon",
  );
});
