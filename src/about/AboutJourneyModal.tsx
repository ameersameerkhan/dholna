import { useEffect, useRef, type RefObject } from "react";
import { AttributionLink } from "../chrome/AttributionLink";

interface AboutJourneyModalProps {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function AboutJourneyModal({ open, onClose, triggerRef }: AboutJourneyModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return (
    <div
      className="about-journey-backdrop"
      data-testid="about-journey-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="about-journey-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-journey-title"
      >
        <button
          ref={closeRef}
          type="button"
          className="about-journey-modal__close"
          aria-label="Close about this journey"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="about-journey-modal__content">
          <h2 id="about-journey-title">About this journey</h2>
          <p>Dholna is a small experiment in music, motion and nostalgia.</p>
          <p>
            A train window, a changing sky, and a handful of songs for disappearing into your
            own thoughts for a while.
          </p>
          <p>I built it simply because I wanted it to exist.</p>
          <p>
            It lives at New Pardesi. For now, that’s just a small corner of the internet for
            things I feel like making.
          </p>
        </div>

        <div className="about-journey-modal__colophon">
          <AttributionLink />
          <a
            className="about-journey-modal__github"
            href="https://github.com/ameersameerkhan/dholna"
            target="_blank"
            rel="noreferrer"
            aria-label="View Dholna source on GitHub"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}
