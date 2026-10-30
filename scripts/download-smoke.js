import { chromium } from "playwright";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { mkdtemp, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const folder = await mkdtemp(path.join(tmpdir(), "forge-download-"));
let browser, server;
try {
  // Deliberately copy ONLY index.html, as Windows does when opening it from ZIP.
  await copyFile(
    new URL("../index.html", import.meta.url),
    path.join(folder, "index.html"),
  );
  browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const errors = [],
    externalRequests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && !request.url().includes("127.0.0.1:"))
      externalRequests.push(request.url());
  });
  const html = await readFile(path.join(folder, "index.html"), "utf8");
  assert.ok(!/<script[^>]+(?:src=|type=["']module)/i.test(html));
  assert.ok(!/<link[^>]+rel=["']stylesheet/i.test(html));
  assert.ok(!/url\(["']?\.\//i.test(html));
  let location = pathToFileURL(path.join(folder, "index.html")).href;
  if (process.env.DOWNLOAD_TEST_HTTP === "1") {
    server = http.createServer((req, res) => {
      if (req.url !== "/index.html") {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    location = `http://127.0.0.1:${server.address().port}/index.html`;
  }
  await page.goto(location);
  await page.waitForSelector(".sword-button");
  await page.evaluate(() => document.fonts.ready);
  assert.ok(
    await page.evaluate(() =>
      [...document.fonts].every((font) => font.status === "loaded"),
    ),
  );
  assert.notEqual(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
    "rgba(0, 0, 0, 0)",
  );
  for (let i = 0; i < 20; i++) {
    await page.locator(".sword-button").click({ force: true });
    await page.waitForTimeout(70);
  }
  await page.locator('[data-action="buy-0"]').click();
  assert.equal(
    await page
      .locator('[data-action="buy-0"] .gen-quantity strong')
      .textContent(),
    "1",
  );
  await page.locator('[data-view="settings"]').first().click();
  await page.locator('[data-action="save"]').click();
  await page.reload();
  assert.equal(
    await page
      .locator('[data-action="buy-0"] .gen-quantity strong')
      .textContent(),
    "1",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(externalRequests, []);
  console.log(
    `Download check passed (${process.env.DOWNLOAD_TEST_HTTP === "1" ? "isolated HTTP; file:// not verified" : "file://"}): embedded fonts/styles, clicks, purchase, save/reload and mobile layout; zero external requests.`,
  );
} finally {
  await browser?.close();
  server?.close();
  await rm(folder, { recursive: true, force: true });
}
