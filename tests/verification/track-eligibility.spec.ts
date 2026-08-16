import { expect, test, type Page } from "@playwright/test";
import { DAY_VIDEO_IDS, NIGHT_VIDEO_IDS } from "../../src/config/tracks";
import { DAY_RESERVE_VIDEO_IDS, NIGHT_RESERVE_VIDEO_IDS } from "../../tools/track-reserves";

type TrackTarget = {
  mode: "day" | "night";
  scope: "runtime" | "reserve";
  videoId: string;
};

const targets: TrackTarget[] = [
  ...DAY_VIDEO_IDS.map((videoId) => ({ mode: "day" as const, scope: "runtime" as const, videoId })),
  ...NIGHT_VIDEO_IDS.map((videoId) => ({ mode: "night" as const, scope: "runtime" as const, videoId })),
  ...DAY_RESERVE_VIDEO_IDS.map((videoId) => ({ mode: "day" as const, scope: "reserve" as const, videoId })),
  ...NIGHT_RESERVE_VIDEO_IDS.map((videoId) => ({ mode: "night" as const, scope: "reserve" as const, videoId })),
];

type VerificationResult = {
  ready: boolean;
  state: number;
  error: number | null;
};

type VerificationVideoData = {
  video_id?: string;
  title?: string;
};

type VerificationEvent = {
  at: number;
  kind: string;
  detail: unknown;
};

async function installVerifier(page: Page, target: TrackTarget) {
  await page.goto(`/tools/track-verifier.html?videoId=${encodeURIComponent(target.videoId)}`);
}

async function result(page: Page): Promise<VerificationResult> {
  return page.evaluate(() => {
    const value = (window as unknown as {
      __dholnaTrackResult?: VerificationResult;
    }).__dholnaTrackResult;

    return value ?? { ready: false, state: -1, error: null };
  });
}

async function videoData(page: Page): Promise<VerificationVideoData> {
  return page.evaluate(() => {
    const player = (window as unknown as {
      __dholnaTrackPlayer?: { getVideoData(): VerificationVideoData };
    }).__dholnaTrackPlayer;

    return player?.getVideoData?.() ?? {};
  });
}

async function currentTime(page: Page): Promise<number> {
  return page.evaluate(() => {
    const player = (window as unknown as {
      __dholnaTrackPlayer?: { getCurrentTime(): number };
    }).__dholnaTrackPlayer;

    return player?.getCurrentTime?.() ?? 0;
  });
}

async function diagnostics(page: Page): Promise<VerificationEvent[]> {
  return page.evaluate(() => {
    return (
      (window as unknown as { __dholnaTrackEvents?: VerificationEvent[] }).__dholnaTrackEvents ?? []
    );
  });
}

for (const target of targets) {
  const tag = target.scope === "runtime" ? "@runtime" : "@reserve";

  test(`${tag} ${target.mode}: ${target.videoId} is embeddable`, async ({ page }) => {
    await installVerifier(page, target);

    await expect.poll(async () => (await result(page)).ready, { timeout: 15_000 }).toBe(true);
    await page.locator("#play").click();

    await page.waitForFunction(
      () => {
        const value = (window as unknown as {
          __dholnaTrackResult?: VerificationResult;
        }).__dholnaTrackResult;
        return value?.state === 1 || value?.error !== null;
      },
      undefined,
      { timeout: 15_000 },
    );

    const afterPlay = await result(page);
    if (afterPlay.error !== null || afterPlay.state !== 1) {
      console.log(
        "DHOLNA_TRACK_DIAGNOSTICS",
        target.videoId,
        JSON.stringify(await diagnostics(page)),
      );
    }
    expect(afterPlay.error).toBeNull();
    expect(afterPlay.state).toBe(1);

    const metadata = await videoData(page);
    expect(metadata.video_id).toBe(target.videoId);
    expect(metadata.title?.trim().length ?? 0).toBeGreaterThan(0);

    await page.waitForTimeout(2_500);

    const finalResult = await result(page);
    expect(finalResult.error).not.toBe(101);
    expect(finalResult.error).not.toBe(150);
    expect(await currentTime(page)).toBeGreaterThan(1);
  });
}
