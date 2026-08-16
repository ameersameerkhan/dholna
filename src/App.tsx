import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AboutJourneyModal } from "./about/AboutJourneyModal";
import { createInitialState, appReducer } from "./appState";
import { AboutJourneyTrigger } from "./chrome/AboutJourneyTrigger";
import { RailwayStatus } from "./chrome/RailwayStatus";
import { Wordmark } from "./chrome/Wordmark";
import { SCENES, type SceneMode } from "./config/scenes";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { useSceneAssetFamily } from "./hooks/useSceneAssetFamily";
import { useSceneMode } from "./hooks/useSceneMode";
import { MusicConsole } from "./player/MusicConsole";
import { YouTubePlayerBridge } from "./player/YouTubePlayerBridge";
import { Scene } from "./scene/Scene";
import { SceneTransitionCanvas } from "./scene/SceneTransitionCanvas";
import type { TransitionOrigin } from "./scene/transitionEngine";

export function App() {
  const { mode, setManualMode } = useSceneMode();
  const reducedMotion = useReducedMotion();
  const assetFamily = useSceneAssetFamily();
  const [state, dispatch] = useReducer(appReducer, mode, createInitialState);
  const [transitionOrigin, setTransitionOrigin] = useState<TransitionOrigin | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerBridgeRef = useRef<YouTubePlayerBridge | null>(null);
  const initialVideoIdsRef = useRef(SCENES[mode].videoIds);
  const activeVideoIdsRef = useRef<readonly string[]>(SCENES[mode].videoIds);
  const aboutTriggerRef = useRef<HTMLButtonElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = playerHostRef.current;
    if (!host) return;

    const bridge = new YouTubePlayerBridge();
    playerBridgeRef.current = bridge;

    void bridge
      .init(host, initialVideoIdsRef.current, {
        onPlaybackChange(playback) {
          dispatch({ type: "playbackChanged", playback });
        },
        onSnapshot(snapshot) {
          const activeVideoIds = activeVideoIdsRef.current;
          if (!snapshot.videoId || !activeVideoIds.includes(snapshot.videoId)) return;
          if (!snapshot.title.trim()) return;

          dispatch({
            type: "trackChanged",
            track: {
              videoId: snapshot.videoId,
              title: snapshot.title,
              artist: snapshot.artist,
              index: snapshot.index,
              currentTime: snapshot.currentTime,
              duration: snapshot.duration,
            },
          });
        },
        onError(code, snapshot) {
          const activeVideoIds = activeVideoIdsRef.current;
          const activeIndex = snapshot?.videoId
            ? activeVideoIds.indexOf(snapshot.videoId)
            : -1;

          if (
            (code === 101 || code === 150) &&
            activeIndex >= 0 &&
            activeIndex + 1 < activeVideoIds.length
          ) {
            playerBridgeRef.current?.cueTracks(activeVideoIds, activeIndex + 1);
            return;
          }

          dispatch({ type: "playbackChanged", playback: "error" });
        },
      })
      .catch(() => {
        dispatch({ type: "playbackChanged", playback: "error" });
      });

    return () => {
      bridge.destroy();
      playerBridgeRef.current = null;
      host.replaceChildren();
    };
  }, []);

  useEffect(() => {
    if (state.playback !== "playing") return;

    const interval = window.setInterval(() => {
      const snapshot = playerBridgeRef.current?.snapshot();
      if (!snapshot) return;
      dispatch({
        type: "progressChanged",
        currentTime: snapshot.currentTime,
        duration: snapshot.duration,
      });
    }, 350);

    return () => window.clearInterval(interval);
  }, [state.playback]);

  useEffect(() => {
    const experience = experienceRef.current;
    if (!experience) return;

    if (!isAboutOpen) {
      experience.inert = false;
      return;
    }

    const previousOverflow = document.body.style.overflow;
    experience.inert = true;
    document.body.style.overflow = "hidden";

    return () => {
      experience.inert = false;
      document.body.style.overflow = previousOverflow;
    };
  }, [isAboutOpen]);

  const handleModeToggle = useCallback(
    (nextMode: SceneMode, origin: TransitionOrigin) => {
      if (state.transition !== "idle") return;

      const nextVideoIds = SCENES[nextMode].videoIds;
      activeVideoIdsRef.current = nextVideoIds;
      setManualMode(nextMode);
      setTransitionOrigin(origin);
      dispatch({ type: "transitionStarted", targetMode: nextMode });
      dispatch({
        type: "trackChanged",
        track: {
          videoId: null,
          title: "",
          artist: "",
          index: 0,
          currentTime: 0,
          duration: 0,
        },
      });
      playerBridgeRef.current?.cueTracks(nextVideoIds, 0);
    },
    [setManualMode, state.transition],
  );

  const handleTransitionComplete = useCallback(() => {
    dispatch({ type: "transitionCompleted" });
    setTransitionOrigin(null);
  }, []);

  return (
    <main
      className="app-shell"
      data-mode={state.mode}
      data-transition={state.transition}
    >
      <div ref={experienceRef} className="app-experience" aria-hidden={isAboutOpen || undefined}>
        <Scene
          mode={state.mode}
          assetFamily={assetFamily}
          reducedMotion={reducedMotion}
        />

        {state.transition === "painting" &&
        state.transitionFromMode &&
        transitionOrigin ? (
          <SceneTransitionCanvas
            fromMode={state.transitionFromMode}
            toMode={state.mode}
            assetFamily={assetFamily}
            origin={transitionOrigin}
            reducedMotion={reducedMotion}
            onComplete={handleTransitionComplete}
          />
        ) : null}

        <header className="top-chrome">
          <RailwayStatus mode={state.mode} />
          <Wordmark />
          <AboutJourneyTrigger
            ref={aboutTriggerRef}
            onOpen={() => setIsAboutOpen(true)}
          />
        </header>

        <MusicConsole
          mode={state.mode}
          transition={state.transition}
          playback={state.playback}
          track={state.track}
          reducedMotion={reducedMotion}
          onPlay={() => playerBridgeRef.current?.play()}
          onPause={() => playerBridgeRef.current?.pause()}
          onPrevious={() => playerBridgeRef.current?.previous()}
          onNext={() => playerBridgeRef.current?.next()}
          onSeek={(seconds) => playerBridgeRef.current?.seekTo(seconds)}
          onModeToggle={handleModeToggle}
        />

        <div
          ref={playerHostRef}
          className="youtube-player-engine"
          aria-hidden="true"
        />
      </div>

      <AboutJourneyModal
        open={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        triggerRef={aboutTriggerRef}
      />
    </main>
  );
}
