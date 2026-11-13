import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
test("homepage preserves artwork and changes composition with screen orientation", async ({
  page,
}) => {
  await page.goto("/");
  for (const size of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 375, height: 667 },
  ]) {
    await page.setViewportSize(size);
    const art = page.locator(".home-backdrop");
    await expect
      .poll(() => art.evaluate((img: HTMLImageElement) => img.currentSrc))
      .toContain(
        size.width <= size.height
          ? "christmas-search-portrait.png"
          : "christmas-search.png",
      );
    await art.evaluate((img: HTMLImageElement) => img.decode());
    const details = await art.evaluate((img: HTMLImageElement) => ({
      src: img.currentSrc,
      fit: getComputedStyle(img).objectFit,
      width: img.naturalWidth,
      height: img.naturalHeight,
    }));
    expect(details.fit).toBe("contain");
    expect(
      details.src.endsWith(
        size.width <= size.height
          ? "christmas-search-portrait.png"
          : "christmas-search.png",
      ),
    ).toBe(true);
    expect(
      size.width <= size.height
        ? details.height > details.width
        : details.width > details.height,
    ).toBe(true);
    const button = (await page
      .getByRole("button", { name: "BEGIN THE SEARCH" })
      .boundingBox())!;
    expect(button.y).toBeGreaterThanOrEqual(0);
    expect(button.y + button.height).toBeLessThanOrEqual(size.height);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(size.width);
    await page.screenshot({
      path: `test-results/home-responsive-${size.width}.png`,
    });
  }
});
const scenes = JSON.parse(fs.readFileSync("src/scenes.json", "utf8"));
const ids = ["santa", "reindeer", "tag", "dkv"];
async function begin(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "BEGIN THE SEARCH" }).click();
  await page.getByRole("button", { name: "Start mission" }).click();
}
async function explore(page: Page) {
  await page.getByRole("button", { name: "Explore location" }).click();
  await expect(page.locator(".loading")).toHaveCount(0);
}
// Use real pointer dragging and wheel zoom to bring a native artwork point into view.
async function reveal(
  page: Page,
  b: { x: number; y: number; w: number; h: number },
  u = 0.5,
  v = 0.5,
) {
  await page.getByRole("button", { name: "Fit scene to screen" }).click();
  for (let attempt = 0; attempt < 8; attempt++) {
    const r = (await page.locator(".scene").boundingBox())!,
      view = (await page.locator(".viewport").boundingBox())!;
    const x = r.x + (b.x + b.w * u) * r.width,
      y = r.y + (b.y + b.h * v) * r.height;
    if (
      x > view.x + 35 &&
      x < view.x + view.width - 35 &&
      y > view.y + 105 &&
      y < view.y + view.height - 30
    ) {
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, -500);
      await page.waitForTimeout(40);
      const im = (await page.locator(".scene").boundingBox())!;
      return {
        x: im.x + (b.x + b.w * u) * im.width,
        y: im.y + (b.y + b.h * v) * im.height,
      };
    }
    const cx = view.x + view.width / 2,
      cy = view.y + view.height / 2;
    const dx = Math.max(-view.width * 0.4, Math.min(view.width * 0.4, cx - x)),
      dy = Math.max(-view.height * 0.35, Math.min(view.height * 0.35, cy - y));
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + dx, cy + dy, { steps: 5 });
    await page.mouse.up();
  }
  throw Error("Could not bring target into view");
}
for (const size of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
])
  test(`all 16 alpha-accurate finds, transitions and saved code at ${size.width}`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize(size);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await begin(page);
    for (let i = 0; i < 4; i++) {
      await explore(page);
      await expect(page.locator(".world-sprite")).toHaveCount(4);
      const sources = await page
        .locator(".world-sprite")
        .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
      expect(sources).toEqual([
        "/objects/santa-master.png",
        "/objects/reindeer-master.png",
        "/objects/easytrip-tag-master.png",
        "/objects/dkv-card-master.png",
      ]);
      for (const id of ids) {
        const pos = await reveal(page, scenes[i].boxes[id]);
        await page.mouse.click(pos.x, pos.y);
        await expect(page.locator(".is-found")).toHaveCount(
          ids.indexOf(id) + 1,
        );
        await page.mouse.click(pos.x, pos.y);
        await expect(page.locator(".is-found")).toHaveCount(
          ids.indexOf(id) + 1,
        );
      }
      await expect(page.locator(".level-done")).toContainText(
        "LOCATION COMPLETE",
      );
      await page
        .getByRole("button", {
          name: i === 3 ? "Complete mission" : "Next location",
        })
        .click();
      if (i === 1) {
        await page.reload();
        await page.getByRole("button", { name: "Resume mission" }).click();
      }
    }
    await expect(page.locator(".code-card strong")).toHaveText("SANTA2026");
    await expect(page.locator(".completed-locations>div")).toHaveCount(4);
    await expect(
      page.getByRole("link", { name: "Open Microsoft Forms" }),
    ).toHaveCount(0);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: "COPY CODE" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "SANTA2026",
    );
    await expect(
      page.getByRole("button", { name: "Code copied" }),
    ).toBeVisible();
    await page.screenshot({ path: `test-results/finale-${size.width}.png` });
    await page.reload();
    await page.getByRole("button", { name: "BEGIN THE SEARCH" }).click();
    await expect(page.locator(".code-card strong")).toHaveText("SANTA2026");
    expect(errors).toEqual([]);
  });
test("transparent and occluded parts never award; outside target never awards", async ({
  page,
}) => {
  await begin(page);
  await explore(page);
  const santa = scenes[0].boxes.santa;
  const transparent = await reveal(page, santa, 0.01, 0.01);
  await page.mouse.click(transparent.x, transparent.y);
  await expect(page.locator(".is-found")).toHaveCount(0);
  const covered = await reveal(page, santa, 0.5, 0.96);
  await page.mouse.click(covered.x, covered.y);
  await expect(page.locator(".is-found")).toHaveCount(0);
  const tag = scenes[0].boxes.tag,
    nearby = await reveal(page, { ...tag, x: tag.x - tag.w * 1.3 });
  await page.mouse.click(nearby.x, nearby.y);
  await expect(page.locator(".is-found")).toHaveCount(0);
});
test("hint delay, pause, general-area hint, removed controls and resize", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await begin(page);
  await explore(page);
  await expect(
    page.getByRole("button", { name: "Hint in 30s" }),
  ).toBeDisabled();
  await page.clock.runFor(10000);
  await page.getByRole("button", { name: "Pause mission" }).click();
  await page.clock.runFor(40000);
  await expect(
    page.getByRole("button", { name: "Hint in 20s" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Resume search" }).click();
  await page.clock.runFor(20000);
  await page.getByRole("button", { name: "A little helping hand" }).click();
  await expect(page.locator(".hint-ring")).toBeVisible();
  await page.clock.runFor(2100);
  await expect(page.locator(".hint-ring")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: /keyboard discovery|sound on|sound off|mute sound|enable sound/i,
    }),
  ).toHaveCount(0);
  await expect(page.locator(".game-logo")).not.toContainText(/easytrip/i);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".zoom-controls>span")).toHaveText("100%");
});
test("touch pinch and drag do not award; touch tap discovers", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await begin(page);
  await explore(page);
  const cdp = await context.newCDPSession(page),
    r = (await page.locator(".viewport").boundingBox())!,
    x = r.x + r.width / 2,
    y = r.y + r.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: x - 25, y },
      { id: 2, x: x + 25, y },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { id: 1, x: x - 65, y },
      { id: 2, x: x + 65, y },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator(".zoom-controls>span")).not.toHaveText("100%");
  await expect(page.locator(".is-found")).toHaveCount(0);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 1, x, y }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ id: 1, x: x + 45, y: y + 20 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator(".is-found")).toHaveCount(0);
  const pos = await reveal(page, scenes[0].boxes.santa);
  await page.touchscreen.tap(pos.x, pos.y);
  await expect(page.locator(".is-found")).toHaveCount(1);
  await context.close();
});
test("fullscreen layout, no scroll, and camera covers viewport at desktop/tablet/mobile", async ({
  page,
}) => {
  await begin(page);
  await explore(page);
  for (const size of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(60);
    const scroll = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
    }));
    expect(scroll.w).toBeLessThanOrEqual(size.width);
    expect(scroll.h).toBeLessThanOrEqual(size.height);
    const view = (await page.locator(".viewport").boundingBox())!,
      im = (await page.locator(".scene").boundingBox())!;
    expect(view.height / size.height).toBeGreaterThan(0.65);
    expect(im.width + 0.5).toBeGreaterThanOrEqual(view.width);
    expect(im.height + 0.5).toBeGreaterThanOrEqual(view.height);
    await page.screenshot({
      path: `test-results/layout-${size.width}x${size.height}.png`,
    });
  }
});
test("missing artwork is explicit", async ({ page }) => {
  await page.route("**/scenes/market.png", (r) => r.abort());
  await begin(page);
  await exploreMissing();
  async function exploreMissing() {
    await page.getByRole("button", { name: "Explore location" }).click();
    await expect(page.locator(".error")).toContainText(
      "Scene artwork is missing: /scenes/market.png",
    );
  }
});
