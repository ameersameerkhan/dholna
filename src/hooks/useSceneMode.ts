import { useCallback, useState } from "react";
import type { SceneMode } from "../config/scenes";
import {
  readStoredMode,
  resolveInitialMode,
  writeStoredMode,
} from "./sceneMode";

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function useSceneMode() {
  const [mode, setMode] = useState<SceneMode>(() => {
    const stored = readStoredMode(browserStorage());
    return resolveInitialMode(stored, new Date().getHours());
  });

  const setManualMode = useCallback((nextMode: SceneMode) => {
    setMode(nextMode);
    writeStoredMode(browserStorage(), nextMode);
  }, []);

  return { mode, setManualMode };
}
