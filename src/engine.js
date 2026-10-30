import { Big, B } from "./number.js";
import {
  generators,
  materials,
  upgrades,
  enchants,
  artifacts,
  challenges,
  events,
  achievementDefs,
} from "./content.js";
export const VERSION = 1;
const upgradeById = new Map(upgrades.map((u) => [u.id, u]));
export function fresh(now = Date.now()) {
  return {
    version: VERSION,
    metal: B(0),
    total: B(0),
    run: B(0),
    clicks: 0,
    criticals: 0,
    perfects: 0,
    combo: 0,
    lastClick: 0,
    generators: generators.map(() => 0),
    upgrades: [],
    sword: 0,
    refinement: 0,
    enchants: enchants.map(() => 0),
    artifacts: [],
    equipped: [],
    achievements: [],
    souls: 0,
    earnedSouls: 0,
    prestiges: 0,
    layers: [0, 0, 0],
    skills: Array(18).fill(0),
    permanent: [0, 0, 0, 0],
    events: 0,
    secret: 0,
    challenge: null,
    completed: [],
    buffs: [],
    abilityUntil: 0,
    abilityReady: 0,
    event: null,
    nextEvent: now + 75000,
    last: now,
    started: now,
    playtime: 0,
    settings: {
      sound: false,
      reduced: false,
      scientific: false,
      offline: true,
    },
    log: [],
  };
}
export class Game {
  constructor(state = fresh(), random = Math.random) {
    this.s = state;
    this.random = random;
    this.notices = [];
    this.offline = null;
  }
  note(msg) {
    this.notices.push(msg);
    this.s.log.unshift(msg);
    this.s.log = this.s.log.slice(0, 30);
  }
  upgradeStats() {
    // Upgrade lists are append-only during a run. Reset/import replaces the list.
    // The final ID also invalidates temporary candidates used by the simulator.
    const ids = this.s.upgrades;
    const key = `${ids.length}:${ids.at(-1) || ""}`;
    if (this.upgradeCache?.ids === ids && this.upgradeCache.key === key)
      return this.upgradeCache;
    const counts = {},
      individual = Array(generators.length).fill(0);
    for (const id of ids) {
      const u = upgradeById.get(id);
      if (!u) continue;
      counts[u.effect] = (counts[u.effect] || 0) + 1;
      if (u.generator !== undefined) individual[u.generator]++;
    }
    this.upgradeCache = { ids, key, counts, individual };
    return this.upgradeCache;
  }
  count(effect) {
    return this.upgradeStats().counts[effect] || 0;
  }
  skill(path) {
    return this.s.skills
      .slice(path * 3, path * 3 + 3)
      .reduce((a, b) => a + b, 0);
  }
  artifact(effect) {
    return this.s.equipped.reduce(
      (n, i) => n + (artifacts[i].effect === effect ? artifacts[i].value : 0),
      0,
    );
  }
  mult(now = Date.now()) {
    const s = this.s;
    return B(materials[s.sword].bonus)
      .mul(1 + s.refinement * 0.15)
      .mul(1 + this.count("material") * 0.08)
      .mul(1 + s.earnedSouls * 0.05)
      .mul(1 + s.achievements.length * 0.01)
      .mul(1 + s.permanent[0] * 0.25)
      .mul(1 + s.layers[0] * 0.5)
      .mul(1 + s.layers[1])
      .mul(1 + s.layers[2] * 2)
      .mul(1 + s.skills[13] * s.generators.filter(Boolean).length * 0.02)
      .mul(s.completed.includes(3) ? 1.2 : 1)
      .mul(s.challenge?.id === 3 ? 0.25 : 1);
  }
  buff(type, now) {
    return this.s.buffs
      .filter((b) => b.until > now && b.type === type)
      .reduce((m, b) => m * b.mult, 1);
  }
  rateFor(i, now = Date.now()) {
    const s = this.s;
    let n = s.generators[i];
    if (!n || s.challenge?.id === 1 || (s.challenge?.id === 2 && i > 0))
      return B(0);
    let own = this.upgradeStats().individual[i];
    let milestone = [10, 25, 50, 100, 200, 400].filter((v) => n >= v).length;
    let synergy =
      1 +
      (s.generators[i + 1] || 0) *
        0.01 *
        this.count("synergy") *
        (1 + s.skills[12] * 0.2);
    return generators[i].rate
      .mul(n)
      .mul(2 ** own * (2 + s.skills[14] * 0.08) ** milestone)
      .mul(synergy)
      .mul(1 + (s.generators[i + 1] || 0) * s.skills[5] * 0.02)
      .mul(i === 0 && s.completed.includes(2) ? 3 : 1)
      .mul(this.mult(now))
      .mul(1 + s.skills[3] * 0.2)
      .mul(1 + this.artifact("production"))
      .mul(1 + s.permanent[1] * 0.2)
      .mul(
        1 +
          s.enchants[1] *
            0.2 *
            (1 + this.count("enchant") * 0.1 + s.skills[6] * 0.1),
      )
      .mul(1 + s.enchants[3] * s.generators.filter(Boolean).length * 0.08)
      .mul(s.completed.includes(0) ? 1.15 : 1)
      .mul(this.buff("production", now));
  }
  rate(now = Date.now()) {
    return this.s.generators.reduce(
      (n, _, i) => n.add(this.rateFor(i, now)),
      B(0),
    );
  }
  clickPower(now = Date.now()) {
    let s = this.s;
    return B(1)
      .mul(2.2 ** this.count("click"))
      .mul(this.mult(now))
      .add(this.rate(now).mul(0.01 * (1 + s.skills[2])))
      .mul(1 + s.skills[0] * 0.3)
      .mul(1 + this.artifact("click"))
      .mul(
        1 +
          s.enchants[0] *
            0.25 *
            (1 + this.count("enchant") * 0.1 + s.skills[6] * 0.1),
      )
      .mul(s.completed.includes(1) ? 1.3 : 1)
      .mul(this.buff("click", now))
      .mul(s.abilityUntil > now ? 4 : 1);
  }
  critChance() {
    return Math.min(
      0.75,
      0.04 +
        this.count("crit") * 0.005 +
        this.s.enchants[2] * 0.01 +
        this.artifact("crit") +
        this.s.skills[9] * 0.02,
    );
  }
  earn(value) {
    this.s.metal = this.s.metal.add(value);
    this.s.total = this.s.total.add(value);
    this.s.run = this.s.run.add(value);
    if (this.s.challenge)
      this.s.challenge.progress = this.s.challenge.progress.add(value);
  }
  click(now = Date.now()) {
    let s = this.s;
    if (s.challenge?.id === 0) return null;
    let delta = now - s.lastClick;
    if (delta < 45) return null;
    s.combo = delta < 1000 ? Math.min(100, s.combo + 1) : 1;
    const perfect = delta >= 450 && delta <= 650,
      crit =
        this.random() < this.critChance() ||
        this.buff("crit", now) > 1 ||
        s.buffs.some((b) => b.type === "crit" && b.until > now);
    let gain = this.clickPower(now)
      .mul(1 + s.combo * 0.01 * (1 + s.skills[1] * 0.15))
      .mul(crit ? 3 + this.count("crit") * 0.15 + s.skills[10] * 0.3 : 1)
      .mul(
        perfect ? 1.5 + this.count("material") * 0.05 + s.skills[11] * 0.2 : 1,
      );
    s.clicks++;
    s.criticals += +crit;
    s.perfects += +perfect;
    s.lastClick = now;
    this.earn(gain);
    this.check();
    return { gain, crit, perfect };
  }
  price(i, n = 1) {
    const q = this.s.generators[i];
    return generators[i].cost
      .mul(1 - this.s.skills[4] * 0.02)
      .mul(B(1.15).pow(q))
      .mul(B(1.15).pow(n).sub(1).div(0.15));
  }
  afford(cost) {
    return (
      this.s.metal.cmp(cost) >= 0 ||
      (this.s.metal.m > 0 &&
        cost.m > 0 &&
        this.s.metal.div(cost).number() >= 1 - 1e-12)
    );
  }
  buyGenerator(i, quantity = 1) {
    if (!generators[i] || (this.s.challenge?.id === 2 && i > 0)) return 0;
    let n =
      quantity === "max"
        ? Math.min(10000, 100000 - this.s.generators[i])
        : quantity;
    if (![1, 10, 100].includes(n) && quantity !== "max") return 0;
    if (quantity === "max") {
      let lo = 0,
        hi = n;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (this.afford(this.price(i, mid))) lo = mid;
        else hi = mid - 1;
      }
      n = lo;
    }
    if (!n || this.s.generators[i] + n > 100000) return 0;
    const cost = this.price(i, n);
    if (!this.afford(cost)) return 0;
    this.s.metal = this.s.metal.sub(cost);
    this.s.generators[i] += n;
    this.check();
    return n;
  }

  available(u) {
    return (
      !this.s.upgrades.includes(u.id) &&
      (u.generator !== undefined
        ? this.s.generators[u.generator] >= u.required
        : this.s.total.cmp(u.required) >= 0)
    );
  }
  buyUpgrade(id) {
    const u = upgrades.find((u) => u.id === id);
    if (!u || !this.available(u) || this.s.metal.cmp(u.cost) < 0) return false;
    this.s.metal = this.s.metal.sub(u.cost);
    this.s.upgrades.push(id);
    return true;
  }
  evolve() {
    const next = materials[this.s.sword + 1];
    if (!next || this.s.metal.cmp(next.cost) < 0) return false;
    this.s.metal = this.s.metal.sub(next.cost);
    this.s.sword++;
    this.note(`Lâmina evoluída: ${next.name}`);
    this.check();
    return true;
  }
  refineCost() {
    return materials[this.s.sword].cost.mul(5).mul(B(4).pow(this.s.refinement));
  }
  refine() {
    let c = this.refineCost();
    if (this.s.refinement >= 100 || this.s.metal.cmp(c) < 0) return false;
    this.s.metal = this.s.metal.sub(c);
    this.s.refinement++;
    return true;
  }
  enchantCost(i) {
    return B(5000)
      .mul(B(5).pow(this.s.enchants[i]))
      .mul(i + 1);
  }
  enchant(i) {
    if (!enchants[i] || this.s.sword < 2 || this.s.enchants[i] >= 100)
      return false;
    let c = this.enchantCost(i);
    if (this.s.metal.cmp(c) < 0) return false;
    this.s.metal = this.s.metal.sub(c);
    this.s.enchants[i]++;
    return true;
  }
  prestigeReward() {
    return Math.max(
      0,
      Math.floor(Math.sqrt(Math.max(0, this.s.run.log() - 5))) +
        (this.s.run.cmp(1e6) >= 0 ? Math.floor(this.s.skills[17] / 3) : 0),
    );
  }
  prestige() {
    let reward = this.prestigeReward();
    if (!reward || this.s.challenge) return false;
    const old = this.s,
      n = fresh(old.last);
    for (const k of [
      "total",
      "clicks",
      "criticals",
      "perfects",
      "achievements",
      "artifacts",
      "equipped",
      "souls",
      "earnedSouls",
      "prestiges",
      "layers",
      "skills",
      "permanent",
      "events",
      "secret",
      "completed",
      "settings",
      "started",
      "playtime",
      "log",
    ])
      n[k] = structuredClone(old[k]);
    n.total = B(n.total);
    n.souls += reward;
    n.earnedSouls += reward;
    n.prestiges++;
    n.metal = B(15 + old.permanent[2] * 100);
    this.s = n;
    this.note(`Renascimento: +${reward} almas de brasa`);
    this.check();
    return true;
  }
  permanentCost(i) {
    return Math.ceil(2 * 2 ** this.s.permanent[i]);
  }
  buyPermanent(i) {
    if (i < 0 || i > 3) return false;
    let c = this.permanentCost(i);
    if (this.s.souls < c || this.s.permanent[i] >= 30) return false;
    this.s.souls -= c;
    this.s.permanent[i]++;
    return true;
  }
  skillPoints() {
    return (
      this.s.earnedSouls +
      this.s.layers[0] * 5 -
      this.s.skills.reduce((a, b) => a + b, 0)
    );
  }
  buySkill(i) {
    if (
      i < 0 ||
      i >= 18 ||
      this.s.skills[i] >= 5 ||
      this.skillPoints() < 1 ||
      (i % 3 && this.s.skills[i - 1] < 3)
    )
      return false;
    this.s.skills[i]++;
    return true;
  }
  respec() {
    this.s.skills.fill(0);
    return true;
  }
  ascend(i) {
    let req = [5, 3, 2][i];
    let available =
      i === 0
        ? this.s.prestiges
        : i === 1
          ? this.s.layers[0]
          : this.s.layers[1];
    if (available < (this.s.layers[i] + 1) * req) return false;
    this.s.layers[i]++;
    this.note(
      [
        "Ascensão ancestral: espaço para artefatos +1",
        "Transcendência divina : eventos mais frequentes",
        "Ruptura dimensional : habilidades aceleradas",
      ][i],
    );
    return true;
  }
  equip(i) {
    if (!this.s.artifacts.includes(i)) return;
    let p = this.s.equipped.indexOf(i);
    if (p >= 0) this.s.equipped.splice(p, 1);
    else if (this.s.equipped.length < Math.min(4, 2 + this.s.layers[0]))
      this.s.equipped.push(i);
  }
  activate(now = Date.now()) {
    if (now < this.s.abilityReady) return false;
    this.s.abilityUntil = now + 15000 + this.s.skills[7] * 1000;
    this.s.abilityReady =
      now +
      Math.max(
        45000,
        120000 - this.s.skills[15] * 5000 - this.s.layers[2] * 5000,
      );
    return true;
  }
  claimEvent(now = Date.now()) {
    let e = this.s.event;
    if (!e || e.expires < now) return false;
    let def = events[e.index];
    this.s.buffs.push({
      type: def.type,
      mult: def.type === "crit" ? 2 : def.mult * (1 + (e.rarity || 0) * 0.15),
      until:
        now + 30000 + this.count("special") * 2000 + this.s.skills[8] * 2000,
    });
    this.s.events++;
    if (this.s.events % 3 === 0) {
      let i = Math.min(artifacts.length - 1, Math.floor(this.s.events / 3) - 1);
      if (!this.s.artifacts.includes(i)) {
        this.s.artifacts.push(i);
        this.note(`Artefato descoberto: ${artifacts[i].name}`);
      }
    }
    this.s.event = null;
    this.note(def.name);
    this.check();
    return true;
  }
  startChallenge(i) {
    if (
      this.s.challenge ||
      this.s.prestiges < 1 ||
      !challenges[i] ||
      this.s.completed.includes(i)
    )
      return false;
    this.s.challenge = { id: i, progress: B(0) };
    return true;
  }
  cancelChallenge() {
    this.s.challenge = null;
  }
  check() {
    const s = this.s;
    for (const a of achievementDefs) {
      let v =
        a.key === "total"
          ? s.total.log()
          : a.key === "units"
            ? s.generators.reduce((a, b) => a + b, 0)
            : a.key === "generator"
              ? s.generators[a.index]
              : s[a.key];
      if (v >= a.value && !s.achievements.includes(a.id)) {
        s.achievements.push(a.id);
        this.note(`Conquista: ${a.name}`);
      }
    }
    if (
      s.challenge &&
      s.challenge.progress.cmp(challenges[s.challenge.id].goal) >= 0
    ) {
      const i = s.challenge.id;
      s.completed.push(i);
      s.challenge = null;
      this.note(`Desafio concluído: ${challenges[i].name}`);
    }
  }
  tick(now = Date.now(), offline = false) {
    const s = this.s;
    let elapsed = Math.max(0, (now - s.last) / 1000);
    if (!elapsed) return B(0);
    if (offline) {
      elapsed = Math.min(elapsed, 8 * 3600 + s.permanent[3] * 3600);
      const efficiency = Math.min(
        1,
        0.5 +
          this.count("special") * 0.01 +
          this.artifact("offline") +
          s.skills[16] * 0.02,
      );
      const gain = this.rate(s.last + 3600000).mul(elapsed * efficiency);
      if (s.settings.offline) this.earn(gain);
      s.last = Math.max(s.last, now);
      s.buffs = [];
      s.event = null;
      this.offline = {
        seconds: elapsed,
        gain: s.settings.offline ? gain : B(0),
      };
      this.check();
      return gain;
    }
    // Integrate at buff boundaries rather than extending expired buffs across a long frame.
    const boundaries = [
      s.last,
      ...s.buffs.map((b) => b.until).filter((t) => t > s.last && t < now),
      now,
    ].sort((a, b) => a - b);
    let gain = B(0);
    for (let i = 1; i < boundaries.length; i++)
      gain = gain.add(
        this.rate(boundaries[i - 1] + 1).mul(
          (boundaries[i] - boundaries[i - 1]) / 1000,
        ),
      );
    this.earn(gain);
    s.playtime += elapsed;
    s.last = now;
    s.buffs = s.buffs.filter((b) => b.until > now);
    if (now - s.lastClick > 1000) s.combo = 0;
    if (s.event && s.event.expires < now) s.event = null;
    if (now >= s.nextEvent) {
      s.event = {
        index: Math.floor(this.random() * events.length),
        rarity: this.random() < 0.05 ? 2 : this.random() < 0.2 ? 1 : 0,
        expires: now + 25000,
      };
      s.nextEvent =
        now +
        Math.max(45000, 100000 - s.layers[1] * 10000) +
        this.random() * 50000;
    }
    this.check();
    return gain;
  }
}
function int(v, max = 1e12) {
  if (!Number.isSafeInteger(v) || v < 0 || v > max)
    throw Error("Contador inválido");
  return v;
}
function big(v) {
  if (
    !v ||
    typeof v.m !== "number" ||
    typeof v.e !== "number" ||
    v.m < 0 ||
    v.m >= 10 ||
    !Number.isFinite(v.m) ||
    !Number.isFinite(v.e) ||
    Math.abs(v.e) > 1e9
  )
    throw Error("Recurso inválido");
  return B(v);
}
export function encode(s) {
  return JSON.stringify({
    format: "infinite-forge",
    version: VERSION,
    state: s,
  });
}
export function decode(raw) {
  if (typeof raw !== "string" || raw.length > 1000000)
    throw Error("Arquivo inválido");
  const data = JSON.parse(raw);
  if (data.format !== "infinite-forge" || data.version !== VERSION)
    throw Error("Versão de save incompatível");
  const v = data.state;
  if (!v || typeof v !== "object") throw Error("Save inválido");
  let s = fresh();
  for (const k of ["metal", "total", "run"]) s[k] = big(v[k]);
  for (const k of [
    "clicks",
    "criticals",
    "perfects",
    "souls",
    "earnedSouls",
    "prestiges",
    "events",
    "secret",
    "refinement",
  ])
    s[k] = int(v[k]);
  s.sword = int(v.sword, materials.length - 1);
  for (const [key, len, max] of [
    ["generators", generators.length, 100000],
    ["enchants", 4, 100],
    ["skills", 18, 5],
    ["layers", 3, 1e6],
    ["permanent", 4, 30],
  ]) {
    if (!Array.isArray(v[key]) || v[key].length !== len)
      throw Error("Lista inválida");
    s[key] = v[key].map((x) => int(x, max));
  }
  for (const [key, allowed] of [
    ["upgrades", upgrades.map((x) => x.id)],
    ["achievements", achievementDefs.map((x) => x.id)],
    ["artifacts", artifacts.map((_, i) => i)],
    ["equipped", artifacts.map((_, i) => i)],
    ["completed", challenges.map((_, i) => i)],
  ]) {
    if (
      !Array.isArray(v[key]) ||
      v[key].some((x) => !allowed.includes(x)) ||
      new Set(v[key]).size !== v[key].length
    )
      throw Error("Conteúdo inválido");
    s[key] = v[key];
  }
  if (
    s.equipped.some((i) => !s.artifacts.includes(i)) ||
    s.equipped.length > Math.min(4, 2 + s.layers[0]) ||
    s.skills.reduce((a, b) => a + b, 0) > s.earnedSouls + s.layers[0] * 5 ||
    s.souls > s.earnedSouls
  )
    throw Error("Progressão inválida");
  for (const k of [
    "last",
    "started",
    "playtime",
    "abilityReady",
    "abilityUntil",
    "nextEvent",
  ]) {
    if (!Number.isFinite(v[k]) || v[k] < 0 || v[k] > 1e15)
      throw Error("Tempo inválido");
    s[k] = v[k];
  }
  if (v.challenge)
    s.challenge = {
      id: int(v.challenge.id, 3),
      progress: big(v.challenge.progress),
    };
  if (v.settings)
    for (const k of Object.keys(s.settings))
      if (typeof v.settings[k] === "boolean") s.settings[k] = v.settings[k];
  s.buffs = [];
  if (Array.isArray(v.buffs))
    s.buffs = v.buffs
      .filter(
        (b) =>
          ["production", "click", "crit"].includes(b.type) &&
          Number.isFinite(b.mult) &&
          b.mult >= 1 &&
          b.mult <= 10 &&
          Number.isFinite(b.until) &&
          b.until <= s.last + 120000,
      )
      .map((b) => ({ ...b }));
  return s;
}
export function load(storage) {
  let error = false;
  for (const key of ["infinite-forge", "infinite-forge-backup"]) {
    try {
      const raw = storage.getItem(key);
      if (raw) return { state: decode(raw), recovered: error };
    } catch {
      error = true;
    }
  }
  return { state: fresh(), recovered: error };
}
export function save(storage, s) {
  const raw = encode(s);
  const old = storage.getItem("infinite-forge");
  if (old) {
    try {
      decode(old);
      storage.setItem("infinite-forge-backup", old);
    } catch {}
  }
  storage.setItem("infinite-forge", raw);
}
