import { VinylMark } from "../brand/VinylMark";

type PlayerArtworkProps = {
  videoId: string | null;
  playing: boolean;
  reducedMotion: boolean;
};

export function PlayerArtwork({
  videoId,
  playing,
  reducedMotion,
}: PlayerArtworkProps) {
  const thumbnail = videoId
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : null;

  return (
    <div
      className="player-artwork"
      data-playing={playing && !reducedMotion}
      aria-hidden="true"
    >
      {thumbnail ? (
        <img className="player-artwork__image" src={thumbnail} alt="" />
      ) : (
        <VinylMark size={32} className="player-artwork__fallback" />
      )}
    </div>
  );
}
