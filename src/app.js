import { Big, B } from "./number.js";
import { Game, fresh, encode, decode, load, save } from "./engine.js";
import {
  generators,
  materials,
  upgrades,
  enchants,
  artifacts,
  paths,
  challenges,
  events,
  achievementDefs,
  skillDescriptions,
} from "./content.js";
import { icon, sword } from "./art.js";
let loaded;
try {
  loaded = load(localStorage);
} catch {
  loaded = { state: fresh(), recovered: true };
}
let game = new Game(loaded.state),
  view = "forge",
  shopTab = "generators",
  quantity = 1,
  filter = "Todas",
  achievementFilter = "Todas",
  artifactFilter = "Todos",
  artifactSort = "rarity",
  shopFilter = "Disponíveis",
  audio;
const root = document.querySelector("#app");
const nav = [
  ["forge", "hammer", "A forja"],
  ["evolution", "sword", "Lâmina"],
  ["enchant", "diamond", "Encantamentos"],
  ["artifacts", "book", "Artefatos"],
  ["skills", "leaf", "Especializações"],
  ["prestige", "flame", "Renascimento"],
  ["challenges", "crown", "Desafios"],
  ["achievements", "star", "Conquistas"],
  ["stats", "chart", "Estatísticas"],
];
const fmt = (v) => B(v).format(game.s.settings.scientific);
const time = (n) =>
  n >= 3600
    ? `${Math.floor(n / 3600)}h ${Math.floor((n % 3600) / 60)}min`
    : n >= 60
      ? `${Math.floor(n / 60)}min ${Math.floor(n % 60)}s`
      : `${Math.ceil(n)}s`;
const progress = (a, b) =>
  Math.min(100, a.cmp(b) >= 0 ? 100 : a.div(b).number() * 100);
const action = (id, label, disabled = false, cls = "", title = "") =>
  `<button data-action="${id}" ${disabled ? "disabled" : ""} class="${cls}" ${title ? `title="${title}"` : ""}>${label}</button>`;
const card = (title, body, button = "", ico = "diamond", cls = "") =>
  `<article class="card ${cls}"><div class="card-icon">${icon(ico, 26)}</div><h3>${title}</h3>${body}${button}</article>`;
function navigation(mobile = false) {
  return nav
    .map(
      ([id, ico, label]) =>
        `<button data-view="${id}" class="${mobile ? "" : "nav-item "}${view === id ? "active" : ""}" ${view === id ? 'aria-current="page"' : ""} title="${label}">${icon(ico, 19)}<span class="${mobile ? "" : "nav-text"}">${label}</span>${!mobile && id === "achievements" ? `<span class="badge">${game.s.achievements.length}</span>` : ""}</button>`,
    )
    .join("");
}
function render() {
  let s = game.s;
  document.body.classList.toggle("reduced", s.settings.reduced);
  root.innerHTML = `<header class="app-header"><div class="brand"><button class="brand-mark" data-action="secret" title="A primeira chama" aria-label="Brasão da primeira chama">${icon("sword", 26)}</button><div><h1>SWORD CLICKER</h1><p>INFINITE FORGE</p></div></div><div class="header-right"><span class="save-state"><i class="dot"></i><span id="save-status">Progresso salvo localmente</span></span><button class="icon-button" data-action="sound" title="${s.settings.sound ? "Desativar" : "Ativar"} som" aria-label="Alternar som">${icon("volume", 18)}</button><button class="icon-button" data-view="settings" title="Configurações" aria-label="Configurações">${icon("gear", 19)}</button></div></header><div class="topbar"><div class="breadcrumb">Seu legado <span style="margin:0 9px;color:#53594b">/</span> <strong>${nav.find((n) => n[0] === view)?.[2] || "Configurações"}</strong></div><span class="live"><i class="dot"></i> A CHAMA NUNCA SE APAGA</span></div><div class="shell"><aside class="sidebar"><div class="nav-label">Sua oficina</div>${navigation()}<div class="sidebar-rule"></div><button data-view="settings" class="nav-item ${view === "settings" ? "active" : ""}">${icon("gear", 19)}<span class="nav-text">Configurações</span></button><div class="sidebar-bottom"><div class="legacy">${icon("flame", 24)}<h4>O fogo é eterno.</h4><p>Todo grande legado começa com uma única martelada.</p>${action("go-prestige", "Descobrir o renascimento ↗")}</div><div class="version">INFINITE FORGE · V1.0</div></div></aside><main class="center"><div id="event-slot"></div>${main()}<div class="footer-caption">DO FERRO AO INFINITO.</div></main><aside class="shop"><div class="shop-head"><h2>Expanda sua forja</h2><span>O poder de criar.</span></div><div class="tabs">${action("tab-generators", `Produção <span class="count">${s.generators.reduce((a, b) => a + b, 0)}</span>`, false, shopTab === "generators" ? "active" : "")}${action("tab-upgrades", `Melhorias <span class="count">${upgrades.filter((u) => game.available(u)).length}</span>`, false, shopTab === "upgrades" ? "active" : "")}</div><div id="shop-body">${shop()}</div><div class="shop-footer">${icon("leaf", 17)}<span>A cada 10, 25, 50, 100, 200 e 400 unidades, a produção deste gerador dobra.</span></div></aside></div><nav class="mobile-nav" aria-label="Navegação">${navigation(true)}</nav>`;
  update();
}
function heading(title, sub, tag = "") {
  return `<div class="page-title"><div><h2>${title}</h2><p>${sub}</p></div>${tag ? `<span class="chapter">${tag}</span>` : ""}</div>`;
}
function resources() {
  return `<div class="resources"><div class="resource"><label>${icon("diamond", 14)} METAL FORJADO</label><strong id="metal">${fmt(game.s.metal)}</strong><small>O início de algo lendário</small></div><div class="resource"><label>${icon("flame", 14)} POR SEGUNDO</label><strong id="rate">${fmt(game.rate())}</strong><small>produção automática</small></div><div class="resource"><label>${icon("hammer", 14)} POR CLIQUE</label><strong id="power">${fmt(game.clickPower())}</strong><small>antes de combos e críticos</small></div></div>`;
}
function main() {
  const s = game.s,
    m = materials[s.sword],
    next = materials[s.sword + 1];
  if (view === "forge")
    return `${heading("Sua forja, seu legado.", "Cada golpe aproxima você do extraordinário.", `ERA ${String(1 + Math.floor(s.sword / 4)).padStart(2, "0")} · ${["O DESPERTAR", "A ALQUIMIA", "O ARCANO", "A ASCENSÃO", "O COSMOS", "O INFINITO"][Math.floor(s.sword / 4)]}`)}${resources()}<div class="buff-bar" id="buffs"></div><div class="forge-stage" id="stage"><span class="stage-note">OFICINA ${s.generators.reduce((a, b) => a + b, 0) > 100 ? "EXPANDIDA" : "INICIANTE"}</span><span class="combo" id="combo"></span><div class="orbit"></div><div class="orbit outer"></div>${Array.from({ length: 12 }, (_, i) => `<i class="ember" style="left:${20 + i * 5}%;bottom:50px;animation-delay:-${i * 0.73}s;animation-duration:${6 + (i % 4)}s"></i>`).join("")}<button class="sword-button" data-action="strike" aria-label="Martelar espada. Pressione espaço para forjar." title="Clique ou pressione espaço. Golpes a cada 0,5s são perfeitos.">${sword(m.color, s.sword)}</button><div class="sword-caption"><span class="rarity">${["COMUM", "INCOMUM", "RARO", "ÉPICO", "LENDÁRIO", "MÍTICO"][Math.floor(s.sword / 4)]} · NÍVEL ${s.sword + 1}</span><h3>${m.title}</h3><p>${m.name} <span style="color:#555c49;margin:0 7px">◆</span> Refinamento +${s.refinement}</p></div></div><section class="progress-section"><div class="row-between"><span class="progress-title">${icon("sword", 14)} Próxima evolução</span><span class="progress-value">${next?.name || "Horizonte infinito"}</span></div><div class="progress"><i id="evo-progress" style="width:${next ? progress(s.metal, next.cost) : 100}%"></i></div><div class="progress-footer"><span id="evo-cost">${next ? `${fmt(s.metal)} / ${fmt(next.cost)} metal` : "A última matéria foi dominada."}</span>${action("go-evolution", `Ver evolução ${icon("arrow", 12)}`, false, "link-button")}</div></section><div class="abilities"><button class="ability" data-action="ability" id="ability" title="Poder de clique ×4 por 15s. Recarga de 120s.">${icon("bolt", 22)}<span><strong>Fúria da forja</strong><small id="ability-label">Clique ×4 · 15 segundos</small></span><span class="key">F</span></button><button class="ability" data-view="enchant">${icon("diamond", 22)}<span><strong>Inscrever uma runa</strong><small>${s.sword < 2 ? "Desbloqueia na lâmina de bronze" : "Dê um novo poder à lâmina"}</small></span>${icon("arrow", 14)}</button></div><section class="journal"><div class="row-between"><span class="eyebrow">Ecos da fornalha</span><span style="font-size:9px;color:var(--muted)">Seu caminho até aqui</span></div><div id="journal">${journal()}</div></section>`;
  if (view === "evolution")
    return `${heading("A alma da lâmina", "O metal guarda a memória de cada golpe.", `${s.sword + 1} / ${materials.length} MATERIAIS`)}${resources()}<div class="panel-content cards">${card(m.name, `<p>${m.title}<br>Bônus de material ×${m.bonus.toFixed(2)} · refinamento +${s.refinement}<br>Cada refinamento adiciona +15% ao multiplicador.</p>`, action("refine", `Refinar · ${fmt(game.refineCost())}`, s.metal.cmp(game.refineCost()) < 0 || s.refinement >= 100), "sword", "wide")}${materials.map((mat, i) => card(mat.name, `<small>Nível ${i + 1} · bônus ×${mat.bonus.toFixed(2)}</small><p>${mat.title}<br>${i === 0 ? "Sua primeira lâmina." : `Requer ${fmt(mat.cost)} metal.`}</p>`, i === s.sword + 1 ? action("evolve", "Forjar esta lâmina", s.metal.cmp(mat.cost) < 0) : `<small>${i <= s.sword ? "✓ Descoberto" : "Evolua o material anterior"}</small>`, "sword", i === s.sword ? "selected" : i > s.sword + 1 ? "locked" : "")).join("")}</div>`;
  if (view === "enchant")
    return `${heading("Palavras que mudam o metal", "Quatro inscrições. Infinitas combinações.", "RUNAS PERMANECEM ATÉ RENASCER")}${resources()}<p class="tip">Desbloqueia no bronze. Encantamentos se acumulam e podem ser combinados. Cada inscrição aumenta seu próprio custo.</p><div class="cards">${enchants.map((e, i) => card(e.name, `<small>Nível ${s.enchants[i]} / 100</small><p>${e.desc}.<br>Amplificados pelas melhorias de Inscrição. A especialização arcana prolonga a Fúria.</p>`, action(`enchant-${i}`, `Inscrever · ${fmt(game.enchantCost(i))}`, s.sword < 2 || s.metal.cmp(game.enchantCost(i)) < 0 || s.enchants[i] >= 100), "diamond")).join("")}</div>`;
  if (view === "artifacts") {
    let ids = s.artifacts.filter(
      (i) =>
        artifactFilter === "Todos" || artifacts[i].rarity === artifactFilter,
    );
    ids.sort((a, b) =>
      artifactSort === "name"
        ? artifacts[a].name.localeCompare(artifacts[b].name)
        : b - a,
    );
    return `${heading("Relíquias de outras eras", "Encontre um artefato a cada três eventos coletados.", `${s.equipped.length} / ${Math.min(4, 2 + s.layers[0])} EQUIPADOS`)}<p class="tip">${s.events} eventos coletados · próximo artefato em ${3 - (s.events % 3)} evento(s). Artefatos e equipamentos sobrevivem aos renascimentos. Compare os bônus abaixo antes de trocar.</p><div class="toolbar"><select id="artifact-filter" aria-label="Filtrar raridade">${["Todos", "Comum", "Raro", "Épico", "Lendário", "Mítico"].map((v) => `<option ${v === artifactFilter ? "selected" : ""}>${v}</option>`).join("")}</select><select id="artifact-sort" aria-label="Ordenar artefatos"><option value="rarity" ${artifactSort === "rarity" ? "selected" : ""}>Mais recentes</option><option value="name" ${artifactSort === "name" ? "selected" : ""}>Nome</option></select></div><div class="cards">${ids.map((i) => card(artifacts[i].name, `<small>${artifacts[i].rarity}</small><p>${artifacts[i].desc}</p>`, action(`equip-${i}`, s.equipped.includes(i) ? "Remover" : "Equipar", !s.equipped.includes(i) && s.equipped.length >= Math.min(4, 2 + s.layers[0])), "diamond", s.equipped.includes(i) ? "selected" : "")).join("") || '<p class="empty wide">A chama guarda tesouros. Colete os eventos dourados para começar sua coleção.</p>'}</div><h3 class="section-title">Bônus equipados</h3><div class="stat-list">${stat("Poder de clique", `+${(game.artifact("click") * 100).toFixed(0)}%`)}${stat("Produção", `+${(game.artifact("production") * 100).toFixed(0)}%`)}${stat("Chance crítica", `+${(game.artifact("crit") * 100).toFixed(0)}%`)}</div>`;
  }
  if (view === "skills")
    return `${heading("Escolha sua maestria", "Um legado, muitos caminhos.", `${game.skillPoints()} PONTOS LIVRES`)}<p class="tip">Cada alma conquistada concede um ponto. Cada ascensão ancestral concede cinco. Nós possuem 5 níveis; o próximo exige 3 níveis no anterior. Redistribuição gratuita.</p>${action("respec", "Redistribuir todos os pontos", false, "link-button")}<div class="cards panel-content">${paths
      .map((p, k) =>
        card(
          p[0],
          `<p>${["Domine o impacto, o ritmo e a força da automação.", "Produza mais, compre melhor e revitalize geradores antigos.", "Fortaleça runas e prolongue poderes temporários.", "Acerte o ponto exato e transforme precisão em poder.", "Construa uma rede em que cada oficina importa.", "Leve o poder da chama para além desta jornada."][k]}</p>${p
            .slice(1)
            .map(
              (name, j) =>
                `<div class="skill-node"><span>${name}<br><small>${s.skills[k * 3 + j]} / 5 · ${skillDescriptions[k * 3 + j]}</small></span>${action(`skill-${k * 3 + j}`, icon("plus", 13), game.skillPoints() < 1 || s.skills[k * 3 + j] >= 5 || (j > 0 && s.skills[k * 3 + j - 1] < 3), "", `Aprender ${name}`)}</div>`,
            )
            .join("")}`,
          "",
          ["hammer", "gear", "diamond", "eye", "leaf", "flame"][k],
        ),
      )
      .join("")}</div>`;
  if (view === "prestige")
    return `${heading("Das cinzas, o infinito.", "O que você cria termina. O que aprende permanece.", `${s.souls} ALMAS DE BRASA`)}<div class="cards panel-content">${card("Renascimento da forja", `<p>Reinicia metal, geradores, melhorias, lâmina, refinamentos e runas. Preserva conquistas, artefatos, especializações e bônus permanentes.</p><small>Recompensa atual: ${game.prestigeReward()} almas · cada alma conquistada dá +5% global e 1 ponto.</small><p>Renasça com 15 metal para retomar a automação. Primeira alma em 1 milhão de metal produzido nesta jornada. Fórmula: ⌊√(log₁₀(produção da jornada) − 5)⌋.</p>`, action("prestige", "Renascer na chama", !game.prestigeReward() || !!s.challenge, "primary"), "flame", "wide")}${["Ascensão ancestral", "Transcendência divina", "Ruptura dimensional"].map((name, i) => card(name, `<small>Nível ${s.layers[i]}</small><p>${["+50% global por nível, cinco pontos de especialização e mais espaço para artefatos (até quatro).", "+100% global por nível e eventos mais frequentes (até 45s).", "+200% global por nível e recarga menor da Fúria (até 45s)."][i]}</p><p>Requer ${(s.layers[i] + 1) * [5, 3, 2][i]} ${["renascimentos", "ascensões ancestrais", "transcendências divinas"][i]} acumulados. Não reinicia a jornada.</p>`, action(`ascend-${i}`, "Elevar legado", (i === 0 ? s.prestiges : s.layers[i - 1]) < (s.layers[i] + 1) * [5, 3, 2][i]), "crown")).join("")}</div><h3 class="section-title">A memória do fogo</h3><div class="cards">${["Brasa eterna", "Engrenagem ancestral", "Herança do aprendiz", "Ampulheta de cinzas"].map((name, i) => card(name, `<small>Nível ${s.permanent[i]} / 30</small><p>${["+25% de produção e clique por nível.", "+20% de produção automática por nível.", "Comece cada renascimento com 15 metal, mais 100 por nível.", "Limite offline +1 hora por nível (base: 8h)."][i]}</p>`, action(`permanent-${i}`, `${game.permanentCost(i)} almas`, s.souls < game.permanentCost(i) || s.permanent[i] >= 30), "flame")).join("")}</div>`;
  if (view === "challenges")
    return `${heading("Prove sua maestria", "Regras diferentes. Um legado mais forte.")}<p class="tip">Desbloqueados no primeiro renascimento. Um desafio por vez; usa sua forja atual e conta apenas produção obtida após iniciar. Cancelar não remove recursos. Bônus são permanentes.</p><div class="cards">${challenges.map((c, i) => card(c.name, `<p>${c.desc}</p><small>Recompensa: ${c.reward}</small>${s.challenge?.id === i ? `<p>${fmt(s.challenge.progress)} / ${fmt(c.goal)}</p><div class="progress"><i style="width:${progress(s.challenge.progress, c.goal)}%"></i></div>` : ""}`, s.completed.includes(i) ? "<p>✓ Concluído</p>" : s.challenge?.id === i ? action("cancel-challenge", "Abandonar desafio") : action(`challenge-${i}`, "Aceitar desafio", s.prestiges < 1 || !!s.challenge), "crown")).join("")}</div>`;
  if (view === "achievements") {
    let defs = achievementDefs
      .filter((a) => a.key !== "secret" || s.secret)
      .filter(
        (a) =>
          achievementFilter === "Todas" ||
          (achievementFilter === "Conquistadas") ===
            s.achievements.includes(a.id),
      );
    return `${heading("Um legado escrito em aço", "Cada conquista concede +1% de produção e clique.", `${s.achievements.length} / ${achievementDefs.length}`)}<div class="toolbar">${["Todas", "Conquistadas", "Pendentes"].map((f) => action(`achfilter-${f}`, f, false, f === achievementFilter ? "active" : "")).join("")}</div><div class="cards">${defs
      .map((a) => {
        let v =
          a.key === "total"
            ? s.total.log()
            : a.key === "units"
              ? s.generators.reduce((a, b) => a + b, 0)
              : a.key === "generator"
                ? s.generators[a.index]
                : s[a.key];
        return `<article class="achievement ${s.achievements.includes(a.id) ? "" : "locked"}">${icon(s.achievements.includes(a.id) ? "star" : "diamond", 23)}<div><strong>${a.name}</strong><p>${a.desc}</p><div class="progress"><i style="width:${Math.min(100, (v / a.value) * 100)}%"></i></div></div></article>`;
      })
      .join("")}</div>`;
  }
  if (view === "stats")
    return `${heading("Os números da criação", "Toda martelada deixa sua marca.")}<h3 class="section-title">Sua jornada</h3><div class="stat-list">${stat("Metal disponível", fmt(s.metal))}${stat("Produção de todos os tempos", fmt(s.total))}${stat("Produção desta jornada", fmt(s.run))}${stat("Produção por segundo", fmt(game.rate()))}${stat("Poder de clique", fmt(game.clickPower()))}${stat("Marteladas", s.clicks.toLocaleString("pt-BR"))}${stat("Críticos / perfeitos", `${s.criticals} / ${s.perfects}`)}${stat("Chance crítica", `${(game.critChance() * 100).toFixed(1)}%`)}${stat("Multiplicador global", `${fmt(game.mult())}×`)}${stat("Melhorias adquiridas", `${s.upgrades.length} / ${upgrades.length}`)}${stat("Tempo ativo", time(s.playtime))}${stat("Renascimentos", s.prestiges)}${stat("Almas conquistadas", s.earnedSouls)}${stat("Eventos coletados", s.events)}</div><h3 class="section-title">Origem da produção</h3><div class="stat-list">${generators.map((g, i) => (s.generators[i] ? stat(`${g.name} (${s.generators[i]})`, `${fmt(game.rateFor(i))}/s`) : "")).join("") || stat("Nenhum gerador", "Comece pelo aprendiz")}</div>`;
  return `${heading("Ao seu ritmo.", "Seu progresso, suas preferências.")}<div class="panel-content">${[
    ["sound", "Som da forja", "Sons sintetizados a cada martelada."],
    ["reduced", "Reduzir efeitos", "Desativa partículas e animações."],
    [
      "scientific",
      "Notação científica",
      "Exibe números grandes em notação exponencial.",
    ],
    [
      "offline",
      "Produção offline",
      "50% da produção por até 8h, ampliável com relíquias.",
    ],
  ]
    .map(
      ([k, name, desc]) =>
        `<label class="settings-row"><span>${name}<small>${desc}</small></span><input type="checkbox" data-setting="${k}" ${s.settings[k] ? "checked" : ""}></label>`,
    )
    .join(
      "",
    )}<h3 class="section-title">Seu legado está seguro</h3><p class="tip">Salvamento local a cada 15 segundos e ao ocultar a página. A cópia anterior fica como backup. Exporte uma cópia antes de trocar de navegador ou limpar dados.</p><div class="toolbar">${action("save", "Salvar agora")}${action("export", "Exportar save")}${action("import", "Importar save")}${action("backup", "Restaurar backup")}${action("reset", "Apagar progresso", false, "danger")}</div><input type="file" id="import-file" accept=".json,application/json" hidden><p class="tip">Atalhos: Espaço — forjar · F — Fúria da forja · S — salvar. Para golpes perfeitos, mantenha intervalos entre 450 e 650ms.</p></div>`;
}
function stat(label, value) {
  return `<div><span>${label}</span><strong>${value}</strong></div>`;
}
function journal() {
  return (
    game.s.log.length
      ? game.s.log.slice(0, 3)
      : [
          "Uma velha lâmina. Uma nova história.",
          "Contrate seu primeiro aprendiz por 15 metal.",
          "Encontre o ritmo: golpes a cada 0,5s são perfeitos.",
        ]
  )
    .map((x) => `<p>${x}</p>`)
    .join("");
}
function shop() {
  let s = game.s;
  if (shopTab === "generators") {
    let visible = generators.filter(
      (g, i) => i < 3 || s.total.cmp(g.cost.mul(0.1)) >= 0 || s.generators[i],
    );
    return `<div class="buy-controls"><span>COMPRAR QUANTIDADE</span><div class="segmented">${[1, 10, 100, "max"].map((n) => action(`qty-${n}`, n === "max" ? "Máx" : `×${n}`, false, quantity === n ? "active" : "")).join("")}</div></div>${visible
      .map((g, i) => {
        const c = game.price(i, quantity === "max" ? 1 : quantity);
        return `<button class="generator" data-action="buy-${i}" data-generator="${i}" title="${g.description} Produção base: ${fmt(g.rate)}/s. Preço cresce 15% por unidade." ${s.metal.cmp(c) < 0 || (s.challenge?.id === 2 && i > 0) ? "disabled" : ""}><span class="gen-icon">${icon(["hammer", "sword", "crown", "gear", "flame", "bolt"][g.symbol], 25)}</span><span class="gen-text"><strong>${g.name}</strong><small>${g.description}</small><small class="cost">◆ ${fmt(c)}</small></span><span class="gen-quantity"><strong>${s.generators[i]}</strong><small>${fmt(game.rateFor(i))}/s</small></span></button>`;
      })
      .join(
        "",
      )}${visible.length < generators.length ? `<div class="locked-row">${icon("diamond", 21)}<span><strong>O próximo capítulo aguarda</strong><small>Revelado em ${fmt(generators[visible.length].cost.mul(0.1))} produzidos</small></span></div>` : ""}`;
  }
  let filtered = upgrades
    .filter((u) => filter === "Todas" || u.category === filter)
    .filter((u) =>
      shopFilter === "Adquiridas"
        ? s.upgrades.includes(u.id)
        : shopFilter === "Bloqueadas"
          ? !s.upgrades.includes(u.id) && !game.available(u)
          : game.available(u),
    );
  return `<div class="buy-controls"><select id="upgrade-filter" aria-label="Categoria de melhorias">${["Todas", ...new Set(upgrades.map((u) => u.category))].map((c) => `<option ${filter === c ? "selected" : ""}>${c}</option>`).join("")}</select><select id="shop-filter" aria-label="Estado das melhorias">${["Disponíveis", "Adquiridas", "Bloqueadas"].map((v) => `<option ${shopFilter === v ? "selected" : ""}>${v}</option>`).join("")}</select></div>${
    filtered
      .slice(0, 40)
      .map(
        (u) =>
          `<article class="upgrade"><span class="eyebrow">${u.category}</span><strong style="margin-top:8px">${u.name}</strong><p>${u.description}</p>${s.upgrades.includes(u.id) ? "<small>✓ Adquirida</small>" : action(`upgrade-${u.id}`, `◆ ${fmt(u.cost)}`, !game.available(u) || s.metal.cmp(u.cost) < 0)}</article>`,
      )
      .join("") ||
    '<p class="empty">Novas possibilidades surgem com a produção. Continue forjando.</p>'
  }${filtered.length > 40 ? '<p class="tip">Exibindo as primeiras 40. Use os filtros para explorar o restante.</p>' : ""}`;
}
function update() {
  const s = game.s,
    now = Date.now();
  for (const [id, value] of [
    ["metal", fmt(s.metal)],
    ["rate", fmt(game.rate())],
    ["power", fmt(game.clickPower())],
    [
      "combo",
      s.combo > 1
        ? `COMBO ×${(1 + s.combo * 0.01).toFixed(2)} · ${s.combo}/100`
        : "",
    ],
    [
      "ability-label",
      now < s.abilityUntil
        ? `Fúria ativa · ${time((s.abilityUntil - now) / 1000)}`
        : now < s.abilityReady
          ? `Recarga · ${time((s.abilityReady - now) / 1000)}`
          : "Clique ×4 · 15 segundos",
    ],
  ]) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
  document
    .querySelectorAll(
      '[data-action="evolve"], [data-action="refine"], [data-action^="enchant-"]',
    )
    .forEach((el) => {
      const a = el.dataset.action;
      if (a === "evolve")
        el.disabled =
          !materials[s.sword + 1] ||
          s.metal.cmp(materials[s.sword + 1].cost) < 0;
      else if (a === "refine")
        el.disabled = s.refinement >= 100 || s.metal.cmp(game.refineCost()) < 0;
      else {
        const i = +a.slice(8);
        el.disabled =
          s.sword < 2 ||
          s.enchants[i] >= 100 ||
          s.metal.cmp(game.enchantCost(i)) < 0;
      }
    });
  const jr = document.getElementById("journal");
  if (jr && jr.innerHTML !== journal()) jr.innerHTML = journal();
  const ability = document.getElementById("ability");
  if (ability) ability.disabled = now < s.abilityReady;
  const next = materials[s.sword + 1];
  const bar = document.getElementById("evo-progress");
  if (bar && next) {
    bar.style.width = `${progress(s.metal, next.cost)}%`;
    document.getElementById("evo-cost").textContent =
      `${fmt(s.metal)} / ${fmt(next.cost)} metal`;
  }
  document.querySelectorAll("[data-generator]").forEach((el) => {
    const i = +el.dataset.generator;
    el.disabled =
      s.metal.cmp(game.price(i, quantity === "max" ? 1 : quantity)) < 0 ||
      (s.challenge?.id === 2 && i > 0);
  });
  const buffs = document.getElementById("buffs");
  if (buffs)
    buffs.innerHTML = s.buffs
      .map(
        (b) =>
          `<span>${{ production: "Produção", click: "Clique", crit: "Crítico" }[b.type]} ×${b.mult} · ${time((b.until - now) / 1000)}</span>`,
      )
      .join("");
  const eventSlot = document.getElementById("event-slot");
  if (eventSlot)
    eventSlot.innerHTML = s.event
      ? `<button class="event-banner" data-action="event"><strong>${icon("star", 20)} ${events[s.event.index].name}</strong><small>${["Comum", "Raro (+15%)", "Lendário (+30%)"][s.event.rarity || 0]} · ${events[s.event.index].desc} · Clique para coletar · ${time((s.event.expires - now) / 1000)}</small></button>`
      : "";
  while (game.notices.length) toast(game.notices.shift());
}
let toastRoot = document.createElement("div");
toastRoot.className = "toasts";
toastRoot.setAttribute("aria-live", "polite");
document.body.append(toastRoot);
function toast(msg) {
  let el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  toastRoot.append(el);
  setTimeout(() => el.remove(), 4500);
  if (toastRoot.childElementCount > 3) toastRoot.firstChild.remove();
}
function confirmAction(title, message, fn) {
  let dialog = document.createElement("dialog");
  dialog.innerHTML = `<h2>${title}</h2><p>${message}</p><footer><button data-cancel>Annuler</button><button data-confirm class="primary">Confirmar</button></footer>`;
  dialog.querySelector("[data-cancel]").textContent = "Cancelar";
  document.body.append(dialog);
  dialog.querySelector("[data-cancel]").onclick = () => dialog.close();
  dialog.querySelector("[data-confirm]").onclick = () => {
    fn();
    dialog.close();
    render();
    persist();
  };
  dialog.onclose = () => dialog.remove();
  dialog.showModal();
}
function persist() {
  try {
    save(localStorage, game.s);
    const el = document.getElementById("save-status");
    if (el) el.textContent = "Progresso salvo localmente";
  } catch {
    toast("Não foi possível salvar. Exporte seu progresso nas configurações.");
  }
}
function playSound(crit) {
  if (!game.s.settings.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    let o = audio.createOscillator(),
      gain = audio.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(crit ? 900 : 420, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(70, audio.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.13);
    o.connect(gain).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.14);
  } catch {}
}
function strike() {
  const result = game.click();
  if (!result) return;
  playSound(result.crit);
  if (!game.s.settings.reduced) {
    let stage = document.getElementById("stage");
    if (stage) {
      let el = document.createElement("span");
      el.className = `float ${result.crit ? "crit" : ""}`;
      el.textContent = `+${fmt(result.gain)}${result.perfect ? " PERFEITO" : result.crit ? " CRÍTICO" : ""}`;
      el.style.marginLeft = `${Math.random() * 60 - 60}px`;
      stage.append(el);
      setTimeout(() => el.remove(), 1000);
      for (let i = 0; i < 6; i++) {
        let spark = document.createElement("i");
        spark.className = "spark";
        spark.style.setProperty("--x", `${Math.random() * 160 - 80}px`);
        spark.style.setProperty("--y", `${Math.random() * 160 - 80}px`);
        stage.append(spark);
        setTimeout(() => spark.remove(), 650);
      }
    }
  }
  update();
}
root.addEventListener("click", (e) => {
  let btn = e.target.closest("button");
  if (!btn || btn.disabled) return;
  if (btn.dataset.view) {
    view = btn.dataset.view;
    render();
    window.scrollTo({
      top: 0,
      behavior: game.s.settings.reduced ? "instant" : "smooth",
    });
    return;
  }
  let a = btn.dataset.action;
  if (!a) return;
  let s = game.s;
  if (a === "strike") {
    strike();
    return;
  }
  if (a === "ability") {
    game.activate();
    update();
    return;
  }
  if (a === "secret") {
    s.secret++;
    if (s.secret === 7) {
      game.note("O brasão respondeu. Você encontrou a primeira chama.");
      game.check();
    }
    if (s.secret > 7) s.secret = 7;
    update();
    return;
  }
  if (a.startsWith("go-")) view = a.slice(3);
  else if (a.startsWith("tab-")) shopTab = a.slice(4);
  else if (a.startsWith("qty-"))
    quantity = a.slice(4) === "max" ? "max" : +a.slice(4);
  else if (a.startsWith("buy-")) game.buyGenerator(+a.slice(4), quantity);
  else if (a.startsWith("upgrade-")) game.buyUpgrade(a.slice(8));
  else if (a === "evolve") game.evolve();
  else if (a === "refine") game.refine();
  else if (a.startsWith("enchant-")) game.enchant(+a.slice(8));
  else if (a.startsWith("equip-")) game.equip(+a.slice(6));
  else if (a.startsWith("skill-")) game.buySkill(+a.slice(6));
  else if (a.startsWith("permanent-")) game.buyPermanent(+a.slice(10));
  else if (a.startsWith("ascend-")) game.ascend(+a.slice(7));
  else if (a === "respec") {
    confirmAction(
      "Redistribuir os pontos?",
      "Todos os pontos de especialização serão devolvidos, sem custo.",
      () => game.respec(),
    );
    return;
  } else if (a === "prestige") {
    confirmAction(
      "Reacender a primeira chama?",
      `Receba ${game.prestigeReward()} almas. Metal, geradores, melhorias, lâmina e runas serão reiniciados. Seu legado permanente será preservado.`,
      () => game.prestige(),
    );
    return;
  } else if (a.startsWith("challenge-")) game.startChallenge(+a.slice(10));
  else if (a === "cancel-challenge") {
    confirmAction(
      "Abandonar desafio?",
      "O progresso deste desafio será descartado. Seus recursos serão preservados.",
      () => game.cancelChallenge(),
    );
    return;
  } else if (a.startsWith("achfilter-")) achievementFilter = a.slice(10);
  else if (a === "event") game.claimEvent();
  else if (a === "sound") {
    s.settings.sound = !s.settings.sound;
    toast(s.settings.sound ? "Som ativado" : "Som desativado");
  } else if (a === "save") {
    persist();
    toast("Seu legado foi salvo.");
    return;
  } else if (a === "export") {
    const blob = new Blob([encode(s)], { type: "application/json" }),
      url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = `infinite-forge-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  } else if (a === "import") {
    document.getElementById("import-file").click();
    return;
  } else if (a === "backup") {
    try {
      const raw = localStorage.getItem("infinite-forge-backup");
      if (!raw) throw Error("Nenhum backup disponível");
      const restored = decode(raw);
      confirmAction(
        "Restaurar backup?",
        "O progresso atual será substituído pela cópia anterior.",
        () => {
          game = new Game(restored);
          game.tick(Date.now(), true);
          toast("Backup restaurado");
        },
      );
      return;
    } catch (err) {
      toast(err.message);
      return;
    }
  } else if (a === "reset") {
    confirmAction(
      "Apagar todo o legado?",
      "Essa ação apaga o progresso e o backup deste navegador. Exporte uma cópia antes de continuar.",
      () => {
        localStorage.removeItem("infinite-forge");
        localStorage.removeItem("infinite-forge-backup");
        game = new Game();
        view = "forge";
      },
    );
    return;
  }
  render();
  persist();
});
root.addEventListener("change", async (e) => {
  let el = e.target;
  if (el.dataset.setting) {
    game.s.settings[el.dataset.setting] = el.checked;
    render();
    persist();
  } else if (el.id === "upgrade-filter") {
    filter = el.value;
    render();
  } else if (el.id === "shop-filter") {
    shopFilter = el.value;
    render();
  } else if (el.id === "artifact-filter") {
    artifactFilter = el.value;
    render();
  } else if (el.id === "artifact-sort") {
    artifactSort = el.value;
    render();
  } else if (el.id === "import-file" && el.files[0]) {
    try {
      if (el.files[0].size > 1000000) throw Error("Arquivo muito grande");
      const next = decode(await el.files[0].text());
      confirmAction(
        "Importar este legado?",
        "O progresso atual será substituído. Uma cópia do save atual será guardada como backup.",
        () => {
          game = new Game(next);
          game.tick(Date.now(), true);
          toast("Progresso importado");
        },
      );
    } catch (err) {
      toast(`Save recusado: ${err.message}`);
    }
  }
});
document.addEventListener("keydown", (e) => {
  if (
    e.target.matches("input,select,textarea,button") ||
    document.querySelector("dialog[open]") ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  )
    return;
  if (e.code === "Space") {
    e.preventDefault();
    if (!e.repeat) strike();
  }
  if (e.key.toLowerCase() === "f") {
    game.activate();
    update();
  }
  if (e.key.toLowerCase() === "s") {
    e.preventDefault();
    persist();
    toast("Progresso salvo");
  }
});
let visibleGenerators = 0,
  availableUpgrades = 0;
setInterval(() => {
  if (document.hidden) return;
  game.tick();
  update();
  const count = generators.filter(
      (g, i) =>
        i < 3 || game.s.total.cmp(g.cost.mul(0.1)) >= 0 || game.s.generators[i],
    ).length,
    uc = upgrades.filter((u) => game.available(u)).length;
  if (count !== visibleGenerators || uc !== availableUpgrades) {
    visibleGenerators = count;
    availableUpgrades = uc;
    const body = document.getElementById("shop-body");
    if (body && !body.contains(document.activeElement)) body.innerHTML = shop();
  } else if (shopTab === "upgrades") {
    document.querySelectorAll('[data-action^="upgrade-"]').forEach((el) => {
      const u = upgrades.find((u) => u.id === el.dataset.action.slice(8));
      el.disabled = !game.available(u) || game.s.metal.cmp(u.cost) < 0;
    });
  }
}, 200);
setInterval(persist, 15000);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    game.tick();
    persist();
  } else {
    game.tick(Date.now(), true);
    showOffline();
    render();
  }
});
window.addEventListener("pagehide", () => {
  game.tick();
  persist();
});
function showOffline() {
  if (game.offline && game.offline.seconds > 60) {
    const o = game.offline;
    toast(
      `A forja continuou: +${fmt(o.gain)} metal em ${time(o.seconds)} (limite offline aplicado).`,
    );
  }
  game.offline = null;
}
game.tick(Date.now(), true);
render();
showOffline();
if (loaded.recovered)
  toast(
    "O save principal estava inválido. Recuperação automática aplicada quando disponível.",
  );
