// Cờ môn phái — SVG vẽ bằng code: lá phướn đuôi nheo trên cán, màu và hoa văn riêng từng phái, chữ hiệu ở giữa.

// [nền, viền, chữ, hoa văn] — hoa văn: cloud | wave | flame | peak | star | moon | leaf | bolt | eye | lotus | blade | bone
export const SECT_FLAGS = {
  thanhvan: ["#2f6db3", "#e9eef6", "#ffffff", "cloud"],
  bachthao: ["#3f8a4f", "#f1e7c8", "#fff8e6", "leaf"],
  vanha: ["#5b6fb0", "#f3e3b5", "#fff6dc", "cloud"],
  linhtieu: ["#c8952b", "#7a2318", "#fff4d0", "star"],
  vanlinh: ["#2e8f86", "#f2e6c4", "#ffffff", "leaf"],
  tutruc: ["#6e3f8f", "#d8c5e6", "#f7efff", "leaf"],
  thienkiem: ["#9b1f24", "#e7c35a", "#ffffff", "blade"],
  chienthan: ["#7d2a17", "#d6a24a", "#ffe9c2", "flame"],
  huyenco: ["#2d3e50", "#b9c7d4", "#e8f1f8", "eye"],
  manhoang: ["#7a5530", "#e2c99a", "#fff2da", "bone"],
  ngthu: ["#56702c", "#e6d9a0", "#fffbe6", "peak"],
  huyetlang: ["#5e1b1b", "#c9a26b", "#f6e6d0", "moon"],
  codao: ["#6b6150", "#d8cfb8", "#fbf6ea", "cloud"],
  tannguyet: ["#3c4a6b", "#d5d9e6", "#f4f6fb", "moon"],
  thukinh: ["#5a4632", "#e0cfa7", "#fff8e8", "wave"],
  antien: ["#7fa7a0", "#f4f1e6", "#ffffff", "cloud"],
  bonglai: ["#1f7a9c", "#f0e2b6", "#ffffff", "wave"],
  tieudao: ["#8fb5d6", "#ffffff", "#ffffff", "cloud"],
  quychan: ["#2a2346", "#d9b85c", "#f6e7b0", "eye"],
  huyetma: ["#4a0c12", "#b3121d", "#ff6a5a", "flame"],
  uminh: ["#1d1a2e", "#6c5c9e", "#c9bcff", "moon"],
  chinhkhi: ["#b8862d", "#2b2b2b", "#ffffff", "blade"],
  bothien: ["#3a6ea5", "#e8c15a", "#fff3cc", "star"],
  hukhong: ["#5c5470", "#d8d2e8", "#ffffff", "lotus"],
  tinhha: ["#14204a", "#9fb7ff", "#e6edff", "star"],
};
const FALLBACK = ["#6b6b6b", "#dddddd", "#ffffff", "cloud"];

let uid = 0;

function motif(kind, color) {
  const c = `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity=".55"`;
  switch (kind) {
    case "cloud":
      return `<path d="M22 112 q6 -8 14 -2 q6 -9 14 0 q8 -6 12 4" ${c}/><path d="M30 34 q5 -6 11 -1 q5 -6 11 1" ${c}/>`;
    case "wave":
      return `<path d="M18 112 q8 -8 16 0 t16 0 t16 0" ${c}/><path d="M18 120 q8 -8 16 0 t16 0 t16 0" ${c}/>`;
    case "flame":
      return `<path d="M30 122 q-6 -12 4 -22 q-1 9 6 10 q-2 -12 8 -18 q-2 12 6 16 q4 -6 2 -12 q10 10 2 26 z" fill="${color}" opacity=".45"/>`;
    case "peak":
      return `<path d="M16 122 L32 98 L42 110 L52 94 L66 122 Z" fill="${color}" opacity=".4"/>`;
    case "star":
      return [[26, 32], [56, 38], [24, 112], [58, 116], [42, 26]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1.6 : 2.4}" fill="${color}" opacity=".7"/>`).join("");
    case "moon":
      return `<path d="M54 24 a10 10 0 1 0 6 18 a8 8 0 1 1 -6 -18 z" fill="${color}" opacity=".55"/>`;
    case "leaf":
      return `<path d="M22 118 q10 -18 26 -14 q-8 14 -26 14 z" fill="${color}" opacity=".4"/><path d="M62 30 q-12 2 -14 14 q12 -2 14 -14 z" fill="${color}" opacity=".4"/>`;
    case "bolt":
      return `<path d="M50 22 L40 36 L48 36 L38 52" ${c}/>`;
    case "eye":
      // bát quái thu nhỏ + vòng
      return `<circle cx="41" cy="72" r="30" ${c}/>${[0, 45, 90, 135, 180, 225, 270, 315].map((d, i) => `<path d="M41 37 h${i % 2 ? 3 : 8} M${i % 2 ? 46 : 41} 37 h${i % 2 ? 3 : 0}" transform="rotate(${d} 41 72) translate(${i % 2 ? -4 : -4} 0)" stroke="${color}" stroke-width="2" opacity=".6"/>`).join("")}`;
    case "lotus":
      return `<g transform="translate(41 120)" fill="${color}" opacity=".45">${[-40, -20, 0, 20, 40].map((d) => `<path d="M0 0 C-5 -10 -4 -20 0 -26 C4 -20 5 -10 0 0 Z" transform="rotate(${d})"/>`).join("")}</g>`;
    case "blade":
      return `<path d="M41 18 L44 30 L41 120 L38 30 Z" fill="${color}" opacity=".35"/>`;
    case "bone":
      return `<path d="M24 114 L58 98" ${c} stroke-width="4"/><circle cx="23" cy="112" r="3" fill="${color}" opacity=".5"/><circle cx="59" cy="100" r="3" fill="${color}" opacity=".5"/>`;
    default:
      return "";
  }
}

/** Chuỗi SVG cờ của một phái. glyph: chữ hiệu (lấy từ codex). */
export function flagSvg(sectId, glyph = "", { size = 48, wave = true, title = "" } = {}) {
  const [bg, edge, ink, kind] = SECT_FLAGS[sectId] ?? FALLBACK;
  const id = `fl${++uid}`;
  const h = size;
  const w = Math.round((size * 96) / 150);
  // Lá cờ 82×128 treo từ x=10; đuôi nheo hai mũi ở dưới
  return `<svg class="sect-flag ${wave ? "wave" : ""}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 150" width="${w}" height="${h}" role="img" aria-label="${title || `Cờ ${glyph}`}">
  <defs>
    <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".35" stop-color="#fff" stop-opacity=".12"/><stop offset=".7" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
    <clipPath id="${id}-c"><path d="M10 12 H88 V128 L68 142 L49 126 L30 142 L10 128 Z"/></clipPath>
  </defs>
  <rect x="5" y="4" width="4" height="146" rx="2" fill="#6b4a2a"/>
  <circle cx="7" cy="5" r="4" fill="#d9b35a"/>
  <rect x="6" y="9" width="86" height="5" rx="2" fill="#4a3320"/>
  <g class="flag-cloth">
    <path d="M10 12 H88 V128 L68 142 L49 126 L30 142 L10 128 Z" fill="${bg}"/>
    <g clip-path="url(#${id}-c)">
      ${motif(kind, ink)}
      <path d="M10 12 H88 V128 L68 142 L49 126 L30 142 L10 128 Z" fill="none" stroke="${edge}" stroke-width="7"/>
      <rect x="10" y="12" width="78" height="132" fill="url(#${id}-g)"/>
    </g>
    <circle cx="49" cy="70" r="24" fill="${edge}" opacity=".95"/>
    <circle cx="49" cy="70" r="20.5" fill="${bg}"/>
    <text x="49" y="79" text-anchor="middle" font-family="'Noto Serif', serif" font-size="26" font-weight="600" fill="${ink}">${glyph}</text>
  </g>
</svg>`;
}

/** Màu chính của cờ (dùng cho cờ nhỏ trên bản đồ). */
export const flagColors = (sectId) => SECT_FLAGS[sectId] ?? FALLBACK;
