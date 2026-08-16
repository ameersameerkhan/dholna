import { forwardRef } from "react";

interface AboutJourneyTriggerProps {
  onOpen: () => void;
}

export const AboutJourneyTrigger = forwardRef<HTMLButtonElement, AboutJourneyTriggerProps>(
  function AboutJourneyTrigger({ onOpen }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className="about-journey-trigger"
        onClick={onOpen}
        aria-label="About this journey"
      >
        <span className="about-journey-trigger__desktop">About this journey</span>
        <span className="about-journey-trigger__mobile">About</span>
        <span aria-hidden="true">↗</span>
      </button>
    );
  },
);
