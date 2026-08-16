import { DAY_VIDEO_IDS, NIGHT_VIDEO_IDS } from "./tracks";

export type SceneMode = "day" | "night";
export type SceneAssetFamily = "desktop" | "portrait";

export type SceneConfig = {
  artwork: Record<SceneAssetFamily, string>;
  videoIds: readonly string[];
  externalPlaylistUrl: string;
  serviceLabel: "DAY SERVICE" | "NIGHT SERVICE";
  tokens: {
    glassTint: string;
    glassBorder: string;
    highlight: string;
    glow: string;
    textPrimary: string;
    textSecondary: string;
  };
};

const base = import.meta.env.BASE_URL;

export const SCENES: Record<SceneMode, SceneConfig> = {
  day: {
    artwork: {
      desktop: `${base}scenes/day.jpg`,
      portrait: `${base}scenes/day-mobile.jpg`,
    },
    videoIds: DAY_VIDEO_IDS,
    externalPlaylistUrl:
      "https://music.youtube.com/playlist?list=PLz2x7P26Rz26hL_psx7KLQJ43Q7tk29Xv",
    serviceLabel: "DAY SERVICE",
    tokens: {
      glassTint: "255 245 226",
      glassBorder: "255 255 255",
      highlight: "255 255 255",
      glow: "244 186 80",
      textPrimary: "255 255 255",
      textSecondary: "255 255 255",
    },
  },
  night: {
    artwork: {
      desktop: `${base}scenes/night.jpg`,
      portrait: `${base}scenes/night-mobile.jpg`,
    },
    videoIds: NIGHT_VIDEO_IDS,
    externalPlaylistUrl:
      "https://music.youtube.com/playlist?list=PLiJzQiSAES33kH4LoRkwfN1-idaKmEeQ2",
    serviceLabel: "NIGHT SERVICE",
    tokens: {
      glassTint: "20 28 52",
      glassBorder: "205 218 255",
      highlight: "235 241 255",
      glow: "154 178 255",
      textPrimary: "255 255 255",
      textSecondary: "226 233 255",
    },
  },
};

export function artworkFor(
  mode: SceneMode,
  family: SceneAssetFamily,
): string {
  return SCENES[mode].artwork[family];
}
