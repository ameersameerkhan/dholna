import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Wordmark } from "./Wordmark";

it("renders the vinyl identity and Dholna wordmark", () => {
  const { container } = render(<Wordmark />);
  expect(screen.getByText("Dholna")).toBeInTheDocument();
  expect(container.querySelector(".brand-vinyl")).toBeInTheDocument();
});
