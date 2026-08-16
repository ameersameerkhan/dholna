import type { SceneMode } from "../config/scenes";

export const SCENE_STORAGE_KEY = "dholna:scene-mode";

export function modeForHour(hour: number): SceneMode {
  return hour >= 6 && hour < 18 ? "day" : "night";
}

export function isSceneMode(value: unknown): value is SceneMode {
  return value === "day" || value === "night";
}

export function resolveInitialMode(stored: unknown, hour: number): SceneMode {
  return isSceneMode(stored) ? stored : modeForHour(hour);
}

export function readStoredMode(storage: Pick<Storage, "getItem"> | null): SceneMode | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(SCENE_STORAGE_KEY);
    return isSceneMode(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeStoredMode(
  storage: Pick<Storage, "setItem"> | null,
  mode: SceneMode,
): void {
  if (!storage) return;
  try {
    storage.setItem(SCENE_STORAGE_KEY, mode);
  } catch {
    // Persistence is optional. The app remains usable without it.
  }
}
