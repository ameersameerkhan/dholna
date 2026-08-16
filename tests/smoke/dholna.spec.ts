import { expect, test, type Browser, type Page } from "@playwright/test";

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
] as const;

async function blockYouTube(page: Page) {
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (/(youtube\.com|ytimg\.com|googlevideo\.com)/i.test(url)) {
      await route.abort();
      return;
    }
    await route.continue();
  });
}

function usesPortraitArtwork(width: number, height: number) {
  return width <= 767 && height > width;
}

function activeScene(page: Page) {
  return page.locator("img.scene-image.is-active");
}

async function expectUprightModeSymbol(page: Page) {
  await page.waitForTimeout(360);
  const matrix = await page.locator(".player-mode-toggle__icon").evaluate((element) => {
    const transform = getComputedStyle(element).transform;
    const parsed = new DOMMatrix(transform === "none" ? undefined : transform);
    return { a: parsed.a, b: parsed.b, c: parsed.c, d: parsed.d };
  });

  expect(Math.abs(matrix.b)).toBeLessThan(0.001);
  expect(Math.abs(matrix.c)).toBeLessThan(0.001);
  expect(matrix.a).toBeCloseTo(1, 3);
  expect(matrix.d).toBeCloseTo(1, 3);
}

test("uses the correct scene family across representative viewports", async ({ page }) => {
  await blockYouTube(page);

  for (const [index, viewport] of VIEWPORTS.entries()) {
    await page.setViewportSize(viewport);
    if (index === 0) {
      await page.goto("/");
    }

    if (usesPortraitArtwork(viewport.width, viewport.height)) {
      await expect(activeScene(page)).toHaveAttribute(
        "src",
        /scenes\/(day|night)-mobile\.jpg$/,
      );
    } else {
      await expect(activeScene(page)).toHaveAttribute(
        "src",
        /scenes\/(day|night)\.jpg$/,
      );
    }
  }
});

test("first load exposes the authored desktop chrome and reference player typography", async ({ page }) => {
  await blockYouTube(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await expect(page.locator(".wordmark")).toHaveText("Dholna");
  const about = page.getByRole("button", { name: "About this journey" });
  await expect(about).toBeVisible();
  await expect(about).toContainText("About this journey");
  await expect(about).toContainText("↗");
  await expect(page.getByText(/YT MUSIC|YouTube Music/i)).toHaveCount(0);

  const favicon = page.locator('link[rel="icon"]');
  await expect(favicon).toHaveAttribute("href", /favicon\.svg$/);

  const visuals = await page.evaluate(() => {
    const style = (selector: string) => getComputedStyle(document.querySelector(selector)!);
    const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
    const chrome = rect(".top-chrome");

    return {
      chromeTop: chrome.top,
      chromeLeft: chrome.left,
      chromeRight: window.innerWidth - chrome.right,
      statusSize: Number.parseFloat(style(".railway-status").fontSize),
      statusWeight: style(".railway-status").fontWeight,
      statusFamily: style(".railway-status").fontFamily,
      wordmarkSize: Number.parseFloat(style(".wordmark").fontSize),
      wordmarkWeight: style(".wordmark").fontWeight,
      vinylWidth: Number.parseFloat(style(".wordmark .brand-vinyl").width),
      aboutSize: Number.parseFloat(style(".about-journey-trigger").fontSize),
      aboutWeight: style(".about-journey-trigger").fontWeight,
      playerBackground: style(".music-console").backgroundImage,
      titleSize: Number.parseFloat(style(".music-console__title").fontSize),
      titleWeight: style(".music-console__title").fontWeight,
      artistSize: Number.parseFloat(style(".music-console__artist").fontSize),
      timeSize: Number.parseFloat(style(".music-console__times").fontSize),
    };
  });

  expect(visuals.chromeTop).toBe(22);
  expect(visuals.chromeLeft).toBe(28);
  expect(visuals.chromeRight).toBe(28);
  expect(visuals.statusSize).toBe(14);
  expect(visuals.statusWeight).toBe("400");
  expect(visuals.statusFamily).toContain("JetBrains Mono");
  expect(visuals.wordmarkSize).toBe(23);
  expect(visuals.wordmarkWeight).toBe("600");
  expect(visuals.vinylWidth).toBe(28);
  expect(visuals.aboutSize).toBe(13);
  expect(visuals.aboutWeight).toBe("400");
  expect(visuals.playerBackground).toContain("25, 29, 34");
  expect(visuals.titleSize).toBe(15);
  expect(visuals.titleWeight).toBe("500");
  expect(visuals.artistSize).toBe(12);
  expect(visuals.timeSize).toBe(10);

  const clock = page.locator(".railway-status time");
  await expect(clock).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
  const firstTick = await clock.textContent();
  await expect
    .poll(async () => clock.textContent(), { timeout: 2_500 })
    .not.toBe(firstTick);
});

test("desktop tooltips use the readable reference material and mode symbol stays upright", async ({ page }) => {
  await blockYouTube(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const previous = page.getByRole("button", { name: "Previous track" });
  await previous.hover();
  const tooltip = page.getByRole("tooltip", { name: "Back down the line" });
  await page.waitForTimeout(450);
  expect(Number(await tooltip.evaluate((element) => getComputedStyle(element).opacity))).toBeGreaterThan(0.9);

  const tooltipVisuals = await tooltip.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      size: Number.parseFloat(style.fontSize),
      family: style.fontFamily,
      weight: style.fontWeight,
      background: style.backgroundColor,
    };
  });

  expect(tooltipVisuals.size).toBe(11);
  expect(tooltipVisuals.family).toContain("Inter");
  expect(tooltipVisuals.weight).toBe("400");
  expect(tooltipVisuals.background).toBe("rgba(12, 14, 16, 0.74)");

  await expectUprightModeSymbol(page);

  const shell = page.locator("main.app-shell");
  const initialMode = await shell.getAttribute("data-mode");
  expect(["day", "night"]).toContain(initialMode);
  const targetMode = initialMode === "day" ? "night" : "day";

  await page.getByRole("button", { name: `Switch to ${targetMode} mode` }).click();
  await expect(shell).toHaveAttribute("data-mode", targetMode);
  await expect(page.locator(".scene-transition-canvas")).toHaveCount(0, {
    timeout: 5_000,
  });
  await expectUprightModeSymbol(page);
});

test("desktop mode switch commits the target scene before Canvas leaves", async ({ page }) => {
  await blockYouTube(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const shell = page.locator("main.app-shell");
  await expect(page.getByRole("region", { name: "Music player" })).toBeVisible();
  await expect(page.locator(".mode-wheel")).toHaveCount(0);

  const initialMode = await shell.getAttribute("data-mode");
  expect(["day", "night"]).toContain(initialMode);
  const targetMode = initialMode === "day" ? "night" : "day";

  const modeButton = page.getByRole("button", {
    name: `Switch to ${targetMode} mode`,
  });
  await expect(modeButton).toBeVisible();
  await modeButton.click();

  await expect(shell).toHaveAttribute("data-mode", targetMode);
  await expect(shell).toHaveAttribute("data-transition", "painting");
  await expect(page.getByText(`${targetMode.toUpperCase()} SERVICE`)).toBeVisible();
  await expect(page.locator(".scene-transition-canvas")).toBeVisible();
  await expect(activeScene(page)).toHaveAttribute(
    "src",
    new RegExp(`scenes/${targetMode}\\.jpg$`),
  );

  await expect(page.locator(".scene-transition-canvas")).toHaveCount(0, {
    timeout: 5_000,
  });
  await expect(shell).toHaveAttribute("data-transition", "idle");
  await expect(activeScene(page)).toHaveAttribute(
    "src",
    new RegExp(`scenes/${targetMode}\\.jpg$`),
  );
});

test("portrait mobile uses the exact one line chrome and readable player", async ({ page }) => {
  await blockYouTube(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("region", { name: "Music player" })).toBeVisible();
  await expect(activeScene(page)).toHaveAttribute(
    "src",
    /scenes\/(day|night)-mobile\.jpg$/,
  );

  const values = await page.evaluate(() => {
    const style = (selector: string) => getComputedStyle(document.querySelector(selector)!);
    const chrome = document.querySelector(".top-chrome")!.getBoundingClientRect();
    return {
      chromeLeft: chrome.left,
      chromeRight: window.innerWidth - chrome.right,
      wordmark: Number.parseFloat(style(".wordmark").fontSize),
      wordmarkWeight: style(".wordmark").fontWeight,
      vinyl: Number.parseFloat(style(".wordmark .brand-vinyl").width),
      status: Number.parseFloat(style(".railway-status").fontSize),
      statusWeight: style(".railway-status").fontWeight,
      about: Number.parseFloat(style(".about-journey-trigger").fontSize),
      aboutWeight: style(".about-journey-trigger").fontWeight,
      desktopLabelDisplay: style(".about-journey-trigger__desktop").display,
      mobileLabelDisplay: style(".about-journey-trigger__mobile").display,
      serviceDisplay: style(".railway-status__service").display,
      separatorDisplay: style(".railway-status__separator").display,
      title: Number.parseFloat(style(".music-console__title").fontSize),
      artist: Number.parseFloat(style(".music-console__artist").fontSize),
      times: Number.parseFloat(style(".music-console__times").fontSize),
    };
  });

  expect(values.chromeLeft).toBe(16);
  expect(values.chromeRight).toBe(16);
  expect(values.wordmark).toBe(18);
  expect(values.wordmarkWeight).toBe("600");
  expect(values.vinyl).toBe(24);
  expect(values.status).toBe(11);
  expect(values.statusWeight).toBe("400");
  expect(values.about).toBe(11);
  expect(values.aboutWeight).toBe("400");
  expect(values.desktopLabelDisplay).toBe("none");
  expect(values.mobileLabelDisplay).not.toBe("none");
  expect(values.serviceDisplay).toBe("none");
  expect(values.separatorDisplay).toBe("none");
  expect(values.title).toBeGreaterThanOrEqual(14);
  expect(values.artist).toBeGreaterThanOrEqual(12);
  expect(values.times).toBeGreaterThanOrEqual(10);

  await expect(page.locator(".railway-status time")).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
  await expect(page.getByRole("button", { name: "About this journey" })).toContainText("About");
  await expect(page.locator(".railway-status__service")).toBeHidden();

  const controls = page.locator(".player-icon-button");
  const count = await controls.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const box = await controls.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test("narrow phone chrome does not overlap", async ({ page }) => {
  await blockYouTube(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  const boxes = await page.evaluate(() => {
    const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
    const brand = box(".wordmark");
    const clock = box(".railway-status");
    const about = box(".about-journey-trigger");
    return {
      brand: { left: brand.left, right: brand.right },
      clock: { left: clock.left, right: clock.right },
      about: { left: about.left, right: about.right },
    };
  });

  expect(boxes.brand.right).toBeLessThanOrEqual(boxes.clock.left + 1);
  expect(boxes.clock.right).toBeLessThanOrEqual(boxes.about.left + 1);
  expect(boxes.about.right).toBeLessThanOrEqual(304);
  await expect(page.locator(".railway-status__service")).toBeHidden();
});

test("opens and closes the journey story without disturbing the experience", async ({ page }) => {
  await blockYouTube(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "About this journey" });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "About this journey" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Dholna is a small experiment in music, motion and nostalgia."),
  ).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Built by Ameer on X" })).toHaveAttribute(
    "href",
    "https://x.com/AmeerSameerKhan",
  );

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("modal backdrop closes and underlying experience is inert while open", async ({ page }) => {
  await blockYouTube(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "About this journey" }).click();

  const experience = page.locator(".app-experience");
  expect(await experience.evaluate((element) => (element as HTMLElement).inert)).toBe(true);

  await page.getByTestId("about-journey-backdrop").click({ position: { x: 4, y: 4 } });
  await expect(page.getByRole("dialog", { name: "About this journey" })).toBeHidden();
  expect(await experience.evaluate((element) => (element as HTMLElement).inert)).toBe(false);
});

test("uses the compact About label on a 320px portrait viewport", async ({ page }) => {
  await blockYouTube(page);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "About this journey" });
  await expect(trigger.locator(".about-journey-trigger__mobile")).toBeVisible();
  await expect(trigger.locator(".about-journey-trigger__desktop")).toBeHidden();

  const box = await trigger.boundingBox();
  expect(box).not.toBeNull();
  expect((box?.x ?? 321) + (box?.width ?? 0)).toBeLessThanOrEqual(304);
});

test("touch layouts suppress desktop tooltips", async ({ browser }) => {
  const context = await createTouchContext(browser);
  const page = await context.newPage();
  await blockYouTube(page);
  await page.goto("/");

  const tooltip = page.locator(".control-tooltip__bubble").filter({ hasText: "Start the journey" });
  await expect(tooltip).toHaveCount(1);
  expect(await tooltip.evaluate((element) => getComputedStyle(element).display)).toBe("none");

  await context.close();
});

async function createTouchContext(browser: Browser) {
  return browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
}

test("reduced motion keeps the experience understandable without decorative spin", async ({ page }) => {
  await blockYouTube(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const animationNames = await page.evaluate(() => ({
    scene: getComputedStyle(document.querySelector("img.scene-image.is-active")!).animationName,
    artwork: getComputedStyle(document.querySelector(".player-artwork")!).animationName,
    brand: getComputedStyle(document.querySelector(".wordmark .brand-vinyl")!).animationName,
    mode: getComputedStyle(document.querySelector(".player-mode-toggle__icon")!).animationName,
  }));

  expect(animationNames.scene).toBe("none");
  expect(animationNames.artwork).toBe("none");
  expect(animationNames.brand).toBe("none");
  expect(animationNames.mode).toBe("none");

  const shell = page.locator("main.app-shell");
  const initialMode = await shell.getAttribute("data-mode");
  const targetMode = initialMode === "day" ? "night" : "day";

  await page
    .getByRole("button", { name: `Switch to ${targetMode} mode` })
    .click();

  await expect(shell).toHaveAttribute("data-mode", targetMode);
  await expect(page.locator(".scene-transition-canvas")).toHaveCount(0, {
    timeout: 2_500,
  });
  await expect(shell).toHaveAttribute("data-transition", "idle");
  await expect(activeScene(page)).toHaveAttribute(
    "src",
    new RegExp(`scenes/${targetMode}-mobile\\.jpg$`),
  );
});
