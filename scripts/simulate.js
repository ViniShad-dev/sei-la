import { Game, fresh } from "../src/engine.js";
import { B } from "../src/number.js";
import { generators, upgrades, materials } from "../src/content.js";
import { writeFile } from "node:fs/promises";
// Actual engine, one-second steps, no injected resources. The idle strategy uses
// the same 20-click bootstrap as a player, then never clicks again.
const seconds = Number(process.argv[2] || 7200);
const reports = [];
for (const strategy of ["manual", "idle", "hybrid"]) {
  const g = new Game(fresh(1000000), () => 0.5);
  let firstPrestige = null,
    firstAuto = null,
    lastBuy = 0,
    longestGap = 0,
    purchases = 0,
    prestiges = 0;
  const snapshots = [];
  for (let t = 1; t <= seconds; t++) {
    const now = 1000000 + t * 1000;
    g.tick(now);
    if (strategy !== "idle" || t <= 20) g.click(now);
    if (g.s.event) g.claimEvent(now);
    if (strategy !== "idle") g.activate(now);
    if (t % 5 === 0) {
      let candidates = [];
      // A marginal ROI policy evaluates production effects rather than favoring
      // the first generator, which would hide new-tier dead zones.
      const utility = () =>
        g.rate(now).add(strategy === "idle" ? B(0) : g.clickPower(now));
      let base = utility();
      if (strategy !== "manual")
        for (let i = 0; i < generators.length; i++) {
          const cost = g.price(i);
          if (g.s.total.cmp(cost.mul(0.1)) < 0 && i > 2) continue;
          g.s.generators[i]++;
          let delta = utility().sub(base);
          g.s.generators[i]--;
          if (delta.m)
            candidates.push({
              cost,
              score: cost.div(delta).log(),
              buy: () => g.buyGenerator(i),
            });
        }
      for (const u of upgrades) {
        if (!g.available(u)) continue;
        g.s.upgrades.push(u.id);
        let delta = utility().sub(base);
        g.s.upgrades.pop();
        if (delta.m)
          candidates.push({
            cost: u.cost,
            score: u.cost.div(delta).log(),
            buy: () => g.buyUpgrade(u.id),
          });
      }
      const next = materials[g.s.sword + 1];
      if (next) {
        g.s.sword++;
        let delta = utility().sub(base);
        g.s.sword--;
        if (delta.m)
          candidates.push({
            cost: next.cost,
            score: next.cost.div(delta).log(),
            buy: () => g.evolve(),
          });
      }
      if (g.s.sword >= 2)
        for (let i = 0; i < 4; i++) {
          let cost = g.enchantCost(i);
          g.s.enchants[i]++;
          let delta = utility().sub(base);
          g.s.enchants[i]--;
          if (delta.m)
            candidates.push({
              cost,
              score: cost.div(delta).log(),
              buy: () => g.enchant(i),
            });
        }
      candidates.sort((a, b) => a.score - b.score);
      // Save for the best ROI option unless another affordable investment has
      // comparable ROI; this avoids starving expensive new tiers indefinitely.
      const chosen = candidates.find(
        (c) => g.afford(c.cost) && c.score <= candidates[0].score + 1,
      );
      if (chosen && chosen.buy()) {
        longestGap = Math.max(longestGap, t - lastBuy);
        lastBuy = t;
        purchases++;
      }
      if (!firstAuto && g.rate(now).m) firstAuto = t;
      if (!firstPrestige && g.prestigeReward() > 0) firstPrestige = t;
      if (g.prestigeReward() >= 2 && g.s.prestiges < 3) {
        g.prestige();
        prestiges++;
        while (g.skillPoints() > 0 && g.s.skills[3] < 5) g.buySkill(3);
        while (g.s.souls >= g.permanentCost(1)) g.buyPermanent(1);
      }
    }
    if (t % 1800 === 0)
      snapshots.push({
        seconds: t,
        produced: g.s.total.format(true),
        rate: g.rate(now).format(true),
        sword: g.s.sword + 1,
      });
    if (!Number.isFinite(g.s.metal.m) || !Number.isFinite(g.s.metal.e))
      throw Error("Invalid economy");
  }
  reports.push({
    strategy,
    simulatedSeconds: seconds,
    firstAutoSeconds: firstAuto,
    firstPrestigeSeconds: firstPrestige,
    prestiges,
    purchases,
    longestPurchaseGapSeconds: Math.max(longestGap, seconds - lastBuy),
    produced: g.s.total.format(true),
    rate: g.rate(g.s.last).format(true),
    generators: g.s.generators.reduce((a, b) => a + b, 0),
    upgrades: g.s.upgrades.length,
    materials: g.s.sword + 1,
    snapshots,
  });
}
const result = {
  generatedAt: new Date().toISOString(),
  notes:
    "Deterministic 1-click/s, 5-second marginal-ROI purchasing; idle bootstraps with 20 clicks. Not a duration guarantee or exhaustive strategy search.",
  reports,
};
console.log(JSON.stringify(result, null, 2));
if (process.env.SIMULATION_OUTPUT)
  await writeFile(
    process.env.SIMULATION_OUTPUT,
    JSON.stringify(result, null, 2) + "\n",
  );
