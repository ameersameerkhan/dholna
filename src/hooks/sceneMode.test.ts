import { describe, expect, it } from "vitest";
import { modeForHour, resolveInitialMode } from "./sceneMode";

describe("modeForHour", () => {
  it.each([
    [0, "night"],
    [5, "night"],
    [6, "day"],
    [17, "day"],
    [18, "night"],
    [23, "night"],
  ] as const)("maps hour %i to %s", (hour, expected) => {
    expect(modeForHour(hour)).toBe(expected);
  });
});

describe("resolveInitialMode", () => {
  it("prefers a valid stored manual choice", () => {
    expect(resolveInitialMode("night", 9)).toBe("night");
  });

  it("falls back to local time for invalid storage", () => {
    expect(resolveInitialMode("invalid", 9)).toBe("day");
  });
});
