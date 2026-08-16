import { describe, expect, it } from "vitest";
import {
  REPAINT_MS,
  SEAL_MS,
  easeInOutCubic,
  maxRadiusFromOrigin,
} from "./transitionEngine";

describe("transition geometry", () => {
  it("covers the farthest viewport corner from the wheel", () => {
    expect(maxRadiusFromOrigin(1000, 600, 900, 300)).toBeCloseTo(
      Math.hypot(900, 300),
    );
  });

  it("keeps easing endpoints stable", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it("completes the ordinary repaint in the approved responsive window", () => {
    expect(REPAINT_MS + SEAL_MS).toBeGreaterThanOrEqual(800);
    expect(REPAINT_MS + SEAL_MS).toBeLessThanOrEqual(900);
  });
});
