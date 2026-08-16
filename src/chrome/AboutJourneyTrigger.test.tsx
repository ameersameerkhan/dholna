import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AboutJourneyTrigger } from "./AboutJourneyTrigger";

describe("AboutJourneyTrigger", () => {
  it("renders the approved desktop and mobile labels inside one button", () => {
    render(<AboutJourneyTrigger onOpen={() => undefined} />);

    const button = screen.getByRole("button", { name: "About this journey" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("About this journey");
    expect(button).toHaveTextContent("About");
    expect(button).toHaveTextContent("↗");
  });

  it("opens the journey story when activated", () => {
    const onOpen = vi.fn();
    render(<AboutJourneyTrigger onOpen={onOpen} />);

    fireEvent.click(screen.getByRole("button", { name: "About this journey" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
