import { Big } from "./number.js";
const names = [
  "Aprendiz",
  "Ferreiro",
  "Mestre ferreiro",
  "Oficina",
  "Fornalha industrial",
  "Martelo mecânico",
  "Fábrica de espadas",
  "Fundição avançada",
  "Forja rúnica",
  "Forja elemental",
  "Forja encantada",
  "Forja ancestral",
  "Forja dracônica",
  "Forja celestial",
  "Forja divina",
  "Forja dimensional",
  "Forja temporal",
  "Forja cósmica",
  "Forja da realidade",
  "Forja do infinito",
  "Núcleo de singularidade",
  "Tear de estrelas",
  "Catedral do vazio",
  "Oráculo das eras",
  "Motor de universos",
  "Coração primordial",
  "Arquiteto do destino",
  "Horizonte absoluto",
];
const descriptions = [
  "Mãos novas. Um futuro incandescente.",
  "A experiência encontra o metal.",
  "Cada lâmina, uma obra-prima.",
  "O primeiro passo de um império.",
  "O fogo nunca mais se apaga.",
  "Precisão em cada impacto.",
  "Mil lâminas, um só propósito.",
  "Transforma minério em possibilidades.",
  "Símbolos antigos despertam no aço.",
  "O poder dos quatro elementos.",
  "Magia entrelaçada ao metal.",
  "Técnicas que o tempo esqueceu.",
  "O sopro de um dragão cativo.",
  "Lâminas banhadas em luz estelar.",
  "O impossível ganha forma.",
  "Forje além das fronteiras.",
  "O amanhã trabalha por você.",
  "O universo é sua matéria-prima.",
  "Reescreva as leis da criação.",
  "Toda história começa nesta chama.",
];
export const generators = names.map((name, i) => ({
  id: `g${i}`,
  name,
  description: descriptions[i] || "Uma nova fronteira da criação.",
  cost: new Big(i === 0 ? 15 : 1, i === 0 ? 0 : Math.floor(2 + i * 1.35)),
  rate: new Big(i === 0 ? 0.2 : 1, i === 0 ? 0 : Math.floor(i * 1.23)),
  symbol: i % 6,
}));
const mats = [
  "Ferro antigo",
  "Cobre",
  "Bronze",
  "Ferro temperado",
  "Aço",
  "Prata lunar",
  "Ouro solar",
  "Obsidiana",
  "Titânio",
  "Mithril",
  "Adamantita",
  "Cristal arcano",
  "Escama dracônica",
  "Luz celestial",
  "Essência divina",
  "Éter dimensional",
  "Poeira cósmica",
  "Aço do vazio",
  "Âmbar temporal",
  "Prisma estelar",
  "Matéria escura",
  "Coração de nebulosa",
  "Memória primordial",
  "Fragmento do infinito",
];
const colors = [
  "#aab8bd",
  "#d58a58",
  "#cea161",
  "#c8d6d9",
  "#e3f1f7",
  "#cbbfff",
  "#ffd379",
  "#a58acb",
  "#8cc6cd",
  "#63e3ce",
  "#86a0ed",
  "#c181ff",
  "#f17560",
  "#f8dfaa",
];
export const materials = mats.map((name, i) => ({
  name,
  cost: new Big(1, 2 + i * 2),
  color: colors[i % colors.length],
  bonus: 1.7 ** i,
  title: [
    "A lâmina esquecida",
    "O despertar da brasa",
    "Juramento da forja",
    "Corte da aurora",
    "Guardião de aço",
    "Sussurro da lua",
    "Coração do sol",
    "Noite eterna",
  ][i % 8],
}));
export const upgrades = [];
for (let i = 0; i < generators.length; i++)
  for (let t = 0; t < 8; t++)
    upgrades.push({
      id: `gen-${i}-${t}`,
      category: "Automação",
      name: `${["Ferramentas", "Têmpera", "Precisão", "Mecanização", "Maestria", "Ressonância", "Legado", "Perfeição"][t]} · ${generators[i].name}`,
      description: `Produção deste gerador ×2. Requer ${[1, 10, 25, 50, 100, 150, 250, 400][t]} unidades.`,
      cost: generators[i].cost.mul(10 ** (t + 1)).mul(t + 2),
      generator: i,
      required: [1, 10, 25, 50, 100, 150, 250, 400][t],
      effect: "generator",
    });
for (const [category, effect, label, desc] of [
  ["Clique", "click", "Martelo", "Poder de clique ×2,2."],
  [
    "Críticos",
    "crit",
    "Olhar preciso",
    "Chance crítica +0,5%; força crítica +0,15.",
  ],
  [
    "Sinergias",
    "synergy",
    "Liga viva",
    "Geradores recebem +1% por unidade do próximo gerador.",
  ],
  ["Encantamentos", "enchant", "Inscrição", "Poder dos encantamentos +10%."],
  [
    "Materiais",
    "material",
    "Metalurgia",
    "Bônus da lâmina +8%; cliques perfeitos mais fortes.",
  ],
  [
    "Especial",
    "special",
    "Fôlego da fornalha",
    "Duração dos eventos +2s; produção offline +1%.",
  ],
])
  for (let t = 0; t < 18; t++)
    upgrades.push({
      id: `${effect}-${t}`,
      category,
      name: `${label} ${["I", "II", "III", "IV", "V", "VI"][t % 6]}${t >= 6 ? ` · era ${1 + Math.floor(t / 6)}` : ""}`,
      description: desc,
      cost: new Big(1 + (t % 4), 2 + t * 1.8),
      required: new Big(1, 1 + t * 1.8),
      effect,
    });
for (const u of upgrades)
  if (u.effect === "click") {
    const tier = Number(u.id.split("-")[1]);
    u.cost = new Big(50).mul(new Big(5).pow(tier));
    u.required = u.cost.mul(0.2);
  }
export const paths = [
  ["Clique", "Golpe vivo", "Onda de choque", "Martelo do destino"],
  ["Automação", "Ritmo constante", "Linha de montagem", "Motor perpétuo"],
  ["Encantamento", "Condutor arcano", "Runa profunda", "Círculo eterno"],
  ["Críticos", "Mão firme", "Ponto de ruptura", "Precisão absoluta"],
  ["Sinergias", "Elo de cobre", "Liga perfeita", "Rede ancestral"],
  ["Transcendência", "Memória do fogo", "Alma desperta", "Eterno retorno"],
];
export const enchants = [
  {
    name: "Brasa",
    desc: "+25% de poder de clique por nível",
    color: "#f8a261",
  },
  { name: "Fluxo", desc: "+20% de produção por nível", color: "#74c6e9" },
  {
    name: "Fortuna",
    desc: "+1% de chance crítica por nível",
    color: "#c79bf9",
  },
  {
    name: "Vínculo",
    desc: "+8% de produção por tipo de gerador por nível",
    color: "#83dab0",
  },
];
export const artifacts = [
  {
    name: "Coração de carvão",
    rarity: "Comum",
    desc: "+20% de cliques",
    effect: "click",
    value: 0.2,
  },
  {
    name: "Ampulheta âmbar",
    rarity: "Raro",
    desc: "+25% de produção offline",
    effect: "offline",
    value: 0.25,
  },
  {
    name: "Olho de dragão",
    rarity: "Épico",
    desc: "+3% de chance crítica",
    effect: "crit",
    value: 0.03,
  },
  {
    name: "Coroa das estrelas",
    rarity: "Lendário",
    desc: "+35% de produção",
    effect: "production",
    value: 0.35,
  },
  {
    name: "Anel de Hefesto",
    rarity: "Épico",
    desc: "+50% de cliques",
    effect: "click",
    value: 0.5,
  },
  {
    name: "Fragmento do éter",
    rarity: "Lendário",
    desc: "+50% de produção",
    effect: "production",
    value: 0.5,
  },
  {
    name: "Selo do infinito",
    rarity: "Mítico",
    desc: "+100% de produção",
    effect: "production",
    value: 1,
  },
  {
    name: "Memória da primeira chama",
    rarity: "Mítico",
    desc: "+100% de cliques",
    effect: "click",
    value: 1,
  },
];
export const challenges = [
  {
    name: "O silêncio do martelo",
    desc: "Produza 100 mil sem clicar. Cliques ficam desativados.",
    goal: new Big(1, 5),
    rule: "idle",
    reward: "Produção automática +15%",
  },
  {
    name: "Feito à mão",
    desc: "Produza 50 mil apenas com cliques. Automação suspensa.",
    goal: new Big(5, 4),
    rule: "manual",
    reward: "Poder de clique +30%",
  },
  {
    name: "Uma só chama",
    desc: "Produza 1 milhão usando apenas aprendizes.",
    goal: new Big(1, 6),
    rule: "first",
    reward: "Aprendizes ×3",
  },
  {
    name: "Fornalha fria",
    desc: "Produza 10 milhões com produção reduzida a 25%.",
    goal: new Big(1, 7),
    rule: "cold",
    reward: "Todas as fontes +20%",
  },
];
export const events = [
  {
    name: "Chuva de meteoritos",
    desc: "Produção ×3 por 30 segundos",
    type: "production",
    mult: 3,
  },
  {
    name: "Bênção ancestral",
    desc: "Cliques ×5 por 30 segundos",
    type: "click",
    mult: 5,
  },
  {
    name: "Tempestade arcana",
    desc: "Críticos garantidos por 30 segundos",
    type: "crit",
    mult: 1,
  },
  {
    name: "Fornalha instável",
    desc: "Produção ×4 por 30 segundos",
    type: "production",
    mult: 4,
  },
  {
    name: "Martelada divina",
    desc: "Cliques ×7 por 30 segundos",
    type: "click",
    mult: 7,
  },
];
export const achievementDefs = [];
for (const [key, label, values] of [
  ["clicks", "Marteladas", [1, 10, 100, 500, 1000, 5000, 10000, 100000, 1e6]],
  [
    "total",
    "Metal produzido",
    [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 50, 80, 120, 200, 300],
  ],
  [
    "units",
    "Força de trabalho",
    [1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  ],
  ["sword", "Evolução", [1, 2, 3, 4, 5, 8, 10, 15, 20, 23]],
  ["prestiges", "Renascimentos", [1, 2, 5, 10, 25, 50]],
  ["events", "Sinais do céu", [1, 5, 10, 25, 100]],
])
  values.forEach((v, i) =>
    achievementDefs.push({
      id: `${key}-${i}`,
      key,
      value: v,
      name: `${label} ${i + 1}`,
      desc:
        key === "total"
          ? `Produza 1e${v} metal.`
          : `Alcance ${v} em ${label.toLowerCase()}.`,
    }),
  );
for (let i = 0; i < generators.length; i++)
  achievementDefs.push({
    id: `master-${i}`,
    key: "generator",
    index: i,
    value: 100,
    name: `Mestre: ${generators[i].name}`,
    desc: "Adquira 100 unidades deste gerador.",
  });
achievementDefs.push({
  id: "secret",
  key: "secret",
  value: 7,
  name: "A chama responde",
  desc: "Descubra o segredo do brasão. Oculta até ser encontrada.",
});
export const skillDescriptions = [
  "+30% de clique por nível",
  "Combo +15% de eficiência por nível",
  "+1% da produção ao clique por nível",
  "+20% de produção por nível",
  "Geradores 2% mais baratos por nível",
  "Geradores antigos +2% por sucessor/nível",
  "Runas 10% mais fortes por nível",
  "Fúria dura +1s por nível",
  "Eventos duram +2s por nível",
  "Chance crítica +2% por nível",
  "Força crítica +0,3 por nível",
  "Golpes perfeitos +20% por nível",
  "Sinergias +20% por nível",
  "+2% global por tipo de gerador/nível",
  "Marcos de gerador +8% por nível",
  "Recarga da Fúria −5s por nível",
  "Eficiência offline +2% por nível",
  "+1 alma por renascimento a cada 3 níveis",
];
