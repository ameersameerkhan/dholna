import { expect, test, type Page } from "@playwright/test";

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

async function readBackdrop(page: Page) {
  return page.locator(".about-journey-backdrop").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      filter: style.backdropFilter,
    };
  });
}

test("uses the approved responsive blur treatment behind the About modal", async ({ page }) => {
  await blockYouTube(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "About this journey" }).click();

  const desktop = await readBackdrop(page);
  expect(desktop.background).toBe("rgba(5, 7, 10, 0.34)");
  expect(desktop.filter).toContain("blur(42px)");
  expect(desktop.filter).toContain("saturate(0.86)");

  await page.getByRole("button", { name: "Close About this journey" }).click();
  await page.setViewportSize({ width: 430, height: 932 });
  await page.getByRole("button", { name: "About this journey" }).click();

  const mobile = await readBackdrop(page);
  expect(mobile.background).toBe("rgba(5, 7, 10, 0.34)");
  expect(mobile.filter).toContain("blur(26px)");
  expect(mobile.filter).toContain("saturate(0.86)");
});
