import { useEffect } from "react";
import {
  artworkFor,
  type SceneAssetFamily,
  type SceneMode,
} from "../config/scenes";
import { useReducedMotion } from "../hooks/useReducedMotion";

type SceneProps = {
  mode: SceneMode;
  assetFamily: SceneAssetFamily;
  reducedMotion?: boolean;
};

const MODES: SceneMode[] = ["day", "night"];

export function Scene({
  mode,
  assetFamily,
  reducedMotion: reducedMotionOverride,
}: SceneProps) {
  const detectedReducedMotion = useReducedMotion();
  const reducedMotion = reducedMotionOverride ?? detectedReducedMotion;

  useEffect(() => {
    if (typeof Image === "undefined") return;

    const inactiveMode = mode === "day" ? "night" : "day";
    const preload = new Image();
    preload.src = artworkFor(inactiveMode, assetFamily);
  }, [assetFamily, mode]);

  return (
    <div
      className={`scene ${reducedMotion ? "scene--reduced-motion" : "scene--motion"}`}
      aria-hidden="true"
    >
      {MODES.map((layerMode) => (
        <img
          key={layerMode}
          className={`scene-image ${layerMode === mode ? "is-active" : "is-inactive"}`}
          src={artworkFor(layerMode, assetFamily)}
          alt=""
          draggable={false}
        />
      ))}
      <div className="scene-shade" />
    </div>
  );
}
