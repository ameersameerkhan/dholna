import { describe, expect, it } from "vitest";
import { playbackForYouTubeState } from "./youtubeState";

describe("playbackForYouTubeState", () => {
  it.each([
    [0, "ended"],
    [1, "playing"],
    [2, "paused"],
    [3, "buffering"],
    [5, "cued"],
  ] as const)("maps YouTube state %i to %s", (state, expected) => {
    expect(playbackForYouTubeState(state)).toBe(expected);
  });

  it("does not treat YouTube UNSTARTED as a ready playback state", () => {
    expect(playbackForYouTubeState(-1)).toBeNull();
  });
});
