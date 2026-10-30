import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const port = 5181,
  url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["scripts/serve.js"], {
  env: { ...process.env, PORT: String(port) },
  stdio: "pipe",
});
let browser;
try {
  await new Promise((resolve, reject) => {
    server.stdout.once("data", resolve);
    server.once("error", reject);
    server.once("exit", (code) => reject(Error(`Server exited ${code}`)));
  });
  browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1050 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await mkdir("test-results", { recursive: true });
  await page.goto(url);
  await page.waitForSelector(".sword-button");
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  for (let i = 0; i < 20; i++) {
    await page.locator(".sword-button").click({ force: true });
    await page.waitForTimeout(60);
  }
  await page.locator('[data-action="buy-0"]').click();
  assert.equal(
    await page
      .locator('[data-action="buy-0"] .gen-quantity strong')
      .textContent(),
    "1",
  );
  await page.locator('[data-view="settings"]').first().click();
  await page.locator('[data-setting="reduced"]').check();
  await page.locator('[data-action="save"]').click();
  await page.reload();
  await page.locator('[data-view="settings"]').first().click();
  assert.ok(await page.locator('[data-setting="reduced"]').isChecked());
  // Real export and file import, with the actual confirmation dialog.
  const downloadPromise = page.waitForEvent("download");
  await page.locator('[data-action="export"]').click();
  const download = await downloadPromise;
  const path = await download.path();
  const exported = JSON.parse(await readFile(path, "utf8"));
  assert.equal(exported.state.generators[0], 1);
  await page.locator("#import-file").setInputFiles(path);
  await page.locator("dialog [data-confirm]").click();
  // Seed an isolated browser test profile through the same validated save format.
  const seed = await page.evaluate(async () => {
    const { fresh, encode } = await import("/src/engine.js");
    const { Big } = await import("/src/number.js");
    const s = fresh();
    s.metal = new Big(1, 100);
    s.total = new Big(1, 100);
    s.run = new Big(1, 30);
    s.sword = 8;
    s.souls = 100;
    s.earnedSouls = 100;
    s.prestiges = 5;
    s.artifacts = [0, 1, 2, 3];
    s.settings.reduced = true;
    return encode(s);
  });
  await page.addInitScript(
    (raw) => localStorage.setItem("infinite-forge", raw),
    seed,
  );
  await page.reload();
  await page.locator('[data-action="qty-10"]').click();
  await page.locator('[data-action="buy-0"]').click();
  assert.equal(
    await page
      .locator('[data-action="buy-0"] .gen-quantity strong')
      .textContent(),
    "10",
  );
  await page.locator('[data-action="qty-100"]').click();
  await page.locator('[data-action="buy-1"]').click();
  assert.equal(
    await page
      .locator('[data-action="buy-1"] .gen-quantity strong')
      .textContent(),
    "100",
  );
  await page.locator('[data-action="qty-max"]').click();
  await page.locator('[data-action="buy-2"]').click();
  assert.ok(
    Number(
      await page
        .locator('[data-action="buy-2"] .gen-quantity strong')
        .textContent(),
    ) > 100,
  );
  await page.locator('[data-action="tab-upgrades"]').click();
  await page.locator('[data-action^="upgrade-"]').first().click();
  await page.locator('[data-view="evolution"]').first().click();
  await page.locator('[data-action="evolve"]').click();
  assert.equal(
    await page.locator("main .card.selected h3").textContent(),
    "Mithril",
  );
  await page.locator('[data-action="refine"]').click();
  await page.locator('[data-view="enchant"]').first().click();
  await page.locator('[data-action="enchant-0"]').click();
  assert.ok((await page.locator("main").innerText()).includes("Nível 1 / 100"));
  await page.locator('[data-view="artifacts"]').first().click();
  await page.locator('[data-action="equip-0"]').click();
  assert.equal(
    await page.locator('[data-action="equip-0"]').textContent(),
    "Remover",
  );
  await page.selectOption("#artifact-filter", "Épico");
  assert.equal(await page.locator("main .card").count(), 1);
  await page.locator('[data-view="skills"]').first().click();
  await page.locator('[data-action="skill-0"]').click();
  assert.ok((await page.locator("main").innerText()).includes("1 / 5"));
  await page.locator('[data-view="challenges"]').first().click();
  await page.locator('[data-action="challenge-0"]').click();
  await page.locator('[data-action="cancel-challenge"]').click();
  await page.locator("dialog [data-confirm]").click();
  await page.locator('[data-view="prestige"]').first().click();
  await page.locator('[data-action="ascend-0"]').click();
  await page.locator('[data-action="permanent-0"]').click();
  await page.locator('[data-action="prestige"]').click();
  await page.locator("dialog [data-confirm]").click();
  await page.locator('[data-view="forge"]').first().click();
  await page.locator('[data-action="tab-generators"]').click();
  assert.equal(
    await page
      .locator('[data-action="buy-0"] .gen-quantity strong')
      .textContent(),
    "0",
  );
  const views = [
    "forge",
    "evolution",
    "enchant",
    "artifacts",
    "skills",
    "prestige",
    "challenges",
    "achievements",
    "stats",
    "settings",
  ];
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of views) {
      const selector =
        width <= 720 && id !== "settings"
          ? `.mobile-nav [data-view="${id}"]`
          : `[data-view="${id}"]`;
      await page.locator(selector).first().click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${width}px overflow in ${id}`,
      );
    }
    if (width === 390) {
      await page.locator('.mobile-nav [data-view="forge"]').click();
      await page.screenshot({
        path: "test-results/mobile.png",
        fullPage: true,
      });
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: clicks, bulk purchases, upgrades, evolution, runes, artifacts, skills, challenges, prestige, save export/import and 50 layout checks.",
  );
} finally {
  await browser?.close();
  server.kill();
}
