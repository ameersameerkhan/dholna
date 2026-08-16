import { useEffect, useState } from "react";
import type { SceneMode } from "../config/scenes";
import { SCENES } from "../config/scenes";

function localTime() {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function RailwayStatus({ mode }: { mode: SceneMode }) {
  const [time, setTime] = useState(localTime);

  useEffect(() => {
    const timer = window.setInterval(() => setTime(localTime()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const serviceLabel = SCENES[mode].serviceLabel;

  return (
    <div className="railway-status" aria-label={`${time}, ${serviceLabel}`}>
      <time>{time}</time>
      <span className="railway-status__separator" aria-hidden="true">·</span>
      <span className="railway-status__service">{serviceLabel}</span>
    </div>
  );
}
