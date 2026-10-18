// Chân dung nhân vật theo cảnh giới — SVG vẽ bằng code, không cần ảnh.
// Mỗi cảnh giới đổi phục sức, hào quang, dị tượng phía sau và khung viền; nam/nữ khác kiểu tóc.

// bg: nền (trong → ngoài), robe/trim: áo và viền áo, aura: hào quang, frame: khung, hair: màu tóc
const LOOKS = [
  { name: "Phàm nhân", bg: ["#e2dccb", "#b9ae94"], robe: "#7d6b55", trim: "#5d4e3d", inner: "#e9e2d0", aura: null, frame: "#8d7d64", hair: "#2a211b" },
  { name: "Luyện Khí", bg: ["#e3ece9", "#a8bfb9"], robe: "#8aa3a4", trim: "#eef3ee", inner: "#f4f6f1", aura: "#d6efe7", frame: "#6f9a86", hair: "#1f1a17" },
  { name: "Trúc Cơ", bg: ["#dcefdc", "#8db795"], robe: "#4d7d5c", trim: "#e7f0e3", inner: "#f3f6ee", aura: "#c3e8c8", frame: "#4f8a63", hair: "#1c1815" },
  { name: "Kim Đan", bg: ["#f8ecc9", "#cfa65a"], robe: "#f2e8d0", trim: "#c4902b", inner: "#fffaf0", aura: "#ffd77a", frame: "#b98a2e", hair: "#1c1815" },
  { name: "Nguyên Anh", bg: ["#e2e7f7", "#8090c8"], robe: "#3b4e8e", trim: "#d9c27c", inner: "#eef0fa", aura: "#b3c0ff", frame: "#9aa6c9", hair: "#171522" },
  { name: "Hóa Thần", bg: ["#33457a", "#121a36"], robe: "#1e2c5b", trim: "#8fd6ff", inner: "#dceeff", aura: "#7cc8ff", frame: "#a9c3d9", hair: "#0f1222" },
  { name: "Luyện Hư", bg: ["#33275a", "#0c0919"], robe: "#5a4889", trim: "#cdbcff", inner: "#ece6ff", aura: "#b59dff", frame: "#b9b0d9", hair: "#120f22" },
  { name: "Hợp Thể", bg: ["#f0f0ee", "#7c7c7a"], robe: "#262626", trim: "#f3f3f1", inner: "#fafaf8", aura: "#ffffff", frame: "#cfd3d6", hair: "#141414" },
  { name: "Đại Thừa", bg: ["#fff6de", "#dfb661"], robe: "#f8f4ea", trim: "#c79f3a", inner: "#ffffff", aura: "#ffe39a", frame: "#d4ad4a", hair: "#d9d6d0" },
  { name: "Chân Tiên", bg: ["#eaf4ff", "#9cc2ea"], robe: "#ffffff", trim: "#7db0e4", inner: "#f2f8ff", aura: "#ffffff", frame: "#d9b450", hair: "#1a1a24" },
  { name: "Kim Tiên", bg: ["#fff3c6", "#de9f1d"], robe: "#e6b434", trim: "#fff4c8", inner: "#fffbe8", aura: "#fff0a8", frame: "#e1b545", hair: "#1c1610" },
  { name: "Huyền Tiên", bg: ["#14404a", "#05171b"], robe: "#1c6d70", trim: "#a2f2e2", inner: "#e6fffa", aura: "#7fffe0", frame: "#d9b450", hair: "#0d1a1c" },
  { name: "Tiên Vương", bg: ["#44205a", "#160720"], robe: "#6b2a8c", trim: "#f2c75c", inner: "#fbf0ff", aura: "#f5c4ff", frame: "#f0c75a", hair: "#140a18" },
  { name: "Tiên Đế", bg: ["#6a1416", "#1a0405"], robe: "#b9231f", trim: "#ffd56a", inner: "#fff6e0", aura: "#ffd56a", frame: "#ffd56a", hair: "#120606" },
];
const SKINS = ["#f3d7bb", "#ecc9a6", "#e2b996"];

let uid = 0;

// Dị tượng phía sau đầu theo cảnh giới
function backdrop(r, L, id) {
  const a = L.aura;
  const rays = (n, len, w, op) =>
    Array.from({ length: n }, (_, i) => {
      const t = (i / n) * Math.PI * 2;
      return `<path d="M100 94 L${100 + Math.cos(t - w) * len} ${94 + Math.sin(t - w) * len} L${100 + Math.cos(t + w) * len} ${94 + Math.sin(t + w) * len} Z" fill="${a}" opacity="${op}"/>`;
    }).join("");
  const stars = (n, seed, color = "#fff") => {
    let s = seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: n }, () => `<circle cx="${(10 + rnd() * 180).toFixed(1)}" cy="${(8 + rnd() * 120).toFixed(1)}" r="${(0.5 + rnd() * 1.3).toFixed(1)}" fill="${color}" opacity="${(0.4 + rnd() * 0.6).toFixed(2)}"/>`).join("");
  };
  const wisps = (op) =>
    `<g fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" opacity="${op}">
      <path d="M38 132 C30 112 46 104 40 86"/><path d="M162 132 C170 112 154 104 160 86"/><path d="M52 150 C44 136 56 128 50 116"/><path d="M148 150 C156 136 144 128 150 116"/></g>`;
  const mountains = (fill, op) => `<path d="M0 150 L34 118 L56 134 L86 104 L112 128 L140 108 L170 130 L200 116 L200 200 L0 200 Z" fill="${fill}" opacity="${op}"/>`;
  const halo = (rr, w, op, dash = "") => `<circle cx="100" cy="94" r="${rr}" fill="none" stroke="${a}" stroke-width="${w}" opacity="${op}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`;
  const glow = (rr, op) => `<circle cx="100" cy="94" r="${rr}" fill="url(#${id}-aura)" opacity="${op}"/>`;
  const clouds = (fill, y = 168) =>
    `<g fill="${fill}" opacity=".95"><ellipse cx="30" cy="${y}" rx="34" ry="12"/><ellipse cx="62" cy="${y + 8}" rx="30" ry="11"/><ellipse cx="170" cy="${y}" rx="34" ry="12"/><ellipse cx="138" cy="${y + 8}" rx="30" ry="11"/></g>`;
  switch (r) {
    case 0:
      return mountains("#9f9378", 0.45);
    case 1:
      return mountains("#8fa9a2", 0.35) + wisps(0.7);
    case 2:
      return mountains("#6f9c7a", 0.4) + glow(58, 0.5) + halo(50, 1.5, 0.6) + wisps(0.6);
    case 3:
      return glow(70, 0.9) + rays(16, 90, 0.05, 0.25) + halo(48, 2, 0.8);
    case 4:
      return glow(70, 0.7) + halo(52, 2, 0.7) + halo(60, 1, 0.5, "2 5") +
        // Nguyên Anh: tiểu anh nhi ngồi thiền trên đỉnh đầu
        `<g transform="translate(100 34)" fill="${a}" opacity=".85"><circle cx="0" cy="-6" r="5"/><path d="M-9 8 C-9 -2 9 -2 9 8 Z"/></g>`;
    case 5:
      return glow(72, 0.6) + halo(50, 2, 0.7) +
        `<g fill="none" stroke="${a}" stroke-width="2.4" stroke-linejoin="round" opacity=".95">
          <path d="M34 20 L46 48 L36 50 L52 82"/><path d="M168 18 L154 46 L164 48 L148 84"/><path d="M14 70 L28 84 L20 88 L32 104" stroke-width="1.6"/><path d="M188 66 L172 82 L180 86 L168 104" stroke-width="1.6"/></g>`;
    case 6:
      return stars(40, 7) + glow(70, 0.55) +
        `<g fill="none" stroke="${a}" opacity=".6"><path d="M100 94 m-62 0 a62 26 0 1 0 124 0 a62 26 0 1 0 -124 0" stroke-width="1.2" transform="rotate(-18 100 94)"/><path d="M100 94 m-52 0 a52 20 0 1 0 104 0 a52 20 0 1 0 -104 0" stroke-width="1" transform="rotate(24 100 94)"/></g>`;
    case 7:
      // Hợp Thể: âm dương hợp nhất
      return `<g class="av-spin-slow"><g transform="translate(100 92) rotate(-20)" opacity=".9">
        <circle r="66" fill="#fafaf8" stroke="#bdbdbb" stroke-width="1.5"/>
        <path d="M0 -66 A66 66 0 0 1 0 66 A33 33 0 0 1 0 0 A33 33 0 0 0 0 -66 Z" fill="#1d1d1d"/>
        <circle cy="-33" r="9" fill="#1d1d1d"/><circle cy="33" r="9" fill="#fafaf8"/></g></g>`;
    case 8:
      return rays(24, 110, 0.045, 0.45) + glow(64, 0.9) + halo(46, 3, 0.9) + halo(54, 1, 0.7);
    case 9:
      return rays(12, 110, 0.06, 0.35) + glow(66, 0.9) + halo(48, 2.5, 0.95) + clouds("#ffffff", 172) +
        // Tiên hạc
        `<path d="M150 40 q10 -6 22 -2 q-10 1 -14 6 q8 0 14 4 q-12 -1 -18 2 z" fill="#ffffff" opacity=".9"/>`;
    case 10:
      // Kim Tiên: kim liên nở sau lưng
      return rays(20, 110, 0.05, 0.4) + glow(70, 0.9) +
        `<g transform="translate(100 150)" fill="#fff0a8" stroke="#d99a1c" stroke-width="1.2" opacity=".95">${[-60, -36, -12, 12, 36, 60]
          .map((d) => `<path d="M0 0 C-14 -30 -10 -62 0 -78 C10 -62 14 -30 0 0 Z" transform="rotate(${d})"/>`)
          .join("")}</g>` + halo(46, 2.5, 0.9);
    case 11: {
      // Huyền Tiên: vòng phù văn
      const marks = Array.from({ length: 16 }, (_, i) => {
        const t = (i / 16) * Math.PI * 2;
        const x = 100 + Math.cos(t) * 62, y = 94 + Math.sin(t) * 62;
        // quẻ bát quái thu nhỏ: ba vạch liền / đứt
        const bars = [0, 1, 2].map((k) => ((i >> k) & 1 ? `M${x - 4} ${y - 3 + k * 3} h8` : `M${x - 4} ${y - 3 + k * 3} h3 M${x + 1} ${y - 3 + k * 3} h3`)).join(" ");
        return `<path d="${bars}" transform="rotate(${(t * 180) / Math.PI + 90} ${x} ${y})"/>`;
      }).join("");
      return stars(24, 11, a) + glow(72, 0.5) +
        `<g fill="none" stroke="${a}" stroke-width="1.3" opacity=".9" class="av-spin"><circle cx="100" cy="94" r="70"/><circle cx="100" cy="94" r="55" stroke-dasharray="3 4"/>${marks}</g>`;
    }
    case 12:
      return stars(20, 5, "#f5c4ff") + rays(18, 110, 0.05, 0.3) + glow(70, 0.7) + halo(50, 2.5, 0.95) + halo(60, 1, 0.6, "1 4");
    case 13:
      return stars(36, 3, "#ffe7a3") + rays(28, 110, 0.04, 0.4) + glow(76, 0.85) +
        `<g fill="none" stroke="${a}" class="av-spin"><circle cx="100" cy="94" r="68" stroke-width="1" stroke-dasharray="2 5"/></g>` +
        halo(48, 3, 1) + halo(56, 1.5, 0.8) + halo(62, 0.8, 0.6);
    default:
      return "";
  }
}

// Mũ/miện trên búi tóc theo cảnh giới
function headwear(r, L, female) {
  const y = female ? 58 : 62;
  if (r >= 12) {
    // miện đế vương: Tiên Vương 5 cánh, Tiên Đế 7 cánh + châu
    const n = r === 13 ? 7 : 5;
    const pts = Array.from({ length: n }, (_, i) => {
      const x = 84 + (i * 32) / (n - 1);
      const h = i === (n - 1) / 2 ? 18 : i % 2 ? 9 : 13;
      return `<path d="M${x - 3} ${y + 2} L${x} ${y - h} L${x + 3} ${y + 2} Z"/>`;
    }).join("");
    return `<g fill="${L.trim}" stroke="${r === 13 ? "#8a5a00" : "#7a5a10"}" stroke-width=".8">${pts}<rect x="82" y="${y}" width="36" height="7" rx="2"/>${
      r === 13 ? `<circle cx="100" cy="${y - 19}" r="2.6" fill="#ff5a3c"/><circle cx="90" cy="${y + 3.5}" r="1.6" fill="#ff5a3c"/><circle cx="110" cy="${y + 3.5}" r="1.6" fill="#ff5a3c"/>` : `<circle cx="100" cy="${y + 3.5}" r="1.8" fill="#c25bd9"/>`
    }</g>`;
  }
  if (r >= 3) {
    // quan (mũ nhỏ trên búi) + trâm
    const bead = r >= 9 ? `<circle cx="${female ? 120 : 118}" cy="${y + 9}" r="2" fill="${L.trim}"/>` : "";
    return `<g><rect x="92" y="${y - 9}" width="16" height="12" rx="3" fill="${L.trim}" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>
      <line x1="80" y1="${y - 2}" x2="120" y2="${y - 4}" stroke="${L.trim}" stroke-width="2" stroke-linecap="round"/>
      ${female ? `<path d="M118 ${y - 3} l2 10" stroke="${L.trim}" stroke-width="1"/>${bead}` : bead}</g>`;
  }
  if (r >= 1) return `<line x1="84" y1="${y}" x2="117" y2="${y - 2}" stroke="#8a6a3a" stroke-width="2" stroke-linecap="round"/>`;
  return `<path d="M88 ${y + 2} q12 -5 24 0" stroke="#6b5a45" stroke-width="2.4" fill="none"/>`; // dây buộc tóc vải
}

/**
 * Trả về chuỗi SVG chân dung.
 * @param {number} realm  chỉ số cảnh giới 0..13
 * @param {"male"|"female"} gender
 * @param {{ seed?: number, size?: number, title?: string, animate?: boolean }} opts
 */
export function avatarSvg(realm, gender = "male", { seed = 0, size = 96, title = "", animate = true } = {}) {
  const r = Math.max(0, Math.min(13, realm | 0));
  const L = LOOKS[r];
  const id = `av${++uid}`;
  const female = gender === "female";
  const skin = SKINS[Math.abs(seed) % SKINS.length];
  const hair = L.hair;
  const ink = "#3a2a20";
  const robeOpacity = r === 6 ? 0.88 : 1;
  const markColor = r >= 10 ? "#ffcf4a" : "#d8342c";

  const longHair = female
    ? `<path d="M77 96 C70 122 74 146 64 176 L88 166 C84 146 82 122 84 104 Z" fill="${hair}"/><path d="M123 96 C130 122 126 146 136 176 L112 166 C116 146 118 122 116 104 Z" fill="${hair}"/>`
    : "";
  const bun = female
    ? `<ellipse cx="100" cy="62" rx="15" ry="10" fill="${hair}"/><circle cx="86" cy="66" r="6" fill="${hair}"/><circle cx="114" cy="66" r="6" fill="${hair}"/>`
    : `<circle cx="100" cy="64" r="10" fill="${hair}"/>`;
  const fringe = female
    ? `<path d="M77 100 C75 76 88 69 100 69 C112 69 125 76 123 100 C119 90 110 84 101 82 C96 88 86 92 77 100 Z" fill="${hair}"/>`
    : `<path d="M77 100 C76 76 88 69 100 69 C112 69 124 76 123 100 C120 89 112 83 100 82 C88 83 80 89 77 100 Z" fill="${hair}"/>`;
  const brows = female
    ? `<path d="M86 95 q6 -4 11 -1" /><path d="M103 94 q5 -3 11 1"/>`
    : `<path d="M85 95 q6 -3 12 -1" stroke-width="2.2"/><path d="M103 94 q6 -2 12 1" stroke-width="2.2"/>`;
  // Từ Hóa Thần trở lên: ấn ký giữa trán
  const mark = r >= 5 ? `<path d="M100 82 l2.2 4 l-2.2 4 l-2.2 -4 Z" fill="${markColor}"/>` : "";
  // Kim Đan: hạt kim đan sáng ở đan điền; Tiên Đế: long văn trên áo (vằn mây vàng)
  const core = r === 3 ? `<circle cx="100" cy="186" r="6" fill="#ffe08a"/><circle cx="100" cy="186" r="11" fill="#ffe08a" opacity=".35"/>` : "";
  const pattern =
    r >= 12
      ? `<g fill="none" stroke="${L.trim}" stroke-width="1.2" opacity=".75"><path d="M44 182 q8 -10 16 0 q8 10 16 0"/><path d="M124 182 q8 -10 16 0 q8 10 16 0"/><path d="M52 168 q6 -7 12 0"/><path d="M136 168 q6 -7 12 0"/></g>`
      : r >= 8
        ? `<g fill="none" stroke="${L.trim}" stroke-width="1" opacity=".6"><path d="M48 180 q8 -8 16 0"/><path d="M136 180 q8 -8 16 0"/></g>`
        : "";
  const frameRings =
    r >= 12
      ? `<circle cx="100" cy="100" r="95" fill="none" stroke="${L.frame}" stroke-width="5"/><circle cx="100" cy="100" r="88" fill="none" stroke="${L.frame}" stroke-width="1" opacity=".7"/>${Array.from({ length: 12 }, (_, i) => {
          const t = (i / 12) * Math.PI * 2;
          return `<circle cx="${100 + Math.cos(t) * 95}" cy="${100 + Math.sin(t) * 95}" r="3" fill="${L.frame}"/>`;
        }).join("")}`
      : r >= 9
        ? `<circle cx="100" cy="100" r="95" fill="none" stroke="${L.frame}" stroke-width="4.5"/><circle cx="100" cy="100" r="89" fill="none" stroke="${L.frame}" stroke-width=".8" opacity=".7"/>`
        : `<circle cx="100" cy="100" r="95" fill="none" stroke="${L.frame}" stroke-width="${r === 0 ? 2.5 : 3.5}"/>`;

  return `<svg class="avatar-svg ${animate ? "anim" : ""}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="${title || `Chân dung ${L.name}`}">
  <defs>
    <radialGradient id="${id}-bg" cx="50%" cy="42%" r="65%"><stop offset="0" stop-color="${L.bg[0]}"/><stop offset="1" stop-color="${L.bg[1]}"/></radialGradient>
    <radialGradient id="${id}-aura"><stop offset="0" stop-color="${L.aura ?? L.bg[0]}" stop-opacity="1"/><stop offset="1" stop-color="${L.aura ?? L.bg[0]}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}-robe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.robe}"/><stop offset="1" stop-color="${L.robe}" stop-opacity="${r === 6 ? 0.55 : 1}"/></linearGradient>
    <clipPath id="${id}-clip"><circle cx="100" cy="100" r="95"/></clipPath>
  </defs>
  <g clip-path="url(#${id}-clip)">
    <rect width="200" height="200" fill="url(#${id}-bg)"/>
    ${backdrop(r, L, id)}
    ${longHair}
    <path d="M22 200 C26 170 46 154 74 147 L88 140 L112 140 L126 147 C154 154 174 170 178 200 Z" fill="url(#${id}-robe)" opacity="${robeOpacity}"/>
    <path d="M88 140 L100 174 L112 140 Z" fill="${L.inner}"/>
    <path d="M85 138 L100 176 L115 138" fill="none" stroke="${L.trim}" stroke-width="5" stroke-linejoin="round"/>
    ${pattern}
    <rect x="40" y="188" width="120" height="10" fill="${L.trim}" opacity=".9"/>
    ${core}
    <rect x="92" y="118" width="16" height="26" rx="6" fill="${skin}"/>
    <path d="M92 134 q8 5 16 0 v6 h-16z" fill="#000" opacity=".08"/>
    <ellipse cx="78" cy="103" rx="3.5" ry="6" fill="${skin}"/><ellipse cx="122" cy="103" rx="3.5" ry="6" fill="${skin}"/>
    <ellipse cx="100" cy="101" rx="22" ry="26" fill="${skin}"/>
    ${bun}
    ${fringe}
    ${headwear(r, L, female)}
    <g fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round">${brows}
      <path d="M88 104 q5 3.5 10 0"/><path d="M102 104 q5 3.5 10 0"/></g>
    <path d="M96 116 q4 2.4 8 0" fill="none" stroke="#b0605a" stroke-width="1.6" stroke-linecap="round"/>
    ${female ? `<ellipse cx="88" cy="111" rx="4" ry="2.2" fill="#e88b84" opacity=".28"/><ellipse cx="112" cy="111" rx="4" ry="2.2" fill="#e88b84" opacity=".28"/>` : ""}
    ${mark}
  </g>
  ${frameRings}
</svg>`;
}

export const REALM_LOOKS = LOOKS.map((l) => l.name);
