// Hình minh họa Cẩm nang — SVG vẽ bằng code: linh căn, thể chất, đạo đồ, xuất thân, giới diện.

let uid = 0;
const svg = (body, size, label, vb = "0 0 100 100") =>
  `<svg class="art-svg" xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${size}" height="${size}" role="img" aria-label="${label}">${body}</svg>`;
const ring = (id, a, b) => `<defs><radialGradient id="${id}" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;

// ---------------------------------------------------------------- Linh căn: các hạt ngũ hành quay quanh đan điền
const ELEM = { kim: "#e0c25c", moc: "#4f9a5a", thuy: "#3b7fc4", hoa: "#d0503a", tho: "#a07a45" };
const ROOT_ELEMS = {
  none: [],
  five: ["kim", "moc", "thuy", "hoa", "tho"],
  four: ["kim", "moc", "thuy", "hoa"],
  three: ["moc", "thuy", "hoa"],
  two: ["thuy", "hoa"],
  heaven: ["kim"],
  mutant: [],
};
export function rootArt(id, size = 72) {
  const g = `rg${++uid}`;
  const els = ROOT_ELEMS[id] ?? [];
  const n = els.length;
  // linh căn càng ít hệ thì hạt càng to, càng sáng
  const r = n ? 6 + (5 - n) * 2.2 : 0;
  const orbs = els
    .map((e, i) => {
      const t = -Math.PI / 2 + (i / n) * Math.PI * 2;
      const x = n === 1 ? 50 : 50 + Math.cos(t) * 24, y = n === 1 ? 50 : 50 + Math.sin(t) * 24;
      return `<circle cx="${x}" cy="${y}" r="${r + 5}" fill="${ELEM[e]}" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="${ELEM[e]}" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/>`;
    })
    .join("");
  let center = "";
  if (id === "none") center = `<circle cx="50" cy="50" r="22" fill="none" stroke="#8a8a85" stroke-width="3" stroke-dasharray="4 5"/><path d="M38 38 L62 62" stroke="#8a8a85" stroke-width="3"/>`;
  if (id === "mutant")
    center = `<circle cx="50" cy="50" r="26" fill="#6a4ad0" opacity=".25"/><path d="M56 18 L38 54 L50 54 L42 82 L64 44 L52 44 Z" fill="#b9a6ff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>`;
  if (id === "heaven") center += `<circle cx="50" cy="50" r="34" fill="none" stroke="${ELEM.kim}" stroke-width="1.5" opacity=".7"/>`;
  return svg(
    `${ring(g, "#2b3a33", "#121a16")}<circle cx="50" cy="50" r="47" fill="url(#${g})"/>${n > 1 ? `<circle cx="50" cy="50" r="24" fill="none" stroke="#fff" stroke-opacity=".18" stroke-dasharray="2 4"/>` : ""}${orbs}${center}<circle cx="50" cy="50" r="47" fill="none" stroke="#c5a873" stroke-opacity=".6" stroke-width="2"/>`,
    size,
    "Linh căn",
  );
}

// ---------------------------------------------------------------- Thể chất: dáng người ngồi thiền với hào quang riêng
const BODY_LOOK = {
  common: { aura: "#9aa39a", extra: "" },
  frail: { aura: "#b9b0a6", extra: `<path d="M44 52 l4 6 l-3 5 l4 6" fill="none" stroke="#7a6a5a" stroke-width="1.6"/>` },
  verdant: { aura: "#7fd18a", extra: `<path d="M22 70 q8 -14 20 -10 q-8 10 -20 10z M78 70 q-8 -14 -20 -10 q8 10 20 10z" fill="#4f9a5a"/>` },
  diamond: { aura: "#f0d27a", extra: `<path d="M50 40 l14 10 l-14 26 l-14 -26 z" fill="none" stroke="#fff6d0" stroke-width="1.6" opacity=".9"/>` },
  thunder: { aura: "#8fb8ff", extra: `<path d="M26 22 L20 38 L27 38 L21 52" fill="none" stroke="#cfe0ff" stroke-width="2.4"/><path d="M76 20 L82 36 L75 36 L81 50" fill="none" stroke="#cfe0ff" stroke-width="2.4"/>` },
  dao: { aura: "#ffe39a", extra: `<g transform="translate(50 24) scale(.32)"><circle r="20" fill="#fafaf8"/><path d="M0 -20 A20 20 0 0 1 0 20 A10 10 0 0 1 0 0 A10 10 0 0 0 0 -20Z" fill="#1d1d1d"/></g>` },
};
export function bodyArt(id, size = 72) {
  const L = BODY_LOOK[id] ?? BODY_LOOK.common;
  const g = `bg${++uid}`;
  return svg(
    `<defs><radialGradient id="${g}"><stop offset="0" stop-color="${L.aura}" stop-opacity=".9"/><stop offset="1" stop-color="${L.aura}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="50" cy="50" r="47" fill="#1d2620"/><circle cx="50" cy="52" r="42" fill="url(#${g})"/>
    <circle cx="50" cy="34" r="9" fill="#f0d7bd"/>
    <path d="M32 82 Q30 56 50 46 Q70 56 68 82 Z" fill="${id === "frail" ? "#9a8f84" : "#3b5a48"}"/>
    <path d="M24 84 Q50 70 76 84 Q50 92 24 84 Z" fill="${id === "frail" ? "#8a8075" : "#2f4a3a"}"/>
    ${L.extra}<circle cx="50" cy="50" r="47" fill="none" stroke="#c5a873" stroke-opacity=".6" stroke-width="2"/>`,
    size,
    "Thể chất",
  );
}

// ---------------------------------------------------------------- Đạo đồ: chữ hiệu trên nền hoa văn riêng
const PATH_LOOK = {
  nguhanh: { color: "#3f7a52" },
  dich: { color: "#2d3e66" },
  daoluan: { color: "#5a4632" },
  phat: { color: "#b8862d" },
  tieudao: { color: "#4a8fb5" },
};
export function pathArt(id, glyph, size = 72) {
  const c = (PATH_LOOK[id] ?? PATH_LOOK.daoluan).color;
  let motif = "";
  if (id === "nguhanh")
    motif = Object.values(ELEM).map((col, i) => {
      const t = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      return `<circle cx="${50 + Math.cos(t) * 36}" cy="${50 + Math.sin(t) * 36}" r="5.5" fill="${col}" stroke="#fff" stroke-width="1"/>`;
    }).join("") + `<polygon points="${[0, 2, 4, 1, 3].map((i) => { const t = -Math.PI / 2 + (i / 5) * Math.PI * 2; return `${50 + Math.cos(t) * 36},${50 + Math.sin(t) * 36}`; }).join(" ")}" fill="none" stroke="#fff" stroke-opacity=".35"/>`;
  if (id === "dich")
    motif = Array.from({ length: 8 }, (_, i) => {
      const bars = [0, 1, 2].map((k) => ((i >> k) & 1 ? `M-6 ${k * 3.2} h12` : `M-6 ${k * 3.2} h4.5 M1.5 ${k * 3.2} h4.5`)).join(" ");
      return `<path d="${bars}" stroke="#e8dcb0" stroke-width="2" transform="rotate(${i * 45} 50 50) translate(50 10)"/>`;
    }).join("");
  if (id === "daoluan") motif = `<g transform="translate(50 50)" opacity=".35"><circle r="38" fill="#fafaf8"/><path d="M0 -38 A38 38 0 0 1 0 38 A19 19 0 0 1 0 0 A19 19 0 0 0 0 -38Z" fill="#1d1d1d"/></g>`;
  if (id === "phat") motif = `<g transform="translate(50 86)" fill="#ffe7a8" opacity=".55">${[-50, -25, 0, 25, 50].map((d) => `<path d="M0 0 C-7 -14 -6 -28 0 -36 C6 -28 7 -14 0 0 Z" transform="rotate(${d})"/>`).join("")}</g>`;
  if (id === "tieudao") motif = `<g fill="#ffffff" opacity=".45"><ellipse cx="28" cy="74" rx="18" ry="7"/><ellipse cx="72" cy="78" rx="20" ry="7"/><ellipse cx="66" cy="24" rx="14" ry="5"/></g>`;
  return svg(
    `<circle cx="50" cy="50" r="47" fill="${c}"/>${motif}<circle cx="50" cy="50" r="20" fill="rgba(0,0,0,.35)"/>
    <text x="50" y="60" text-anchor="middle" font-family="'Noto Serif', serif" font-size="28" font-weight="700" fill="#fff">${glyph}</text>
    <circle cx="50" cy="50" r="47" fill="none" stroke="#e3c46a" stroke-width="2.5"/>`,
    size,
    "Đạo đồ",
  );
}

// ---------------------------------------------------------------- Xuất thân: ấn triện vuông
const ORIGIN_LOOK = {
  village: ["農", "#7a6a3a"], merchant: ["商", "#b8862d"], orphan: ["孤", "#6b6b6b"], clan: ["族", "#2f6db3"],
  sect_servant: ["僕", "#3f7a52"], noble: ["王", "#8a2a3a"], physician: ["醫", "#2e8f86"], scholar: ["書", "#4a5a8a"],
  temple: ["觀", "#9a6a2a"], hunter: ["獵", "#5e6b2c"], fallen_clan: ["衰", "#6a5a7a"], demonic: ["魔", "#5a0f16"], omen: ["瑞", "#c8231f"],
};
export function originArt(id, size = 72) {
  const [glyph, c] = ORIGIN_LOOK[id] ?? ["生", "#7a6a5a"];
  return svg(
    `<rect x="8" y="8" width="84" height="84" rx="10" fill="${c}"/><rect x="15" y="15" width="70" height="70" rx="6" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.5"/>
    <text x="50" y="66" text-anchor="middle" font-family="'Noto Serif', serif" font-size="40" font-weight="700" fill="#fff">${glyph}</text>
    <circle cx="80" cy="80" r="3" fill="#fff" opacity=".35"/><circle cx="22" cy="24" r="2" fill="#fff" opacity=".3"/>`,
    size,
    "Xuất thân",
  );
}

// ---------------------------------------------------------------- Giới diện: phong cảnh thu nhỏ
export function worldArt(id, glyph, hue, size = 72) {
  const g = `wg${++uid}`, cl = `wc${++uid}`;
  const sky = `hsl(${hue} 45% 72%)`, sky2 = `hsl(${hue} 40% 42%)`, land = `hsl(${hue} 30% 28%)`;
  const extra = {
    blood: `<path d="M58 70 L70 44 L82 70 Z" fill="#5a1414"/><path d="M68 46 q2 -10 6 -14 q-1 8 2 10" fill="#ff7a3c"/>`,
    hidden: `<ellipse cx="30" cy="40" rx="18" ry="5" fill="#fff" opacity=".7"/><ellipse cx="70" cy="34" rx="14" ry="4" fill="#fff" opacity=".6"/>`,
    shattered: `<path d="M20 20 L40 34 L34 46 L52 58" fill="none" stroke="#e8f0ff" stroke-width="2"/>`,
    wild: `<path d="M26 72 l4 -14 l4 14 z M36 72 l5 -18 l5 18 z" fill="#2c4a1c"/>`,
    abundant: `<circle cx="72" cy="30" r="5" fill="#bff7ff"/><circle cx="62" cy="22" r="3" fill="#bff7ff"/>`,
    declining: `<circle cx="74" cy="30" r="9" fill="#d8c08a" opacity=".6"/>`,
    turmoil: `<path d="M24 32 l10 -6 M30 40 l12 -4" stroke="#ffd2a8" stroke-width="2"/>`,
    peaceful: `<circle cx="74" cy="28" r="8" fill="#fff6c8"/>`,
  }[id] ?? "";
  return svg(
    `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="${sky2}"/></linearGradient><clipPath id="${cl}"><circle cx="50" cy="50" r="47"/></clipPath></defs>
    <g clip-path="url(#${cl})"><rect width="100" height="100" fill="url(#${g})"/>${extra}
      <path d="M0 76 L22 52 L36 64 L54 44 L72 62 L86 54 L100 66 L100 100 L0 100 Z" fill="${land}"/>
      <path d="M0 86 Q50 74 100 88 L100 100 L0 100 Z" fill="hsl(${hue} 25% 20%)"/></g>
    <circle cx="50" cy="50" r="47" fill="none" stroke="#c5a873" stroke-width="2"/>
    <circle cx="80" cy="80" r="13" fill="#9b2c2c" stroke="#fff" stroke-width="1.5"/><text x="80" y="85.5" text-anchor="middle" font-family="'Noto Serif', serif" font-size="15" fill="#fff">${glyph}</text>`,
    size,
    "Giới diện",
  );
}
