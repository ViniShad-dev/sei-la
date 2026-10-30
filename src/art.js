export const icon = (name, size = 22) => {
  const paths = {
    hammer: "M14 3l7 7-4 4-3-3-8 10-4-4 10-8-3-3z",
    flame:
      "M13 2c2 6-4 6-1 10 2-1 3-3 3-5 9 10 3 16-3 16C1 23 1 12 7 7c-1 6 1 7 2 7-2-5 3-7 4-12z",
    sword: "M15 2l7 0 0 7-11 10-3-3zM4 13l7 7M7 17l-5 5",
    diamond: "M12 2l10 10-10 10L2 12zM12 2v20M2 12h20",
    star: "M12 2l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z",
    chart: "M3 3v18h19M7 16l4-6 4 3 6-9",
    gear: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M10 2h4l1 4 4-1 2 4-3 3 3 3-2 4-4-1-1 4h-4l-1-4-4 1-2-4 3-3-3-3 2-4 4 1z",
    book: "M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3zM12 6v16",
    arrow: "M5 12h14M13 6l6 6-6 6",
    check: "M4 12l5 5L20 6",
    clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v6l4 2",
    volume: "M3 9h4l5-5v16l-5-5H3zM16 7c5 3 5 7 0 10",
    bolt: "M13 2L4 14h7l-1 8 10-13h-8z",
    crown: "M3 6l5 4 4-7 4 7 5-4-2 13H5z",
    leaf: "M20 3C4 1 0 15 9 19c9 4 13-6 11-16M5 22L17 7",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
    plus: "M12 4v16M4 12h16",
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.diamond}"/></svg>`;
};
export function sword(color, tier) {
  const width = 21 + Math.min(12, tier * 0.7);
  const blade = `M130 14L${130 + width} 61 ${145 + Math.floor(tier / 5)} 295 ${115 - Math.floor(tier / 5)} 295 ${130 - width} 61Z`;

  return `<svg class="sword-svg" viewBox="0 0 260 460" aria-hidden="true"><defs><linearGradient id="blade"><stop stop-color="#394349"/><stop offset=".43" stop-color="${color}"/><stop offset=".49" stop-color="#f0f2dc"/><stop offset=".52" stop-color="${color}"/><stop offset="1" stop-color="#475054"/></linearGradient><linearGradient id="gold"><stop stop-color="#4f3521"/><stop offset=".45" stop-color="#e4be74"/><stop offset=".55" stop-color="#ffdf96"/><stop offset="1" stop-color="#6f4726"/></linearGradient><linearGradient id="grip"><stop stop-color="#241c17"/><stop offset=".5" stop-color="#67503a"/><stop offset="1" stop-color="#1b1713"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="4"/></filter></defs><g transform="translate(130 226) rotate(23) translate(-130 -226)"><path d="${blade}" fill="${color}" opacity=".25" filter="url(#glow)"/><path d="${blade}" fill="url(#blade)" stroke="#b8b9a2" stroke-width="1"/><path d="M130 20V289M113 65l17 16 17-16" stroke="#f9f1cd" opacity=".5"/><path d="M130 110l7 12-7 12-7-12zM130 150v37m-5-30 10 12-10 10" stroke="${tier > 3 ? "#f5dca8" : "#747c77"}" fill="none" opacity=".7"/><path d="M87 284l-22 18 5 13 34-14h52l34 14 5-13-22-18-28 5h-30Z" fill="url(#gold)" stroke="#d2ac65"/><path d="M119 301h22l-2 91h-18Z" fill="url(#grip)" stroke="#a17b44"/>${Array.from({ length: 8 }, (_, i) => `<path d="M121 ${309 + i * 10}l18 7" stroke="#a38a62" stroke-width="3" opacity=".65"/>`).join("")}<path d="M120 300h20v10h-20zM119 386h22v11h-22z" fill="url(#gold)"/><path d="M130 394l14 13-14 19-14-19z" fill="url(#gold)" stroke="#d7b371"/><path d="M130 293l9 8-9 10-9-10z" fill="${tier > 4 ? color : "#b06a36"}" stroke="#efd295"/>${tier > 5 ? '<path d="M113 81l-11 170 13 26M147 81l11 170-13 26" stroke="' + color + '" fill="none" opacity=".6"/>' : ""}${tier === 0 ? '<path d="M119 94l8 7-5 15M140 209l-6 8 6 7M117 245l10 8" stroke="#9d633a" opacity=".7" stroke-width="3" fill="none"/>' : ""}${tier > 8 ? `<path d="M105 289L81 257 92 291M155 289l24-32-11 34" fill="url(#gold)" stroke="${color}"/>` : ""}${tier > 13 ? `<path d="M116 210l14-15 14 15-14 15zM118 236l12-8 12 8-12 8z" stroke="${color}" fill="none"/><circle cx="130" cy="301" r="16" stroke="${color}" fill="none" opacity=".65"/>` : ""}</g></svg>`;
}
