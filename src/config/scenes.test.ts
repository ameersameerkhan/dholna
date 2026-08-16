import { describe, expect, it } from "vitest";
import { artworkFor, SCENES } from "./scenes";
import { DAY_VIDEO_IDS, NIGHT_VIDEO_IDS } from "./tracks";

describe("SCENES", () => {
  it("contains distinct day and night environments", () => {
    expect(artworkFor("day", "desktop")).toContain("scenes/day.jpg");
    expect(artworkFor("night", "desktop")).toContain("scenes/night.jpg");
    expect(artworkFor("day", "portrait")).toContain("scenes/day-mobile.jpg");
    expect(artworkFor("night", "portrait")).toContain("scenes/night-mobile.jpg");
    expect(artworkFor("day", "desktop")).not.toBe(
      artworkFor("night", "desktop"),
    );
    expect(artworkFor("day", "portrait")).not.toBe(
      artworkFor("night", "portrait"),
    );
    expect(SCENES.day.videoIds).toEqual(DAY_VIDEO_IDS);
    expect(SCENES.night.videoIds).toEqual(NIGHT_VIDEO_IDS);
    expect(SCENES.day.videoIds).not.toBe(SCENES.night.videoIds);
    expect(SCENES.day.serviceLabel).toBe("DAY SERVICE");
    expect(SCENES.night.serviceLabel).toBe("NIGHT SERVICE");
  });
});
