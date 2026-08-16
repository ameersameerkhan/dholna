import { describe, expect, it } from "vitest";
import { appReducer, createInitialState } from "./appState";

describe("appReducer", () => {
  it("commits the target scene underneath the repaint immediately", () => {
    const initial = createInitialState("day");
    const painting = appReducer(initial, {
      type: "transitionStarted",
      targetMode: "night",
    });

    expect(painting.mode).toBe("night");
    expect(painting.transition).toBe("painting");
    expect(painting.transitionFromMode).toBe("day");

    const complete = appReducer(painting, { type: "transitionCompleted" });
    expect(complete.mode).toBe("night");
    expect(complete.transition).toBe("idle");
    expect(complete.transitionFromMode).toBeNull();
  });

  it("ignores a second transition start while painting", () => {
    const painting = appReducer(createInitialState("day"), {
      type: "transitionStarted",
      targetMode: "night",
    });

    expect(
      appReducer(painting, { type: "transitionStarted", targetMode: "day" }),
    ).toEqual(painting);
  });

  it("starts in one booting playback state without a separate readiness flag", () => {
    const initial = createInitialState("day");

    expect(initial.playback).toBe("booting");
    expect(initial).not.toHaveProperty("playerReady");
  });

  it("tracks locally initiated playlist cueing through the same playback state", () => {
    const initial = createInitialState("day");
    const cueing = appReducer(initial, {
      type: "playbackChanged",
      playback: "cueing",
    });

    expect(cueing.playback).toBe("cueing");
  });

  it("tracks actual playback events", () => {
    const initial = createInitialState("day");
    const playing = appReducer(initial, {
      type: "playbackChanged",
      playback: "playing",
    });

    expect(playing.playback).toBe("playing");
  });
});
