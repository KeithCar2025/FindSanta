import { chromium } from "@playwright/test";
import fs from "node:fs";
const levels = JSON.parse(fs.readFileSync("src/scenes.json", "utf8"));
const browser = await chromium.launch();
fs.mkdirSync("docs/qa", { recursive: true });
for (let i = 0; i < 4; i++) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await page.goto("http://localhost:5173");
  if (i) {
    await page.evaluate(
      (i) =>
        localStorage.setItem(
          "find-santa-v1",
          JSON.stringify({
            level: i,
            found: Array.from({ length: 4 }, (_, n) =>
              n < i ? ["santa", "reindeer", "tag", "dkv"] : [],
            ),
            complete: false,
          }),
        ),
      i,
    );
    await page.reload();
  }
  if (i === 0) {
    await page.screenshot({ path: "docs/qa/redesign-intro.png" });
    await page.getByRole("button", { name: "BEGIN THE SEARCH" }).click();
    await page.getByRole("button", { name: "Start mission" }).click();
  } else await page.getByRole("button", { name: "Resume mission" }).click();
  await page.getByRole("button", { name: "Explore location" }).click();
  await page.locator(".loading").waitFor({ state: "hidden" });
  await page.screenshot({
    path: `docs/qa/redesign-${levels[i].id}-desktop.png`,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  await page.screenshot({
    path: `docs/qa/redesign-${levels[i].id}-mobile.png`,
  });
  const html = await page
    .locator(".image-space")
    .evaluate((el) => el.outerHTML);
  // Record the actual high-resolution layered objects at maximum gameplay zoom.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(80);
  for (const [id, b] of Object.entries(levels[i].boxes)) {
    await page.evaluate((b) => {
      const image = document.querySelector(".scene"),
        stage = document.querySelector(".scene-transform");
      stage.style.transform = `translate(${(0.5 - b.x - b.w / 2) * image.offsetWidth * 8}px,${(0.5 - b.y - b.h / 2) * image.offsetHeight * 8}px) scale(8)`;
    }, b);
    const view = await page.locator(".viewport").boundingBox();
    await page.screenshot({
      path: `docs/qa/${levels[i].id}-${id}-zoom.png`,
      clip: {
        x: view.x + view.width / 2 - 140,
        y: view.y + view.height / 2 - 130,
        width: 280,
        height: 260,
      },
    });
  }
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.evaluate((html) => {
    document.body.innerHTML = html;
    document.body.style.cssText = "margin:0;width:1536px;height:1024px";
    const el = document.querySelector(".image-space");
    el.style.cssText = "width:1536px;height:1024px;--scene-zoom:1";
  }, html);
  await page.waitForTimeout(100);
  await page.screenshot({ path: `docs/qa/${levels[i].id}-composite.png` });
  await page.close();
}
await browser.close();
