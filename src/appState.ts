import type { SceneMode } from "./config/scenes";

export type PlaybackState =
  | "booting"
  | "cueing"
  | "cued"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

export type TrackState = {
  videoId: string | null;
  title: string;
  artist: string;
  index: number;
  currentTime: number;
  duration: number;
};

export type AppState = {
  mode: SceneMode;
  transitionFromMode: SceneMode | null;
  transition: "idle" | "painting";
  playback: PlaybackState;
  track: TrackState;
};

export type AppAction =
  | { type: "transitionStarted"; targetMode: SceneMode }
  | { type: "transitionCompleted" }
  | { type: "playbackChanged"; playback: PlaybackState }
  | { type: "trackChanged"; track: Partial<TrackState> }
  | { type: "progressChanged"; currentTime: number; duration: number };

const EMPTY_TRACK: TrackState = {
  videoId: null,
  title: "",
  artist: "",
  index: 0,
  currentTime: 0,
  duration: 0,
};

export function createInitialState(mode: SceneMode): AppState {
  return {
    mode,
    transitionFromMode: null,
    transition: "idle",
    playback: "booting",
    track: { ...EMPTY_TRACK },
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "transitionStarted":
      if (state.transition !== "idle") return state;
      return {
        ...state,
        mode: action.targetMode,
        transitionFromMode: state.mode,
        transition: "painting",
      };

    case "transitionCompleted":
      return {
        ...state,
        transitionFromMode: null,
        transition: "idle",
      };

    case "playbackChanged":
      return { ...state, playback: action.playback };

    case "trackChanged":
      return { ...state, track: { ...state.track, ...action.track } };

    case "progressChanged":
      return {
        ...state,
        track: {
          ...state.track,
          currentTime: action.currentTime,
          duration: action.duration,
        },
      };
  }
}
