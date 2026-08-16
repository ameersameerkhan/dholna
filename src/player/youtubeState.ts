import type { PlaybackState } from "../appState";

export function playbackForYouTubeState(state: number): PlaybackState | null {
  switch (state) {
    case 0:
      return "ended";
    case 1:
      return "playing";
    case 2:
      return "paused";
    case 3:
      return "buffering";
    case 5:
      return "cued";
    case -1:
    default:
      return null;
  }
}
