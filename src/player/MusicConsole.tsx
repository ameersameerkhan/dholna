import {
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import type { PlaybackState, TrackState } from "../appState";
import type { SceneMode } from "../config/scenes";
import type { TransitionOrigin } from "../scene/transitionEngine";
import { ControlTooltip } from "./ControlTooltip";
import { formatTime } from "./formatTime";
import { ModeToggle } from "./ModeToggle";
import { PlayerArtwork } from "./PlayerArtwork";

type MusicConsoleProps = {
  mode: SceneMode;
  transition: "idle" | "painting";
  playback: PlaybackState;
  track: TrackState;
  reducedMotion: boolean;
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onModeToggle: (nextMode: SceneMode, origin: TransitionOrigin) => void;
};

export function MusicConsole({
  mode,
  transition,
  playback,
  track,
  reducedMotion,
  onPlay,
  onPause,
  onPrevious,
  onNext,
  onSeek,
  onModeToggle,
}: MusicConsoleProps) {
  const unavailable = playback === "error";
  const preparing = playback === "booting" || playback === "cueing";
  const showingPause = playback === "playing" || playback === "buffering";
  const playable =
    playback === "cued" || playback === "paused" || playback === "ended";
  const transportReady = playable || showingPause;
  const playDisabled = unavailable || (!playable && !showingPause);
  const secondaryTransportDisabled = unavailable || !transportReady;

  const visibleVideoId = preparing ? null : track.videoId;
  const visibleTitle = preparing ? "Dholna" : track.title || "Dholna";
  const visibleArtist = preparing
    ? "Preparing the journey"
    : unavailable
      ? "Playback unavailable"
      : track.artist || "Ready for the journey";
  const duration = preparing ? 0 : Math.max(0, track.duration);
  const currentTime = preparing
    ? 0
    : Math.min(Math.max(0, track.currentTime), duration || 0);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const seekStyle = {
    "--seek-progress": `${progress}%`,
  } as CSSProperties;
  const modeTooltip = mode === "day" ? "Chase the moon" : "Bring back the sun";

  return (
    <section className="music-console" aria-label="Music player">
      <div className="music-console__artwork">
        <PlayerArtwork
          videoId={visibleVideoId}
          playing={playback === "playing"}
          reducedMotion={reducedMotion}
        />
      </div>

      <div className="music-console__track">
        <div className="music-console__meta">
          <div className="music-console__title" title={visibleTitle}>
            {visibleTitle}
          </div>
          <div className="music-console__artist">{visibleArtist}</div>
        </div>

        <input
          className="music-console__seek"
          type="range"
          min={0}
          max={duration}
          step={1}
          value={currentTime}
          aria-label="Seek track"
          disabled={unavailable || preparing || duration <= 0}
          style={seekStyle}
          onChange={(event) => onSeek(Number(event.currentTarget.value))}
        />

        <div className="music-console__times" aria-hidden="true">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="music-console__controls">
        <ControlTooltip label="Back down the line">
          <button
            className="player-icon-button"
            type="button"
            aria-label="Previous track"
            disabled={secondaryTransportDisabled}
            onClick={onPrevious}
          >
            <SkipBackIcon size={19} weight="regular" aria-hidden="true" />
          </button>
        </ControlTooltip>

        <ControlTooltip label={showingPause ? "Pause the journey" : "Start the journey"}>
          <button
            className="player-icon-button player-icon-button--primary"
            type="button"
            aria-label={showingPause ? "Pause" : "Play"}
            disabled={playDisabled}
            onClick={showingPause ? onPause : onPlay}
          >
            {showingPause ? (
              <PauseIcon size={21} weight="fill" aria-hidden="true" />
            ) : (
              <PlayIcon size={21} weight="fill" aria-hidden="true" />
            )}
          </button>
        </ControlTooltip>

        <ControlTooltip label="Next station">
          <button
            className="player-icon-button"
            type="button"
            aria-label="Next track"
            disabled={secondaryTransportDisabled}
            onClick={onNext}
          >
            <SkipForwardIcon size={19} weight="regular" aria-hidden="true" />
          </button>
        </ControlTooltip>

        <span className="music-console__divider" aria-hidden="true" />

        <ControlTooltip label={modeTooltip}>
          <ModeToggle
            mode={mode}
            disabled={transition !== "idle"}
            onToggle={onModeToggle}
          />
        </ControlTooltip>
      </div>
    </section>
  );
}
