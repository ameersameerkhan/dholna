import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MusicConsole } from "./MusicConsole";

const track = {
  videoId: "abc123",
  title: "Night Train",
  artist: "Dholna Radio",
  index: 0,
  currentTime: 65,
  duration: 240,
};

describe("MusicConsole", () => {
  it("renders track information, player controls and playful tooltip copy", () => {
    const onPlay = vi.fn();
    const onSeek = vi.fn();
    const onModeToggle = vi.fn();

    render(
      <MusicConsole
        mode="night"
        transition="idle"
        playback="paused"
        track={track}
        reducedMotion={false}
        onPlay={onPlay}
        onPause={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onSeek={onSeek}
        onModeToggle={onModeToggle}
      />,
    );

    expect(screen.getByText("Night Train")).toBeInTheDocument();
    expect(screen.getByText("Dholna Radio")).toBeInTheDocument();
    expect(screen.getByText("1:05")).toBeInTheDocument();
    expect(screen.getByText("4:00")).toBeInTheDocument();
    expect(screen.getByRole("tooltip", { name: "Back down the line" })).toBeInTheDocument();
    expect(screen.getByRole("tooltip", { name: "Start the journey" })).toBeInTheDocument();
    expect(screen.getByRole("tooltip", { name: "Next station" })).toBeInTheDocument();
    expect(screen.getByRole("tooltip", { name: "Bring back the sun" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(onPlay).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByRole("slider", { name: "Seek track" }), {
      target: { value: "120" },
    });
    expect(onSeek).toHaveBeenCalledWith(120);

    const modeButton = screen.getByRole("button", {
      name: /switch to day mode/i,
    });
    vi.spyOn(modeButton, "getBoundingClientRect").mockReturnValue({
      x: 20,
      y: 40,
      left: 20,
      top: 40,
      right: 64,
      bottom: 84,
      width: 44,
      height: 44,
      toJSON: () => ({}),
    });
    fireEvent.click(modeButton);
    expect(onModeToggle).toHaveBeenCalledWith("day", { x: 42, y: 62 });
  });

  it("uses Pause tooltip copy while playing", () => {
    render(
      <MusicConsole
        mode="day"
        transition="idle"
        playback="playing"
        track={track}
        reducedMotion={false}
        onPlay={vi.fn()}
        onPause={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onSeek={vi.fn()}
        onModeToggle={vi.fn()}
      />,
    );

    expect(screen.getByRole("tooltip", { name: "Pause the journey" })).toBeInTheDocument();
    expect(screen.getByRole("tooltip", { name: "Chase the moon" })).toBeInTheDocument();
  });

  it("shows a controlled nonblank presentation while cueing and disables transport", () => {
    const onPlay = vi.fn();

    render(
      <MusicConsole
        mode="day"
        transition="idle"
        playback="cueing"
        track={track}
        reducedMotion={false}
        onPlay={onPlay}
        onPause={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onSeek={vi.fn()}
        onModeToggle={vi.fn()}
      />,
    );

    expect(screen.getByText("Dholna")).toBeInTheDocument();
    expect(screen.getByText("Preparing the journey")).toBeInTheDocument();
    expect(screen.getAllByText("0:00").length).toBeGreaterThan(0);
    expect(screen.queryByText("Night Train")).not.toBeInTheDocument();
    expect(screen.queryByText(/youtube/i)).not.toBeInTheDocument();

    const play = screen.getByRole("button", { name: "Play" });
    expect(play).toBeDisabled();
    fireEvent.click(play);
    expect(onPlay).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Previous track" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next track" })).toBeDisabled();
  });

  it("enables transport once YouTube reports a cued playlist", () => {
    const commonProps = {
      mode: "day" as const,
      transition: "idle" as const,
      track,
      reducedMotion: false,
      onPlay: vi.fn(),
      onPause: vi.fn(),
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onSeek: vi.fn(),
      onModeToggle: vi.fn(),
    };

    const { rerender } = render(
      <MusicConsole {...commonProps} playback="cueing" />,
    );

    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous track" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next track" })).toBeDisabled();

    rerender(<MusicConsole {...commonProps} playback="cued" />);

    expect(screen.getByRole("button", { name: "Play" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Previous track" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next track" })).toBeEnabled();
  });

  it("disables transport controls when playback is in error", () => {
    render(
      <MusicConsole
        mode="day"
        transition="idle"
        playback="error"
        track={{ ...track, title: "", artist: "" }}
        reducedMotion={false}
        onPlay={vi.fn()}
        onPause={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onSeek={vi.fn()}
        onModeToggle={vi.fn()}
      />,
    );

    expect(screen.getByText("Playback unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous track" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next track" })).toBeDisabled();
  });
});
