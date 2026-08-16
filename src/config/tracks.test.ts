import { describe, expect, it } from "vitest";
import { DAY_VIDEO_IDS, NIGHT_VIDEO_IDS } from "./tracks";

describe("Dholna track arrays", () => {
  it("contains exactly 12 unique Day and Night IDs", () => {
    expect(DAY_VIDEO_IDS).toHaveLength(12);
    expect(NIGHT_VIDEO_IDS).toHaveLength(12);
    expect(new Set(DAY_VIDEO_IDS).size).toBe(12);
    expect(new Set(NIGHT_VIDEO_IDS).size).toBe(12);
  });

  it("does not share a video between Day and Night", () => {
    const night = new Set<string>(NIGHT_VIDEO_IDS);
    expect(DAY_VIDEO_IDS.some((videoId) => night.has(videoId))).toBe(false);
  });
});
