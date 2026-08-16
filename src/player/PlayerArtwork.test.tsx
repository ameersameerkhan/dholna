import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlayerArtwork } from "./PlayerArtwork";

describe("PlayerArtwork", () => {
  it("uses the vinyl mark until real track artwork is available", () => {
    const { container, rerender } = render(
      <PlayerArtwork videoId={null} playing={false} reducedMotion={false} />,
    );

    expect(container.querySelector(".brand-vinyl")).toBeInTheDocument();
    expect(container.querySelector(".player-artwork__image")).not.toBeInTheDocument();

    rerender(
      <PlayerArtwork videoId="abc123" playing={true} reducedMotion={false} />,
    );

    expect(container.querySelector(".brand-vinyl")).not.toBeInTheDocument();
    expect(container.querySelector(".player-artwork__image")).toHaveAttribute(
      "src",
      "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
    );
  });
});
