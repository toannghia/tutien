// Biểu trưng thành tựu — SVG vẽ bằng code. Hình dáng theo nhóm, màu và chữ hiệu riêng từng thành tựu.
// Nhóm: realm (huy chương tròn có dải lụa) · life (lục giác) · bond (vuông bo, ấn triện) · mind (bát giác) · karma (hoa sen)

const E = {
  // Cảnh giới
  awaken: ["realm", "氣", "#6f9a86"],
  foundation: ["realm", "基", "#4f8a63"],
  core: ["realm", "丹", "#c4902b"],
  soul: ["realm", "嬰", "#5a6fc0"],
  spirit: ["realm", "神", "#2f7fb8"],
  mahayana: ["realm", "乘", "#c79f3a"],
  immortal: ["realm", "仙", "#7db0e4"],
  king: ["realm", "王", "#8a3fb0"],
  dao: ["realm", "道", "#c8231f"],
  // Đời người
  mortal_life: ["life", "安", "#8d7d64"],
  short: ["life", "殤", "#7a4a5a"],
  millennium: ["life", "千", "#3f8a7a"],
  myriad: ["life", "萬", "#2a6b8f"],
  // Nhân duyên
  partner: ["bond", "緣", "#c45a7a"],
  sect: ["bond", "長", "#2f6db3"],
  rogue: ["bond", "散", "#6b6150"],
  late_bloomer: ["bond", "晚", "#5e8a3a"],
  reckless: ["bond", "險", "#a83a2a"],
  // Đạo tâm & học vấn
  scholar: ["mind", "博", "#3c5a8a"],
  perfect: ["mind", "全", "#b8862d"],
  heart: ["mind", "心", "#c4502b"],
  tribulation: ["mind", "雷", "#4a5ab8"],
  // Nhân quả
  saint: ["karma", "善", "#d9a92e"],
  demon: ["karma", "魔", "#7a0f1a"],
  heir: ["karma", "承", "#6b4a2a"],
  obsession: ["karma", "執", "#5a3a8a"],
  rebond: ["karma", "續", "#c4507a"],
  redeem: ["karma", "解", "#2e8f86"],
};

let uid = 0;
const poly = (n, r, cx = 50, cy = 50, rot = -Math.PI / 2) =>
  Array.from({ length: n }, (_, i) => {
    const t = rot + (i / n) * Math.PI * 2;
    return `${(cx + Math.cos(t) * r).toFixed(1)},${(cy + Math.sin(t) * r).toFixed(1)}`;
  }).join(" ");

function frame(kind, fill, rim, id) {
  switch (kind) {
    case "realm":
      return `<path d="M34 70 L26 98 L38 92 L44 100 L50 74 Z" fill="${rim}" opacity=".9"/><path d="M66 70 L74 98 L62 92 L56 100 L50 74 Z" fill="${rim}" opacity=".75"/>
        <circle cx="50" cy="46" r="34" fill="${rim}"/><circle cx="50" cy="46" r="29" fill="url(#${id})"/>
        <circle cx="50" cy="46" r="25" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" stroke-dasharray="2 3"/>`;
    case "life":
      return `<polygon points="${poly(6, 40)}" fill="${rim}"/><polygon points="${poly(6, 34)}" fill="url(#${id})"/><polygon points="${poly(6, 29)}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.2"/>`;
    case "bond":
      return `<rect x="12" y="12" width="76" height="76" rx="14" fill="${rim}" transform="rotate(45 50 50)"/><rect x="18" y="18" width="64" height="64" rx="10" fill="url(#${id})" transform="rotate(45 50 50)"/>`;
    case "mind":
      return `<polygon points="${poly(8, 40, 50, 50, -Math.PI / 8)}" fill="${rim}"/><polygon points="${poly(8, 34, 50, 50, -Math.PI / 8)}" fill="url(#${id})"/>
        ${Array.from({ length: 8 }, (_, i) => `<line x1="50" y1="13" x2="50" y2="19" stroke="#fff" stroke-opacity=".55" stroke-width="2" transform="rotate(${i * 45} 50 50)"/>`).join("")}`;
    case "karma":
      return `${Array.from({ length: 8 }, (_, i) => `<ellipse cx="50" cy="22" rx="11" ry="20" fill="${rim}" transform="rotate(${i * 45} 50 50)"/>`).join("")}
        <circle cx="50" cy="50" r="27" fill="url(#${id})"/><circle cx="50" cy="50" r="23" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.2"/>`;
    default:
      return `<circle cx="50" cy="50" r="38" fill="url(#${id})"/>`;
  }
}

/** SVG biểu trưng. locked = chưa đạt (xám, có khóa). */
export function emblemSvg(achId, { size = 56, locked = false, title = "" } = {}) {
  const [kind, glyph, color] = E[achId] ?? ["realm", "✦", "#888"];
  const id = `em${++uid}`;
  const base = locked ? "#9a9a96" : color;
  const rim = locked ? "#7d7d7a" : "#e3c46a";
  const cy = kind === "realm" ? 46 : 50;
  return `<svg class="emblem ${locked ? "locked" : ""}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 104" width="${size}" height="${Math.round(size * 1.04)}" role="img" aria-label="${title || glyph}">
  <defs><radialGradient id="${id}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="${base}"/><stop offset="1" stop-color="${base}" stop-opacity=".85"/></radialGradient></defs>
  ${frame(kind, base, rim, id)}
  <text x="50" y="${cy + 10}" text-anchor="middle" font-family="'Noto Serif', serif" font-size="28" font-weight="700" fill="#fff" ${locked ? 'opacity=".7"' : 'stroke="rgba(0,0,0,.25)" stroke-width=".6"'}>${glyph}</text>
  ${locked ? `<g transform="translate(70 70)"><circle r="12" fill="#5c5c58"/><rect x="-6" y="-2" width="12" height="9" rx="1.5" fill="#e8e8e4"/><path d="M-3.5 -2 v-3 a3.5 3.5 0 0 1 7 0 v3" fill="none" stroke="#e8e8e4" stroke-width="2"/></g>` : ""}
</svg>`;
}

export const EMBLEM_GROUPS = [
  ["realm", "Cảnh giới"],
  ["life", "Đời người"],
  ["bond", "Nhân duyên & lối đi"],
  ["mind", "Đạo tâm & học vấn"],
  ["karma", "Nhân quả luân hồi"],
];
export const emblemGroup = (achId) => (E[achId] ?? ["realm"])[0];
