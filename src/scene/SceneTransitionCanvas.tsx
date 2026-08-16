import { useEffect, useRef } from "react";
import {
  artworkFor,
  type SceneAssetFamily,
  type SceneMode,
} from "../config/scenes";
import {
  startSceneTransition,
  type SceneTransitionController,
  type TransitionOrigin,
} from "./transitionEngine";

type SceneTransitionCanvasProps = {
  fromMode: SceneMode;
  toMode: SceneMode;
  assetFamily: SceneAssetFamily;
  origin: TransitionOrigin;
  reducedMotion: boolean;
  onComplete: () => void;
};

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load scene image: ${source}`));
    image.src = source;
  });
}

export function SceneTransitionCanvas({
  fromMode,
  toMode,
  assetFamily,
  origin,
  reducedMotion,
  onComplete,
}: SceneTransitionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fromArtwork = artworkFor(fromMode, assetFamily);
  const toArtwork = artworkFor(toMode, assetFamily);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let controller: SceneTransitionController | null = null;

    Promise.all([loadImage(fromArtwork), loadImage(toArtwork)])
      .then(([fromImage, toImage]) => {
        if (disposed) return;
        controller = startSceneTransition({
          canvas,
          fromImage,
          toImage,
          targetMode: toMode,
          origin,
          width: Math.max(1, window.innerWidth || canvas.clientWidth),
          height: Math.max(1, window.innerHeight || canvas.clientHeight),
          reducedMotion,
          onComplete,
        });
      })
      .catch(() => {
        if (!disposed) onComplete();
      });

    return () => {
      disposed = true;
      controller?.cancel();
    };
  }, [fromArtwork, onComplete, origin, reducedMotion, toArtwork, toMode]);

  return (
    <canvas
      ref={canvasRef}
      className="scene-transition-canvas"
      aria-hidden="true"
      style={{ backgroundImage: `url("${fromArtwork}")` }}
    />
  );
}
