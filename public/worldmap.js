import { flagColors, flagSvg } from "./banner.js";
// Vạn Giới Đồ — bản đồ thế giới kiểu bản đồ giấy cổ, sinh tất định từ seed (ai mở cũng thấy cùng một bản đồ).
// Phóng to/thu nhỏ bằng viewBox: cuộn chuột, chụm 2 ngón, kéo để di chuyển, bấm vùng để bay tới.

const W = 2000;
const H = 1300;

// ---------------------------------------------------------------- tiện ích hình học

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Đường cong khép kín mượt qua các điểm (Catmull-Rom → Bézier)
function smoothPath(pts, closed = true) {
  const n = pts.length;
  const p = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${p(0)[0].toFixed(1)},${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return closed ? d + "Z" : d;
}

// Đảo/lục địa có bờ biển gồ ghề: bán kính nhiễu theo góc
function blob(cx, cy, rx, ry, rand, n = 90, rough = 0.18) {
  const waves = Array.from({ length: 6 }, (_, k) => ({ a: (rough / (k + 1)) * (0.6 + rand()), f: k + 2, ph: rand() * Math.PI * 2 }));
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const r = 1 + waves.reduce((s, w) => s + w.a * Math.sin(w.f * t + w.ph), 0);
    return [cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r];
  });
}

function inside(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// Ô Voronoi của seed i (cắt hình chữ nhật bằng các nửa mặt phẳng — Sutherland–Hodgman)
function voronoiCell(seeds, i) {
  let poly = [[-100, -100], [W + 100, -100], [W + 100, H + 100], [-100, H + 100]];
  const [sx, sy] = seeds[i];
  seeds.forEach(([tx, ty], j) => {
    if (j === i) return;
    const a = tx - sx, b = ty - sy, c = (tx * tx + ty * ty - sx * sx - sy * sy) / 2;
    const keep = (p) => a * p[0] + b * p[1] <= c;
    const out = [];
    for (let k = 0; k < poly.length; k++) {
      const P = poly[k], Q = poly[(k + 1) % poly.length];
      const kp = keep(P), kq = keep(Q);
      if (kp) out.push(P);
      if (kp !== kq) {
        const t = (c - a * P[0] - b * P[1]) / (a * (Q[0] - P[0]) + b * (Q[1] - P[1]));
        out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]);
      }
    }
    poly = out;
  });
  return poly;
}

// Làm biên giới cong tự nhiên: chèn điểm giữa có lệch ngẫu nhiên
function wiggle(poly, rand, amt = 22, steps = 4) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i], B = poly[(i + 1) % poly.length];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const j = s === 0 ? 0 : (rand() - 0.5) * amt;
      const nx = -(B[1] - A[1]), ny = B[0] - A[0];
      const len = Math.hypot(nx, ny) || 1;
      out.push([A[0] + (B[0] - A[0]) * t + (nx / len) * j, A[1] + (B[1] - A[1]) * t + (ny / len) * j]);
    }
  }
  return out;
}

const bbox = (pts) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};
const centroid = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

// ---------------------------------------------------------------- dữ liệu địa lý

const MAIN = { cx: 1100, cy: 730, rx: 640, ry: 440 };
const SEEDS = {
  peaceful: [760, 640],
  abundant: [1100, 480],
  wild: [1470, 620],
  turmoil: [1110, 860],
  declining: [760, 950],
  blood: [1460, 970],
};
const TINT = {
  peaceful: "#dfe6b4", abundant: "#bcd59c", wild: "#d6cba9", turmoil: "#e6d3a2",
  declining: "#efdfab", blood: "#cfa08c", hidden: "#c6e8b4", shattered: "#c3bbd6",
};
const TOWNS = {
  peaceful: ["Thanh Bình Trấn", "Lạc Nhạn Hồ"],
  abundant: ["Linh Tuyền Thành", "Vạn Mộc Lâm"],
  wild: ["Thú Cốc", "Hắc Phong Lĩnh"],
  turmoil: ["Cổ Chiến Trường", "Thiết Huyết Quan"],
  declining: ["Hoàng Sa Trấn", "Khô Mộc Nguyên"],
  blood: ["Huyết Trì", "Liệt Diễm Sơn"],
  hidden: ["Vân Hải Đình", "Bích Lạc Đảo"],
  shattered: ["Toái Tinh Nhai", "Hư Không Môn"],
};

// Tất cả hình học được sinh một lần (tất định)
function buildGeo() {
  const r = rng(20261018);
  const coast = blob(MAIN.cx, MAIN.cy, MAIN.rx, MAIN.ry, r, 140, 0.1);
  const ids = Object.keys(SEEDS);
  const seeds = ids.map((id) => SEEDS[id]);
  const regions = {};
  ids.forEach((id, i) => {
    const cell = wiggle(voronoiCell(seeds, i), r, 26, 5);
    regions[id] = { id, cell, island: false };
  });
  // Ẩn Tiên: cụm đảo mây phía tây bắc
  const hiddenIsles = [
    blob(250, 230, 130, 80, r, 60, 0.22),
    blob(480, 130, 70, 44, r, 40, 0.25),
    blob(150, 430, 60, 40, r, 40, 0.25),
    blob(400, 330, 40, 26, r, 30, 0.25),
  ];
  regions.hidden = { id: "hidden", isles: hiddenIsles, island: true };
  // Tàn Thiên: mảnh đất vỡ phía đông bắc
  const shards = [
    [[1580, 150], [1700, 120], [1740, 230], [1640, 270], [1570, 220]],
    [[1760, 180], [1880, 200], [1900, 300], [1790, 320], [1750, 260]],
    [[1620, 300], [1730, 330], [1720, 430], [1610, 410]],
    [[1760, 360], [1850, 350], [1870, 440], [1780, 460]],
    [[1500, 280], [1570, 300], [1560, 370], [1490, 350]],
  ].map((p) => wiggle(p, r, 14, 3));
  regions.shattered = { id: "shattered", isles: shards, island: true };

  // Vùng hợp lệ để đặt vật thể trên đất liền của một vùng
  const onLand = (id, p) => {
    const g = regions[id];
    if (g.island) return g.isles.some((isle) => inside(p, isle));
    return inside(p, coast) && inside(p, g.cell);
  };
  // Lấy mẫu điểm ngẫu nhiên trong vùng, giữ khoảng cách tối thiểu
  const sample = (id, count, minGap, margin = 18) => {
    const g = regions[id];
    const box = g.island ? bbox(g.isles.flat()) : bbox(g.cell.filter((p) => p[0] > -50 && p[1] > -50 && p[0] < W + 50 && p[1] < H + 50));
    const out = [];
    for (let k = 0; k < count * 12 && out.length < count; k++) {
      const p = [box.x + r() * box.w, box.y + r() * box.h];
      if (!onLand(id, p)) continue;
      if (margin && ![[margin, 0], [-margin, 0], [0, margin], [0, -margin]].every(([dx, dy]) => onLand(id, [p[0] + dx, p[1] + dy]))) continue;
      if (out.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < minGap)) continue;
      out.push(p);
    }
    return out;
  };
  for (const id of Object.keys(regions)) {
    const g = regions[id];
    const pts = g.island ? g.isles.flat() : g.cell.filter((p) => inside(p, coast));
    g.center = g.island ? centroid(g.isles[0]) : centroid(sample(id, 40, 0, 40).concat([SEEDS[id]]));
    g.box = g.island ? bbox(g.isles.flat()) : bbox(pts.length > 3 ? pts : g.cell);
  }
  return { coast, regions, onLand, sample, rand: r };
}

// ---------------------------------------------------------------- vẽ

const tree = (x, y, s = 1, c = "#5f8a4f") => `<g class="t"><path d="M${x},${y + 7 * s}v-4" stroke="#6d5236" stroke-width="${1.6 * s}"/><circle cx="${x}" cy="${y}" r="${5.5 * s}" fill="${c}" stroke="#3e5c34" stroke-width=".8"/></g>`;
const peak = (x, y, s = 1, snow = true) =>
  `<g class="m"><path d="M${x - 18 * s},${y} L${x - 2 * s},${y - 26 * s} L${x + 16 * s},${y} Z" fill="#cbbf9d" stroke="#5a4a32" stroke-width="1.2"/><path d="M${x - 2 * s},${y - 26 * s} L${x + 16 * s},${y} L${x + 3 * s},${y}" fill="#a99b78"/>${
    snow ? `<path d="M${x - 8 * s},${y - 16 * s} L${x - 2 * s},${y - 26 * s} L${x + 5 * s},${y - 17 * s} L${x},${y - 19 * s}Z" fill="#fbf8ee"/>` : ""
  }</g>`;
const hut = (x, y) => `<g><rect x="${x - 5}" y="${y - 4}" width="10" height="7" fill="#f3ead6" stroke="#6d5236" stroke-width=".8"/><path d="M${x - 7},${y - 4}L${x},${y - 10}L${x + 7},${y - 4}Z" fill="#a8553e"/></g>`;
const dune = (x, y, s = 1) => `<path d="M${x - 14 * s},${y} q${14 * s},-${9 * s} ${28 * s},0" fill="none" stroke="#bfa26a" stroke-width="1.6"/>`;
const sword = (x, y) => `<g stroke="#7a4b35" stroke-width="2" stroke-linecap="round"><path d="M${x - 7},${y - 7}L${x + 7},${y + 7}"/><path d="M${x + 7},${y - 7}L${x - 7},${y + 7}"/></g>`;
const cloud = (x, y, s = 1) => `<g class="cl" opacity=".88"><ellipse cx="${x}" cy="${y}" rx="${40 * s}" ry="${14 * s}" fill="#fff"/><ellipse cx="${x - 24 * s}" cy="${y + 5 * s}" rx="${24 * s}" ry="${11 * s}" fill="#fbfdfc"/><ellipse cx="${x + 26 * s}" cy="${y + 6 * s}" rx="${22 * s}" ry="${10 * s}" fill="#f6faf9"/></g>`;

function terrain(geo) {
  const { sample, rand: r, regions } = geo;
  const out = [];
  const many = (id, n, gap, fn, margin = 10) => sample(id, n, gap, margin).forEach((p) => out.push(fn(p[0], p[1])));
  // Thanh Bình: ruộng, cây, làng
  sample("peaceful", 26, 46, 30).forEach(([x, y], i) => {
    if (i % 3 === 0) out.push(`<g class="field">${[0, 1, 2, 3].map((k) => `<path d="M${x - 22},${y - 8 + k * 6} l44,-6" stroke="#a9bf7a" stroke-width="3"/>`).join("")}</g>`);
    else if (i % 3 === 1) out.push(tree(x, y, 0.9, "#7ea25c"), tree(x + 9, y + 6, 0.8, "#6d9450"));
    else out.push(hut(x, y), hut(x + 13, y + 5));
  });
  // Linh Thịnh: rừng rậm, hồ
  many("abundant", 170, 15, (x, y) => tree(x, y, 0.8 + r() * 0.5, r() > 0.5 ? "#5e9150" : "#4c7d43"));
  sample("abundant", 3, 160, 60).forEach(([x, y]) => out.push(`<ellipse cx="${x}" cy="${y}" rx="${36 + r() * 20}" ry="${18 + r() * 10}" fill="#9fc6c6" stroke="#6d9a9b" stroke-width="1.5"/><ellipse cx="${x}" cy="${y}" rx="14" ry="6" fill="#d6f6f2" opacity=".7"/>`));
  // Hung Hoang: dãy núi
  many("wild", 75, 30, (x, y) => peak(x, y, 0.8 + r() * 0.7, r() > 0.4), 14);
  many("wild", 20, 40, (x, y) => tree(x, y, 0.8, "#6b7f4d"));
  // Loạn Thiên: đồi, chiến địa
  many("turmoil", 30, 52, (x, y) => (r() > 0.55 ? sword(x, y) : `<path d="M${x - 16},${y} q16,-14 32,0" fill="#dcc591" stroke="#8a7350" stroke-width="1.2"/>`));
  many("turmoil", 18, 50, (x, y) => tree(x, y, 0.8, "#8a9a5a"));
  // Mạt Pháp: sa mạc
  many("declining", 60, 34, (x, y) => dune(x, y, 0.8 + r() * 0.6));
  many("declining", 8, 90, (x, y) => `<path d="M${x},${y + 8}v-14m0,5l-6,-6m6,3l6,-6" stroke="#8a7146" stroke-width="2" fill="none" stroke-linecap="round"/>`);
  // Huyết Sát: núi lửa, dung nham
  const [vx, vy] = sample("blood", 1, 0, 70)[0] ?? regions.blood.center;
  out.push(
    `<g class="volcano"><path d="M${vx - 60},${vy + 20} L${vx - 18},${vy - 46} L${vx + 18},${vy - 46} L${vx + 60},${vy + 20} Z" fill="#6e3b33" stroke="#3e1f1a" stroke-width="1.5"/><ellipse cx="${vx}" cy="${vy - 46}" rx="18" ry="6" fill="#ff8a3d"/><path d="M${vx},${vy - 42} q-8,40 -60,90 q-30,30 -70,46" fill="none" stroke="#ff7a2e" stroke-width="4" opacity=".85"/><path d="M${vx + 4},${vy - 42} q16,44 70,80" fill="none" stroke="#ff6a2a" stroke-width="3" opacity=".8"/><circle cx="${vx + 6}" cy="${vy - 66}" r="10" fill="#6d6d6d55"/><circle cx="${vx + 16}" cy="${vy - 84}" r="7" fill="#7a7a7a44"/></g>`,
  );
  many("blood", 40, 36, (x, y) => (r() > 0.5 ? peak(x, y, 0.7, false).replaceAll("#cbbf9d", "#8a5a4d").replaceAll("#a99b78", "#6e4238") : `<circle cx="${x}" cy="${y}" r="3" fill="#5a2c25"/>`));
  // Ẩn Tiên: rừng trên đảo, mây
  many("hidden", 50, 16, (x, y) => tree(x, y, 0.8, "#5c9a62"), 6);
  // Tàn Thiên: vết nứt
  regions.shattered.isles.forEach((isle) => {
    const [cx, cy] = centroid(isle);
    out.push(`<path d="M${cx - 30},${cy - 10} l18,8 l-6,14 l24,-4" fill="none" stroke="#3b3250" stroke-width="2.2"/>`);
  });
  return out.join("");
}

function rivers(geo) {
  const r = rng(77);
  const paths = [
    [[700, 520], [760, 600], [720, 700], [640, 760], [520, 780], [400, 800]],
    [[1050, 390], [1000, 470], [1060, 560], [1020, 640], [940, 700], [860, 760], [700, 860], [600, 1180]],
    [[1380, 470], [1460, 560], [1560, 620], [1700, 640]],
  ];
  return paths
    .map((pts) => {
      const d = smoothPath(pts.map(([x, y]) => [x + (r() - 0.5) * 20, y + (r() - 0.5) * 20]), false);
      return `<path d="${d}" fill="none" stroke="#7fa9b3" stroke-width="6" stroke-linecap="round" opacity=".9"/><path d="${d}" fill="none" stroke="#bfe0e4" stroke-width="2" stroke-linecap="round" opacity=".8"/>`;
    })
    .join("");
}

// Cây khung nhỏ nhất (Prim) nối các địa danh trên đất liền bằng đường mòn
function roads(places) {
  const pts = places.filter((p) => !p.island);
  if (pts.length < 2) return "";
  const inTree = [0];
  const edges = [];
  while (inTree.length < pts.length) {
    let best = null;
    for (const i of inTree)
      for (let j = 0; j < pts.length; j++) {
        if (inTree.includes(j)) continue;
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (!best || d < best.d) best = { i, j, d };
      }
    inTree.push(best.j);
    edges.push(best);
  }
  return edges
    .map(({ i, j }) => {
      const a = pts[i], b = pts[j];
      const mx = (a.x + b.x) / 2 + (a.y - b.y) * 0.12, my = (a.y + b.y) / 2 + (b.x - a.x) * 0.12;
      return `<path d="M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}" fill="none" stroke="#8a6a43" stroke-width="2.4" stroke-dasharray="7 6" stroke-linecap="round"/>`;
    })
    .join("");
}

// Cờ nhỏ cắm cạnh mái chùa, màu theo cờ môn phái
const mapFlag = (id) => {
  const [bg, edge] = flagColors(id);
  return `<g class="map-flag" transform="translate(12,-30)"><rect x="-1" y="0" width="1.6" height="30" fill="#5a3a22"/><path d="M0.6 1 h12 v9 l-3 3 l-3 -3 l-3 3 l-3 -3 z" fill="${bg}" stroke="${edge}" stroke-width=".8"/></g>`;
};

const pagoda = (s) =>
  `<path d="M-14,4 L14,4 L10,-2 L-10,-2Z M-11,-2 L11,-2 L7,-9 L-7,-9Z M-8,-9 L8,-9 L0,-18Z" fill="#a8553e" stroke="#5a2a1d" stroke-width="1"/><rect x="-7" y="4" width="14" height="8" fill="#f1e5c8" stroke="#5a2a1d" stroke-width="1"/>`;

// ---------------------------------------------------------------- tạo bản đồ

export function createWorldMap(host, { data, codex, esc, fmt, realmName, onSelect }) {
  const geo = buildGeo();
  const { coast, regions } = geo;
  const worldName = (id) => codex.worlds.find((w) => w.id === id)?.name ?? id;
  const stat = (id) => data.worlds.find((w) => w.id === id);

  // Địa danh: các môn phái + 2 thành trấn mỗi vùng
  const places = [];
  for (const id of Object.keys(regions)) {
    const g = regions[id];
    const sects = codex.sects.filter((s) => s.world === id);
    const need = sects.length + 2;
    let spots = g.island ? [...g.isles.slice(0, 4).map((isle) => centroid(isle)), ...geo.sample(id, 6, 40, 8)] : geo.sample(id, need, 120, 46);
    // Vùng hẹp không đủ chỗ: nới khoảng cách tối thiểu để môn phái nào cũng có vị trí
    if (!g.island && spots.length < need) spots = geo.sample(id, need, 80, 30);
    if (!g.island && spots.length < need) spots = geo.sample(id, need, 50, 20);
    sects.forEach((s, i) => spots[i] && places.push({ kind: "sect", id: s.id, region: id, name: s.name, glyph: s.glyph, x: spots[i][0], y: spots[i][1], island: g.island }));
    (TOWNS[id] ?? []).forEach((name, k) => {
      const p = spots[sects.length + k];
      if (p) places.push({ kind: "town", region: id, name, x: p[0], y: p[1], island: g.island });
    });
  }

  const landShapes = (g) => (g.island ? g.isles.map((isle) => `<path d="${smoothPath(isle)}"/>`).join("") : "");
  const sectStat = (sid) => {
    for (const w of data.worlds) {
      const s = w.sects.find((x) => x.id === sid);
      if (s) return s;
    }
    return null;
  };
  const maxPower = Math.max(1, ...data.worlds.flatMap((w) => w.sects.map((s) => Number(s.power))));

  const svg = `<svg class="wm-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Vạn Giới Đồ">
    <defs>
      <pattern id="wmWaves" width="80" height="40" patternUnits="userSpaceOnUse"><path d="M4,20 q10,-7 20,0 t20,0" fill="none" stroke="#86aab0" stroke-width="1.2" opacity=".55"/><path d="M44,36 q8,-5 16,0" fill="none" stroke="#86aab0" stroke-width="1" opacity=".4"/></pattern>
      <pattern id="wmPaper" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r=".7" fill="#8a7448" opacity=".18"/><circle cx="9" cy="10" r=".6" fill="#8a7448" opacity=".14"/></pattern>
      <radialGradient id="wmVoid"><stop offset="0" stop-color="#1a1030"/><stop offset=".55" stop-color="#5b3fa0" stop-opacity=".6"/><stop offset="1" stop-color="#5b3fa0" stop-opacity="0"/></radialGradient>
      <clipPath id="wmLand"><path d="${smoothPath(coast)}"/></clipPath>
    </defs>
    <rect width="${W}" height="${H}" fill="#b5cfcf"/>
    <rect width="${W}" height="${H}" fill="url(#wmWaves)"/>
    <!-- Hư không giữa các mảnh Tàn Thiên -->
    <circle cx="1720" cy="300" r="190" fill="url(#wmVoid)" opacity=".8"/>
    <!-- Bờ biển: viền nước nông + cát -->
    <g fill="none" stroke-linejoin="round">
      <path d="${smoothPath(coast)}" stroke="#d3e6e3" stroke-width="44" opacity=".8"/>
      ${["hidden", "shattered"].map((id) => regions[id].isles.map((isle) => `<path d="${smoothPath(isle)}" stroke="#d3e6e3" stroke-width="30" opacity=".75"/>`).join("")).join("")}
      <path d="${smoothPath(coast)}" stroke="#e8d7a6" stroke-width="12"/>
    </g>
    <!-- Lục địa: nền giấy rồi tô màu từng vùng -->
    <path d="${smoothPath(coast)}" fill="#ecdfb8"/>
    <g clip-path="url(#wmLand)">
      ${Object.values(regions).filter((g) => !g.island).map((g) => `<path class="wm-region" data-id="${g.id}" d="${smoothPath(g.cell)}" fill="${TINT[g.id]}"/>`).join("")}
    </g>
    ${["hidden", "shattered"].map((id) => `<g class="wm-region" data-id="${id}" fill="${TINT[id]}" stroke="#6b5a3a" stroke-width="2">${landShapes(regions[id])}</g>`).join("")}
    <path d="${smoothPath(coast)}" fill="url(#wmPaper)" pointer-events="none"/>
    <path d="${smoothPath(coast)}" fill="none" stroke="#6b5a3a" stroke-width="2.5" pointer-events="none"/>
    <!-- Biên giới vùng -->
    <g clip-path="url(#wmLand)" fill="none" stroke="#8a4a32" stroke-width="2.2" stroke-dasharray="10 6 2 6" opacity=".7" pointer-events="none">
      ${Object.values(regions).filter((g) => !g.island).map((g) => `<path d="${smoothPath(g.cell)}"/>`).join("")}
    </g>
    <g class="wm-terrain" pointer-events="none">${rivers(geo)}${terrain(geo)}</g>
    <g pointer-events="none">${roads(places)}
      <path d="M560,640 Q440,520 400,360" fill="none" stroke="#4f7d8a" stroke-width="2" stroke-dasharray="3 7"/>
      <path d="M1560,520 Q1600,440 1640,400" fill="none" stroke="#4f7d8a" stroke-width="2" stroke-dasharray="3 7"/>
    </g>
    <g pointer-events="none">${cloud(200, 170, 1.1)}${cloud(560, 230, 0.8)}${cloud(90, 330, 0.8)}${cloud(330, 420, 0.6)}</g>
    <!-- Vùng chọn: viền sáng -->
    <path class="wm-sel" d="" fill="none" stroke="#f3c34f" stroke-width="5" stroke-linejoin="round" pointer-events="none"/>
    <!-- Địa danh -->
    <g class="wm-places">${places
      .map((p) => {
        if (p.kind === "town")
          return `<g class="wm-place town" transform="translate(${p.x.toFixed(0)},${p.y.toFixed(0)})"><g class="k"><circle r="5.5" fill="#fff8e6" stroke="#5a3d22" stroke-width="2"/><circle r="2" fill="#5a3d22"/><text y="-11" class="lbl town-lbl">${esc(p.name)}</text></g></g>`;
        const st = sectStat(p.id);
        const scale = 0.85 + 0.6 * Math.sqrt(Number(st?.power ?? 0) / maxPower);
        return `<g class="wm-place sect" data-sect="${p.id}" data-region="${p.region}" transform="translate(${p.x.toFixed(0)},${p.y.toFixed(0)})"><g class="k" style="--sz:${scale.toFixed(2)}"><circle r="22" fill="transparent"/>${pagoda()}${mapFlag(p.id)}<text y="27" class="lbl sect-lbl">${esc(p.name)}</text></g></g>`;
      })
      .join("")}</g>
    <!-- Tên vùng + số tu sĩ -->
    <g class="wm-names" pointer-events="none">${Object.values(regions)
      .map((g) => {
        const s = stat(g.id);
        // Tên vùng đặt cố định cho cân đối (tâm tính toán hay lệch về phía biên)
        const [x, y] = g.island ? (g.id === "hidden" ? [300, 110] : [1720, 90]) : [SEEDS[g.id][0], SEEDS[g.id][1] - 24];
        return `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)})"><g class="k"><text class="lbl region-lbl">${esc(worldName(g.id))}</text><text y="30" class="lbl region-sub">${fmt(s?.players ?? 0)} tu sĩ${s?.active ? ` · ${fmt(s.active)} đang tu` : ""}</text></g></g>`;
      })
      .join("")}</g>
    <!-- La bàn + tiêu đề -->
    <g transform="translate(1860,1150)" pointer-events="none" class="wm-compass"><circle r="56" fill="#f4ead0" stroke="#6b5a3a" stroke-width="2"/><path d="M0,-48 L10,0 L0,48 L-10,0Z" fill="#8a4a32"/><path d="M-48,0 L0,-10 L48,0 L0,10Z" fill="#6b5a3a" opacity=".7"/><text y="-60" class="lbl compass-lbl">Bắc</text></g>
    <g transform="translate(150,1190)" pointer-events="none"><rect x="-120" y="-44" width="300" height="74" rx="8" fill="#f4ead0" stroke="#6b5a3a" stroke-width="2"/><text x="30" y="0" class="lbl title-lbl">Vạn Giới Đồ</text><text x="30" y="22" class="lbl title-sub">${fmt(data.totals.players ?? 0)} tu sĩ · ${fmt(data.totals.lives ?? 0)} kiếp</text></g>
  </svg>`;

  host.innerHTML = `<div class="wm">
    ${svg}
    <div class="wm-ctrl">
      <button data-z="in" aria-label="Phóng to">+</button><button data-z="out" aria-label="Thu nhỏ">−</button><button data-z="home" aria-label="Toàn cảnh">⌂</button><button data-z="full" aria-label="Toàn màn hình">⛶</button>
    </div>
    <div class="wm-hint">Cuộn hoặc chụm để phóng to · kéo để di chuyển · bấm vào vùng</div>
    <div class="wm-card" hidden></div>
  </div>`;

  const root = host.querySelector(".wm");
  const el = root.querySelector("svg");
  const card = root.querySelector(".wm-card");
  const view = { x: 0, y: 0, w: W, h: H };
  const MIN_W = 260;

  const fit = () => {
    // Giữ tỉ lệ khung: mở rộng viewBox theo khung chứa để không bị méo khi kéo
    const r = el.getBoundingClientRect();
    return r.width / r.height || W / H;
  };
  const apply = () => {
    el.setAttribute("viewBox", `${view.x} ${view.y} ${view.w} ${view.h}`);
    const zoom = W / view.w;
    el.dataset.lod = zoom < 1.5 ? "1" : zoom < 2.6 ? "2" : "3";
    // Chữ lớn chậm hơn bản đồ khi phóng to
    // Khung hẹp (điện thoại) thì chữ to hơn để đọc được
    const boost = el.clientWidth < 600 ? 1.7 : 1;
    el.style.setProperty("--k", (boost / Math.pow(zoom, 0.72)).toFixed(3));
  };
  const clamp = () => {
    view.w = Math.max(MIN_W, Math.min(W * 1.15, view.w));
    view.h = view.w / fit();
    view.x = Math.max(-W * 0.15, Math.min(W * 1.15 - view.w, view.x));
    view.y = Math.max(-H * 0.2, Math.min(H * 1.2 - view.h, view.y));
  };
  const home = () => {
    const a = fit();
    if (a > W / H) Object.assign(view, { h: H, w: H * a, y: 0, x: (W - H * a) / 2 });
    else {
      // Khung hẹp (điện thoại): phóng sẵn vào lục địa thay vì để thừa nhiều biển
      const w = a < 1.25 ? Math.max(MIN_W, Math.min(W, H * a * 1.05)) : W;
      Object.assign(view, { w, h: w / a, x: MAIN.cx - w / 2 - 40, y: MAIN.cy - w / a / 2 - 60 });
    }
    clamp();
  };
  let anim = 0;
  const animateTo = (target, ms = 520) => {
    cancelAnimationFrame(anim);
    const from = { ...view };
    const t0 = performance.now();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = (t) => {
      const k = reduce ? 1 : Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      for (const key of ["x", "y", "w"]) view[key] = from[key] + (target[key] - from[key]) * e;
      view.h = view.w / fit();
      apply();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };
  const toSvg = (cx, cy) => {
    const r = el.getBoundingClientRect();
    return [view.x + ((cx - r.left) / r.width) * view.w, view.y + ((cy - r.top) / r.height) * view.h];
  };
  const zoomAt = (factor, cx, cy) => {
    const [sx, sy] = cx === undefined ? [view.x + view.w / 2, view.y + view.h / 2] : toSvg(cx, cy);
    const nw = Math.max(MIN_W, Math.min(W * 1.15, view.w * factor));
    const k = nw / view.w;
    view.x = sx - (sx - view.x) * k;
    view.y = sy - (sy - view.y) * k;
    view.w = nw;
    clamp();
    apply();
  };

  home();
  apply();
  new ResizeObserver(() => {
    view.h = view.w / fit();
    apply();
  }).observe(el);

  // Cuộn chuột để phóng to (giữ điểm dưới con trỏ đứng yên)
  el.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomAt(Math.exp(e.deltaY * 0.0015), e.clientX, e.clientY);
  }, { passive: false });

  // Kéo / chụm hai ngón
  const pointers = new Map();
  let dragged = false, pinch0 = null;
  el.addEventListener("pointerdown", (e) => {
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged = false;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), w: view.w, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    }
  });
  el.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    if (pointers.size === 2 && pinch0) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const targetW = pinch0.w * (pinch0.d / d);
      zoomAt(targetW / view.w, (a.x + b.x) / 2, (a.y + b.y) / 2);
      dragged = true;
      return;
    }
    const r = el.getBoundingClientRect();
    const dx = ((cur.x - prev.x) / r.width) * view.w, dy = ((cur.y - prev.y) / r.height) * view.h;
    if (Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y) > 1) dragged = true;
    view.x -= dx;
    view.y -= dy;
    clamp();
    apply();
    root.classList.add("dragging");
  });
  const up = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch0 = null;
    root.classList.remove("dragging");
  };
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);

  // Bấm vào vùng / môn phái
  el.addEventListener("click", (e) => {
    if (dragged) return;
    const sect = e.target.closest(".wm-place.sect");
    if (sect) return selectSect(sect.dataset.sect, sect.dataset.region);
    const reg = e.target.closest(".wm-region");
    if (reg) selectRegion(reg.dataset.id, true);
  });

  root.querySelectorAll(".wm-ctrl button").forEach(
    (b) =>
      (b.onclick = () => {
        const z = b.dataset.z;
        if (z === "in") zoomAt(0.6);
        if (z === "out") zoomAt(1.6);
        if (z === "home") {
          const t = { ...view };
          home();
          const target = { ...view };
          Object.assign(view, t);
          animateTo(target);
          card.hidden = true;
          el.querySelector(".wm-sel").setAttribute("d", "");
        }
        if (z === "full") {
          if (document.fullscreenElement) document.exitFullscreen();
          else root.requestFullscreen?.().catch(() => root.classList.toggle("pseudo-full"));
        }
      }),
  );

  // Bay tới một khung; trên màn hình hẹp, đẩy điểm đến lên nửa trên để thẻ thông tin không che
  function flyTo(box, pad = 0.25) {
    const a = fit();
    let w = box.w * (1 + pad * 2), h = box.h * (1 + pad * 2);
    if (w / h < a) w = h * a;
    w = Math.max(MIN_W * 1.4, w);
    const narrow = el.getBoundingClientRect().width < 600;
    const shift = narrow ? (w / a) * 0.22 : 0;
    animateTo({ x: box.x + box.w / 2 - w / 2, y: box.y + box.h / 2 - w / a / 2 + shift, w });
  }

  function selectRegion(id, fly) {
    const g = regions[id];
    const s = stat(id);
    const def = codex.worlds.find((w) => w.id === id);
    el.querySelector(".wm-sel").setAttribute("d", g.island ? g.isles.map((isle) => smoothPath(isle)).join(" ") : smoothPath(g.cell.map(([x, y]) => [x, y])));
    el.querySelector(".wm-sel").setAttribute("clip-path", g.island ? "" : "url(#wmLand)");
    if (fly) flyTo(g.box, 0.12);
    const top = s?.sects?.find((x) => Number(x.power) > 0);
    card.hidden = false;
    card.innerHTML = `<button class="wm-x" aria-label="Đóng">×</button>
      <div class="muted small">Giới diện</div><h3>${esc(def.name)}</h3>
      <div class="muted small">${esc(def.desc)}</div>
      ${def.perk ? `<div class="small wm-perk">✦ ${esc(def.perk)}</div>` : ""}
      <div class="wm-kv"><span>Tu sĩ</span><b>${fmt(s?.players ?? 0)}</b><span>Đang tu hành</span><b>${fmt(s?.active ?? 0)}</b><span>Thọ trung bình</span><b>${s?.avgAge ? fmt(s.avgAge) : "—"}</b><span>Cảnh giới cao nhất</span><b>${esc(realmName(s?.topRealm))}</b></div>
      ${top ? `<div class="small">Mạnh nhất: <b>${esc(codex.sects.find((x) => x.id === top.id)?.name ?? "")}</b></div>` : ""}
      ${s?.top?.[0] ? `<div class="small">Cao thủ: <b>${esc(s.top[0].name)}</b> — ${esc(realmName(s.top[0].realm))}</div>` : ""}
      <button class="btn small wm-more">Xem môn phái &amp; cao thủ ↓</button>`;
    card.querySelector(".wm-x").onclick = () => (card.hidden = true);
    card.querySelector(".wm-more").onclick = () => onSelect(id, true);
    onSelect(id, false);
  }

  function selectSect(sid, region) {
    const p = places.find((x) => x.kind === "sect" && x.id === sid);
    const s = sectStat(sid);
    const def = codex.sects.find((x) => x.id === sid);
    selectRegion(region, false);
    flyTo({ x: p.x - 210, y: p.y - 150, w: 420, h: 300 }, 0.05);
    card.innerHTML = `<button class="wm-x" aria-label="Đóng">×</button>
      <div class="wm-sect-head"><span class="sflag">${flagSvg(sid, def.glyph, { size: 58 })}</span><div><div class="muted small">Môn phái · ${esc(worldName(region))}</div><h3>${esc(def.name)}</h3></div></div>
      <div class="muted small">${esc(def.desc)}</div>
      <div class="wm-kv"><span>Thế lực</span><b>${fmt(s?.power ?? 0)}</b><span>Đệ tử</span><b>${fmt(s?.members ?? 0)}</b><span>Trưởng lão</span><b>${fmt(s?.elders ?? 0)}</b><span>Đỉnh cao</span><b>${esc(realmName(s?.topRealm))}</b></div>
      ${s?.chief ? `<div class="small">掌 Chưởng môn: <b>${esc(s.chief.name)}</b> — ${esc(realmName(s.chief.realm))}</div>${s.chief.motto ? `<div class="small muted">“${esc(s.chief.motto)}”</div>` : ""}` : `<div class="small muted">Ghế chưởng môn đang trống.</div>`}
      <div class="small">${s?.leader ? `Mạnh nhất: <b>${esc(s.leader.name)}</b> — ${esc(realmName(s.leader.realm))}, ${fmt(s.leader.age)} tuổi` : "Chưa có đệ tử nào."}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><a class="btn small" href="#/sects/${sid}">Chính sự môn phái</a><button class="btn small ghost wm-more">Xem cả giới ↓</button></div>`;
    card.querySelector(".wm-x").onclick = () => (card.hidden = true);
    card.querySelector(".wm-more").onclick = () => onSelect(region, true);
  }

  return { selectRegion };
}
