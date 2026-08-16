export function AttributionLink() {
  return (
    <a
      className="attribution-link"
      href="https://x.com/AmeerSameerKhan"
      target="_blank"
      rel="noreferrer"
      aria-label="Built by Ameer on X"
    >
      <span className="attribution-link__prefix">Built by </span>
      <span className="attribution-link__name">Ameer</span>
      <span aria-hidden="true">↗</span>
    </a>
  );
}
