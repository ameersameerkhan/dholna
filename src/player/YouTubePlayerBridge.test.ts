import { afterEach, describe, expect, it, vi } from "vitest";
import { YouTubePlayerBridge } from "./YouTubePlayerBridge";

type MutableYouTubeWindow = {
  YT?: unknown;
};

type Hooks = {
  player?: FakePlayer;
  ready?: (event: { target: FakePlayer }) => void;
  stateChange?: (event: { target: FakePlayer; data: number }) => void;
  autoplayBlocked?: () => void;
  error?: (event: { target: FakePlayer; data: number }) => void;
};

const DAY_IDS = ["day-video-1", "day-video-2"] as const;
const NIGHT_IDS = ["night-video-1", "night-video-2"] as const;

const cuePlaylist = vi.fn();
const loadPlaylist = vi.fn();
const playVideo = vi.fn();
const pauseVideo = vi.fn();
const previousVideo = vi.fn();
const nextVideo = vi.fn();
const seekTo = vi.fn();
const destroy = vi.fn();
let constructCount = 0;
let playerState = -1;

class FakePlayer {
  cuePlaylist = cuePlaylist;
  loadPlaylist = loadPlaylist;
  playVideo = playVideo;
  pauseVideo = pauseVideo;
  previousVideo = previousVideo;
  nextVideo = nextVideo;
  seekTo = seekTo;
  destroy = destroy;
  getPlayerState = () => playerState;
  getCurrentTime = () => 0;
  getDuration = () => 240;
  getVideoData = () => ({
    video_id: "fake-video",
    title: "Fake track",
    author: "Fake artist",
  });
  getPlaylistIndex = () => 0;

  constructor(
    _element: HTMLElement,
    options: {
      events: {
        onReady: (event: { target: FakePlayer }) => void;
        onStateChange: (event: { target: FakePlayer; data: number }) => void;
        onAutoplayBlocked?: () => void;
        onError: (event: { target: FakePlayer; data: number }) => void;
      };
    },
  ) {
    constructCount += 1;
    hooks.player = this;
    hooks.ready = options.events.onReady;
    hooks.stateChange = options.events.onStateChange;
    hooks.autoplayBlocked = options.events.onAutoplayBlocked;
    hooks.error = options.events.onError;
  }
}

let hooks: Hooks = {};

function callbacks() {
  return {
    onPlaybackChange: vi.fn(),
    onSnapshot: vi.fn(),
    onError: vi.fn(),
  };
}

async function readyBridge(videoIds: readonly string[] = DAY_IDS) {
  const bridge = new YouTubePlayerBridge();
  const bridgeCallbacks = callbacks();
  const init = bridge.init(
    document.createElement("div"),
    videoIds,
    bridgeCallbacks,
  );

  await Promise.resolve();
  expect(hooks.player).toBeDefined();
  expect(hooks.ready).toBeDefined();
  hooks.ready!({ target: hooks.player! });
  await init;

  return { bridge, bridgeCallbacks };
}

function emitState(state: number) {
  playerState = state;
  hooks.stateChange!({ target: hooks.player!, data: state });
}

describe("YouTubePlayerBridge", () => {
  afterEach(() => {
    (window as unknown as MutableYouTubeWindow).YT = undefined;
    hooks = {};
    constructCount = 0;
    playerState = -1;
    vi.clearAllMocks();
  });

  it("creates one player and cues the initial explicit tracks when YouTube becomes ready", async () => {
    (window as unknown as MutableYouTubeWindow).YT = { Player: FakePlayer };

    const { bridgeCallbacks } = await readyBridge();

    expect(constructCount).toBe(1);
    expect(cuePlaylist).toHaveBeenCalledTimes(1);
    expect(cuePlaylist).toHaveBeenLastCalledWith([...DAY_IDS], 0, 0);
    expect(bridgeCallbacks.onPlaybackChange).toHaveBeenLastCalledWith("cueing");
  });

  it("uses the same player when cueing another explicit track array", async () => {
    (window as unknown as MutableYouTubeWindow).YT = { Player: FakePlayer };

    const { bridge, bridgeCallbacks } = await readyBridge();
    bridge.cueTracks(NIGHT_IDS, 0);

    expect(constructCount).toBe(1);
    expect(destroy).not.toHaveBeenCalled();
    expect(cuePlaylist).toHaveBeenCalledTimes(2);
    expect(cuePlaylist).toHaveBeenLastCalledWith([...NIGHT_IDS], 0, 0);
    expect(bridgeCallbacks.onPlaybackChange).toHaveBeenLastCalledWith("cueing");
  });

  it("Play calls only playVideo even before the cued state arrives", async () => {
    (window as unknown as MutableYouTubeWindow).YT = { Player: FakePlayer };

    const { bridge } = await readyBridge();
    const cueCountBeforePlay = cuePlaylist.mock.calls.length;

    bridge.play();

    expect(playVideo).toHaveBeenCalledTimes(1);
    expect(loadPlaylist).not.toHaveBeenCalled();
    expect(cuePlaylist).toHaveBeenCalledTimes(cueCountBeforePlay);
  });

  it("Previous and Next are direct commands without bridge readiness state", async () => {
    (window as unknown as MutableYouTubeWindow).YT = { Player: FakePlayer };

    const { bridge } = await readyBridge();

    bridge.previous();
    bridge.next();

    expect(previousVideo).toHaveBeenCalledTimes(1);
    expect(nextVideo).toHaveBeenCalledTimes(1);
  });

  it("maps meaningful YouTube state events and snapshots them", async () => {
    (window as unknown as MutableYouTubeWindow).YT = { Player: FakePlayer };

    const { bridgeCallbacks } = await readyBridge();

    emitState(5);
    emitState(1);
    emitState(2);
    emitState(3);
    emitState(0);

    expect(bridgeCallbacks.onPlaybackChange.mock.calls).toContainEqual(["cued"]);
    expect(bridgeCallbacks.onPlaybackChange.mock.calls).toContainEqual(["playing"]);
    expect(bridgeCallbacks.onPlaybackChange.mock.calls).toContainEqual(["paused"]);
    expect(bridgeCallbacks.onPlaybackChange.mock.calls).toContainEqual(["buffering"]);
    expect(bridgeCallbacks.onPlaybackChange.mock.calls).toContainEqual(["ended"]);
    expect(bridgeCallbacks.onSnapshot).toHaveBeenCalled();
  });

  it("reports YouTube errors with the current snapshot and does not recover itself", async () => {
    (window as unknown as MutableYouTubeWindow).YT = { Player: FakePlayer };

    const { bridgeCallbacks } = await readyBridge();
    const cueCountBeforeError = cuePlaylist.mock.calls.length;

    expect(hooks.error).toBeDefined();
    hooks.error!({ target: hooks.player!, data: 150 });

    expect(bridgeCallbacks.onError).toHaveBeenCalledWith(
      150,
      expect.objectContaining({
        videoId: "fake-video",
        title: "Fake track",
        artist: "Fake artist",
        index: 0,
      }),
    );
    expect(cuePlaylist).toHaveBeenCalledTimes(cueCountBeforeError);
  });

  it("does not create recovery cue commands when autoplay is blocked", async () => {
    (window as unknown as MutableYouTubeWindow).YT = { Player: FakePlayer };

    await readyBridge();
    const cueCountBeforeBlock = cuePlaylist.mock.calls.length;

    expect(hooks.autoplayBlocked).toBeDefined();
    hooks.autoplayBlocked!();

    expect(loadPlaylist).not.toHaveBeenCalled();
    expect(cuePlaylist).toHaveBeenCalledTimes(cueCountBeforeBlock);
  });
});
