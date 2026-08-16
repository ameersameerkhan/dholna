import { VinylMark } from "../brand/VinylMark";

export function Wordmark() {
  return (
    <div className="wordmark" aria-label="Dholna">
      <VinylMark />
      <span className="wordmark__text">Dholna</span>
    </div>
  );
}
