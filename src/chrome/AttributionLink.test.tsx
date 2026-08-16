import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AttributionLink } from "./AttributionLink";

it("links to Ameer's X profile", () => {
  render(<AttributionLink />);
  const link = screen.getByRole("link", { name: "Built by Ameer on X" });
  expect(link).toHaveAttribute("href", "https://x.com/AmeerSameerKhan");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noreferrer");
});
