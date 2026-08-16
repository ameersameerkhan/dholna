import { DAY_VIDEO_IDS, NIGHT_VIDEO_IDS } from "../src/config/tracks.ts";
import { DAY_RESERVE_VIDEO_IDS, NIGHT_RESERVE_VIDEO_IDS } from "./track-reserves.ts";

const tracks = [
  ...DAY_VIDEO_IDS.map((videoId) => ({ set: "active", mode: "day", videoId })),
  ...NIGHT_VIDEO_IDS.map((videoId) => ({ set: "active", mode: "night", videoId })),
  ...DAY_RESERVE_VIDEO_IDS.map((videoId) => ({ set: "reserve", mode: "day", videoId })),
  ...NIGHT_RESERVE_VIDEO_IDS.map((videoId) => ({ set: "reserve", mode: "night", videoId })),
];

const rows = document.querySelector("#tracks");
const activeCount = document.querySelector("#active-count");
const reserveCount = document.querySelector("#reserve-count");

activeCount.textContent = String(tracks.filter((track) => track.set === "active").length);
reserveCount.textContent = String(tracks.filter((track) => track.set === "reserve").length);

rows.innerHTML = tracks
  .map((track) => {
    const verifierUrl = `./track-verifier.html?videoId=${encodeURIComponent(track.videoId)}`;
    return `<tr><td>${track.set}</td><td>${track.mode}</td><td><code>${track.videoId}</code></td><td><a href="${verifierUrl}" target="_blank" rel="noreferrer">Open verifier ↗</a></td></tr>`;
  })
  .join("");
