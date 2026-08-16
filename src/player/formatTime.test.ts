import { describe, expect, it } from "vitest";
import { formatTime } from "./formatTime";

describe("formatTime", () => {
  it.each([
    [0, "0:00"],
    [9, "0:09"],
    [65, "1:05"],
    [3605, "60:05"],
  ])("formats %i seconds", (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected);
  });
});
