import type { PlaybackState } from "../appState";
import { playbackForYouTubeState } from "./youtubeState";

export type PlayerSnapshot = {
  videoId: string | null;
  title: string;
  artist: string;
  index: number;
  currentTime: number;
  duration: number;
};

type PlayerCallbacks = {
  onPlaybackChange: (playback: PlaybackState) => void;
  onSnapshot: (snapshot: PlayerSnapshot) => void;
  onError: (code: number, snapshot: PlayerSnapshot | null) => void;
};

type YouTubeVideoData = {
  video_id?: string;
  title?: string;
  author?: string;
};

type YouTubePlayer = {
  cuePlaylist(videoIds: string[], index?: number, startSeconds?: number): void;
  playVideo(): void;
  pauseVideo(): void;
  previousVideo(): void;
  nextVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getPlayerState(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoData(): YouTubeVideoData;
  getPlaylistIndex(): number;
  destroy(): void;
};

type YouTubePlayerEvent = {
  target: YouTubePlayer;
};

type YouTubeStateEvent = YouTubePlayerEvent & {
  data: number;
};

type YouTubePlayerConstructor = new (
  element: HTMLElement,
  options: {
    height: string;
    width: string;
    playerVars: {
      enablejsapi: 1;
      playsinline: 1;
      origin: string;
    };
    events: {
      onReady: (event: YouTubePlayerEvent) => void;
      onStateChange: (event: YouTubeStateEvent) => void;
      onAutoplayBlocked: () => void;
      onError: (event: YouTubeStateEvent) => void;
    };
  },
) => YouTubePlayer;

type YouTubeNamespace = {
  Player: YouTubePlayerConstructor;
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_URL = "https://www.youtube.com/iframe_api";
const API_TIMEOUT_MS = 12_000;
let apiPromise: Promise<YouTubeNamespace> | null = null;

function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    let settled = false;
    const previousReady = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("YouTube IFrame API timed out"));
    }, API_TIMEOUT_MS);

    const finish = () => {
      if (settled || !window.YT?.Player) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(window.YT);
    };

    window.onYouTubeIframeAPIReady = () => {
      try {
        previousReady?.();
      } finally {
        finish();
      }
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${API_URL}"]`,
    );

    if (existing) {
      existing.addEventListener(
        "error",
        () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          reject(new Error("YouTube IFrame API failed to load"));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = API_URL;
    script.async = true;
    script.addEventListener(
      "error",
      () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        reject(new Error("YouTube IFrame API failed to load"));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  return apiPromise;
}

export class YouTubePlayerBridge {
  private player: YouTubePlayer | null = null;
  private callbacks: PlayerCallbacks | null = null;
  private destroyed = false;

  async init(
    container: HTMLElement,
    initialVideoIds: readonly string[],
    callbacks: PlayerCallbacks,
  ): Promise<void> {
    this.callbacks = callbacks;

    const yt = await loadYouTubeApi();
    if (this.destroyed) return;

    const mount = document.createElement("div");
    container.replaceChildren(mount);

    await new Promise<void>((resolve, reject) => {
      const readyTimeout = window.setTimeout(() => {
        reject(new Error("YouTube player initialisation timed out"));
      }, API_TIMEOUT_MS);

      this.player = new yt.Player(mount, {
        height: "200",
        width: "200",
        playerVars: {
          enablejsapi: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            window.clearTimeout(readyTimeout);
            this.player = event.target;
            this.debug("ready");
            this.cueTracks(initialVideoIds, 0);
            resolve();
          },
          onStateChange: (event) => {
            this.debug("state", event.data);
            const playback = playbackForYouTubeState(event.data);
            if (playback) this.callbacks?.onPlaybackChange(playback);
            this.emitSnapshot();
          },
          onAutoplayBlocked: () => {
            this.debug("autoplay-blocked");
            const playback = this.player
              ? playbackForYouTubeState(this.player.getPlayerState())
              : null;
            if (playback) this.callbacks?.onPlaybackChange(playback);
            this.emitSnapshot();
          },
          onError: (event) => {
            this.debug("error", event.data);
            this.callbacks?.onError(event.data, this.snapshot());
          },
        },
      });
    });
  }

  cueTracks(videoIds: readonly string[], index = 0): void {
    if (!this.player || videoIds.length === 0) return;
    const safeIndex = Math.min(Math.max(0, index), videoIds.length - 1);
    const queue = [...videoIds];
    this.debug("command:cue", { videoIds: queue, index: safeIndex });
    this.callbacks?.onPlaybackChange("cueing");
    this.player.cuePlaylist(queue, safeIndex, 0);
  }

  play(): void {
    this.debug("command:play");
    this.player?.playVideo();
  }

  pause(): void {
    this.debug("command:pause");
    this.player?.pauseVideo();
  }

  previous(): void {
    this.debug("command:previous");
    this.player?.previousVideo();
  }

  next(): void {
    this.debug("command:next");
    this.player?.nextVideo();
  }

  seekTo(seconds: number): void {
    this.debug("command:seek", seconds);
    this.player?.seekTo(Math.max(0, seconds), true);
  }

  snapshot(): PlayerSnapshot | null {
    const player = this.player;
    if (!player) return null;

    try {
      const video = player.getVideoData() ?? {};
      return {
        videoId: video.video_id || null,
        title: video.title || "",
        artist: video.author || "",
        index: Math.max(0, player.getPlaylistIndex() || 0),
        currentTime: Math.max(0, player.getCurrentTime() || 0),
        duration: Math.max(0, player.getDuration() || 0),
      };
    } catch {
      return null;
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.debug("destroy");
    try {
      this.player?.destroy();
    } finally {
      this.player = null;
      this.callbacks = null;
    }
  }

  private emitSnapshot(): void {
    const snapshot = this.snapshot();
    if (snapshot) this.callbacks?.onSnapshot(snapshot);
  }

  private debug(kind: string, detail?: unknown): void {
    if (!import.meta.env.DEV) return;

    const player = this.player;
    let snapshot: PlayerSnapshot | null = null;
    let rawState: number | null = null;

    if (player) {
      try {
        rawState = player.getPlayerState();
        snapshot = this.snapshot();
      } catch {
        // Diagnostics must never affect playback behaviour.
      }
    }

    console.info(
      "DHOLNA_YT_EVENT",
      JSON.stringify({
        at: Math.round(performance.now()),
        kind,
        detail,
        rawState,
        videoId: snapshot?.videoId ?? null,
        index: snapshot?.index ?? null,
        currentTime: snapshot?.currentTime ?? null,
        duration: snapshot?.duration ?? null,
      }),
    );
  }
}
