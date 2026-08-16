import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import type { MouseEvent } from "react";
import type { SceneMode } from "../config/scenes";
import type { TransitionOrigin } from "../scene/transitionEngine";

type ModeToggleProps = {
  mode: SceneMode;
  disabled: boolean;
  onToggle: (nextMode: SceneMode, origin: TransitionOrigin) => void;
};

export function ModeToggle({ mode, disabled, onToggle }: ModeToggleProps) {
  const targetMode: SceneMode = mode === "day" ? "night" : "day";
  const Icon = mode === "day" ? SunIcon : MoonIcon;
  const symbol = mode === "day" ? "sun" : "moon";

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (disabled) return;

    const rect = event.currentTarget.getBoundingClientRect();
    onToggle(targetMode, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }

  return (
    <button
      className="player-icon-button player-mode-toggle"
      type="button"
      data-mode={mode}
      aria-label={`Switch to ${targetMode} mode`}
      aria-pressed={mode === "night"}
      disabled={disabled}
      onClick={handleClick}
    >
      <span
        className="player-mode-toggle__icon"
        data-symbol={symbol}
        aria-hidden="true"
      >
        <Icon size={20} weight="regular" />
      </span>
    </button>
  );
}
