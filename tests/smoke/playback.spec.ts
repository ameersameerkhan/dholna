import { expect, test, type Page } from "@playwright/test";
import { DAY_VIDEO_IDS, NIGHT_VIDEO_IDS } from "../../src/config/tracks";

async function forceDayMode(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("dholna:scene-mode", "day");
  });
}

async function installFakeYouTube(page: Page) {
  await page.addInitScript({
    content: `
      (() => {
        const harness = {
          calls: {
            construct: 0,
            destroy: 0,
            cue: 0,
            load: 0,
            play: 0,
            pause: 0,
            previous: 0,
            next: 0
          },
          lastCue: null,
          lastLoad: null,
          player: null,
          videoDataOverride: null,
          emitState(state) {
            if (!this.player) throw new Error("Fake YouTube player is not ready");
            this.player.state = state;
            this.player.events.onStateChange({ target: this.player, data: state });
          },
          emitError(code) {
            if (!this.player) throw new Error("Fake YouTube player is not ready");
            this.player.events.onError({ target: this.player, data: code });
          },
          overrideVideoData(videoId, title = "Fake track", author = "Fake artist") {
            this.videoDataOverride = {
              video_id: videoId,
              title,
              author
            };
          },
          setPlayerIndex(index) {
            if (!this.player) throw new Error("Fake YouTube player is not ready");
            this.player.index = index;
          }
        };

        class FakePlayer {
          constructor(_element, options) {
            harness.calls.construct += 1;
            this.events = options.events;
            this.state = -1;
            this.currentTime = 0;
            this.queue = [];
            this.index = 0;
            harness.player = this;
            queueMicrotask(() => this.events.onReady({ target: this }));
          }

          cuePlaylist(videoIds, index = 0, startSeconds = 0) {
            harness.calls.cue += 1;
            this.queue = [...videoIds];
            this.index = index;
            harness.lastCue = {
              videoIds: [...videoIds],
              index,
              startSeconds
            };
          }

          loadPlaylist(options) {
            harness.calls.load += 1;
            harness.lastLoad = options;
          }

          playVideo() { harness.calls.play += 1; }
          pauseVideo() { harness.calls.pause += 1; }
          previousVideo() { harness.calls.previous += 1; }
          nextVideo() { harness.calls.next += 1; }
          seekTo() {}
          getPlayerState() { return this.state; }
          getCurrentTime() { return this.currentTime; }
          getDuration() { return 240; }
          getVideoData() {
            if (harness.videoDataOverride) {
              return harness.videoDataOverride;
            }

            const videoId = this.queue[this.index] ?? null;
            return videoId
              ? {
                  video_id: videoId,
                  title: "Fake track",
                  author: "Fake artist"
                }
              : {};
          }
          getPlaylistIndex() { return this.index; }
          destroy() { harness.calls.destroy += 1; }
        }

        window.__dholnaYouTubeTest = harness;
        window.YT = { Player: FakePlayer };
      })();
    `,
  });
}

async function playbackHarness(page: Page) {
  return page.evaluate(() => {
    const harness = (window as unknown as {
      __dholnaYouTubeTest: {
        calls: {
          construct: number;
          destroy: number;
          cue: number;
          load: number;
          play: number;
          pause: number;
          previous: number;
          next: number;
        };
        lastCue: {
          videoIds: string[];
          index: number;
          startSeconds: number;
        } | null;
        lastLoad: unknown;
      };
    }).__dholnaYouTubeTest;

    return {
      calls: { ...harness.calls },
      lastCue: harness.lastCue,
      lastLoad: harness.lastLoad,
    };
  });
}

async function emitState(page: Page, state: number) {
  await page.evaluate((nextState) => {
    const harness = (window as unknown as {
      __dholnaYouTubeTest: { emitState: (state: number) => void };
    }).__dholnaYouTubeTest;
    harness.emitState(nextState);
  }, state);
}

async function emitError(page: Page, code: number) {
  await page.evaluate((errorCode) => {
    const harness = (window as unknown as {
      __dholnaYouTubeTest: { emitError: (code: number) => void };
    }).__dholnaYouTubeTest;
    harness.emitError(errorCode);
  }, code);
}

async function overrideVideoData(
  page: Page,
  videoId: string,
  title = "Fake track",
  author = "Fake artist",
) {
  await page.evaluate(
    ({ id, nextTitle, nextAuthor }) => {
      const harness = (window as unknown as {
        __dholnaYouTubeTest: {
          overrideVideoData: (videoId: string, title: string, author: string) => void;
        };
      }).__dholnaYouTubeTest;
      harness.overrideVideoData(id, nextTitle, nextAuthor);
    },
    { id: videoId, nextTitle: title, nextAuthor: author },
  );
}

async function setPlayerIndex(page: Page, index: number) {
  await page.evaluate((nextIndex) => {
    const harness = (window as unknown as {
      __dholnaYouTubeTest: { setPlayerIndex: (index: number) => void };
    }).__dholnaYouTubeTest;
    harness.setPlayerIndex(nextIndex);
  }, index);
}

async function switchToNight(page: Page) {
  await page.getByRole("button", { name: "Switch to night mode" }).click();
  await expect(page.locator("main.app-shell")).toHaveAttribute("data-mode", "night");
  await expect.poll(async () => (await playbackHarness(page)).calls.cue).toBe(2);
}

test("fresh load stays silent until the explicit tracks are cued and Play is pressed", async ({ page }) => {
  await forceDayMode(page);
  await installFakeYouTube(page);
  await page.goto("/");

  await expect.poll(async () => (await playbackHarness(page)).calls.cue).toBe(1);

  const initial = await playbackHarness(page);
  expect(initial.calls.construct).toBe(1);
  expect(initial.calls.load).toBe(0);
  expect(initial.calls.play).toBe(0);
  expect(initial.lastCue).toEqual({
    videoIds: [...DAY_VIDEO_IDS],
    index: 0,
    startSeconds: 0,
  });

  const play = page.getByRole("button", { name: "Play" });
  await expect(play).toBeDisabled();
  await expect(page.getByText("Preparing the journey")).toBeVisible();

  await emitState(page, 5);
  await expect(play).toBeEnabled();

  await play.click();

  const afterPlay = await playbackHarness(page);
  expect(afterPlay.calls.play).toBe(1);
  expect(afterPlay.calls.load).toBe(0);
  expect(afterPlay.calls.cue).toBe(1);
});

test("Pause is one direct command", async ({ page }) => {
  await forceDayMode(page);
  await installFakeYouTube(page);
  await page.goto("/");

  await expect.poll(async () => (await playbackHarness(page)).calls.cue).toBe(1);
  await emitState(page, 1);

  const pause = page.getByRole("button", { name: "Pause" });
  await expect(pause).toBeVisible();
  await pause.click();

  const harness = await playbackHarness(page);
  expect(harness.calls.pause).toBe(1);
  expect(harness.calls.load).toBe(0);
  expect(harness.calls.cue).toBe(1);
});

test("Previous and Next each delegate exactly once", async ({ page }) => {
  await forceDayMode(page);
  await installFakeYouTube(page);
  await page.goto("/");

  await expect.poll(async () => (await playbackHarness(page)).calls.cue).toBe(1);
  await emitState(page, 5);

  await page.getByRole("button", { name: "Previous track" }).click();
  await page.getByRole("button", { name: "Next track" }).click();

  const harness = await playbackHarness(page);
  expect(harness.calls.previous).toBe(1);
  expect(harness.calls.next).toBe(1);
  expect(harness.calls.load).toBe(0);
  expect(harness.calls.cue).toBe(1);
});

test("paused Day to Night cues Night track one on the same player and stays silent", async ({ page }) => {
  await forceDayMode(page);
  await installFakeYouTube(page);
  await page.goto("/");

  await expect.poll(async () => (await playbackHarness(page)).calls.cue).toBe(1);
  await emitState(page, 5);

  await switchToNight(page);

  const switched = await playbackHarness(page);
  expect(switched.calls.construct).toBe(1);
  expect(switched.calls.destroy).toBe(0);
  expect(switched.calls.load).toBe(0);
  expect(switched.calls.play).toBe(0);
  expect(switched.lastCue).toEqual({
    videoIds: [...NIGHT_VIDEO_IDS],
    index: 0,
    startSeconds: 0,
  });

  const play = page.getByRole("button", { name: "Play" });
  await expect(play).toBeDisabled();

  await emitState(page, 5);
  await expect(play).toBeEnabled();
  expect((await playbackHarness(page)).calls.play).toBe(0);
});

test("playing Day to Night still cues Night on the same player and does not resume", async ({ page }) => {
  await forceDayMode(page);
  await installFakeYouTube(page);
  await page.goto("/");

  await expect.poll(async () => (await playbackHarness(page)).calls.cue).toBe(1);
  await emitState(page, 1);
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

  await switchToNight(page);

  const switched = await playbackHarness(page);
  expect(switched.calls.construct).toBe(1);
  expect(switched.calls.destroy).toBe(0);
  expect(switched.calls.load).toBe(0);
  expect(switched.calls.play).toBe(0);
  expect(switched.lastCue).toEqual({
    videoIds: [...NIGHT_VIDEO_IDS],
    index: 0,
    startSeconds: 0,
  });

  await expect(page.getByRole("button", { name: "Play" })).toBeDisabled();
  await emitState(page, 5);
  await expect(page.getByRole("button", { name: "Play" })).toBeEnabled();
  expect((await playbackHarness(page)).calls.play).toBe(0);
});

test("stale Day metadata is ignored after switching to Night", async ({ page }) => {
  await forceDayMode(page);
  await installFakeYouTube(page);
  await page.goto("/");

  await expect.poll(async () => (await playbackHarness(page)).calls.cue).toBe(1);
  await emitState(page, 5);
  await switchToNight(page);

  await overrideVideoData(page, DAY_VIDEO_IDS[0], "Stale Day track");
  await emitState(page, 5);
  await expect(page.locator(".music-console__title")).toHaveText("Dholna");

  await overrideVideoData(page, NIGHT_VIDEO_IDS[0], "Night track one");
  await emitState(page, 5);
  await expect(page.locator(".music-console__title")).toHaveText("Night track one");
});

for (const errorCode of [101, 150] as const) {
  test(`YouTube error ${errorCode} skips to the next Night track silently`, async ({ page }) => {
    await forceDayMode(page);
    await installFakeYouTube(page);
    await page.goto("/");

    await expect.poll(async () => (await playbackHarness(page)).calls.cue).toBe(1);
    await emitState(page, 5);
    await switchToNight(page);
    await emitState(page, 5);

    await emitError(page, errorCode);
    await expect.poll(async () => (await playbackHarness(page)).calls.cue).toBe(3);

    const recovered = await playbackHarness(page);
    expect(recovered.lastCue).toEqual({
      videoIds: [...NIGHT_VIDEO_IDS],
      index: 1,
      startSeconds: 0,
    });
    expect(recovered.calls.play).toBe(0);
    await expect(page.getByRole("button", { name: "Play" })).toBeDisabled();
    await expect(page.getByText("Preparing the journey")).toBeVisible();

    await emitState(page, 5);
    await expect(page.getByRole("button", { name: "Play" })).toBeEnabled();
    expect((await playbackHarness(page)).calls.play).toBe(0);
  });
}

test("an embed error on the final Night track becomes unavailable without wrapping", async ({ page }) => {
  await forceDayMode(page);
  await installFakeYouTube(page);
  await page.goto("/");

  await expect.poll(async () => (await playbackHarness(page)).calls.cue).toBe(1);
  await emitState(page, 5);
  await switchToNight(page);
  await setPlayerIndex(page, NIGHT_VIDEO_IDS.length - 1);
  await emitState(page, 5);

  const cueCountBeforeError = (await playbackHarness(page)).calls.cue;
  await emitError(page, 150);

  await expect(page.getByText("Playback unavailable")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeDisabled();
  expect((await playbackHarness(page)).calls.cue).toBe(cueCountBeforeError);
});

test("repeated Day Night switching keeps one player and never blanks the console", async ({ page }) => {
  await forceDayMode(page);
  await installFakeYouTube(page);
  await page.goto("/");

  await expect.poll(async () => (await playbackHarness(page)).calls.cue).toBe(1);
  await emitState(page, 5);
  await expect(page.locator(".music-console__title")).toHaveText("Fake track");

  for (let index = 0; index < 6; index += 1) {
    const toNight = index % 2 === 0;
    const targetMode = toNight ? "night" : "day";
    const targetIds = toNight ? NIGHT_VIDEO_IDS : DAY_VIDEO_IDS;

    await page
      .getByRole("button", {
        name: toNight ? "Switch to night mode" : "Switch to day mode",
      })
      .click();

    await expect(page.locator("main.app-shell")).toHaveAttribute(
      "data-mode",
      targetMode,
    );
    await expect(page.getByText("Preparing the journey")).toBeVisible();
    await expect(page.locator(".music-console__title")).toHaveText("Dholna");
    await expect.poll(async () => (await playbackHarness(page)).calls.cue).toBe(index + 2);

    const cueing = await playbackHarness(page);
    expect(cueing.calls.construct).toBe(1);
    expect(cueing.calls.destroy).toBe(0);
    expect(cueing.calls.load).toBe(0);
    expect(cueing.calls.play).toBe(0);
    expect(cueing.lastCue).toEqual({
      videoIds: [...targetIds],
      index: 0,
      startSeconds: 0,
    });

    await emitState(page, 5);
    await expect(page.locator(".music-console__title")).toHaveText("Fake track");
    await expect(page.getByRole("button", { name: "Play" })).toBeEnabled();
    await expect(page.locator("main.app-shell")).toHaveAttribute(
      "data-transition",
      "idle",
      { timeout: 3_000 },
    );
  }

  const finalHarness = await playbackHarness(page);
  expect(finalHarness.calls.construct).toBe(1);
  expect(finalHarness.calls.destroy).toBe(0);
  expect(finalHarness.calls.load).toBe(0);
  expect(finalHarness.calls.play).toBe(0);
  await expect(page.locator(".music-console__title")).not.toHaveText("");
});
