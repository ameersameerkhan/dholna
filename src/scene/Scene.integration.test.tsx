import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Scene } from "./Scene";

describe("railway scene", () => {
  it("renders the dedicated portrait artwork family", () => {
    const { container } = render(
      <Scene mode="night" assetFamily="portrait" reducedMotion />,
    );
    const images = Array.from(
      container.querySelectorAll<HTMLImageElement>("img.scene-image"),
    );

    expect(images).toHaveLength(2);
    expect(images[0].src).toContain("scenes/day-mobile.jpg");
    expect(images[1].src).toContain("scenes/night-mobile.jpg");
    expect(images[0]).toHaveAttribute("alt", "");
    expect(images[1]).toHaveAttribute("alt", "");
  });

  it("renders the desktop artwork family on wider layouts", () => {
    const { container } = render(
      <Scene mode="day" assetFamily="desktop" reducedMotion />,
    );
    const images = Array.from(
      container.querySelectorAll<HTMLImageElement>("img.scene-image"),
    );

    expect(images[0].src).toContain("scenes/day.jpg");
    expect(images[1].src).toContain("scenes/night.jpg");
  });
});
