import { expect, test, type Page } from "@playwright/test";
import { DAY_VIDEO_IDS, NIGHT_VIDEO_IDS } from "../../src/config/tracks";

type Mode = "day" | "night";

type YouTubeTelemetry = {
  kind: string;
  rawState: number | null;
  videoId: string | null;
  index: number | null;
  currentTime: number | null;
};

const TRACKS: Record<Mode, readonly string[]> = {
  day: DAY_VIDEO_IDS,
  night: NIGHT_VIDEO_IDS,
};

const modes = ["day", "night"] as const;

test.describe.configure({ mode: "serial" });

async function forceMode(page: Page, mode: Mode) {
  await page.addInitScript((sceneMode) => {
    window.localStorage.setItem("dholna:scene-mode", sceneMode);
  }, mode);
}

function captureYouTubeTelemetry(page: Page): YouTubeTelemetry[] {
  const events: YouTubeTelemetry[] = [];

  page.on("console", (message) => {
    const text = message.text();
    const prefix = "DHOLNA_YT_EVENT ";
    if (!text.startsWith(prefix)) return;

    try {
      const event = JSON.parse(text.slice(prefix.length)) as YouTubeTelemetry;
      events.push(event);
      console.log(text);
    } catch {
      // Ignore unrelated or partial console output from the live provider.
    }
  });

  return events;
}

async function expectReadyAndSilent(page: Page) {
  const play = page.getByRole("button", { name: "Play" });
  const slider = page.getByRole("slider", { name: "Seek track" });

  await expect(play).toBeVisible({ timeout: 30_000 });
  await expect(play).toBeEnabled({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Pause" })).toHaveCount(0);
  await expect
    .poll(async () => Number(await slider.getAttribute("max")), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);
}

async function expectActiveTrack(
  page: Page,
  events: YouTubeTelemetry[],
  mode: Mode,
): Promise<string> {
  const validIds = TRACKS[mode];
  const title = page.locator(".music-console__title");

  await expect(title).not.toHaveText("Dholna", { timeout: 30_000 });
  await expectReadyAndSilent(page);

  let activeVideoId: string | null = null;
  await expect
    .poll(
      () => {
        const latest = [...events]
          .reverse()
          .find(
            (event) =>
              event.videoId !== null &&
              validIds.includes(event.videoId) &&
              event.rawState === 5,
          );
        activeVideoId = latest?.videoId ?? null;
        return activeVideoId;
      },
      { timeout: 30_000 },
    )
    .not.toBeNull();

  expect(validIds).toContain(activeVideoId);
  return activeVideoId!;
}

async function expectPlaybackAdvances(page: Page) {
  const slider = page.getByRole("slider", { name: "Seek track" });

  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible({
    timeout: 15_000,
  });

  await expect
    .poll(async () => Number(await slider.inputValue()), { timeout: 20_000 })
    .toBeGreaterThan(3);

  await page.waitForTimeout(2_000);
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toHaveCount(0);
}

async function switchMode(page: Page, mode: Mode) {
  await page.getByRole("button", { name: `Switch to ${mode} mode` }).click();
  await expect(page.locator("main.app-shell")).toHaveAttribute("data-mode", mode);
}

for (const mode of modes) {
  test(`live ${mode} loads an explicit Dholna track and remains silent`, async ({ page }) => {
    const events = captureYouTubeTelemetry(page);
    await forceMode(page, mode);
    await page.goto("/");

    const activeVideoId = await expectActiveTrack(page, events, mode);
    expect(TRACKS[mode]).toContain(activeVideoId);

    await page.waitForTimeout(1_000);
    await expectReadyAndSilent(page);
    expect(events.some((event) => event.rawState === 1)).toBe(false);
  });

  test(`live ${mode} playback advances after one Play press`, async ({ page }) => {
    const events = captureYouTubeTelemetry(page);
    await forceMode(page, mode);
    await page.goto("/");

    await expectActiveTrack(page, events, mode);
    await expectPlaybackAdvances(page);

    const playingEvent = [...events]
      .reverse()
      .find(
        (event) =>
          event.rawState === 1 &&
          event.videoId !== null &&
          TRACKS[mode].includes(event.videoId),
      );
    expect(playingEvent?.videoId).toBeTruthy();
  });
}

test("live paused Day to Night switch selects a Night track and stays silent", async ({ page }) => {
  const events = captureYouTubeTelemetry(page);
  await forceMode(page, "day");
  await page.goto("/");

  await expectActiveTrack(page, events, "day");
  const eventBoundary = events.length;

  await switchMode(page, "night");
  await expectActiveTrack(page, events, "night");
  await expectReadyAndSilent(page);

  const afterSwitch = events.slice(eventBoundary);
  expect(afterSwitch.some((event) => event.rawState === 1)).toBe(false);
});

test("live playing Day to Night switch becomes silent and requires Play again", async ({ page }) => {
  const events = captureYouTubeTelemetry(page);
  await forceMode(page, "day");
  await page.goto("/");

  await expectActiveTrack(page, events, "day");
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible({
    timeout: 15_000,
  });

  const eventBoundary = events.length;
  await switchMode(page, "night");
  await expectActiveTrack(page, events, "night");
  await expectReadyAndSilent(page);

  const afterSwitch = events.slice(eventBoundary);
  expect(afterSwitch.some((event) => event.rawState === 1)).toBe(false);
});

test("live Night to Day switch selects a Day track and stays silent", async ({ page }) => {
  const events = captureYouTubeTelemetry(page);
  await forceMode(page, "night");
  await page.goto("/");

  await expectActiveTrack(page, events, "night");
  const eventBoundary = events.length;

  await switchMode(page, "day");
  await expectActiveTrack(page, events, "day");
  await expectReadyAndSilent(page);

  const afterSwitch = events.slice(eventBoundary);
  expect(afterSwitch.some((event) => event.rawState === 1)).toBe(false);
});

test("live repeated scene switching keeps one persistent YouTube iframe", async ({ page }) => {
  const events = captureYouTubeTelemetry(page);
  await forceMode(page, "day");
  await page.goto("/");

  await expectActiveTrack(page, events, "day");
  await expect(page.locator(".youtube-player-engine iframe")).toHaveCount(1);

  const sequence: Mode[] = ["night", "day", "night", "day"];
  for (const mode of sequence) {
    await switchMode(page, mode);
    await expectActiveTrack(page, events, mode);
    await expectReadyAndSilent(page);
    await expect(page.locator(".youtube-player-engine iframe")).toHaveCount(1);
  }
});
