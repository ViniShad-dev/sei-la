import { test } from "node:test";
import assert from "node:assert/strict";
import { Big, B } from "../src/number.js";
import { Game, fresh, encode, decode, load, save } from "../src/engine.js";
import {
  generators,
  materials,
  upgrades,
  artifacts,
  challenges,
} from "../src/content.js";
const funded = () => {
  let g = new Game(fresh(1000000), () => 0.99);
  g.s.metal = new Big(1, 500);
  g.s.total = new Big(1, 500);
  return g;
};
const close = (a, b) =>
  assert.ok(
    Math.abs(a.div(b).number() - 1) < 1e-9,
    `${a.format(true)} ≠ ${b.format(true)}`,
  );
test("scientific arithmetic exceeds native floating range and survives JSON", () => {
  const x = new Big(5, 10000);
  assert.equal(x.mul(4).e, 10001);
  close(x.add(x), new Big(1, 10001));
  close(x.sub(x.mul(0.5)), x.mul(0.5));
  assert.equal(x.cmp(new Big(9, 9999)), 1);
  assert.equal(B(0).cmp(x), -1);
  assert.equal(x.format(true), "5.00e10000");
  close(new Big(1, 2.8), B(10).pow(2.8));
  assert.ok(new Big(9, 2).cmp(new Big(1, 2.8)) > 0);
  assert.equal(JSON.parse(JSON.stringify(x)).e, 10000);
  assert.throws(() => B(Infinity));
});
test("clicks: combo, critical, perfect timing, click throttling", () => {
  const g = new Game(fresh(1000), () => 0);
  let a = g.click(2000);
  assert.ok(a.crit);
  assert.equal(g.s.clicks, 1);
  assert.equal(g.click(2010), null);
  let b = g.click(2500);
  assert.ok(b.perfect);
  assert.ok(b.gain.cmp(a.gain) > 0);
  assert.equal(g.s.combo, 2);
  g.click(5000);
  assert.equal(g.s.combo, 1);
});
test("all 28 generators: individual, bulk and max purchases; production and milestones", () => {
  for (let i = 0; i < generators.length; i++) {
    const g = funded();
    assert.equal(g.buyGenerator(i), 1);
    assert.equal(g.buyGenerator(i, 10), 10);
    assert.equal(g.buyGenerator(i, 100), 100);
    assert.equal(g.s.generators[i], 111);
    assert.ok(g.rateFor(i).cmp(0) > 0);
    const expected = generators[i].rate.mul(111).mul(16).mul(g.mult());
    close(g.rateFor(i), expected);
    g.s.metal = g.price(i, 3);
    assert.equal(g.buyGenerator(i, "max"), 3);
    assert.equal(g.s.generators[i], 114);
    assert.ok(g.s.metal.cmp(g.price(i)) < 0);
  }
  const g = new Game();
  assert.equal(g.buyGenerator(0), 0);
  assert.equal(g.buyGenerator(0, 2), 0);
});
test("bulk price matches sum and rejected purchase preserves state", () => {
  const g = new Game();
  let sum = B(0);
  for (let q = 0; q < 10; q++)
    sum = sum.add(generators[0].cost.mul(B(1.15).pow(q)));
  close(sum, g.price(0, 10));
  g.s.metal = B(15);
  const before = encode(g.s);
  assert.equal(g.buyGenerator(0, 10), 0);
  assert.equal(before, encode(g.s));
});
test("every upgrade is unlockable, charged once and its category works", () => {
  const g = funded();
  g.s.generators.fill(400);
  assert.equal(upgrades.length, 332);
  for (const u of upgrades) {
    assert.ok(g.available(u), u.id);
    assert.ok(g.buyUpgrade(u.id), u.id);
    assert.equal(g.buyUpgrade(u.id), false);
  }
  assert.equal(g.s.upgrades.length, 332);
  for (const effect of [
    "click",
    "crit",
    "synergy",
    "enchant",
    "material",
    "special",
  ])
    assert.equal(g.count(effect), 18);
  const a = funded();
  a.s.generators[0] = 1;
  let before = a.rate();
  a.buyUpgrade("gen-0-0");
  close(a.rate(), before.mul(2));
  let click = a.clickPower();
  a.buyUpgrade("click-0");
  assert.ok(a.clickPower().cmp(click) > 0);
  before = a.rate();
  a.s.generators[1] = 10;
  a.buyUpgrade("synergy-0");
  assert.ok(a.rateFor(0).cmp(before) > 0);
});
test("24 material evolutions, refinement and all enchantment effects", () => {
  const g = funded();
  for (let i = 1; i < materials.length; i++) {
    assert.ok(g.evolve());
    assert.equal(g.s.sword, i);
  }
  assert.equal(g.evolve(), false);
  let before = g.mult();
  assert.ok(g.refine());
  assert.ok(g.mult().cmp(before) > 0);
  g.s.generators[0] = 1;
  for (let i = 0; i < 4; i++) {
    let cost = g.enchantCost(i);
    assert.ok(g.enchant(i));
    assert.equal(g.s.enchants[i], 1);
    assert.ok(g.enchantCost(i).cmp(cost) > 0);
  }
  assert.ok(g.critChance() > 0.04);
  const h = new Game();
  assert.equal(h.enchant(0), false);
});
test("prestige retains earned rewards and resets run, without duplication", () => {
  let g = funded();
  g.s.run = B(1e6);
  g.s.generators[0] = 10;
  g.s.sword = 2;
  g.s.enchants[0] = 1;
  g.s.artifacts = [0];
  g.s.equipped = [0];
  assert.equal(g.prestigeReward(), 1);
  assert.ok(g.prestige());
  assert.equal(g.s.souls, 1);
  assert.equal(g.s.earnedSouls, 1);
  assert.equal(g.s.generators[0], 0);
  assert.equal(g.s.sword, 0);
  assert.equal(g.s.enchants[0], 0);
  assert.deepEqual(g.s.artifacts, [0]);
  assert.equal(g.prestige(), false);
  assert.equal(g.s.souls, 1);
  assert.equal(g.s.total.e, 500);
  g.s.souls = 10;
  g.s.earnedSouls = 10;
  assert.ok(g.buyPermanent(0));
  assert.equal(g.s.souls, 8);
  assert.equal(g.skillPoints(), 10);
  assert.ok(g.buySkill(0));
  assert.equal(g.buySkill(1), false);
  g.buySkill(0);
  g.buySkill(0);
  assert.ok(g.buySkill(1));
  assert.equal(g.skillPoints(), 6);
  g.respec();
  assert.equal(g.skillPoints(), 10);
});
test("prestige layers unlock mechanics and enforce requirements", () => {
  let g = new Game();
  assert.equal(g.ascend(0), false);
  g.s.prestiges = 5;
  assert.ok(g.ascend(0));
  assert.equal(g.skillPoints(), 5);
  assert.equal(g.ascend(0), false);
  g.s.layers[0] = 3;
  assert.ok(g.ascend(1));
  g.s.layers[1] = 2;
  assert.ok(g.ascend(2));
  assert.ok(g.activate(1000));
  assert.equal(g.activate(1001), false);
});
test("events cannot be claimed twice and artefacts have real equipment effects", () => {
  let g = new Game(fresh(1000), () => 0);
  for (let i = 0; i < 24; i++) {
    g.s.event = { index: i % 5, expires: 100000 };
    assert.ok(g.claimEvent(2000));
    assert.equal(g.claimEvent(2000), false);
  }
  assert.equal(g.s.artifacts.length, artifacts.length);
  let p = g.clickPower(300000);
  g.equip(0);
  assert.ok(g.clickPower(300000).cmp(p) > 0);
  g.equip(1);
  g.equip(2);
  assert.equal(g.s.equipped.length, 2);
  g.equip(0);
  assert.equal(g.s.equipped.length, 1);
  g.s.event = { index: 0, expires: 1000 };
  assert.equal(g.claimEvent(2000), false);
});
test("all challenges enforce restrictions and grant each reward once", () => {
  for (let i = 0; i < challenges.length; i++) {
    let g = funded();
    g.s.prestiges = 1;
    g.s.generators.fill(1);
    assert.ok(g.startChallenge(i));
    assert.equal(g.startChallenge((i + 1) % 4), false);
    if (i === 0) assert.equal(g.click(), null);
    if (i === 1) assert.equal(g.rate().cmp(0), 0);
    if (i === 2) {
      assert.equal(g.rateFor(1).cmp(0), 0);
      assert.equal(g.buyGenerator(1), 0);
    }
    g.earn(challenges[i].goal);
    g.check();
    assert.ok(g.s.completed.includes(i));
    assert.equal(g.s.challenge, null);
    assert.equal(g.startChallenge(i), false);
  }
});
test("frame independent production, including expiration boundaries", () => {
  let a = new Game(fresh(1000)),
    b = new Game(fresh(1000));
  for (const g of [a, b]) {
    g.s.generators[0] = 1;
    g.s.buffs = [{ type: "production", mult: 3, until: 6000 }];
    g.s.achievements = ["units-0"];
  }
  a.tick(11000);
  for (let t = 1100; t <= 11000; t += 100) b.tick(t);
  close(a.s.metal, b.s.metal);
  assert.equal(a.s.buffs.length, 0);
});
test("offline gain is capped, clock rollback does not duplicate, settings respected", () => {
  let g = new Game(fresh(1000));
  g.s.generators[0] = 1;
  const expected = g.rate(3601000).mul(8 * 3600 * 0.5);
  g.tick(1000 + 24 * 3600000, true);
  close(g.offline.gain, expected);
  let before = g.s.metal;
  g.tick(1000, true);
  close(g.s.metal, before);
  g.tick(1000 + 24 * 3600000, true);
  close(g.s.metal, before);
  g.s.settings.offline = false;
  g.tick(g.s.last + 3600000, true);
  close(g.s.metal, before);
});
test("validated save round trip, backup recovery, corrupt imports rejected", () => {
  let g = funded();
  g.s.generators[2] = 4;
  g.s.sword = 7;
  g.s.run = new Big(3, 2000);
  let raw = encode(g.s),
    s = decode(raw);
  assert.equal(s.run.e, 2000);
  assert.equal(s.generators[2], 4);
  assert.ok(s.metal instanceof Big);
  for (const mutate of [
    (x) => (x.state.metal.m = Infinity),
    (x) => (x.state.generators[0] = -1),
    (x) => (x.state.skills[0] = 4),
    (x) => (x.state.equipped = [0]),
    (x) => (x.version = 99),
    (x) => (x.state.upgrades = ["bogus"]),
    (x) => (x.state.metal.e = 1e15),
  ]) {
    let v = JSON.parse(raw);
    mutate(v);
    assert.throws(() => decode(JSON.stringify(v)));
  }
  let data = new Map(),
    store = {
      getItem: (k) => data.get(k) || null,
      setItem: (k, v) => data.set(k, v),
    };
  save(store, g.s);
  g.s.clicks = 10;
  save(store, g.s);
  data.set("infinite-forge", "bad");
  const result = load(store);
  assert.equal(result.recovered, true);
  assert.equal(result.state.clicks, 0);
  assert.throws(() => decode("x"));
});
test("all 18 specialization nodes change their advertised mechanic", () => {
  const a = funded();
  a.s.generators[0] = 25;
  a.s.generators[1] = 10;
  a.s.enchants.fill(1);
  a.s.upgrades = ["synergy-0"];
  a.s.run = B(1e10);
  a.s.earnedSouls = 100;
  a.s.souls = 100;
  const before = [
    a.clickPower(),
    a.rate(),
    a.price(0),
    a.critChance(),
    a.prestigeReward(),
  ];
  for (const i of [0, 2, 3, 5, 6, 12, 13, 14]) {
    const g = new Game(decode(encode(a.s)));
    g.s.skills[i] = 1;
    const actual = [0, 2].includes(i) ? g.clickPower() : g.rate();
    assert.ok(
      actual.cmp([0, 2].includes(i) ? before[0] : before[1]) > 0,
      `skill ${i}`,
    );
  }
  const g = new Game(a.s, () => 0);
  g.s.skills[4] = 1;
  assert.ok(g.price(0).cmp(before[2]) < 0);
  g.s.skills[9] = 1;
  assert.ok(g.critChance() > before[3]);
  g.s.skills[17] = 3;
  assert.equal(g.prestigeReward(), before[4] + 1);
  g.s.skills[7] = 1;
  g.s.skills[15] = 1;
  g.activate(1000);
  assert.equal(g.s.abilityUntil, 17000);
  assert.equal(g.s.abilityReady, 116000);
  g.s.skills[8] = 1;
  g.s.event = { index: 0, expires: 100000 };
  g.claimEvent(2000);
  assert.equal(g.s.buffs.at(-1).until, 34000);
  const base = new Game(decode(encode(a.s)), () => 0),
    improved = new Game(decode(encode(a.s)), () => 0);
  base.s.skills.fill(0);
  improved.s.skills.fill(0);
  improved.s.skills[1] = 1;
  improved.s.skills[10] = 1;
  improved.s.skills[11] = 1;
  assert.ok(improved.click(2000000).gain.cmp(base.click(2000000).gain) > 0);
  assert.ok(improved.click(2000500).gain.cmp(base.click(2000500).gain) > 0);
  const off = new Game(decode(encode(a.s)));
  off.s.skills[16] = 1;
  let expected = off.rate(off.s.last + 3600000).mul(3600 * 0.52);
  off.tick(off.s.last + 3600000, true);
  close(off.offline.gain, expected);
});
test("huge max purchases, late events, and secret are bounded and persistent", () => {
  const g = funded();
  let n = g.buyGenerator(0, "max");
  assert.ok(n > 1000 && n < 10000);
  assert.ok(g.s.metal.cmp(g.price(0)) < 0);
  const h = new Game(fresh(1000), () => 0);
  h.s.secret = 1;
  h.check();
  assert.equal(h.s.achievements.includes("secret"), false);
  h.s.secret = 7;
  h.check();
  assert.ok(h.s.achievements.includes("secret"));
  h.tick(100000);
  assert.equal(h.s.event.rarity, 2);
  h.claimEvent(100000);
  assert.ok(h.s.buffs[0].mult > 3);
  assert.ok(decode(encode(h.s)).buffs.length > 0);
});
test("active powers and click enchantments remain relevant with enormous automatic production", () => {
  const g = funded();
  g.s.generators[27] = 100;
  const now = 1000000,
    base = g.clickPower(now);
  g.activate(now);
  close(g.clickPower(now), base.mul(4));
  g.s.abilityUntil = 0;
  g.s.enchants[0] = 1;
  close(g.clickPower(now), base.mul(1.25));
  g.s.buffs = [{ type: "click", mult: 5, until: now + 30000 }];
  close(g.clickPower(now), base.mul(1.25 * 5));
});
