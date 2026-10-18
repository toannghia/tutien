// Tu Tiên Lộ — client. Không cần build: ES module thuần.
// Mọi logic game nằm trên máy chủ; client chỉ hiển thị và gửi lựa chọn.

import { createWorldMap } from "./worldmap.js";
import { avatarSvg } from "./avatar.js";
import { flagSvg } from "./banner.js";
import { EMBLEM_GROUPS, emblemGroup, emblemSvg } from "./emblem.js";
import { bodyArt, originArt, pathArt, rootArt, worldArt } from "./icons.js";
import { PATH_DETAIL, PHYSIQUE_LORE, REALM_LORE, ROOT_LORE, SECT_GUIDE, WORLD_LORE } from "./codex-text.js";

const $view = document.getElementById("view");
const HUES = [30, 140, 155, 45, 210, 270, 230, 190, 0, 50, 40, 280, 300, 15];
const SPEEDS = { 1: 1100, 2: 550, 4: 220 };
const STAT_LABEL = { cultivation: "tu vi", health: "thể trạng", resources: "linh tài", luck: "khí vận", comprehension: "ngộ tính", lifespan: "thọ nguyên", virtue: "thiện nghiệp", sin: "ác nghiệp" };
// Tăng ác nghiệp là điều xấu dù số dương
const deltaCls = (k, v) => (k === "sin" ? (v > 0 ? "down sin" : "up") : k === "virtue" ? (v > 0 ? "up virtue" : "down") : v > 0 ? "up" : "down");
const ERRORS = {
  USER_ALREADY_EXISTS: "Email này đã có tài khoản — hãy chọn Đăng nhập.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Email này đã có tài khoản — hãy chọn Đăng nhập.",
  INVALID_EMAIL_OR_PASSWORD: "Sai email hoặc mật khẩu.",
  PASSWORD_TOO_SHORT: "Mật khẩu cần ít nhất 8 ký tự.",
  INVALID_EMAIL: "Email không hợp lệ.",
};

const app = {
  codex: null,
  me: null,
  run: null, // kiếp đang chơi
  shown: 0, // số mốc đã hiện
  timer: null,
  busy: false,
  speed: Number(store("tt-speed") || 1),
  auto: false, // chỉ bật trong phiên hiện tại, không lưu — tránh người chơi mất hộp lựa chọn mà không biết vì sao
  paused: false,
  justUnlocked: [],
};

// ---------------------------------------------------------------- tiện ích

function store(k, v) {
  try {
    if (v === undefined) return localStorage.getItem(k);
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {}
  return null;
}
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (n) => Number(n).toLocaleString("vi-VN");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const byId = (list, id) => list.find((x) => x.id === id);
const realmIndexOf = (label) => {
  const name = String(label).split(" · ")[0];
  return Math.max(0, app.codex.realms.findIndex((r) => r.name === name));
};

function toast(msg, ms = 2600) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}

async function api(path, { method = "GET", body, retry = 4 } = {}) {
  for (let i = 0; ; i++) {
    let res;
    try {
      res = await fetch(path, {
        method,
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      // Mất mạng: thử lại cùng yêu cầu (máy chủ xử lý idempotent theo step)
      if (i >= retry) throw new Error("Không kết nối được máy chủ.");
      if (i === 0) toast("Mất kết nối, đang thử lại…");
      await sleep(1000 * 2 ** i);
      continue;
    }
    const data = res.headers.get("content-type")?.includes("json") ? await res.json() : null;
    if (res.status === 401 && path.startsWith("/api/game") && i === 0) {
      await api("/api/auth/sign-in/anonymous", { method: "POST", body: {} });
      continue;
    }
    if (!res.ok) throw new Error(ERRORS[data?.code] || data?.message || data?.error || res.statusText);
    return data;
  }
}

// ---------------------------------------------------------------- khởi động

async function boot() {
  const measureTabbar = () => document.documentElement.style.setProperty("--tabbar-h", `${document.querySelector(".tabbar")?.offsetHeight ?? 0}px`);
  measureTabbar();
  addEventListener("resize", measureTabbar);
  store("tt-auto", null); // dọn khoá cũ từ bản trước (từng lưu chế độ tự quyết)
  document.getElementById("themeBtn").onclick = toggleTheme;
  document.getElementById("accountChip").onclick = openAccount;
  const [codex, session] = await Promise.all([api("/api/codex"), api("/api/auth/get-session")]);
  app.codex = codex;
  // Lần đầu mở game: tạo ngay tài khoản khách trên máy chủ
  if (!session) await api("/api/auth/sign-in/anonymous", { method: "POST", body: {} });
  await refreshMe();
  window.addEventListener("hashchange", route);
  route();
}

async function refreshMe() {
  app.me = await api("/api/game/me");
  // Liên kết trang quản trị chỉ hiện với admin
  document.querySelector('nav.links a[data-route="admin"]')?.remove();
  if (app.me.isAdmin) document.querySelector("nav.links")?.insertAdjacentHTML("beforeend", `<a href="#/admin" data-route="admin">Quản trị</a>`);
  const chip = document.getElementById("accountChip");
  chip.classList.toggle("guest", app.me.isGuest);
  chip.innerHTML = `<span class="avatar">${esc((app.me.isGuest ? "客" : app.me.name)[0])}</span><span class="name">${
    app.me.isGuest ? "Khách · Lưu tiến trình" : esc(app.me.name)
  }</span>`;
}

function toggleTheme() {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  store("tt-theme", root.dataset.theme);
}

function route() {
  stopPlayback();
  closeModal();
  const [name, arg, arg2] = location.hash.replace(/^#\/?/, "").split("/");
  document.querySelectorAll("a[data-route]").forEach((a) => a.classList.toggle("active", a.dataset.route === name));
  window.scrollTo(0, 0);
  closeDuel();
  const pages = { "": renderHome, play: renderPlay, world: () => renderWorld(),
    admin: () => renderAdmin(),
    sects: arg ? () => renderSect(arg) : () => renderSects(),
    duel: arg === "join" ? () => Promise.resolve(joinRoom(arg2)) : renderDuel, history: arg ? () => renderHistoryDetail(arg) : renderHistory, rank: renderRank, codex: renderCodex };
  (pages[name] ?? renderHome)().catch((e) => ($view.innerHTML = `<div class="empty">${esc(e.message)}</div>`));
}

// ---------------------------------------------------------------- Trang chủ

async function renderHome() {
  const current = await api("/api/game/runs/current");
  const s = app.me.stats;
  $view.innerHTML = `
    <section class="hero">
      ${mountainsSvg()}
      <div class="eyebrow">— Một lần luân hồi, một đời tiên lộ —</div>
      <h1>Tu Tiên Lộ</h1>
      <p>Giữa vạn giới mênh mang, một sinh mệnh thức giấc. Phàm nhân hay tiên nhân — số mệnh nào đang đợi ngươi?</p>
      <a class="btn big" href="#/play">${current ? `Tiếp tục kiếp ${pad(current.number)}` : "Tu tiên"}</a>
      <div class="home-links"><a href="#/sects">門 Môn phái</a><a href="#/history">史 Sổ Sinh Tử</a></div>
      ${s.total_runs ? `<div class="home-stats"><span>${s.total_runs} kiếp đã qua</span><span>Cao nhất: ${esc(app.codex.realms[s.best_realm].name)}</span><span>Thọ lâu nhất: ${fmt(s.longest_age)} tuổi</span><span>${app.me.achievements.length}/${app.codex.achievements.length} thành tựu</span></div>` : ""}
    </section>
    <section class="pillars">
      <div><div class="num">壹</div><h3>Gieo một số mệnh</h3><p class="muted small">Luân hồi định giới diện, xuất thân, linh căn và thể chất. Không có hai đời giống nhau.</p></div>
      <div><div class="num">貳</div><h3>Đi qua tiên lộ</h3><p class="muted small">Cơ duyên và kiếp nạn đan xen. Đến ngã rẽ tự chọn; chạm bình cảnh, tự quyết có đột phá hay không.</p></div>
      <div><div class="num">叁</div><h3>Lưu danh vạn giới</h3><p class="muted small">Mỗi kiếp được ghi lại. Mở khoá thành tựu, leo bảng xếp hạng, đồng bộ trên mọi thiết bị.</p></div>
    </section>`;
}

const pad = (n) => String(n).padStart(3, "0");
// Chân dung nhân vật theo cảnh giới hiện tại
const portrait = (run, realm, size = 96, opts = {}) => avatarSvg(realm, run.profile.gender, { seed: run.seed ?? 0, size, title: `${run.profile.name} — ${app.codex.realms[realm]?.name ?? ""}`, ...opts });
// Người chơi khác (luận đạo): không biết giới tính → suy từ tên cho ổn định
const nameSeed = (name = "") => [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

function mountainsSvg() {
  return `<svg class="mountains" viewBox="0 0 1400 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path d="M0 400 L180 170 L320 300 L520 90 L700 280 L880 140 L1060 300 L1220 160 L1400 320 L1400 400Z" fill="var(--line)"/>
    <path d="M0 400 L120 290 L300 360 L460 240 L640 380 L820 260 L1000 370 L1180 280 L1400 380 L1400 400Z" fill="var(--bg-2)"/>
    <circle cx="1080" cy="90" r="46" fill="var(--gold)" opacity=".25"/></svg>`;
}

// ---------------------------------------------------------------- Chơi

async function renderPlay() {
  app.run = await api("/api/game/runs/current");
  if (!app.run) return renderNewLife();
  app.shown = Math.min(Number(store(`tt-shown-${app.run.id}`) ?? app.run.facts.length), app.run.facts.length);
  drawPlay();
  playback();
}

async function renderNewLife() {
  $view.innerHTML = `<div class="reveal"><div class="seal-big">命</div><div class="muted small">THIÊN MỆNH QUYỂN</div><h2>Một kiếp mới</h2>
    <p class="muted">Vạn duyên luân chuyển, một kiếp sắp thành.</p><button class="btn big" id="roll">Gieo số mệnh</button></div>`;
  document.getElementById("roll").onclick = startLife;
}

async function startLife() {
  if (app.busy) return;
  app.busy = true;
  try {
    const run = await api("/api/game/runs", { method: "POST", body: {} });
    app.run = run;
    app.shown = 0;
    app.auto = false;
    app.justUnlocked = run.unlocked ?? [];
    store(`tt-shown-${run.id}`, "0");
    await reveal(run);
  } finally {
    app.busy = false;
  }
}

// Nhân quả tiền kiếp hiện lúc đầu thai: [chữ, nhãn, giá trị, lớp]
function karmaRows(k) {
  if (!k) return [];
  const net = k.v - k.s;
  const blessing = net >= 8 ? Math.min(10, Math.round(net / 3)) : 0;
  const burden = net <= -8 ? Math.min(10, Math.round(-net / 3)) : 0;
  const realm = (i) => (i >= app.codex.realms.length ? "Chứng đạo" : app.codex.realms[i]?.name ?? "");
  const rows = [];
  if (k.prev) rows.push(["前", "Tiền kiếp", `${k.prev.name} · ${realm(k.prev.realm)}`, ""]);
  if (blessing) rows.push(["福", "Phúc báo", `Khí vận +${blessing}`, "rare"]);
  if (burden) rows.push(["業", "Nghiệp chướng", `Khí vận −${burden}`, "bad"]);
  if (k.insight >= 5) rows.push(["慧", "Túc tuệ", `${k.insight} · ngộ tính +${Math.round(k.insight / 10)}`, k.insight >= 30 ? "rare" : ""]);
  if (k.obsession) rows.push(["執", "Chấp niệm", `Vượt qua ${realm(k.obsession.realm)}`, ""]);
  if (k.bond) rows.push(["緣", "Tiền duyên", k.bond.name, "rare"]);
  if (k.feud) rows.push(["冤", "Oan gia", k.feud.name, "bad"]);
  if (k.legacy) rows.push(["府", "Động phủ", `Di sản của ${k.legacy.name}`, "rare"]);
  return rows;
}

async function reveal(run) {
  const p = run.profile;
  const c = app.codex;
  const root = c.roots.find((r) => r.name === p.root);
  const body = byId(c.physiques, p.physique);
  const rows = [
    ["界", "Giới diện", byId(c.worlds, p.world).name, ""],
    ["生", "Xuất thân", byId(c.origins, p.origin).name, ""],
    ["性", "Giới tính", p.gender === "male" ? "Nam" : "Nữ", ""],
    ["根", "Linh căn", p.root, root.score >= 68 ? "rare" : root.score === 0 ? "bad" : ""],
    ["體", "Thể chất", body.name, body.id === "common" ? "" : body.id === "frail" ? "bad" : "rare"],
    ["才", "Tư chất", `${p.aptitude} / 100`, p.aptitude >= 80 ? "rare" : ""],
    ["悟", "Ngộ tính", `${p.comprehension} / 100`, p.comprehension >= 80 ? "rare" : ""],
    ["運", "Khí vận", `${p.luck} / 100`, p.luck >= 80 ? "rare" : ""],
    ...karmaRows(p.karma),
  ];
  $view.innerHTML = `<div class="reveal">
    <div class="seal-big">命</div><div class="muted small">THIÊN MỆNH QUYỂN · KIẾP ${pad(run.number)}</div>
    <h2>${esc(p.name)}</h2><p class="muted">Vạn duyên luân chuyển, một kiếp sắp thành.</p>
    <div class="reveal-rows">${rows
      .map(([g, k, v, cls]) => `<div class="reveal-row"><span class="glyph">${g}</span><span class="k">${k}</span><span class="v ${cls}">${esc(v)}</span></div>`)
      .join("")}</div>
    <p class="muted small" id="rootDesc"></p>
    <button class="btn big hidden" id="enter">Bước vào tiên lộ</button></div>`;
  const els = [...document.querySelectorAll(".reveal-row")];
  for (const el of els) {
    await sleep(380);
    el.classList.add("on");
  }
  document.getElementById("rootDesc").textContent = `${byId(c.origins, p.origin)?.desc ?? ""} ${root.desc}`.trim();
  const btn = document.getElementById("enter");
  btn.classList.remove("hidden");
  btn.onclick = () => {
    drawPlay();
    playback();
  };
}

function drawPlay() {
  const run = app.run;
  $view.innerHTML = `<div class="play">
    <aside class="sheet" id="sheet"></aside>
    <section>
      <div class="realm-strip" id="strip"></div>
      <div class="controls">
        <div class="seg" id="speed">${[1, 2, 4].map((x) => `<button data-s="${x}" class="${x === app.speed ? "on" : ""}">x${x}</button>`).join("")}</div>
        <button class="btn ghost small" id="pause" style="padding:5px 10px">${app.paused ? "▶ Tiếp" : "❚❚ Dừng"}</button>
        <button class="btn ghost small" id="skip" style="padding:5px 10px">» Hiện hết</button>
        <label><input type="checkbox" id="auto" ${app.auto ? "checked" : ""}/> Để số mệnh tự quyết</label>
        <span class="spacer"></span>
        <button class="btn ghost small" id="newLife" style="padding:5px 10px">⟳ Kiếp mới</button>
      </div>
      <div class="auto-banner ${app.auto ? "" : "hidden"}" id="autoBanner">Số mệnh đang tự quyết — các ngã rẽ được chọn ngẫu nhiên. <button class="btn small" id="autoOff" style="padding:4px 12px">Tự mình lựa chọn</button></div>
      <div id="ending"></div>
      <div id="decision"></div>
      <div class="timeline" id="timeline"></div>
    </section></div>`;
  document.querySelectorAll("#speed button").forEach((b) => (b.onclick = () => setSpeed(Number(b.dataset.s))));
  document.getElementById("pause").onclick = () => {
    app.paused = !app.paused;
    document.getElementById("pause").textContent = app.paused ? "▶ Tiếp" : "❚❚ Dừng";
    if (!app.paused) playback();
  };
  document.getElementById("skip").onclick = () => {
    for (; app.shown < app.run.facts.length; ) appendFact(app.run.facts[app.shown++]);
    store(`tt-shown-${app.run.id}`, String(app.shown));
    updateSheet();
    playback();
  };
  document.getElementById("auto").onchange = (e) => {
    setAuto(e.target.checked);
    if (app.auto && app.run.pending && app.shown >= app.run.facts.length) {
      closeModal();
      autoChoose();
    }
  };
  document.getElementById("autoOff").onclick = () => setAuto(false);
  document.getElementById("newLife").onclick = () => {
    if (app.run.phase === "finished" || confirm("Kiếp này chưa kết thúc. Luân hồi sớm và bắt đầu kiếp mới?")) {
      stopPlayback();
      closeModal();
      startLife();
    }
  };
  const tl = document.getElementById("timeline");
  tl.innerHTML = "";
  run.facts.slice(0, app.shown).forEach((f) => appendFact(f, false));
  updateSheet();
}

function setAuto(on) {
  app.auto = on;
  const box = document.getElementById("auto");
  if (box) box.checked = on;
  document.getElementById("autoBanner")?.classList.toggle("hidden", !on);
  // Tắt tự quyết khi đang có ngã rẽ chờ: mở ngay hộp lựa chọn
  if (!on && app.run?.pending && app.shown >= app.run.facts.length && !document.getElementById("overlay")) {
    stopPlayback();
    openChoice(app.run.pending);
  }
}

function setSpeed(x) {
  app.speed = x;
  store("tt-speed", String(x));
  document.querySelectorAll("#speed button").forEach((b) => b.classList.toggle("on", Number(b.dataset.s) === x));
}

function stopPlayback() {
  clearTimeout(app.timer);
  app.timer = null;
}

// Hiện lần lượt các mốc mới, rồi mở hộp lựa chọn hoặc thẻ kết cục
function playback() {
  stopPlayback();
  const run = app.run;
  if (!run || !document.getElementById("timeline")) return;
  if (app.shown < run.facts.length) {
    if (app.paused) return;
    const fact = run.facts[app.shown++];
    appendFact(fact);
    store(`tt-shown-${run.id}`, String(app.shown));
    updateSheet();
    const delay = isMinor(fact) ? SPEEDS[app.speed] / 3 : SPEEDS[app.speed];
    app.timer = setTimeout(playback, delay);
    return;
  }
  updateSheet();
  if (run.pending) {
    if (app.auto) app.timer = setTimeout(autoChoose, SPEEDS[app.speed]);
    else openChoice(run.pending);
  } else showEnding();
}

const isMinor = (f) => f.title === "Tiểu cảnh giới tinh tiến" || f.title === "Tích lũy chờ thời";

function appendFact(f, animate = true) {
  const tl = document.getElementById("timeline");
  if (!tl) return;
  const el = document.createElement("div");
  el.className = `fact ${f.kind} ${isMinor(f) ? "minor" : ""} ${f.breakthrough ? `bt-fact bt-${f.breakthrough.result}` : ""}`;
  if (!animate) el.style.animation = "none";
  const deltas = Object.entries(f.delta ?? {})
    .filter(([, v]) => v)
    .map(([k, v]) => `<span class="delta ${deltaCls(k, v)}">${v > 0 ? "+" : ""}${fmt(v)} ${STAT_LABEL[k]}</span>`)
    .join("");
  if (f.quiz) {
    const r = f.quiz;
    el.classList.add(r.ok ? "quiz-ok" : "quiz-no");
    el.innerHTML = `<div class="age">${fmt(f.age)}<small>tuổi</small></div>
      <h3>${r.ok ? "✓" : r.picked ? "✗" : "·"} ${esc(f.title)}</h3><div class="meta">${esc(f.realm)}</div>
      <p class="quiz-line">${esc(r.question)}</p>
      <p class="small">${r.picked ? `Ngươi đáp: <b class="${r.ok ? "good" : "bad"}">${esc(r.picked)}</b>` : "Bỏ qua"}${r.ok ? "" : ` · Đáp án: <b>${esc(r.answer)}</b>`}</p>
      <details class="explain"><summary>Giảng giải</summary>${esc(r.explain)}</details>
      ${deltas ? `<div class="deltas">${deltas}</div>` : ""}`;
    tl.prepend(el);
    return;
  }
  el.innerHTML = `<div class="age">${fmt(f.age)}<small>tuổi</small></div>
    <h3>${esc(f.title)}</h3>
    ${isMinor(f) ? "" : `<div class="meta">${esc(f.realm)}</div>`}
    ${f.choice ? `<div class="picked">› ${esc(f.choice)}</div>` : ""}
    ${isMinor(f) ? "" : `<p>${esc(f.text)}</p>`}
    ${f.breakthrough ? `<div class="bt-chips"><span>Cơ hội ${f.breakthrough.chance}%</span>${f.breakthrough.tribulation ? `<span>Thiên lôi ${f.breakthrough.result === "success" || f.breakthrough.result === "ascend" ? 9 : f.breakthrough.strikes}/9</span>` : ""}${f.breakthrough.lifespan ? `<span>Thọ nguyên ${fmt(f.breakthrough.lifespan[0])} → ${fmt(f.breakthrough.lifespan[1])}</span>` : ""}</div>${f.breakthrough.reason && f.breakthrough.result === "fail" ? `<p class="small muted">${esc(f.breakthrough.reason)}</p>` : ""}` : ""}
    ${deltas ? `<div class="deltas">${deltas}</div>` : ""}`;
  tl.prepend(el);
}

function updateSheet() {
  const run = app.run;
  const sheet = document.getElementById("sheet");
  if (!run || !sheet) return;
  const done = app.shown >= run.facts.length;
  const last = run.facts[Math.max(0, app.shown - 1)];
  const realm = done ? run.realm : realmIndexOf(last.realm);
  const label = done ? run.realmLabel : last.realm;
  const age = done ? run.age : last.age;
  // Đang kể lại: dùng chỉ số đóng dấu ở mốc vừa hiện, để không "lộ trước" kết quả phía sau
  const stat = done || !last.stat ? statOf(run) : statFromFact(last.stat);
  sheetHtml(sheet, run, { realm, label, age, stat, shown: done ? run.facts.length : app.shown });
  stripHtml(document.getElementById("strip"), run, realm);
}

const statOf = (run) => ({ health: run.health, lifespan: run.lifespan, progress: run.progress, resources: run.resources, luck: run.luck, comprehension: run.comprehension, sect: run.sect, sectId: run.sectId, partner: run.partner, path: run.path, virtue: run.karma?.virtue, sin: run.karma?.sin });
const statFromFact = (t) => ({ health: t.h, lifespan: t.l, progress: t.p, resources: t.r, luck: t.lk, comprehension: t.c, sect: t.sc, sectId: t.si, partner: t.pt, path: t.pa, virtue: t.kv, sin: t.ks });

function sheetHtml(el, run, { realm, label, age, stat, shown = run.facts.length }) {
  const p = run.profile;
  const c = app.codex;
  const st = stat ?? statOf(run);
  const sect = { none: "Tán tu", member: "Đệ tử tông môn", elder: "Trưởng lão", outcast: "Bị trục xuất" }[st.sect];
  const partner = { none: "Độc hành", partner: "Có đạo lữ", widowed: "Đạo lữ đã khuất" }[st.partner];
  const quizzes = run.facts.slice(0, shown).filter((f) => f.quiz);
  const quizOk = quizzes.filter((f) => f.quiz.ok).length;
  const meter = (k, v, max, cls = "") =>
    `<div class="meter"><div class="row"><span class="muted">${k}</span><span>${fmt(v)}${max ? ` / ${fmt(max)}` : ""}</span></div>${max ? `<div class="bar ${cls}"><i style="width:${Math.min(100, (v / max) * 100)}%"></i></div>` : ""}</div>`;
  const open = el.classList.contains("open");
  // Đổi cảnh giới → chân dung mới, kèm hiệu ứng lóe sáng
  const prevRealm = el.dataset.realm === undefined ? realm : Number(el.dataset.realm);
  el.dataset.realm = realm;
  const up = realm > prevRealm;
  el.innerHTML = `
    <div class="who">
      <div class="who-av ${up ? "av-up" : ""}">${portrait(run, realm, 96)}</div>
      <div class="muted small">KIẾP ${pad(run.number)} · ${esc(byId(c.worlds, p.world).name)}</div>
      <h2>${esc(p.name)}</h2><span class="realm-badge" style="--hue:${HUES[realm]}">${esc(label)}</span>
      <button class="sheet-toggle" aria-expanded="${open}" aria-label="Chi tiết nhân vật">${open ? "Thu gọn ▴" : "Chi tiết ▾"}</button>
    </div>
    <div class="group vitals">
      ${meter("Thể trạng", st.health, 100, `health ${st.health < 40 ? "low" : ""}`)}
      ${meter("Tuổi", age, st.lifespan, "life")}
      ${realm > 0 ? meter("Tu vi cảnh giới", st.progress, 100) : ""}
    </div>
    <div class="group detail">
      <div class="kv"><span class="k">Giới tính</span><span class="v">${p.gender === "male" ? "Nam" : "Nữ"}</span></div>
      <div class="kv"><span class="k">Xuất thân</span><span class="v">${esc(byId(c.origins, p.origin).name)}</span></div>
      <div class="kv"><span class="k">Linh căn</span><span class="v">${esc(p.root)}</span></div>
      <div class="kv"><span class="k">Thể chất</span><span class="v">${esc(byId(c.physiques, p.physique).name)}</span></div>
      <div class="kv"><span class="k">Đạo đồ</span><span class="v">${esc(byId(c.paths, st.path)?.name ?? "—")}</span></div>
      ${quizzes.length ? `<div class="kv"><span class="k">Khảo hạch</span><span class="v">${quizOk}/${quizzes.length} đúng</span></div>` : ""}
      <div class="kv"><span class="k">Tông môn</span><span class="v">${sect}${st.sectId ? ` · ${esc(c.sects.find((x) => x.id === st.sectId)?.name ?? "")}` : ""}</span></div>
      <div class="kv"><span class="k">Đạo lữ</span><span class="v">${partner}</span></div>
      ${p.karma ? `<div class="kv"><span class="k">Nghiệp lực</span><span class="v"><span class="good">Thiện ${fmt(st.virtue ?? 0)}</span> · <span class="bad">Ác ${fmt(st.sin ?? 0)}</span></span></div>` : ""}
    </div>
    <div class="group detail">
      ${meter("Tư chất", p.aptitude, 100)}
      ${meter("Ngộ tính", st.comprehension, 100)}
      ${meter("Khí vận", st.luck, 100)}
      ${meter("Linh tài", st.resources)}
    </div>`;
  el.querySelector(".sheet-toggle").onclick = () => {
    el.classList.toggle("open");
    sheetHtml(el, run, { realm, label, age, stat, shown });
  };
}

function stripHtml(el, run, realm) {
  if (!el) return;
  const counts = {};
  run.facts.slice(0, app.shown || run.facts.length).forEach((f) => {
    const i = realmIndexOf(f.realm);
    counts[i] = (counts[i] ?? 0) + 1;
  });
  el.innerHTML = app.codex.realms
    .map(
      (r, i) =>
        `<div class="chip ${i === realm ? "now" : i < realm ? "done" : ""}" style="--hue:${HUES[i]}"><b>${esc(r.name)}</b>${i <= realm ? `${counts[i] ?? 0} mốc` : "Chưa đạt"}</div>`,
    )
    .join("");
  el.querySelector(".now")?.scrollIntoView({ block: "nearest", inline: "center" });
}

// ---------------------------------------------------------------- Lựa chọn

function openChoice(p) {
  if (p.kind === "quiz") return openQuiz(p);
  if (p.kind === "path") return openPath(p);
  if (p.kind === "breakthrough") return openBreakthrough(p);
  const isBt = p.kind === "breakthrough";
  const modal = openDecision(
    `<div class="head"><span>${isBt ? "Bình cảnh" : "Ngã rẽ số mệnh"} · ${fmt(app.run.age)} tuổi</span></div>
     <div class="body">
       <div class="eyebrow">${isBt ? "✦ Đột phá" : "✦ Lựa chọn"}</div>
       <h2>${esc(p.title)}</h2><p>${esc(p.prompt)}</p>
       ${isBt ? `<div class="chance"><span class="muted">Cơ hội thành công</span><div class="bar"><i style="width:${p.chance}%"></i></div><b>${p.chance}%</b></div>` : ""}
       ${p.options
         .map(
           (o, i) =>
             `<button class="option" data-id="${esc(o.id)}"><span class="n">0${i + 1}</span><span>${esc(o.text)}${o.hint ? `<small>${esc(o.hint)}</small>` : ""}</span><span>»</span></button>`,
         )
         .join("")}
       <p class="err" id="choiceErr"></p>
       <div style="text-align:center"><button class="btn ghost small" id="autoOn" style="padding:6px 14px">Để số mệnh tự quyết <span class="muted">· tự chọn từ nay</span></button></div>
     </div>`);
  modal.querySelectorAll(".option").forEach((b) => (b.onclick = () => choose(b.dataset.id)));
  modal.querySelector("#autoOn").onclick = () => {
    setAuto(true);
    autoChoose();
  };
}

// Chọn đạo đồ: ba thẻ lớn
function openPath(p) {
  const modal = openDecision(
    `<div class="head"><span>Bước vào tiên lộ · ${fmt(app.run.age)} tuổi</span></div>
     <div class="body">
       <div class="eyebrow">✦ Chọn đạo đồ</div><h2>${esc(p.title)}</h2><p>${esc(p.prompt)}</p>
       ${app.codex.paths
         .map(
           (x) => `<button class="path-card" data-id="${esc(x.id)}"><span class="glyph">${esc(x.glyph)}</span>
             <span><b>${esc(x.name)}</b><small>${esc(x.desc)}</small><small class="perk">${esc(x.perk)}</small></span></button>`,
         )
         .join("")}
       <p class="err" id="choiceErr"></p>
     </div>`);
  modal.querySelectorAll(".path-card").forEach((b) => (b.onclick = () => choose(b.dataset.id)));
}

// Câu hỏi khảo hạch: trả lời xong hiện đúng/sai + giảng giải ngay trong hộp, bấm Tiếp tục mới chạy tiếp
function openQuiz(p) {
  const answers = p.options.filter((o) => o.id !== "skip");
  const modal = openDecision(
    `<div class="head"><span>${esc(p.school ?? "Khảo hạch")} · ${esc(p.title)}</span><span class="quiz-progress">${esc(p.progress ?? "")}</span></div>
     <div class="body">
       ${p.intro ? `<p class="muted small quiz-intro">${esc(p.intro)}</p>` : ""}
       <div class="eyebrow">✦ Câu hỏi</div>
       <h2 class="quiz-q">${esc(p.prompt)}</h2>
       <div id="answers">${answers
         .map((o, i) => `<button class="option quiz-opt" data-id="${esc(o.id)}"><span class="n">${"ABCD"[i] ?? i + 1}</span><span>${esc(o.text)}</span><span class="mark"></span></button>`)
         .join("")}</div>
       <div id="quizResult"></div>
       <p class="err" id="choiceErr"></p>
       <div class="quiz-foot" id="quizFoot">
         <button class="btn ghost small" id="skipQ">Bỏ qua câu này</button>
       </div>
     </div>`);
  const submit = async (id) => {
    if (app.busy) return;
    modal.querySelectorAll(".quiz-opt, #skipQ").forEach((b) => (b.disabled = true));
    const before = app.run.facts.length;
    const next = await choose(id, { keepOpen: true });
    if (!next) {
      modal.querySelectorAll(".quiz-opt, #skipQ").forEach((b) => (b.disabled = false));
      return;
    }
    const fact = next.facts.slice(before).find((f) => f.kind === "quiz");
    if (!fact) return closeModalAndPlay();
    const r = fact.quiz;
    modal.querySelectorAll(".quiz-opt").forEach((b) => {
      const text = b.querySelector("span:nth-child(2)").textContent;
      if (text === r.answer) b.classList.add("right");
      else if (b.dataset.id === id) b.classList.add("wrong");
    });
    const reward = Object.entries(fact.delta ?? {})
      .map(([k, v]) => `<span class="delta up">+${fmt(v)} ${STAT_LABEL[k]}</span>`)
      .join("");
    modal.querySelector("#quizResult").innerHTML = `<div class="quiz-result ${r.ok ? "ok" : "no"}">
      <b>${r.ok ? "✓ Đáp đúng" : r.picked ? "✗ Chưa đúng" : "Đã bỏ qua"}</b>${r.ok ? "" : ` — đáp án: <b>${esc(r.answer)}</b>`}
      ${reward ? `<div class="deltas">${reward}</div>` : ""}
      <p>${esc(r.explain)}</p></div>`;
    modal.querySelector("#quizFoot").innerHTML = `<button class="btn" id="nextQ">Tiếp tục ›</button>`;
    const nextBtn = modal.querySelector("#nextQ");
    nextBtn.focus();
    nextBtn.onclick = closeModalAndPlay;
  };
  modal.querySelectorAll(".quiz-opt").forEach((b) => (b.onclick = () => submit(b.dataset.id)));
  modal.querySelector("#skipQ").onclick = () => submit("skip");
}

function closeModalAndPlay() {
  closeModal();
  playback();
}

function autoChoose() {
  const p = app.run?.pending;
  if (!p) return;
  let id;
  if (p.kind === "breakthrough") {
    const has = (x) => p.options.some((o) => o.id === x);
    id = app.run.health < 60 ? "wait" : has("aid") ? "aid" : "attempt";
  } else if (p.kind === "quiz") id = "skip"; // tự quyết không trả lời hộ người chơi
  else id = p.options[Math.floor(Math.random() * p.options.length)].id;
  const before = app.run.facts.length;
  choose(id).then((next) => next && p.kind === "breakthrough" && toastBreakthrough(next.facts.slice(before)));
}

// keepOpen: giữ hộp thoại (để hiện kết quả câu hỏi) và chưa chạy tiếp; trả về trạng thái mới
async function choose(choiceId, { keepOpen = false } = {}) {
  if (app.busy) return null;
  app.busy = true;
  const run = app.run;
  try {
    const next = await api(`/api/game/runs/${run.id}/choices`, {
      method: "POST",
      body: { step: run.step, eventId: run.pending.eventId, choiceId },
    });
    app.run = next;
    app.justUnlocked = next.unlocked ?? [];
    if (!keepOpen) {
      closeModal();
      playback();
    }
    return next;
  } catch (e) {
    const err = document.getElementById("choiceErr");
    if (err) err.textContent = e.message;
    else toast(e.message);
    return null;
  } finally {
    app.busy = false;
  }
}

// ---------------------------------------------------------------- Đột phá: màn hình riêng + hiệu ứng kết quả

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const CONGRATS = [
  (to) => `Chúc mừng đạo hữu đặt chân vào ${to}!`,
  (to) => `Tiên lộ rộng mở — ${to} đã thành!`,
  (to) => `Một bước lên ${to}, thiên địa cũng phải nhìn lại.`,
  (to) => `Đại đạo không phụ người có lòng. ${to}, chúc mừng!`,
];
const COMFORT = [
  "Thất bại là mẹ thành công — đạo tâm chưa vỡ thì tiên lộ chưa đứt.",
  "Núi cao còn đó, ngày khác lại leo.",
  "Bình cảnh chưa qua, nhưng căn cơ đã dày thêm một phần.",
];
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

function openBreakthrough(p) {
  const final = p.to === "Chứng đạo";
  const glyph = final ? "道" : p.tribulation ? "劫" : "破";
  const factors = (p.factors ?? [])
    .map((f) => `<div class="bt-factor"><span>${esc(f.label)}</span><b class="${f.value > 0 ? "good" : f.value < 0 ? "bad" : ""}">${f.value > 0 ? "+" : ""}${f.value}%</b></div>`)
    .join("");
  const modal = openDecision(
    `<div class="bt ${p.tribulation ? "bt-trib" : ""} ${final ? "bt-final" : ""}">
      ${p.tribulation ? `<div class="bt-clouds"></div>` : ""}
      <div class="head"><span>${p.tribulation ? "Thiên kiếp" : "Bình cảnh"} · ${fmt(app.run.age)} tuổi</span></div>
      <div class="body" id="btBody">
        <div class="bt-top">
          <div class="bt-glyph">${glyph}</div>
          <div class="bt-path"><span>${esc(p.from)}</span><i>›</i><b>${esc(p.to)}</b></div>
        </div>
        <p class="bt-prompt">${esc(p.prompt)}</p>
        <div class="bt-ring" id="btRing" style="--p:${p.chance}"><div><b id="btPct">${p.chance}%</b><small>cơ hội</small></div></div>
        <details class="bt-factors"><summary>Vì sao ${p.chance}%?</summary>${factors}</details>
        <div class="bt-options">${p.options
          .map((o) => {
            const extra = o.id === "aid" && p.aidChance ? ` <span class="good">→ ${p.aidChance}%</span>` : "";
            return `<button class="option bt-opt" data-id="${esc(o.id)}"><span class="n">${o.id === "wait" ? "◌" : o.id === "aid" ? "✦" : "⚡"}</span><span>${esc(o.text)}${extra}<small>${esc(o.hint ?? "")}</small></span><span>»</span></button>`;
          })
          .join("")}</div>
        <p class="err" id="choiceErr"></p>
      </div>
    </div>`);
  // Rê chuột/chạm vào "hộ pháp" thì vòng tỉ lệ xem trước con số mới
  const ring = modal.querySelector("#btRing");
  const pct = modal.querySelector("#btPct");
  const show = (v) => {
    ring.style.setProperty("--p", v);
    pct.textContent = `${v}%`;
  };
  modal.querySelectorAll(".bt-opt").forEach((b) => {
    if (b.dataset.id === "aid" && p.aidChance) {
      b.onmouseenter = () => show(p.aidChance);
      b.onmouseleave = () => show(p.chance);
    }
    b.onclick = () => (b.dataset.id === "wait" ? choose("wait") : attemptBreakthrough(modal, b.dataset.id, p));
  });
}

async function attemptBreakthrough(modal, choiceId, p) {
  if (app.busy) return;
  modal.querySelectorAll(".bt-opt").forEach((b) => (b.disabled = true));
  const before = app.run.facts.length;
  const next = await choose(choiceId, { keepOpen: true });
  if (!next) {
    modal.querySelectorAll(".bt-opt").forEach((b) => (b.disabled = false));
    return;
  }
  const fact = next.facts.slice(before).find((f) => f.breakthrough);
  if (!fact) return closeModalAndPlay();
  await chargeScene(modal, fact.breakthrough, choiceId === "aid" ? p.aidChance : p.chance);
  resultScene(modal, fact);
}

// Cảnh vận công / độ kiếp trước khi lộ kết quả
async function chargeScene(modal, b, chance) {
  const body = modal.querySelector("#btBody");
  const lines = b.tribulation
    ? ["Kiếp vân cuồn cuộn kéo đến…", "Thiên uy đè xuống, vạn vật im phăng phắc…", "Lôi quang xé toạc bầu trời!"]
    : ["Linh khí cuồn cuộn đổ về đan điền…", "Vận chuyển chu thiên, xung kích bình cảnh…", "Bình cảnh rung động…"];
  body.innerHTML = `<div class="bt-charge ${b.tribulation ? "trib" : ""}">
      ${b.tribulation ? `<div class="bt-bolt"></div><div class="bt-flash"></div>` : `<div class="bt-vortex"><i></i><i></i><i></i></div>`}
      <div class="bt-charge-text" id="chargeText">${lines[0]}</div>
      ${b.tribulation ? `<div class="bt-strikes" id="strikes">Đạo lôi 0/9</div>` : `<div class="muted small">Cơ hội ${chance}%</div>`}
    </div>`;
  if (REDUCED) return sleep(400);
  const text = body.querySelector("#chargeText");
  if (!b.tribulation) {
    for (const l of lines) {
      text.textContent = l;
      await sleep(850);
    }
    return;
  }
  // Thiên kiếp: đếm từng đạo lôi; thất bại thì dừng ở đạo vượt quá sức chịu
  const total = b.result === "success" || b.result === "ascend" ? 9 : (b.strikes ?? 3) + 1;
  const strikes = body.querySelector("#strikes");
  const flash = body.querySelector(".bt-flash");
  const bolt = body.querySelector(".bt-bolt");
  for (let i = 1; i <= total; i++) {
    text.textContent = lines[Math.min(lines.length - 1, Math.floor((i / total) * lines.length))];
    strikes.textContent = `Đạo lôi ${i}/9`;
    bolt.style.left = `${20 + Math.random() * 60}%`;
    for (const el of [flash, bolt]) {
      el.classList.remove("on");
      void el.offsetWidth; // chạy lại animation
      el.classList.add("on");
    }
    modal.querySelector(".modal").classList.toggle("shake-sm", i === total);
    await sleep(i === total ? 900 : 420);
  }
}

function resultScene(modal, fact) {
  const b = fact.breakthrough;
  const body = modal.querySelector("#btBody");
  const tags = [b.aided && "Linh tài hộ pháp", b.insight && "Vấn tâm"].filter(Boolean).map((t) => `<span class="ach">✦ ${t}</span>`).join("");
  const deltas = Object.entries(fact.delta ?? {})
    .map(([k, v]) => `<span class="delta ${deltaCls(k, v)}">${v > 0 ? "+" : ""}${fmt(v)} ${STAT_LABEL[k]}</span>`)
    .join("");
  let html = "";
  if (b.result === "success" || b.result === "ascend") {
    const asc = b.result === "ascend";
    const gain = b.lifespan ? b.lifespan[1] - b.lifespan[0] : 0;
    html = `<div class="bt-result success ${asc ? "ascend" : ""}">
      <div class="bt-burst"></div>${particles(asc ? 40 : 26)}
      ${app.run ? `<div class="bt-avatar">${portrait(app.run, asc ? 13 : realmIndexOf(b.to), 132)}</div>` : `<div class="bt-big">${asc ? "道" : b.tribulation ? "渡" : "成"}</div>`}
      <h2>${asc ? "Chứng đạo bất hủ!" : b.tribulation ? "Độ kiếp thành công!" : "Đột phá thành công!"}</h2>
      <p class="bt-cheer">${asc ? "Thân hợp thiên địa, tên lưu vạn giới. Một đời cầu đạo đã viên mãn." : esc(pickOne(CONGRATS)(b.to))}</p>
      <div class="bt-stats">
        ${asc ? "" : `<div><small>Cảnh giới</small><b>${esc(b.to)}</b></div>`}
        ${gain > 0 ? `<div><small>Thọ nguyên</small><b><span class="countup" data-from="${b.lifespan[0]}" data-to="${b.lifespan[1]}">${fmt(b.lifespan[0])}</span> năm</b><span class="good small">+${fmt(gain)}</span></div>` : ""}
        ${b.tribulation ? `<div><small>Thiên lôi</small><b>9/9</b></div>` : ""}
        <div><small>Cơ hội</small><b>${b.chance}%</b></div>
      </div>
      ${tags ? `<div class="ach-list">${tags}</div>` : ""}
      <button class="btn" id="btNext">${asc ? "Xem kết cục" : "Tiếp tục tu hành ›"}</button>
    </div>`;
  } else if (b.result === "death") {
    html = `<div class="bt-result death">
      <div class="bt-big">終</div>
      <h2>${b.to === "Chứng đạo" ? "Tan biến trước đại đạo" : "Hồn phi phách tán"}</h2>
      <p>${esc(b.reason ?? "")}</p>
      <p class="muted small">Đỡ được ${b.strikes}/9 đạo thiên lôi · cơ hội ${b.chance}%</p>
      <button class="btn ghost" id="btNext">Xem kết cục</button>
    </div>`;
  } else {
    html = `<div class="bt-result fail">
      <svg class="bt-crack" viewBox="0 0 200 120" aria-hidden="true"><path d="M100 0 L92 30 L108 48 L88 72 L104 90 L96 120"/><path d="M92 30 L64 40 L50 62"/><path d="M108 48 L138 56 L150 80"/><path d="M88 72 L60 86"/></svg>
      <div class="bt-big">裂</div>
      <h2>${b.tribulation ? "Độ kiếp thất bại" : "Đột phá thất bại"}</h2>
      <p class="bt-reason">${esc(b.reason ?? "")}</p>
      ${deltas ? `<div class="deltas" style="justify-content:center">${deltas}<span class="delta down">tu vi lùi lại</span></div>` : ""}
      ${b.tribulation ? `<p class="muted small">Đỡ được ${b.strikes}/9 đạo thiên lôi — vẫn còn sống, đó đã là cơ duyên.</p>` : ""}
      ${b.tips?.length ? `<div class="bt-tips"><b>Lần sau:</b><ul>${b.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
      <p class="bt-comfort">${esc(pickOne(COMFORT))}</p>
      <button class="btn" id="btNext">Tiếp tục</button>
    </div>`;
  }
  body.innerHTML = html;
  const m = modal.querySelector(".modal");
  m.classList.remove("shake-sm");
  if (b.result === "fail") m.classList.add("shake");
  if (b.result === "death") m.classList.add("fade-dark");
  if (b.result === "success" || b.result === "ascend") m.classList.add("glow");
  body.querySelectorAll(".countup").forEach(countUp);
  const btn = body.querySelector("#btNext");
  btn.focus();
  btn.onclick = closeModalAndPlay;
}

function particles(n) {
  if (REDUCED) return "";
  return `<div class="bt-particles">${Array.from({ length: n }, (_, i) => {
    const a = (360 / n) * i + Math.random() * 10;
    const d = 90 + Math.random() * 140;
    const delay = Math.random() * 0.25;
    return `<i style="--a:${a}deg;--d:${d}px;--t:${delay}s"></i>`;
  }).join("")}</div>`;
}

function countUp(el) {
  const from = Number(el.dataset.from);
  const to = Number(el.dataset.to);
  if (REDUCED) return void (el.textContent = fmt(to));
  const t0 = performance.now();
  const dur = 1200;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    el.textContent = fmt(Math.round(from + (to - from) * (1 - (1 - k) ** 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Tự quyết: không mở màn hình, chỉ báo kết quả bằng thông báo ngắn
function toastBreakthrough(facts) {
  const f = facts.find((x) => x.breakthrough);
  if (!f) return;
  const b = f.breakthrough;
  const msg = {
    success: `✦ Đột phá ${b.to} thành công!`,
    ascend: "✦ Chứng đạo bất hủ!",
    fail: `Đột phá ${b.to} thất bại (${b.chance}%)`,
    death: "Hồn phi phách tán dưới thiên kiếp",
  }[b.result];
  toast(msg, 3000);
}

// ---------------------------------------------------------------- Kết cục

async function showEnding() {
  const run = app.run;
  const box = document.getElementById("ending");
  if (!box || box.innerHTML) return;
  const unlocked = app.justUnlocked;
  app.justUnlocked = [];
  if (unlocked.length) await refreshMe();
  const achNames = (ids) => ids.map((id) => byId(app.codex.achievements, id)?.name).filter(Boolean);
  box.innerHTML = `<div class="ending-card ${run.ascended ? "ascended" : ""}">
    <div class="end-avatar ${run.ascended ? "" : "faded"}">${portrait(run, run.realm, 112, { animate: !!run.ascended })}<span class="glyph">${run.ascended ? "道" : "終"}</span></div>
    <div class="muted small">KẾT CỤC KIẾP ${pad(run.number)}</div>
    <h2>${esc(run.endingReason)}</h2>
    <div class="muted">${esc(run.realmLabel)} · hưởng thọ ${fmt(run.age)} tuổi</div>
    ${unlocked.length ? `<div class="muted small" style="margin-top:14px">Thành tựu mới</div><div class="ach-list emblems">${unlocked.map((id) => `<span class="ach-new">${emblemSvg(id, { size: 52, title: byId(app.codex.achievements, id)?.name })}<small>${esc(byId(app.codex.achievements, id)?.name ?? "")}</small></span>`).join("")}</div>` : ""}
    <div class="quote">“Một kiếp khép lại. Vạn kiếp vẫn còn phía trước.”</div>
    <div class="actions">
      <button class="btn" id="again">⟳ Luân hồi lần nữa</button>
      <button class="btn ghost" id="share">Chia sẻ · Lưu ảnh</button>
    </div>
    ${app.me.isGuest ? `<div class="nudge">Ngươi đang chơi bằng tài khoản khách. <b>Lưu danh tiên lộ</b> để giữ ${app.me.stats.total_runs} kiếp đã qua, lên bảng xếp hạng và chơi tiếp trên máy khác.<div style="margin-top:10px"><button class="btn" id="saveAcc">Lưu tiến trình</button></div></div>` : ""}
  </div>`;
  document.getElementById("again").onclick = startLife;
  document.getElementById("share").onclick = () => openShare(run);
  document.getElementById("saveAcc")?.addEventListener("click", openAccount);
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------------------------------------------------------------- Ảnh số mệnh: xem trước, chia sẻ, lưu

const CARD = { w: 1080, h: 1350 };
const PALETTE = { paper: "#f5f2e9", ink: "#1e2a21", green: "#345c46", muted: "#7b856e", gold: "#aa8c52", red: "#b94e43", line: "#d7ddcc" };

async function loadCardFonts() {
  // Canvas không tự tải web font: nạp trước kèm ký tự tiếng Việt
  const sample = "Tu Tiên Lộ ỗ ặ ữ 命 道";
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`500 40px "Noto Serif"`, sample),
        document.fonts.load(`400 28px "Be Vietnam Pro"`, sample),
        document.fonts.load(`600 28px "Be Vietnam Pro"`, sample),
      ]),
      sleep(2500),
    ]);
  } catch {}
}

// Ngắt dòng theo chiều rộng; trả về số dòng đã vẽ
// `text` là chuỗi (ngắt theo từ) hoặc mảng cụm không được tách (ví dụ tên thành tựu)
function wrapText(g, text, x, y, maxW, lineH, maxLines = 3) {
  const words = Array.isArray(text) ? text : String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "…");
  }
  lines.forEach((l, i) => g.fillText(l, x, y + i * lineH));
  return lines.length;
}

async function buildFateCard(run) {
  await loadCardFonts();
  const c = app.codex;
  const p = run.profile;
  const cv = document.createElement("canvas");
  cv.width = CARD.w;
  cv.height = CARD.h;
  const g = cv.getContext("2d");
  const font = (size, weight = 400, family = "Be Vietnam Pro") => (g.font = `${weight} ${size}px "${family}", serif`);
  const center = (text, y, size, color, weight = 500, family = "Noto Serif") => {
    font(size, weight, family);
    g.fillStyle = color;
    g.textAlign = "center";
    g.fillText(text, CARD.w / 2, y, 920);
  };

  // Nền giấy + núi mờ + khung đôi
  g.fillStyle = PALETTE.paper;
  g.fillRect(0, 0, CARD.w, CARD.h);
  g.fillStyle = "#e9e6d8";
  g.beginPath();
  g.moveTo(0, 1350); g.lineTo(0, 1060); g.lineTo(200, 900); g.lineTo(360, 1010); g.lineTo(560, 820); g.lineTo(760, 990); g.lineTo(920, 880); g.lineTo(1080, 980); g.lineTo(1080, 1350);
  g.fill();
  g.strokeStyle = "#a5b497"; g.lineWidth = 2; g.strokeRect(36, 36, 1008, 1278);
  g.strokeStyle = PALETTE.line; g.lineWidth = 1; g.strokeRect(50, 50, 980, 1250);

  // Chân dung theo cảnh giới cuối cùng + ấn triện nhỏ góc phải
  try {
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(portrait(run, run.realm, 176, { animate: false }));
    await img.decode();
    g.drawImage(img, 452, 64, 176, 176);
  } catch {
    center(run.ascended ? "道" : "命", 178, 60, PALETTE.red);
  }
  const seal = run.ascended ? "道" : "命";
  g.strokeStyle = PALETTE.red; g.lineWidth = 3; g.strokeRect(880, 84, 70, 70);
  font(46, 500, "Noto Serif"); g.fillStyle = PALETTE.red; g.textAlign = "center"; g.fillText(seal, 915, 136);

  center(`THIÊN MỆNH QUYỂN · KIẾP ${pad(run.number)}`, 262, 24, PALETTE.muted, 500, "Be Vietnam Pro");
  center(p.name, 360, 80, PALETTE.ink);
  // Huy hiệu cảnh giới
  font(40, 500, "Noto Serif");
  const label = run.realmLabel;
  const bw = Math.min(900, g.measureText(label).width + 70);
  g.strokeStyle = PALETTE.gold; g.lineWidth = 2; g.strokeRect(540 - bw / 2, 400, bw, 68);
  center(label, 448, 40, PALETTE.gold);
  center(`Hưởng thọ ${fmt(run.age)} tuổi`, 530, 30, PALETTE.green, 500, "Be Vietnam Pro");

  // Bảng thông tin
  const rows = [
    ["Giới diện", byId(c.worlds, p.world).name],
    ["Xuất thân", byId(c.origins, p.origin).name],
    ["Linh căn", p.root],
    ["Thể chất", byId(c.physiques, p.physique).name],
    ["Mốc cuộc đời", `${run.facts.length} mốc`],
  ];
  rows.forEach(([k, v], i) => {
    const y = 620 + i * 62;
    font(26, 400); g.fillStyle = PALETTE.muted; g.textAlign = "left"; g.fillText(k, 170, y);
    font(30, 500, "Noto Serif"); g.fillStyle = PALETTE.ink; g.textAlign = "right"; g.fillText(v, 910, y, 520);
    g.strokeStyle = PALETTE.line; g.lineWidth = 1; g.beginPath(); g.moveTo(170, y + 22); g.lineTo(910, y + 22); g.stroke();
  });

  // Kết cục
  center("KẾT CỤC", 980, 22, PALETTE.muted, 600, "Be Vietnam Pro");
  font(42, 500, "Noto Serif"); g.fillStyle = run.ascended ? PALETTE.gold : PALETTE.red; g.textAlign = "center";
  const n = wrapText(g, run.endingReason ?? "Đang tu hành", 540, 1040, 860, 52, 2);

  // Thành tựu của kiếp này
  // Thành tựu của kiếp này: hàng biểu trưng (tối đa 7)
  const achIds = (run.achievements ?? []).filter((id) => byId(c.achievements, id));
  if (achIds.length) {
    const shown = achIds.slice(0, 7), sz = 74, gap = 14;
    const x0 = 540 - (shown.length * sz + (shown.length - 1) * gap) / 2;
    const y0 = 1040 + n * 52 + 4;
    await Promise.all(
      shown.map(async (id, i) => {
        try {
          const img = new Image();
          img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(emblemSvg(id, { size: sz }));
          await img.decode();
          g.drawImage(img, x0 + i * (sz + gap), y0, sz, sz * 1.04);
        } catch {}
      }),
    );
    if (achIds.length > 7) center(`+${achIds.length - 7} thành tựu`, y0 + sz + 34, 20, PALETTE.green, 500, "Be Vietnam Pro");
  }

  center("“Một kiếp khép lại. Vạn kiếp vẫn còn phía trước.”", 1218, 26, PALETTE.muted, 400, "Noto Serif");
  center(`TU TIÊN LỘ · ${location.host}`, 1268, 20, "#8b987e", 500, "Be Vietnam Pro");

  return new Promise((resolve, reject) => cv.toBlob((b) => (b ? resolve(b) : reject(new Error("Không tạo được ảnh."))), "image/png"));
}

async function openShare(run) {
  const modal = openModal(`<div class="head"><span>Ảnh số mệnh · Kiếp ${pad(run.number)}</span><button class="icon-btn" data-close>×</button></div>
    <div class="body share-body"><div class="share-preview"><div class="muted small">Đang vẽ ảnh…</div></div>
    <div class="share-actions">
      <button class="btn" id="doShare" disabled>Chia sẻ</button>
      <a class="btn ghost" id="doSave" aria-disabled="true">Lưu ảnh</a>
    </div>
    <p class="muted small share-hint" id="shareHint"></p><p class="err" id="shareErr"></p></div>`);
  let blob;
  try {
    blob = await buildFateCard(run);
  } catch (e) {
    modal.querySelector("#shareErr").textContent = e.message;
    return;
  }
  const name = `tu-tien-lo-kiep-${pad(run.number)}.png`;
  const file = new File([blob], name, { type: "image/png" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  img.alt = `Ảnh số mệnh kiếp ${run.number}`;
  modal.querySelector(".share-preview").replaceChildren(img);
  // Thu hồi URL khi đóng hộp thoại
  new MutationObserver((_, obs) => {
    if (!document.body.contains(modal)) {
      URL.revokeObjectURL(url);
      obs.disconnect();
    }
  }).observe(document.body, { childList: true });

  const text = `${run.profile.name} · ${run.realmLabel} · ${fmt(run.age)} tuổi — ${run.endingReason ?? "đang tu hành"}. Kiếp này của ta trên Tu Tiên Lộ.`;
  const canShareFile = !!navigator.canShare?.({ files: [file] });
  const shareBtn = modal.querySelector("#doShare");
  const saveBtn = modal.querySelector("#doSave");
  const hint = modal.querySelector("#shareHint");
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  saveBtn.href = url;
  saveBtn.download = name;
  saveBtn.removeAttribute("aria-disabled");
  saveBtn.onclick = () => toast("Đã lưu ảnh vào thư mục Tải về.");
  hint.textContent = isIOS ? "Mẹo: nhấn giữ ảnh rồi chọn “Lưu vào Ảnh” để cất vào thư viện ảnh." : "";

  shareBtn.disabled = false;
  if (!canShareFile && !navigator.share) shareBtn.textContent = "Sao chép lời mời";
  shareBtn.onclick = async () => {
    try {
      if (canShareFile) await navigator.share({ files: [file], title: "Tu Tiên Lộ", text });
      else if (navigator.share) await navigator.share({ title: "Tu Tiên Lộ", text, url: location.origin });
      else {
        await navigator.clipboard.writeText(`${text} ${location.origin}`);
        toast("Đã sao chép lời chia sẻ. Dùng nút Lưu ảnh để lấy ảnh.");
      }
    } catch (e) {
      if (e.name !== "AbortError") modal.querySelector("#shareErr").textContent = "Thiết bị không mở được chia sẻ. Hãy dùng nút Lưu ảnh.";
    }
  };
}

// ---------------------------------------------------------------- Lịch sử

async function renderHistory() {
  const { lives, next } = await api("/api/game/lives");
  const c = app.codex;
  const realm = (i) => (i >= c.realms.length ? "Chứng đạo" : c.realms[i]?.name ?? "");
  const status = (r) => (r.status === "active" ? "Đang tu hành" : r.status === "abandoned" ? "Luân hồi sớm" : r.ending ?? "");
  // Những gì một kiếp nhận vào từ kiếp trước
  const gotChips = (k) => {
    if (!k) return [];
    const out = [];
    if (k.blessing) out.push(["good", `福 Phúc báo +${k.blessing}`]);
    if (k.burden) out.push(["bad", `業 Nghiệp chướng −${k.burden}`]);
    if (k.insight >= 5) out.push(["", `慧 Túc tuệ ${k.insight}`]);
    if (k.obsession) out.push(["", `執 Chấp niệm ${realm(k.obsession.realm)}`]);
    if (k.bond) out.push(["good", `緣 Tiền duyên ${k.bond.name}`]);
    if (k.feud) out.push(["bad", `冤 Oan gia ${k.feud.name}`]);
    if (k.legacy) out.push(["good", `府 Động phủ ${k.legacy.name}${k.legacy.claimed ? " · đã kế thừa" : ""}`]);
    return out;
  };
  const chips = (list) => list.map(([cls, t]) => `<span class="kchip ${cls}">${esc(t)}</span>`).join("");
  const nextChips = gotChips(next);
  const maxK = Math.max(10, ...lives.map((l) => Math.max(l.virtue, l.sin)));
  $view.innerHTML = `<div class="page lives-page">
    <h1>Sổ Sinh Tử</h1>
    <p class="muted">Mỗi kiếp gieo nhân, kiếp sau gặt quả. Thiện nghiệp hóa phúc báo, ác nghiệp thành nghiệp chướng; cảnh giới đã tu để lại túc tuệ; nơi gục ngã thành chấp niệm; đạo lữ thành tiền duyên; tu đến Kim Đan để lại động phủ cho chính mình kiếp sau.</p>
    <section class="karma-next">
      <div class="muted small">NHÂN QUẢ ĐANG CHỜ KIẾP SAU</div>
      ${nextChips.length ? `<div class="kchips">${chips(nextChips)}</div>` : `<div class="muted">Chưa có nhân quả nào — kiếp kế tiếp bắt đầu như tờ giấy trắng.</div>`}
      <div class="karma-bal"><span>Thiện nghiệp tích lũy <b class="good">${fmt(next.v)}</b></span><span>Ác nghiệp tích lũy <b class="bad">${fmt(next.s)}</b></span><span class="muted small">mỗi kiếp phai một nửa</span></div>
    </section>
    ${
      lives.length
        ? `<ol class="lives">${lives
            .map((l) => {
              const got = gotChips(l.inherited);
              const left = [];
              if (l.left) left.push(["good", `府 Để lại động phủ (${fmt(l.left.res)} linh tài)${l.left.claimed ? " · đã được kế thừa" : ""}`]);
              return `<li class="life ${l.status}">
                <a class="life-card" href="#/history/${esc(l.id)}">
                  <span class="life-av ${l.status === "finished" && !l.ending?.startsWith("Chứng đạo") ? "faded" : ""}">${avatarSvg(l.realm, l.gender, { seed: l.seed, size: 56, animate: false })}</span>
                  <div class="main">
                    <div class="muted small">KIẾP ${pad(l.number)} · ${esc(byId(c.worlds, l.world)?.name ?? "")}</div>
                    <div class="title">${esc(l.name)} <span class="realm" style="--hue:${HUES[l.realm]}">${esc(realm(l.realm))}</span></div>
                    <div class="sub">${fmt(l.age)} tuổi · ${esc(status(l))}</div>
                    ${l.virtue || l.sin ? `<div class="kbars"><span class="kb v" style="width:${(l.virtue / maxK) * 100}%"></span><span class="kb s" style="width:${(l.sin / maxK) * 100}%"></span><small>Thiện ${l.virtue} · Ác ${l.sin}</small></div>` : ""}
                    ${got.length ? `<div class="kchips"><span class="muted small">Nhận:</span>${chips(got)}</div>` : ""}
                    ${left.length ? `<div class="kchips"><span class="muted small">Để lại:</span>${chips(left)}</div>` : ""}
                  </div>
                  <span class="muted">›</span>
                </a></li>`;
            })
            .join("")}</ol>`
        : `<div class="empty">Chưa có kiếp nào. <a href="#/play">Bắt đầu tu tiên</a></div>`
    }
  </div>`;
}

async function renderHistoryDetail(id) {
  const run = await api(`/api/game/runs/${id}`);
  if (run.status === "active") return void (location.hash = "#/play");
  $view.innerHTML = `<div class="play"><aside class="sheet" id="sheet"></aside><section>
    <p><a href="#/history" class="muted small">‹ Sổ Sinh Tử</a></p>
    <div class="realm-strip" id="strip"></div><div class="timeline" id="timeline"></div></section></div>`;
  const saved = { run: app.run, shown: app.shown };
  app.run = run;
  app.shown = run.facts.length;
  run.facts.forEach((f) => appendFact(f, false));
  sheetHtml(document.getElementById("sheet"), run, { realm: run.realm, label: run.realmLabel, age: run.age });
  stripHtml(document.getElementById("strip"), run, run.realm);
  const end = run.status === "abandoned" ? run.storedEnding || "Luân hồi sớm" : run.endingReason || run.storedEnding;
  document.getElementById("timeline").insertAdjacentHTML(
    "beforebegin",
    `<div class="ending-card ${run.ascended ? "ascended" : ""}"><div class="end-avatar ${run.ascended ? "" : "faded"}">${portrait(run, run.realm, 112, { animate: false })}<span class="glyph">${run.ascended ? "道" : "終"}</span></div><h2>${esc(end)}</h2><div class="muted">${esc(run.realmLabel)} · ${fmt(run.age)} tuổi</div>
      ${run.status === "finished" ? `<div class="actions" style="margin-top:16px"><button class="btn ghost" id="shareOld">Chia sẻ · Lưu ảnh</button></div>` : ""}</div>`,
  );
  document.getElementById("shareOld")?.addEventListener("click", () => openShare(run));
  Object.assign(app, saved);
}

// ---------------------------------------------------------------- Bảng xếp hạng

// Bộ lọc giới diện / môn phái của bảng cao thủ (giữ trong phiên)
const rankFilter = { world: "", sect: "" };

async function renderRank(by = "realm") {
  const c = app.codex;
  const tab = (k, label) => `<button data-by="${k}" class="${by === k ? "on" : ""}">${label}</button>`;
  const tabs = `<div class="tabs rank-tabs">${tab("realm", "Cảnh giới")}${tab("age", "Sống lâu")}${tab("duel", "Đạo vị")}${tab("sects", "Môn phái")}${tab("worlds", "Giới diện")}</div>`;
  const page = (intro, body) => {
    $view.innerHTML = `<div class="page rank-page"><h1>Bảng xếp hạng</h1>${tabs}<p class="muted small rank-intro">${intro}</p>${body}</div>`;
    $view.querySelectorAll(".rank-tabs button").forEach((b) => (b.onclick = () => renderRank(b.dataset.by)));
  };
  const me = (r) => (r.userId === app.me.id ? ' <span class="muted small">(ngươi)</span>' : "");
  // Ảnh cấp bậc: chân dung theo cảnh giới (không rõ giới tính thì suy từ tên)
  const rowAvatar = (realm, gender, name, seed) => {
    const ns = nameSeed(name);
    return `<span class="row-av">${avatarSvg(realm ?? 0, gender ?? (ns % 2 ? "female" : "male"), { seed: seed ?? ns, size: 40, animate: false, title: c.realms[realm ?? 0]?.name })}</span>`;
  };
  // Chuyển sang bảng cao thủ, lọc sẵn theo giới / phái
  const wireJump = () =>
    $view.querySelectorAll("[data-jump-world],[data-jump-sect]").forEach(
      (el) =>
        (el.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          rankFilter.world = el.dataset.jumpWorld ?? (el.dataset.jumpSect ? byId(c.sects, el.dataset.jumpSect)?.world ?? "" : "");
          rankFilter.sect = el.dataset.jumpSect ?? "";
          renderRank("realm");
        }),
    );

  if (by === "duel") {
    const rows = await api("/api/duel/leaderboard");
    page(
      "Điểm Đạo vị từ luận đạo trực tiếp. Chỉ tài khoản đã lưu tiến trình mới được xếp hạng.",
      rows.length
        ? `<div class="list">${rows
            .map(
              (r, i) => `<div class="item has-av ${r.userId === app.me.id ? "me" : ""}"><div class="no ${i < 3 ? "top" : ""}">${i + 1}</div>
                ${rowAvatar(r.realm, null, r.name)}
                <div class="main"><div class="title">${esc(r.name)}${me(r)}</div><div class="sub">${esc(c.realms[r.realm]?.name ?? "")} · ${r.wins} thắng · ${r.losses} thua · ${r.draws} hòa</div></div>
                <div style="text-align:right"><div class="realm" style="--hue:45">${fmt(r.rating)}</div><div class="end">${esc(rankTitle(r.rating))}</div></div></div>`,
            )
            .join("")}</div>`
        : `<div class="empty">Chưa có ai luận đạo.</div>`,
    );
    return;
  }

  if (by === "sects") {
    const [world, sects] = await Promise.all([api("/api/world"), api("/api/sects")]);
    const metric = store("tt-rank-sect") || "power";
    const pol = new Map(sects.map((x) => [x.id, x]));
    const rows = world.worlds
      .flatMap((w) => w.sects.map((x) => ({ ...x, world: w.id, ...(pol.get(x.id) ? { points: pol.get(x.id).points, disciples: pol.get(x.id).disciples, chief: pol.get(x.id).chief } : {}) })))
      .map((x) => ({ ...x, power: Number(x.power) || 0, points: Number(x.points) || 0, members: Number(x.members) || 0 }));
    const key = { power: "power", points: "points", members: "members" }[metric] ?? "power";
    rows.sort((a, b) => b[key] - a[key] || b.power - a.power || b.members - a.members);
    const unit = { power: "thế lực", points: "điểm tỷ võ", members: "đệ tử" }[key];
    page(
      `Xếp hạng ${c.sects.length} môn phái của vạn giới. Thế lực = tổng (cảnh giới + 1)² kiếp tốt nhất mỗi đệ tử; điểm tỷ võ do đệ tử tại thế giành được trong luận đạo.`,
      `<div class="range sect-metric">${[["power", "Thế lực"], ["points", "Điểm tỷ võ"], ["members", "Số đệ tử"]]
        .map(([k, l]) => `<button data-m="${k}" class="${k === key ? "on" : ""}">${l}</button>`)
        .join("")}</div>
      <div class="list sect-board">${rows
        .map((s, i) => {
          const d = byId(c.sects, s.id);
          return `<a class="item link" href="#/sects/${s.id}"><div class="no ${i < 3 && s[key] ? "top" : ""}">${i + 1}</div>
            <span class="sflag">${flagSvg(s.id, d?.glyph ?? "", { size: 46, wave: false, title: `Cờ ${d?.name ?? ""}` })}</span>
            <div class="main"><div class="title">${esc(d?.name ?? s.id)}</div>
              <div class="sub">${esc(byId(c.worlds, s.world)?.name ?? "")} · ${fmt(s.members)} đệ tử · đỉnh cao ${esc(s.topRealm == null ? "—" : c.realms[s.topRealm]?.name ?? "—")}</div>
              <div class="sub">${s.chief ? `掌 <b>${esc(s.chief.name)}</b>` : s.leader ? `Mạnh nhất: <b>${esc(s.leader.name)}</b>` : "Chưa có đệ tử."} · <span class="linkish" data-jump-sect="${s.id}">Cao thủ ›</span></div></div>
            <div class="sect-power"><b>${fmt(s[key])}</b><small>${unit}</small></div></a>`;
        })
        .join("")}</div>`,
    );
    $view.querySelectorAll(".sect-metric button").forEach((b) => (b.onclick = () => (store("tt-rank-sect", b.dataset.m), renderRank("sects"))));
    wireJump();
    return;
  }

  if (by === "worlds") {
    const world = await api("/api/world");
    const rows = world.worlds.slice().sort((a, b) => b.players - a.players || (b.topRealm ?? -1) - (a.topRealm ?? -1));
    page(
      "Tám giới diện xếp theo số tu sĩ đã luân hồi vào. Bấm “Cao thủ” để xem bảng xếp hạng riêng của giới.",
      `<div class="list world-board">${rows
        .map((w, i) => {
          const d = byId(c.worlds, w.id);
          const look = WORLD_LOOK[w.id] ?? { glyph: "界", hue: 120 };
          return `<div class="item"><div class="no ${i < 3 && w.players ? "top" : ""}">${i + 1}</div>
            <div class="main"><div class="title"><span class="wglyph sm" style="--hue:${look.hue}">${look.glyph}</span> ${esc(d.name)}</div>
              <div class="sub">${fmt(w.active)} đang tu hành · ${fmt(w.lives)} kiếp · thọ TB ${w.avgAge ? fmt(w.avgAge) : "—"} · cao nhất ${esc(w.topRealm == null ? "—" : c.realms[w.topRealm]?.name ?? "—")}</div>
              <div class="sub">${w.top[0] ? `Cao thủ: <b>${esc(w.top[0].name)}</b> — ${esc(c.realms[w.top[0].realm]?.name ?? "")}` : "Chưa ai luân hồi vào giới này."} · <a href="#" data-jump-world="${w.id}">Cao thủ ›</a></div></div>
            <div class="sect-power"><b>${fmt(w.players)}</b><small>tu sĩ</small></div></div>`;
        })
        .join("")}</div>`,
    );
    wireJump();
    return;
  }

  // Bảng cao thủ (cảnh giới / sống lâu), lọc theo giới và môn phái
  const q = new URLSearchParams({ by, ...(rankFilter.world ? { world: rankFilter.world } : {}), ...(rankFilter.sect ? { sect: rankFilter.sect } : {}) });
  const rows = await api(`/api/leaderboard?${q}`);
  const sectsOf = c.sects.filter((x) => !rankFilter.world || x.world === rankFilter.world);
  const scope = rankFilter.sect ? byId(c.sects, rankFilter.sect)?.name : rankFilter.world ? byId(c.worlds, rankFilter.world)?.name : "";
  page(
    "Mỗi tu sĩ chỉ tính kiếp tốt nhất. Khách hiện là “Vô danh tu sĩ” cho đến khi lưu tiến trình.",
    `<div class="rank-filter">
      <select id="fWorld" aria-label="Lọc theo giới diện"><option value="">Mọi giới diện</option>${c.worlds.map((w) => `<option value="${w.id}" ${w.id === rankFilter.world ? "selected" : ""}>${esc(w.name)}</option>`).join("")}</select>
      <select id="fSect" aria-label="Lọc theo môn phái"><option value="">Mọi môn phái</option>${sectsOf.map((x) => `<option value="${x.id}" ${x.id === rankFilter.sect ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
      ${rankFilter.world || rankFilter.sect ? `<button class="btn ghost small" id="fClear">Bỏ lọc</button>` : ""}
    </div>
    ${rows.length
      ? `<div class="list">${rows
          .map(
            (r, i) => `<div class="item has-av ${r.userId === app.me.id ? "me" : ""}"><div class="no ${i < 3 ? "top" : ""}">${i + 1}</div>
              ${rowAvatar(r.best_realm, r.gender, r.name, r.seed)}
              <div class="main"><div class="title">${esc(r.name)}${me(r)}</div>
                <div class="sub">${fmt(r.age)} tuổi · ${esc(byId(c.worlds, r.world)?.name ?? "")}${r.sect_id ? ` · ${r.sect_rank === "outcast" ? "phản đồ " : ""}${esc(byId(c.sects, r.sect_id)?.name ?? "")}` : " · tán tu"}</div></div>
              <div style="text-align:right"><div class="realm" style="--hue:${HUES[r.best_realm]}">${esc(c.realms[r.best_realm].name)}</div><div class="end">${esc(r.ending_reason)}</div></div></div>`,
          )
          .join("")}</div>`
      : `<div class="empty">${scope ? `Chưa ai ở ${esc(scope)} khép lại một kiếp.` : "Chưa có ai khép lại một kiếp."}</div>`}`,
  );
  document.getElementById("fWorld").onchange = (e) => {
    rankFilter.world = e.target.value;
    if (rankFilter.sect && byId(c.sects, rankFilter.sect)?.world !== rankFilter.world) rankFilter.sect = "";
    renderRank(by);
  };
  document.getElementById("fSect").onchange = (e) => {
    rankFilter.sect = e.target.value;
    if (rankFilter.sect) rankFilter.world = byId(c.sects, rankFilter.sect)?.world ?? rankFilter.world;
    renderRank(by);
  };
  document.getElementById("fClear")?.addEventListener("click", () => {
    rankFilter.world = rankFilter.sect = "";
    renderRank(by);
  });
}

// ---------------------------------------------------------------- Cẩm nang

// Hiệu ứng của một xuất thân: [chữ, lớp màu]
function originEffects(o) {
  const out = [[`Linh tài khởi đầu ${o.resources}`, ""]];
  if (o.sect === "member") out.push(["Là đệ tử tông môn từ đầu", "good"]);
  const b = o.bonus ?? {};
  const add = (v, label, invert = false) => v && out.push([`${label} ${v > 0 ? "+" : "−"}${Math.abs(v)}`, (v > 0) !== invert ? "good" : "bad"]);
  add(b.luck, "Khí vận");
  add(b.comprehension, "Ngộ tính");
  add(b.lifespan, "Thọ nguyên");
  add(b.virtue, "Thiện nghiệp");
  add(b.sin, "Ác nghiệp", true);
  return out;
}

// Cẩm nang › Luân hồi: hướng dẫn vòng đời một kiếp và nhân quả giữa các kiếp
function guideLuanHoi(c) {
  const sec = (glyph, title, body) => `<section class="guide-sec"><span class="guide-glyph">${glyph}</span><div><h3>${title}</h3>${body}</div></section>`;
  return `<div class="guide">
    ${sec("輪", "Một kiếp diễn ra thế nào", `<ol>
      <li><b>Đầu thai:</b> luân hồi bốc ngẫu nhiên giới diện, xuất thân, linh căn, thể chất, tư chất, ngộ tính, khí vận — cộng thêm nhân quả từ kiếp trước.</li>
      <li><b>Thức tỉnh:</b> có linh căn thì khoảng 8–14 tuổi bước vào Luyện Khí và <b>chọn đạo đồ</b>. Phàm căn sống đời người thường, trừ khi gặp kỳ ngộ khai mở linh căn.</li>
      <li><b>Tu hành:</b> năm tháng trôi, cơ duyên và kiếp nạn xen kẽ. Gặp ngã rẽ thì tự chọn; khảo hạch theo đạo đồ hiện ra khi nhập môn, nghe giảng, vấn tâm.</li>
      <li><b>Bình cảnh:</b> tu vi viên mãn thì phải đột phá — thử ngay, dùng linh tài hộ pháp (+10%), hay tích lũy thêm cho thể trạng hồi phục. Hóa Thần, Chân Tiên, Tiên Đế phải <b>độ thiên kiếp</b>: thất bại có thể hồn phi phách tán.</li>
      <li><b>Kết cục:</b> thọ nguyên cạn, tử nạn, hoặc <b>chứng đạo</b> ở đỉnh Tiên Đế. Bấm “Luân hồi” để bắt đầu kiếp mới; bỏ kiếp đang dở gọi là <i>luân hồi sớm</i>.</li></ol>`)}
    ${sec("命", "Bảo hiểm số mệnh", `<p>Xui liên tiếp <b>${c.rules?.pityLimit ?? 5} kiếp</b> (linh căn kém, tư chất thấp) thì kiếp kế tiếp chắc chắn được linh căn tốt. Không ai bị số phận bỏ rơi mãi.</p>`)}
    ${sec("業", "Nghiệp lực thiện / ác", `<p>Lựa chọn của ngươi để lại nghiệp: cứu người, trừ yêu, bố thí, tố giác phản đồ → <span class="good">thiện nghiệp</span>; đoạt bảo, luyện tà pháp, vu cáo đồng môn → <span class="bad">ác nghiệp</span> (thường kèm lợi lộc trước mắt).</p>
      <ul><li><b>Trong kiếp:</b> thiện ≥ 22 có <i>công đức kim quang</i>; thiện ≥ 20 giảm 25% nguy cơ chết khi độ kiếp. Ác ≥ 18 sinh <i>tâm ma</i>; ác ≥ 20 thiên lôi hung hơn; ác ≥ 30 bình cảnh khó qua.</li>
      <li><b>Sang kiếp sau:</b> nghiệp mỗi kiếp phai một nửa. Dư thiện thành <span class="good">phúc báo</span> (khí vận, đột phá); dư ác thành <span class="bad">nghiệp chướng</span>. Luân hồi sớm <b>không xóa</b> được ác nghiệp, và thiện nghiệp chỉ tính khi đi hết một đời.</li></ul>`)}
    ${sec("慧", "Túc tuệ", `<p>Cảnh giới đã tu ở các kiếp gần để lại ký ức đạo pháp (tối đa 60): ngộ tính cao hơn, linh căn thức tỉnh sớm hơn, và <b>đường quen +5%</b> khi đột phá cảnh giới mình từng đạt.</p>`)}
    ${sec("府", "Động phủ tiền kiếp", `<p>Kiếp đạt <b>Kim Đan</b> trở lên để lại một động phủ (một nửa linh tài lúc tọa hóa). Kiếp sau có thể lạc vào đó: <b>kế thừa</b> (linh tài, tu vi, pháp bảo +3% đột phá) hoặc <b>phong ấn lại</b> (thiện nghiệp, để dành cho kiếp sau nữa).</p>`)}
    ${sec("執", "Chấp niệm · Tiền duyên · Oan gia", `<ul>
      <li><b>Chấp niệm:</b> gục ngã ở cảnh giới nào (thiên kiếp, đột phá thất bại, hết thọ), kiếp sau mang chấp niệm: +5% khi thử lại; vượt qua thì chấp niệm tiêu tan — thưởng thọ nguyên, ngộ tính, khí vận.</li>
      <li><b>Tiền duyên:</b> kiếp trước có đạo lữ thì kiếp sau sẽ gặp lại <i>cố nhân</i> — nối duyên hay để duyên trôi là tùy ngươi.</li>
      <li><b>Oan gia:</b> gây ác nghiệp nặng (≥ 25) thì kiếp sau nạn nhân tìm đến đòi nợ: chuộc lỗi, nghênh chiến, hoặc (Phật tu) siêu độ.</li></ul>`)}
    ${sec("心", "Đạo tâm & rủi ro", `<p>Dám chọn phương án có hiểm nguy mà sống sót thì được <b>lịch luyện</b>: thêm tu vi và +1% đột phá mỗi lần (tối đa +5%). Né tránh mãi thì <b>đạo tâm thiếu tôi luyện</b> (−4% đột phá). Khí vận giúp tránh họa và đột phá dễ hơn, nhưng không thay được bản lĩnh.</p>`)}
    ${sec("峰", "Càng cao càng khó", `<p>Bình cảnh dày dần, tu luyện chậm dần, thiên kiếp hung dần theo cảnh giới (xem tab Cảnh giới). Đỉnh cao thường cần nhiều kiếp: hãy tích thiện, để lại động phủ, nuôi túc tuệ cho kiếp sau.</p>`)}
    ${sec("冊", "Sổ Sinh Tử", `<p>Mọi kiếp được ghi lại cùng nghiệp lực, những gì nhận vào và để lại, và nhân quả đang chờ kiếp sau. <a href="#/history">Mở Sổ Sinh Tử ›</a></p>`)}
  </div>`;
}

async function renderCodex(tab = "luanhoi") {
  const c = app.codex;
  const tabs = { luanhoi: "Luân hồi", paths: "Đạo đồ", realms: "Cảnh giới", roots: "Linh căn", physiques: "Thể chất", origins: "Xuất thân", worlds: "Giới diện", sects: "Môn phái", achievements: "Thành tựu" };
  const card = (title, body, locked = false, art = "") =>
    `<div class="card ${locked ? "locked" : ""} ${art ? "with-art" : ""}">${art ? `<div class="card-art">${art}</div>` : ""}<div class="card-body"><h3>${esc(title)}</h3><div class="muted small">${body}</div></div></div>`;
  const content = {
    luanhoi: () => guideLuanHoi(c),
    realms: () =>
      `<p class="muted small">Càng lên cao càng khó: bình cảnh dày hơn, tu luyện chậm dần, thiên kiếp hung hơn. Đỉnh cao thường phải tu qua nhiều kiếp — túc tuệ, phúc báo và động phủ của kiếp trước sẽ giúp kiếp sau đi xa hơn.</p>` +
      c.realms
        .map((r, i) =>
          card(
            `${i}. ${r.name}`,
            `<i>${REALM_LORE[r.id]?.lore ?? ""}</i><br/>${REALM_LORE[r.id]?.play ?? ""}<br/>` +
            (i === 0
              ? "Thọ nguyên của người thường."
              : `Thọ nguyên ~${fmt(r.lifespan)} năm · ${r.stages.length} tiểu cảnh giới (${r.stages.join(", ")})${r.tribulation ? " · <b>phải độ thiên kiếp</b>" : ""}${r.immortal ? " · tiên giới" : ""}
                ${r.wallBase != null ? `<div class="realm-diff"><span>Đột phá vào (cơ bản) <b>${r.wallBase}%</b></span><span>Tốc độ tu luyện <b>${r.speed}%</b> (so với Luyện Khí)</span>${r.storm ? `<span>Thiên kiếp hung <b>×${(r.storm / 100).toFixed(2)}</b></span>` : ""}</div>` : ""}`),
            false,
            avatarSvg(i, i % 2 ? "female" : "male", { seed: i, size: 76, animate: false, title: r.name }),
          ),
        )
        .join(""),
    sects: () => `<div class="card guide-card">${SECT_GUIDE}</div>` + c.worlds.map((w) => `<div class="card"><h3>${esc(w.name)}</h3>${c.sects.filter((x) => x.world === w.id).map((x) => `<div class="kv codex-sect"><span class="sflag">${flagSvg(x.id, x.glyph, { size: 40, wave: false })}</span><span class="k">${esc(x.name)}</span></div><div class="muted small" style="margin-bottom:6px">${esc(x.desc)}${x.perk ? `<br><span class="sect-perk">✦ ${esc(x.perk)}</span>` : ""}</div>`).join("")}</div>`).join(""),
    paths: () =>
      `<p class="muted small">Đạo đồ chọn một lần khi linh căn thức tỉnh và theo ngươi suốt kiếp. Mỗi câu khảo hạch trả lời đúng đều có thưởng theo đạo đồ; khảo hạch xuất hiện khi nhập môn, ở giảng đường tông môn, trước mỗi bình cảnh (vấn tâm: đúng thì +10% đột phá) và khi gặp kỳ nhân. Câu đã gặp sẽ được nhắc lại theo đường cong quên lãng.</p>` +
      c.paths
        .map((p) =>
          card(
            `${p.glyph} ${p.name}`,
            `${esc(p.desc)}<div class="fx-line good">${esc(p.perk)}</div><b>Hợp với:</b> ${esc(PATH_DETAIL[p.id]?.fit ?? "")}<br/><b>Nội dung khảo hạch:</b> ${esc(PATH_DETAIL[p.id]?.topics ?? "")}<div class="origin-fx"><span class="muted">Ngân hàng ${p.questions} câu hỏi</span></div>`,
            false,
            pathArt(p.id, p.glyph, 76),
          ),
        )
        .join(""),
    roots: () => {
      const total = c.roots.reduce((t, r) => t + r.weight, 0);
      const base = 0.35 + 0.48;
      return (
        `<p class="muted small">Linh căn quyết định ngươi có tu tiên được không và tu nhanh đến đâu. Tốc độ tu luyện tỉ lệ với (0,35 + điểm linh căn/100), nên linh căn tốt tu nhanh hơn hẳn; điểm linh căn cũng cộng thẳng vào tỉ lệ đột phá. Xui liên tiếp ${c.rules?.pityLimit ?? 5} kiếp thì kiếp sau chắc chắn có linh căn từ tam linh căn trở lên.</p>` +
        c.roots
          .map((r) =>
            card(
              r.name,
              `${esc(r.desc)}<br/>${ROOT_LORE[r.id] ?? ""}<div class="origin-fx">${
                r.score === 0
                  ? `<span class="bad">Không thể tu luyện</span>`
                  : `<span class="${r.score >= 48 ? "good" : ""}">Tốc độ tu luyện ${Math.round(((0.35 + r.score / 100) / base) * 100)}% (so với tam linh căn)</span><span class="good">Đột phá +${Math.round((r.score / 700) * 100)}%</span>`
              }<span class="muted">Điểm ${r.score} · tỉ lệ đầu thai ${Math.round((r.weight / total) * 1000) / 10}%</span></div>`,
              false,
              rootArt(r.id, 76),
            ),
          )
          .join("")
      );
    },
    physiques: () => {
      const total = c.physiques.reduce((t, r) => t + r.weight, 0);
      const fx = (p) => {
        const out = [];
        const mul = (v, label, goodWhenHigh = true) => v !== 1 && out.push([`${label} ×${v}`, (v > 1) === goodWhenHigh ? "good" : "bad"]);
        mul(p.speed, "Tốc độ tu luyện");
        mul(p.guard, "Thương tích nhận vào", false);
        mul(p.regen, "Hồi phục thể trạng");
        if (p.breakthrough) out.push([`Đột phá ${p.breakthrough > 0 ? "+" : "−"}${Math.round(Math.abs(p.breakthrough) * 100)}%`, p.breakthrough > 0 ? "good" : "bad"]);
        if (p.id === "thunder") out.push(["Nguy cơ chết khi độ kiếp ×0,6", "good"]);
        if (!out.length) out.push(["Không cộng không trừ", "muted"]);
        return out;
      };
      return (
        `<p class="muted small">Thể chất là căn cốt nhục thân, bốc ngẫu nhiên lúc đầu thai: ảnh hưởng tốc độ tu luyện, mức chịu thương, tốc độ hồi phục và tỉ lệ đột phá.</p>` +
        c.physiques
          .map((p) => card(p.name, `${esc(p.desc)}<br/>${PHYSIQUE_LORE[p.id] ?? ""}<div class="origin-fx">${fx(p).map(([t, cls]) => `<span class="${cls}">${esc(t)}</span>`).join("")}<span class="muted">Tỉ lệ đầu thai ${Math.round((p.weight / total) * 1000) / 10}%</span></div>`, false, bodyArt(p.id, 76)))
          .join("")
      );
    },
    origins: () =>
      `<p class="muted small">Xuất thân được luân hồi bốc ngẫu nhiên lúc đầu thai, quyết định linh tài khởi đầu và một vài lợi thế (hoặc gánh nặng) riêng.</p>` +
      c.origins.map((o) => card(o.name, `<i>${esc(o.text)}</i><br/>${esc(o.desc)}<div class="origin-fx">${originEffects(o).map((e) => `<span class="${e[1]}">${esc(e[0])}</span>`).join("")}<span class="muted">Tỉ lệ đầu thai ${o.chance}%</span></div>`, false, originArt(o.id, 76))).join(""),
    worlds: () =>
      `<p class="muted small"><b>Cơ duyên</b> nhân thẳng vào tốc độ tu luyện. <b>Hiểm họa</b> nhân vào khả năng gặp tai ương và kết cục xấu khi chọn liều. Giới diện bốc ngẫu nhiên lúc đầu thai; mỗi giới có môn phái riêng.</p>` +
      c.worlds
        .map((w) =>
          card(
            w.name,
            `${esc(w.desc)}<br/>${WORLD_LORE[w.id] ?? ""}<div class="origin-fx"><span class="${w.fortune >= 1.1 ? "good" : w.fortune < 1 ? "bad" : ""}">Cơ duyên ×${w.fortune} (tu luyện ${w.fortune >= 1 ? "+" : "−"}${Math.round(Math.abs(w.fortune - 1) * 100)}%)</span><span class="${w.danger <= 0.9 ? "good" : w.danger >= 1.3 ? "bad" : ""}">Hiểm họa ×${w.danger}</span></div><div class="muted small" style="margin-top:6px">Môn phái: ${c.sects.filter((x) => x.world === w.id).map((x) => esc(x.name)).join(", ")}</div>`,
            false,
            worldArt(w.id, WORLD_LOOK[w.id]?.glyph ?? "界", WORLD_LOOK[w.id]?.hue ?? 120, 76),
          ),
        )
        .join(""),
    achievements: () =>
      EMBLEM_GROUPS.map(([g, label]) => {
        const list = c.achievements.filter((a) => emblemGroup(a.id) === g);
        if (!list.length) return "";
        return `<div class="ach-group"><h3>${label}</h3><div class="ach-grid">${list
          .map((a) => {
            const got = app.me.achievements.includes(a.id);
            return `<div class="ach-card ${got ? "got" : "locked"}">${emblemSvg(a.id, { size: 64, locked: !got, title: a.name })}<div><b>${esc(a.name)}</b><div class="muted small">${esc(a.desc)}</div></div></div>`;
          })
          .join("")}</div></div>`;
      }).join(""),
  };
  $view.innerHTML = `<div class="page"><h1>Cẩm nang tiên lộ</h1><p class="muted">Hiểu căn cốt, biết cảnh giới và giới diện trước khi bước vào luân hồi.</p>
    <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button data-t="${k}" class="${k === tab ? "on" : ""}">${v}${k === "achievements" ? ` (${app.me.achievements.length}/${c.achievements.length})` : ""}</button>`).join("")}</div>
    <div class="cards">${content[tab]()}</div></div>`;
  $view.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => renderCodex(b.dataset.t)));
}

// ---------------------------------------------------------------- Tài khoản

function openAccount() {
  if (!app.me.isGuest) {
    const m = openModal(`<div class="head"><span>Tài khoản</span><button class="icon-btn" data-close>×</button></div><div class="body">
      <h2>${esc(app.me.name)}</h2><p class="muted">${esc(app.me.email)}</p>
      <div class="field"><label>Đạo hiệu</label><input id="newName" value="${esc(app.me.name)}" maxlength="32"/></div>
      <p class="err" id="accErr"></p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="rename">Lưu đạo hiệu</button><button class="btn ghost" id="signout">Đăng xuất</button>${app.me.isAdmin ? `<a class="btn ghost" href="#/admin" id="toAdmin">Trang quản trị</a>` : ""}</div></div>`);
    m.querySelector("#toAdmin")?.addEventListener("click", closeModal);
    m.querySelector("#rename").onclick = () =>
      guard("#accErr", async () => {
        await api("/api/auth/update-user", { method: "POST", body: { name: m.querySelector("#newName").value.trim() || app.me.name } });
        await refreshMe();
        closeModal();
        toast("Đã đổi đạo hiệu.");
      });
    m.querySelector("#signout").onclick = () =>
      guard("#accErr", async () => {
        await api("/api/auth/sign-out", { method: "POST", body: {} });
        await api("/api/auth/sign-in/anonymous", { method: "POST", body: {} });
        await refreshMe();
        closeModal();
        route();
      });
    return;
  }
  const n = app.me.stats.total_runs;
  const m = openModal(`<div class="head"><span>Lưu danh tiên lộ</span><button class="icon-btn" data-close>×</button></div><div class="body">
    <h2>Lưu tiến trình</h2>
    <p class="muted small">${n ? `${n} kiếp đã qua, thành tựu và kỷ lục của ngươi sẽ được chuyển vào tài khoản.` : "Tạo tài khoản để giữ tiến trình và chơi trên nhiều thiết bị."} Nếu đăng nhập vào tài khoản đã có, dữ liệu hai bên sẽ được gộp lại.</p>
    <div class="tabs"><button data-mode="up" class="on">Đăng ký</button><button data-mode="in">Đăng nhập</button></div>
    ${app.codex.google ? `<button class="btn ghost google" id="google">Tiếp tục với Google</button><div class="divider">hoặc dùng email</div>` : ""}
    <div class="field" id="nameField"><label>Đạo hiệu</label><input id="name" maxlength="32" placeholder="Tên hiển thị trên bảng xếp hạng"/></div>
    <div class="field"><label>Email</label><input id="email" type="email" autocomplete="email"/></div>
    <div class="field"><label>Mật khẩu</label><input id="pw" type="password" autocomplete="new-password" placeholder="Ít nhất 8 ký tự"/></div>
    <p class="err" id="accErr"></p>
    <button class="btn" id="submit" style="width:100%">Đăng ký &amp; lưu tiến trình</button></div>`);
  let mode = "up";
  m.querySelectorAll(".tabs button").forEach(
    (b) =>
      (b.onclick = () => {
        mode = b.dataset.mode;
        m.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
        m.querySelector("#nameField").classList.toggle("hidden", mode === "in");
        m.querySelector("#submit").textContent = mode === "up" ? "Đăng ký & lưu tiến trình" : "Đăng nhập & gộp tiến trình";
        m.querySelector("#pw").autocomplete = mode === "up" ? "new-password" : "current-password";
      }),
  );
  m.querySelector("#google")?.addEventListener("click", () =>
    guard("#accErr", async () => {
      const r = await api("/api/auth/sign-in/social", { method: "POST", body: { provider: "google", callbackURL: `${location.origin}/#/play` } });
      if (r?.url) location.href = r.url;
    }),
  );
  m.querySelector("#submit").onclick = () =>
    guard("#accErr", async () => {
      const email = m.querySelector("#email").value.trim();
      const password = m.querySelector("#pw").value;
      if (mode === "up") {
        const name = m.querySelector("#name").value.trim() || "Đạo hữu";
        await api("/api/auth/sign-up/email", { method: "POST", body: { name, email, password } });
      } else {
        await api("/api/auth/sign-in/email", { method: "POST", body: { email, password } });
      }
      await refreshMe();
      closeModal();
      toast(`Đã lưu tiến trình: ${app.me.stats.total_runs} kiếp trong tài khoản.`, 3500);
      route();
    });
}

async function guard(errSel, fn) {
  const err = document.querySelector(errSel);
  if (err) err.textContent = "";
  try {
    await fn();
  } catch (e) {
    if (err) err.textContent = e.message;
    else toast(e.message);
  }
}

// ---------------------------------------------------------------- Modal

function openModal(html, { dismissable = true } = {}) {
  closeModal();
  const ov = document.createElement("div");
  ov.className = "overlay";
  ov.id = "overlay";
  ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  if (dismissable) {
    ov.addEventListener("click", (e) => e.target === ov && closeModal());
    ov.querySelector("[data-close]")?.addEventListener("click", closeModal);
  }
  document.body.append(ov);
  return ov;
}

// Lựa chọn trong lúc chơi hiện NGAY TRONG dòng thời gian (không che màn hình); nơi khác thì dùng hộp nổi
const isDock = () => matchMedia("(max-width: 900px)").matches;

function openDecision(html) {
  const host = document.getElementById("decision");
  if (!host) return openModal(html, { dismissable: false });
  closeModal();
  const key = app.run?.pending ? `${app.run.id}:${app.run.step}` : "";
  const box = document.createElement("div");
  box.id = "overlay";
  box.className = "decision";
  box.innerHTML = `<div class="modal" role="region" aria-label="Lựa chọn">${html}</div>`;
  // Nút thu gọn trên dòng tiêu đề; bấm cả dòng tiêu đề cũng được
  const head = box.querySelector(".head");
  if (head) {
    head.insertAdjacentHTML("beforeend", `<button class="dec-toggle" type="button" aria-expanded="true">Thu gọn ▾</button>`);
    head.insertAdjacentHTML("afterbegin", `<span class="dec-dot" aria-hidden="true"></span>`);
    head.addEventListener("click", (e) => {
      if (e.target.closest("button:not(.dec-toggle)")) return;
      setCollapsed(box, !box.classList.contains("collapsed"), key);
    });
  }
  host.replaceChildren(box);
  setCollapsed(box, app.collapsedKey === key && !!key, key);
  if (isDock()) {
    // Điện thoại: khung neo ngay trên thanh điều hướng, chừa chỗ để nội dung không bị che
    document.body.classList.add("has-dock");
    app.dockObserver?.disconnect();
    app.dockObserver = new ResizeObserver(() => document.documentElement.style.setProperty("--dock-h", `${box.offsetHeight}px`));
    app.dockObserver.observe(box);
  } else {
    box.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }
  return box;
}

function setCollapsed(box, collapsed, key) {
  box.classList.toggle("collapsed", collapsed);
  app.collapsedKey = collapsed ? key : null;
  const t = box.querySelector(".dec-toggle");
  if (t) {
    t.textContent = collapsed ? "Mở ▴" : "Thu gọn ▾";
    t.setAttribute("aria-expanded", String(!collapsed));
  }
}

function closeModal() {
  document.getElementById("overlay")?.remove();
  document.body.classList.remove("has-dock");
  app.dockObserver?.disconnect();
}

// ---------------------------------------------------------------- Luận đạo (đấu trực tiếp)

const RANKS = [
  [1400, "Đạo tôn"],
  [1250, "Tông sư"],
  [1100, "Chân truyền"],
  [950, "Nhập thất"],
  [0, "Sơ học"],
];
const rankTitle = (r) => RANKS.find(([min]) => r >= min)[1];
const wsUrl = (path) => `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}${path}`;

const duel = {
  queueWs: null,
  roomWs: null,
  roomId: null,
  timer: null,
  offset: 0, // đồng hồ máy chủ − đồng hồ máy
  q: null, // câu hiện tại
  picked: null,
  scores: [0, 0],
  you: null,
  opp: null,
  ended: false,
  retries: 0,
};

function closeDuel() {
  clearInterval(duel.timer);
  duel.timer = null;
  for (const k of ["queueWs", "roomWs"]) {
    try {
      duel[k]?.close(1000, "leave");
    } catch {}
    duel[k] = null;
  }
  duel.roomId = null;
}

async function renderDuel() {
  const me = await api("/api/duel/me");
  const s = me.stats;
  const result = { win: "Thắng", lose: "Thua", draw: "Hòa" };
  $view.innerHTML = `<div class="page duel-lobby">
    <h1>Luận đạo</h1>
    <p class="muted">Đấu trực tiếp 5 câu khảo hạch với một đạo hữu khác. Đúng và nhanh thì nhiều điểm hơn.</p>
    <div class="duel-card">
      <div><div class="muted small">ĐẠO VỊ</div><div class="duel-rating">${fmt(me.rating)}</div><div class="realm" style="--hue:45">${esc(rankTitle(me.rating))}</div></div>
      <div class="duel-stats"><span><b>${s.wins}</b> thắng</span><span><b>${s.losses}</b> thua</span><span><b>${s.draws}</b> hòa</span>${me.rank ? `<span>Hạng <b>${me.rank}</b></span>` : ""}</div>
    </div>
    ${me.guest ? `<div class="nudge">Ngươi đang là khách: được luận đạo thử nhưng <b>chưa tính Đạo vị</b>. <a href="#" id="duelSave">Lưu tiến trình</a> để lên bảng xếp hạng.</div>` : ""}
    ${me.guest ? "" : `<p class="muted small">Mỗi trận thắng xếp hạng: <b>+3 điểm tỷ võ</b> cho môn phái của nhân vật đang tu hành (hòa +1). <a href="#/sects">Xem môn phái ›</a></p>`}
    <button class="btn big" id="findMatch" style="margin:20px 0 8px">Tìm đối thủ</button>
    <div class="friend-box">
      <h3>Đấu với bạn</h3>
      <p class="muted small">Tạo phòng rồi gửi mã, link hoặc mã QR cho bạn. Trận giao hữu, không tính Đạo vị.</p>
      <div class="friend-row">
        <button class="btn ghost" id="hostRoom">Tạo phòng mời bạn</button>
        <form id="joinForm" class="join-form"><input id="joinCode" maxlength="8" placeholder="Nhập mã phòng" autocomplete="off" autocapitalize="characters" aria-label="Mã phòng"/><button class="btn" type="submit">Vào phòng</button></form>
      </div>
    </div>
    <h3 style="margin-top:12px">Trận gần đây</h3>
    ${
      me.recent.length
        ? `<div class="list">${me.recent
            .map(
              (r) => `<div class="item"><div class="no ${r.result === "win" ? "top" : ""}">${r.result === "win" ? "勝" : r.result === "lose" ? "敗" : "和"}</div>
                <div class="main"><div class="title">${esc(r.opponent)}</div><div class="sub">${result[r.result]} · ${r.my_score} – ${r.opp_score}</div></div>
                <div class="${r.delta > 0 ? "good" : r.delta < 0 ? "bad" : "muted"}">${r.delta > 0 ? "+" : ""}${r.delta || ""}</div></div>`,
            )
            .join("")}</div>`
        : `<div class="empty">Chưa có trận nào.</div>`
    }</div>`;
  document.getElementById("findMatch").onclick = findMatch;
  document.getElementById("hostRoom").onclick = hostRoom;
  document.getElementById("joinForm").onsubmit = (e) => {
    e.preventDefault();
    joinRoom(document.getElementById("joinCode").value);
  };
  document.getElementById("duelSave")?.addEventListener("click", (e) => {
    e.preventDefault();
    openAccount();
  });
}

function findMatch() {
  closeDuel();
  const started = Date.now();
  $view.innerHTML = `<div class="duel-search">
    <div class="seal-spin">論</div>
    <h2>Đang tìm đạo hữu…</h2>
    <div class="muted" id="searchTime">0 giây</div>
    <button class="btn ghost" id="cancelSearch" style="margin-top:24px">Huỷ</button></div>`;
  duel.timer = setInterval(() => {
    const el = document.getElementById("searchTime");
    if (el) el.textContent = `${Math.floor((Date.now() - started) / 1000)} giây`;
  }, 500);
  document.getElementById("cancelSearch").onclick = () => {
    closeDuel();
    renderDuel();
  };
  const ws = new WebSocket(wsUrl("/api/duel/queue"));
  duel.queueWs = ws;
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.type === "matched") {
      duel.queueWs = null;
      clearInterval(duel.timer);
      enterRoom(m.roomId);
    }
  };
  ws.onclose = (e) => {
    if (duel.queueWs === ws && e.code !== 1000) {
      toast("Mất kết nối khi tìm trận.");
      closeDuel();
      renderDuel();
    }
  };
}

function enterRoom(roomId) {
  duel.roomId = roomId;
  duel.ended = false;
  duel.retries = 0;
  duel.q = null;
  duel.scores = [0, 0];
  $view.innerHTML = `<div class="duel-room">
    <div class="duel-vs">
      <div class="fighter" id="fYou"></div>
      <div class="vs"><div class="duel-score" id="score">0 – 0</div><div class="muted small" id="phase">Đang vào trận…</div></div>
      <div class="fighter right" id="fOpp"></div>
    </div>
    <div class="duel-stage" id="stage"><div class="duel-countdown">…</div></div>
  </div>`;
  connectRoom();
}

function connectRoom() {
  const ws = new WebSocket(wsUrl(`/api/duel/room/${duel.roomId}`));
  duel.roomWs = ws;
  ws.onmessage = (e) => onRoomMsg(JSON.parse(e.data));
  ws.onclose = (e) => {
    if (duel.roomWs !== ws || duel.ended || e.code === 4001) return;
    // Rớt mạng: thử vào lại phòng
    if (duel.retries++ < 5) {
      setPhase("Mất kết nối, đang vào lại…");
      setTimeout(() => duel.roomId && connectRoom(), 1000 * duel.retries);
    } else {
      toast("Không vào lại được trận.");
      closeDuel();
      renderDuel();
    }
  };
}

const remaining = (endsAt) => Math.max(0, endsAt - (Date.now() + duel.offset));
const setPhase = (t) => {
  const el = document.getElementById("phase");
  if (el) el.textContent = t;
};

function fighterHtml(f, side) {
  const seed = nameSeed(f.name);
  return `<div class="avatar av">${avatarSvg(f.realm ?? 0, seed % 2 ? "female" : "male", { seed, size: 44, animate: false })}</div><div class="fname">${esc(f.name)}${f.bot ? ' <span class="muted small">(tàn ảnh)</span>' : ""}</div>
    ${f.title ? `<div class="chief-tag line">掌 ${esc(f.title)}</div>` : ""}
    <div class="muted small line">${f.guest ? "Khách" : `${fmt(f.rating)}<span class="rk"> · ${esc(rankTitle(f.rating))}</span>`}</div>
    <div class="muted small line realm-line">${esc(app.codex.realms[f.realm]?.name ?? "")}</div>
    ${side === "opp" ? `<div class="opp-status" id="oppStatus"></div>` : ""}`;
}

function onRoomMsg(m) {
  if (m.now) duel.offset = m.now - Date.now();
  const stage = document.getElementById("stage");
  if (!stage) return;
  switch (m.type) {
    case "state":
      duel.retries = 0;
      duel.you = m.you;
      duel.opp = m.opp;
      duel.scores = m.scores;
      document.getElementById("fYou").innerHTML = fighterHtml(m.you, "you");
      document.getElementById("fOpp").innerHTML = fighterHtml(m.opp, "opp");
      updateScore();
      setOppStatus(m.opp.connected ? "" : "Chưa vào trận");
      if (m.phase === "waiting") setPhase("Chờ đối thủ vào trận…");
      if (m.phase === "cancelled") onRoomMsg({ type: "cancelled", reason: "Trận đã bị huỷ." });
      break;
    case "countdown": {
      setPhase("Chuẩn bị");
      clearInterval(duel.timer);
      const tick = () => {
        const s = Math.ceil(remaining(m.endsAt) / 1000);
        stage.innerHTML = `<div class="duel-countdown">${s > 0 ? s : "Bắt đầu!"}</div>`;
      };
      tick();
      duel.timer = setInterval(tick, 200);
      break;
    }
    case "question":
      showQuestion(m);
      break;
    case "you_answered":
      setPhase("Đã chọn — chờ đối thủ…");
      break;
    case "opp_answered":
      setOppStatus("✓ Đã trả lời");
      break;
    case "opp_status":
      setOppStatus(m.connected ? "" : "Mất kết nối…");
      break;
    case "reveal":
      showReveal(m);
      break;
    case "end":
      showEnd(m);
      break;
    case "cancelled":
      duel.ended = true;
      clearInterval(duel.timer);
      stage.innerHTML = `<div class="duel-end"><h2>Trận bị huỷ</h2><p class="muted">${esc(m.reason)}</p><button class="btn" id="again">Tìm trận khác</button></div>`;
      document.getElementById("again").onclick = findMatch;
      break;
  }
}

function setOppStatus(t) {
  const el = document.getElementById("oppStatus");
  if (el) el.textContent = t || "Đang suy nghĩ…";
}

function updateScore() {
  const el = document.getElementById("score");
  if (el) el.textContent = `${duel.scores[0]} – ${duel.scores[1]}`;
}

function showQuestion(m) {
  duel.q = m;
  duel.picked = null;
  clearInterval(duel.timer);
  setPhase(`Câu ${m.index + 1}/${m.total}`);
  setOppStatus(m.answered?.[1] ? "✓ Đã trả lời" : "");
  const stage = document.getElementById("stage");
  stage.innerHTML = `<div class="duel-timer"><i id="timeBar"></i></div>
    <div class="muted small">Câu ${m.index + 1}/${m.total} · ${"★".repeat(m.level)}</div>
    <h2 class="quiz-q">${esc(m.prompt)}</h2>
    <div>${m.options
      .map((o, i) => `<button class="option quiz-opt" data-id="${esc(o.id)}"><span class="n">${"ABCD"[i]}</span><span>${esc(o.text)}</span><span class="mark"></span></button>`)
      .join("")}</div>`;
  stage.querySelectorAll(".quiz-opt").forEach(
    (b) =>
      (b.onclick = () => {
        if (duel.picked) return;
        duel.picked = b.dataset.id;
        b.classList.add("picked");
        stage.querySelectorAll(".quiz-opt").forEach((x) => (x.disabled = true));
        duel.roomWs?.send(JSON.stringify({ type: "answer", index: m.index, choiceId: b.dataset.id }));
      }),
  );
  const total = m.endsAt - m.now;
  const bar = () => {
    const left = remaining(m.endsAt);
    const el = document.getElementById("timeBar");
    if (el) {
      el.style.width = `${(left / total) * 100}%`;
      el.classList.toggle("low", left < 4000);
    }
    if (left <= 0) {
      clearInterval(duel.timer);
      stage.querySelectorAll(".quiz-opt").forEach((x) => (x.disabled = true));
      if (!duel.picked) setPhase("Hết giờ");
    }
  };
  bar();
  duel.timer = setInterval(bar, 100);
  if (m.answered?.[0]) {
    duel.picked = "?";
    stage.querySelectorAll(".quiz-opt").forEach((x) => (x.disabled = true));
    setPhase("Đã chọn — chờ đối thủ…");
  }
}

function showReveal(m) {
  clearInterval(duel.timer);
  duel.scores = m.scores;
  updateScore();
  setPhase(m.last ? "Tổng kết…" : "Chờ câu tiếp");
  const stage = document.getElementById("stage");
  stage.querySelectorAll(".quiz-opt").forEach((b) => {
    b.disabled = true;
    if (b.dataset.id === m.answer) b.classList.add("right");
    else if (b.dataset.id === m.you.choiceId) b.classList.add("wrong");
    if (m.opp.choiceId && b.dataset.id === m.opp.choiceId) b.querySelector("span:nth-child(2)").insertAdjacentHTML("beforeend", ` <span class="opp-pick">${esc(duel.opp?.name.split(" ").pop() ?? "Đối thủ")}</span>`);
  });
  const pts = (x) => (x.ok ? `<span class="good">+${x.points}</span>` : `<span class="bad">0</span>`);
  stage.insertAdjacentHTML(
    "beforeend",
    `<div class="quiz-result ${m.you.ok ? "ok" : "no"}"><b>${m.you.ok ? "✓ Đúng" : m.you.choiceId ? "✗ Sai" : "Hết giờ"}</b> · ngươi ${pts(m.you)} · đối thủ ${pts(m.opp)}<p>${esc(m.explain)}</p></div>`,
  );
  const bar = document.getElementById("timeBar");
  if (bar) bar.style.width = "0";
}

async function showEnd(m) {
  duel.ended = true;
  clearInterval(duel.timer);
  duel.scores = m.scores;
  updateScore();
  setPhase("Kết thúc");
  const title = { win: "Thắng", lose: "Thua", draw: "Hòa" }[m.result];
  const glyph = { win: "勝", lose: "敗", draw: "和" }[m.result];
  document.getElementById("stage").innerHTML = `<div class="duel-end ${m.result}">
    <div class="glyph">${glyph}</div><h2>${title}</h2>
    <div class="muted">${m.scores[0]} – ${m.scores[1]} điểm · đúng ${m.correct[0]}/${duel.q?.total ?? 5} câu</div>
    ${
      m.friendly
        ? `<div class="muted" style="margin:10px 0">Trận giao hữu — không tính Đạo vị.</div>`
        : m.ranked
        ? `<div class="duel-delta ${m.delta >= 0 ? "good" : "bad"}">${m.delta >= 0 ? "+" : ""}${m.delta} Đạo vị → ${fmt(m.rating)} · ${esc(rankTitle(m.rating))}</div>`
        : `<div class="nudge">Trận đấu thử của khách không tính Đạo vị. <a href="#" id="endSave">Lưu tiến trình</a> để lên bảng xếp hạng.</div>`
    }
    <div class="actions"><button class="btn" id="again">${m.friendly ? "Tạo phòng mời lại" : "Đấu tiếp"}</button><button class="btn ghost" id="lobby">Về sảnh</button></div></div>`;
  document.getElementById("again").onclick = m.friendly ? hostRoom : findMatch;
  document.getElementById("lobby").onclick = () => {
    closeDuel();
    renderDuel();
  };
  document.getElementById("endSave")?.addEventListener("click", (e) => {
    e.preventDefault();
    openAccount();
  });
  try {
    duel.roomWs?.close(1000, "done");
  } catch {}
  duel.roomWs = null;
}

// ---------------------------------------------------------------- Mời bạn: mã phòng, QR, link

const QR_LIB = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
let qrLoading = null;
function loadQr() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  qrLoading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = QR_LIB;
    s.onload = () => resolve(window.qrcode);
    s.onerror = () => reject(new Error("Không tải được thư viện mã QR"));
    document.head.append(s);
  });
  return qrLoading;
}

const inviteUrl = (code) => `${location.origin}/#/duel/join/${code}`;

function hostRoom() {
  closeDuel();
  $view.innerHTML = `<div class="duel-search"><div class="seal-spin">邀</div><h2>Đang mở phòng…</h2></div>`;
  const ws = new WebSocket(wsUrl("/api/duel/queue?mode=host"));
  duel.queueWs = ws;
  ws.onmessage = async (e) => {
    const m = JSON.parse(e.data);
    if (m.type === "hosting") {
      duel.offset = m.now - Date.now();
      showInvite(m.code, m.expiresAt);
    }
    if (m.type === "matched") {
      duel.queueWs = null;
      clearInterval(duel.timer);
      toast("Bạn đã vào phòng — bắt đầu luận đạo!");
      enterRoom(m.roomId);
    }
    if (m.type === "expired") {
      duel.queueWs = null;
      clearInterval(duel.timer);
      $view.innerHTML = `<div class="duel-search"><h2>Mã phòng đã hết hạn</h2><p class="muted">${esc(m.reason)}</p>
        <button class="btn" id="reHost">Tạo phòng mới</button> <button class="btn ghost" id="toLobby">Về sảnh</button></div>`;
      document.getElementById("reHost").onclick = hostRoom;
      document.getElementById("toLobby").onclick = renderDuel;
    }
  };
  ws.onclose = (e) => {
    if (duel.queueWs === ws && e.code !== 1000) {
      toast("Mất kết nối, phòng đã đóng.");
      closeDuel();
      renderDuel();
    }
  };
}

async function showInvite(code, expiresAt) {
  const url = inviteUrl(code);
  $view.innerHTML = `<div class="page invite">
    <h1>Mời bạn luận đạo</h1>
    <p class="muted">Gửi mã, link hoặc cho bạn quét mã QR. Trận giao hữu — không tính Đạo vị.</p>
    <div class="invite-card">
      <div class="invite-code" aria-label="Mã phòng">${[...code].map((c) => `<span>${c}</span>`).join("")}</div>
      <div class="invite-qr" id="qr"><div class="muted small">Đang tạo mã QR…</div></div>
      <div class="invite-link"><input readonly value="${esc(url)}" id="inviteUrl" aria-label="Link mời"/></div>
      <div class="invite-actions">
        <button class="btn" id="shareInvite">Chia sẻ link</button>
        <button class="btn ghost" id="copyInvite">Sao chép</button>
      </div>
      <div class="invite-wait"><span class="dec-dot"></span> Đang chờ bạn vào phòng · còn <b id="ttl">10:00</b></div>
    </div>
    <button class="btn ghost" id="cancelHost" style="margin-top:16px">Huỷ phòng</button>
  </div>`;
  const ttl = () => {
    const left = Math.max(0, expiresAt - (Date.now() + duel.offset));
    const el = document.getElementById("ttl");
    if (el) el.textContent = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`;
  };
  ttl();
  duel.timer = setInterval(ttl, 1000);
  document.getElementById("cancelHost").onclick = () => {
    closeDuel();
    renderDuel();
  };
  document.getElementById("copyInvite").onclick = async () => {
    try {
      await navigator.clipboard.writeText(`Luận đạo với ta trên Tu Tiên Lộ! Mã phòng: ${code} — ${url}`);
      toast("Đã sao chép lời mời.");
    } catch {
      document.getElementById("inviteUrl").select();
    }
  };
  document.getElementById("shareInvite").onclick = async () => {
    const text = `Luận đạo với ta trên Tu Tiên Lộ! Mã phòng: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Tu Tiên Lộ — Luận đạo", text, url });
      } catch {}
    } else document.getElementById("copyInvite").click();
  };
  try {
    const qrcode = await loadQr();
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    const box = document.getElementById("qr");
    if (box) box.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  } catch (e) {
    const box = document.getElementById("qr");
    if (box) box.innerHTML = `<div class="muted small">${esc(e.message)}</div>`;
  }
}

function joinRoom(rawCode) {
  closeDuel();
  const code = String(rawCode ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code) return renderDuel();
  // Bỏ mã khỏi địa chỉ để tải lại trang không cố vào lại phòng đã dùng
  if (location.hash.startsWith("#/duel/join")) history.replaceState(null, "", "#/duel");
  $view.innerHTML = `<div class="duel-search"><div class="seal-spin">入</div><h2>Đang vào phòng ${esc(code)}…</h2></div>`;
  const ws = new WebSocket(wsUrl(`/api/duel/queue?mode=join&code=${encodeURIComponent(code)}`));
  duel.queueWs = ws;
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.type === "matched") {
      duel.queueWs = null;
      enterRoom(m.roomId);
    }
    if (m.type === "error") {
      duel.queueWs = null;
      $view.innerHTML = `<div class="duel-search"><h2>Không vào được phòng</h2><p class="muted">${esc(m.reason)}</p>
        <button class="btn" id="toLobby">Về sảnh Luận đạo</button></div>`;
      document.getElementById("toLobby").onclick = renderDuel;
    }
  };
}

// ---------------------------------------------------------------- Bản đồ thế giới

const WORLD_LOOK = {
  peaceful: { glyph: "平", hue: 150 },
  abundant: { glyph: "靈", hue: 190 },
  turmoil: { glyph: "亂", hue: 25 },
  wild: { glyph: "荒", hue: 90 },
  declining: { glyph: "末", hue: 40 },
  hidden: { glyph: "隱", hue: 260 },
  blood: { glyph: "血", hue: 0 },
  shattered: { glyph: "殘", hue: 220 },
};

async function renderWorld(selected) {
  const data = await api("/api/world");
  const view = store("tt-world-view") === "list" ? "list" : "map";
  const c = app.codex;
  const realmName = (i) => (i === null || i === undefined ? "—" : c.realms[i]?.name ?? "—");
  const pick = selected ?? store("tt-world") ?? data.worlds.slice().sort((a, b) => b.players - a.players)[0]?.id ?? "peaceful";
  const t = data.totals;
  $view.innerHTML = `<div class="page world-page">
    <h1>Bản đồ vạn giới</h1>
    <p class="muted">Thiên địa hiện có <b>${fmt(t.players ?? 0)}</b> tu sĩ đã trải qua <b>${fmt(t.lives ?? 0)}</b> kiếp · <b>${fmt(t.active ?? 0)}</b> người đang tu hành. Chọn một giới diện để xem môn phái và cao thủ.</p>
    ${view === "list" ? `<div class="world-map">${data.worlds
      .map((w) => {
        const def = byId(c.worlds, w.id);
        const look = WORLD_LOOK[w.id] ?? { glyph: "界", hue: 120 };
        return `<button class="world-tile ${w.id === pick ? "on" : ""}" data-id="${w.id}" style="--hue:${look.hue}">
          <span class="wglyph">${look.glyph}</span>
          <span class="wname">${esc(def.name)}</span>
          <span class="wstat"><b>${fmt(w.players)}</b> tu sĩ${w.active ? ` · <i class="live"></i>${fmt(w.active)}` : ""}</span>
        </button>`;
      })
      .join("")}</div><p><button class="btn ghost small" id="toSandbox">Xem bản đồ</button></p>` : `<div class="wm-host" id="wmHost"></div><p class="wm-under"><button class="btn ghost small" id="toList">Xem dạng danh sách</button></p>`}
    <div id="worldDetail"></div>
  </div>`;
  const select = (id, scroll = false) => {
    store("tt-world", id);
    $view.querySelectorAll(".world-tile").forEach((x) => x.classList.toggle("on", x.dataset.id === id));
    detail(id);
    if (scroll) document.getElementById("worldDetail").scrollIntoView({ behavior: "smooth", block: "start" });
  };
  $view.querySelectorAll(".world-tile").forEach((b) => (b.onclick = () => select(b.dataset.id)));
  document.getElementById("toSandbox")?.addEventListener("click", () => {
    store("tt-world-view", "map");
    renderWorld(pick);
  });
  document.getElementById("toList")?.addEventListener("click", () => {
    store("tt-world-view", "list");
    renderWorld(pick);
  });
  const host = document.getElementById("wmHost");
  if (host) createWorldMap(host, { data, codex: c, esc, fmt, realmName, onSelect: (id, scroll) => select(id, scroll) });
  select(pick);

  function detail(id) {
    const w = data.worlds.find((x) => x.id === id);
    const def = byId(c.worlds, id);
    const look = WORLD_LOOK[id] ?? { hue: 120 };
    const maxPower = Math.max(1, ...w.sects.map((x) => Number(x.power)));
    const sectDef = (sid) => c.sects.find((x) => x.id === sid);
    document.getElementById("worldDetail").innerHTML = `<section class="world-detail" style="--hue:${look.hue}">
      <div class="wd-head"><span class="wglyph big">${look.glyph}</span><div><h2>${esc(def.name)}</h2><div class="muted small">${esc(def.desc)} · Hiểm họa ×${def.danger} · Cơ duyên ×${def.fortune}</div></div></div>
      <div class="wd-stats">
        <div><small>Tu sĩ</small><b>${fmt(w.players)}</b></div>
        <div><small>Đang tu hành</small><b>${fmt(w.active)}</b></div>
        <div><small>Số kiếp</small><b>${fmt(w.lives)}</b></div>
        <div><small>Thọ trung bình</small><b>${w.avgAge ? fmt(w.avgAge) : "—"}</b></div>
        <div><small>Thọ cao nhất</small><b>${w.maxAge ? fmt(w.maxAge) : "—"}</b></div>
        <div><small>Cảnh giới cao nhất</small><b>${esc(realmName(w.topRealm))}</b></div>
      </div>
      <h3>Môn phái</h3>
      <div class="sect-list">${w.sects
        .map(
          (s, i) => `<div class="sect-row">
            <div class="sect-rank ${i === 0 && s.power ? "first" : ""}">${i + 1}</div>
            <span class="sflag">${flagSvg(s.id, sectDef(s.id)?.glyph ?? "", { size: 46, wave: false, title: `Cờ ${sectDef(s.id)?.name ?? ""}` })}</span>
            <div class="main"><div class="title">${esc(sectDef(s.id)?.name ?? s.id)}${i === 0 && s.power ? ' <span class="crown">mạnh nhất</span>' : ""}</div>
              <div class="sub">${esc(sectDef(s.id)?.desc ?? "")}</div>
              <div class="power"><i style="width:${(Number(s.power) / maxPower) * 100}%"></i></div>
              <div class="sub">${fmt(s.members)} đệ tử · ${fmt(s.elders)} trưởng lão · đỉnh cao ${esc(realmName(s.topRealm))}</div>
              ${s.chief ? `<div class="sub chief">掌 Chưởng môn: <b>${esc(s.chief.name)}</b> — ${esc(realmName(s.chief.realm))}</div>` : ""}
              <div class="sub"><a href="#/sects/${s.id}">Chính sự môn phái ›</a></div>
              <div class="sub leader">${s.leader ? `Mạnh nhất: <b>${esc(s.leader.name)}</b> — ${esc(realmName(s.leader.realm))}, ${fmt(s.leader.age)} tuổi${s.leader.rank === "elder" ? " · trưởng lão" : ""}` : "Chưa có đệ tử nào."}</div></div>
            <div class="sect-power"><b>${fmt(s.power)}</b><small>thế lực</small></div>
          </div>`,
        )
        .join("")}</div>
      <h3>Cao thủ ${esc(def.name)}</h3>
      ${
        w.top.length
          ? `<div class="list">${w.top
              .map(
                (p, i) => `<div class="item"><div class="no ${i === 0 ? "top" : ""}">${i + 1}</div>
                  <div class="main"><div class="title">${esc(p.name)}</div><div class="sub">${fmt(p.age)} tuổi${p.sect ? ` · ${esc(sectDef(p.sect)?.name ?? "")}` : " · tán tu"}</div></div>
                  <div class="realm" style="--hue:${HUES[p.realm] ?? 45}">${esc(realmName(p.realm))}</div></div>`,
              )
              .join("")}</div>`
          : `<div class="empty">Chưa ai luân hồi vào giới này.</div>`
      }
      <p class="muted small">Thế lực môn phái = tổng (cảnh giới + 1)² của kiếp tốt nhất mỗi đệ tử. Số liệu cập nhật mỗi phút.</p>
    </section>`;
  }
}

// ---------------------------------------------------------------- Quản trị: báo cáo + cấu hình

const ddmm = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

// Cột theo ngày, một chuỗi số liệu: 1 màu nhấn, đầu cột bo 4px, khe 2px, lưới mờ, tooltip khi rê, kèm bảng số liệu
function barChart(title, data, unit) {
  const W = 600, H = 170, padL = 30, padB = 22, padT = 8;
  const max = Math.max(1, ...data.map((p) => p.n));
  // Mốc trục là số nguyên: 0, nửa, đỉnh
  const nice = max <= 4 ? 4 : Math.ceil(max / 2 / 5) * 10;
  const bw = (W - padL) / data.length;
  const y = (v) => padT + (H - padT - padB) * (1 - v / nice);
  const grid = [0, nice / 2, nice]
    .map((v) => `<line x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${padL - 6}" y="${y(v) + 4}" class="axis" text-anchor="end">${fmt(v)}</text>`)
    .join("");
  const step = Math.ceil(data.length / 7);
  const bars = data
    .map((p, i) => {
      const x = padL + i * bw + 1;
      const w = Math.max(2, bw - 2);
      const top = y(p.n);
      const h = y(0) - top;
      const r = Math.min(4, w / 2, h);
      const path = h > 0 ? `M${x},${y(0)} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${y(0)} Z` : "";
      return `<g class="bar" data-tip="${ddmm(p.d)}: ${fmt(p.n)} ${unit}"><rect x="${padL + i * bw}" y="${padT}" width="${bw}" height="${H - padT - padB}" class="hit"/>${path ? `<path d="${path}"/>` : ""}${i % step === 0 ? `<text x="${x + w / 2}" y="${H - 6}" class="axis" text-anchor="middle">${ddmm(p.d)}</text>` : ""}</g>`;
    })
    .join("");
  const total = data.reduce((a, p) => a + p.n, 0);
  return `<figure class="chart"><figcaption><b>${esc(title)}</b><span class="muted small">Tổng ${fmt(total)} · cao nhất ${fmt(max)}/ngày</span></figcaption>
    <div class="chart-box"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${grid}<line x1="${padL}" x2="${W}" y1="${y(0)}" y2="${y(0)}" class="base"/>${bars}</svg><div class="tip" hidden></div></div>
    <details class="small"><summary>Xem bảng số liệu</summary><table class="mini"><tr><th>Ngày</th><th>${esc(unit)}</th></tr>${data
      .map((p) => `<tr><td>${ddmm(p.d)}</td><td>${fmt(p.n)}</td></tr>`)
      .join("")}</table></details></figure>`;
}

// Thanh ngang cho phân bố (một chuỗi), nhãn và số dùng màu chữ, thanh mang màu nhấn
function hbarList(title, rows) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  const total = rows.reduce((a, r) => a + r.n, 0);
  return `<figure class="chart"><figcaption><b>${esc(title)}</b><span class="muted small">${fmt(total)} lượt</span></figcaption>
    <div class="hbars">${rows
      .map((r) => `<div class="hrow" title="${esc(r.k)}: ${fmt(r.n)}"><span class="hk">${esc(r.k)}</span><span class="htrack"><i style="width:${(r.n / max) * 100}%"></i></span><span class="hn">${fmt(r.n)}</span></div>`)
      .join("")}</div></figure>`;
}

function wireTooltips(root) {
  root.querySelectorAll(".chart-box").forEach((box) => {
    const tip = box.querySelector(".tip");
    box.querySelectorAll(".bar").forEach((g) => {
      g.addEventListener("mouseenter", () => {
        tip.textContent = g.dataset.tip;
        tip.hidden = false;
        g.classList.add("on");
      });
      g.addEventListener("mousemove", (e) => {
        const r = box.getBoundingClientRect();
        tip.style.left = `${Math.min(r.width - 120, Math.max(0, e.clientX - r.left - 50))}px`;
        tip.style.top = `${Math.max(0, e.clientY - r.top - 38)}px`;
      });
      g.addEventListener("mouseleave", () => {
        tip.hidden = true;
        g.classList.remove("on");
      });
      // Chạm trên điện thoại
      g.addEventListener("click", () => {
        tip.textContent = g.dataset.tip;
        tip.hidden = false;
      });
    });
  });
}

async function renderAdmin(tab = "report", days = Number(store("tt-admin-days") || 14)) {
  if (!app.me?.isAdmin) {
    $view.innerHTML = `<div class="page"><h1>Quản trị</h1><div class="empty">Tài khoản này không có quyền quản trị.</div></div>`;
    return;
  }
  $view.innerHTML = `<div class="page admin"><h1>Quản trị</h1>
    <div class="tabs"><button data-t="report" class="${tab === "report" ? "on" : ""}">Báo cáo</button><button data-t="settings" class="${tab === "settings" ? "on" : ""}">Cấu hình chỉ số</button><button data-t="questions" class="${tab === "questions" ? "on" : ""}">Câu hỏi</button><button data-t="sects" class="${tab === "sects" ? "on" : ""}">Môn phái</button></div>
    <div id="adminBody"><div class="empty">Đang tải…</div></div></div>`;
  $view.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => renderAdmin(b.dataset.t, days)));
  if (tab === "settings") return renderAdminSettings();
  if (tab === "questions") return renderAdminQuestions();
  if (tab === "sects") return renderAdminSects();

  const r = await api(`/api/admin/report?days=${days}`);
  const sumDuel = r.series.duelsRanked.map((p, i) => ({ d: p.d, n: p.n + r.series.duelsBot[i].n + r.series.duelsFriendly[i].n }));
  const tile = (label, value, sub = "") => `<div class="stat"><small>${label}</small><b>${value}</b>${sub ? `<span>${sub}</span>` : ""}</div>`;
  const body = document.getElementById("adminBody");
  body.innerHTML = `
    <div class="range">${[7, 14, 30, 90].map((d) => `<button data-d="${d}" class="${d === days ? "on" : ""}">${d} ngày</button>`).join("")}</div>
    <div class="stats">
      ${tile("Người chơi", fmt(r.users.total), `${fmt(r.users.registered)} đăng ký · ${fmt(r.users.guests)} khách`)}
      ${tile("Hoạt động 24 giờ", fmt(r.active.dau ?? 0))}
      ${tile("Hoạt động 7 ngày", fmt(r.active.wau ?? 0))}
      ${tile("Hoạt động 30 ngày", fmt(r.active.mau ?? 0))}
      ${tile("Tổng kiếp", fmt(r.lives.total ?? 0), `${fmt(r.lives.active ?? 0)} đang chơi · ${fmt(r.lives.finished ?? 0)} đã xong`)}
      ${tile("Thọ trung bình", r.lives.avg_age ? fmt(r.lives.avg_age) : "—", "kiếp đã khép lại")}
      ${tile("Luận đạo", fmt((r.duels.ranked ?? 0) + (r.duels.bot ?? 0) + (r.duels.friendly ?? 0)), `${fmt(r.duels.ranked ?? 0)} xếp hạng · ${fmt(r.duels.bot ?? 0)} với bot · ${fmt(r.duels.friendly ?? 0)} giao hữu`)}
    </div>
    <div class="charts">
      ${barChart("Người hoạt động mỗi ngày", r.series.active, "người")}
      ${barChart("Người chơi mới mỗi ngày", r.series.newUsers, "người")}
      ${barChart("Kiếp mới mỗi ngày", r.series.lives, "kiếp")}
      ${barChart("Trận luận đạo mỗi ngày", sumDuel, "trận")}
    </div>
    <div class="charts">
      ${hbarList("Cảnh giới cuối cùng (kiếp đã xong)", r.dist.realms.filter((x) => x.n))}
      ${hbarList("Giới diện", r.dist.worlds)}
      ${hbarList("Đạo đồ (kiếp có linh căn)", r.dist.paths.filter((x) => x.n))}
      ${hbarList("Kết cục phổ biến", r.dist.endings)}
    </div>
    <h3>Cao thủ (theo kiếp tốt nhất)</h3>
    <table class="table"><tr><th>#</th><th>Tu sĩ</th><th>Cảnh giới</th><th>Tuổi</th><th>Số kiếp</th></tr>${r.top
      .map((t, i) => `<tr><td>${i + 1}</td><td>${esc(t.name)}</td><td>${esc(t.realm ?? "")}</td><td>${fmt(t.age)}</td><td>${fmt(t.lives)}</td></tr>`)
      .join("")}</table>
    <p class="muted small">Ngày tính theo giờ Việt Nam. "Hoạt động" = có tạo kiếp, đưa ra lựa chọn hoặc luận đạo trong ngày.</p>`;
  body.querySelectorAll(".range button").forEach(
    (b) =>
      (b.onclick = () => {
        store("tt-admin-days", b.dataset.d);
        renderAdmin("report", Number(b.dataset.d));
      }),
  );
  wireTooltips(body);
}

async function renderAdminSettings() {
  const s = await api("/api/admin/settings");
  const groups = { game: "Lối chơi — áp dụng cho kiếp mới", duel: "Luận đạo — áp dụng cho trận mới", system: "Hệ thống — áp dụng ngay" };
  const field = (spec) => {
    const v = s.values[spec.key];
    const meta = s.meta[spec.key];
    const input =
      spec.type === "boolean"
        ? `<label class="switch"><input type="checkbox" name="${spec.key}" ${v ? "checked" : ""}/> <span>${v ? "Bật" : "Tắt"}</span></label>`
        : `<input type="number" name="${spec.key}" value="${v}" min="${spec.min}" max="${spec.max}" step="${spec.step}"/>`;
    return `<div class="setting ${v !== s.defaults[spec.key] ? "changed" : ""}">
      <div><b>${esc(spec.label)}</b><div class="muted small">${esc(spec.help)}</div>
        <div class="muted small">Mặc định: ${spec.type === "boolean" ? (spec.default ? "Bật" : "Tắt") : spec.default}${spec.type === "number" ? ` · khoảng ${spec.min}–${spec.max}` : ""}${meta ? ` · sửa lúc ${new Date(meta.updated_at).toLocaleString("vi-VN")} bởi ${esc(meta.updated_by ?? "")}` : ""}</div>
        <div class="err" data-err="${spec.key}"></div></div>
      <div class="setting-input">${input}</div></div>`;
  };
  const body = document.getElementById("adminBody");
  body.innerHTML = `<form id="settingsForm">
    ${Object.entries(groups)
      .map(([g, title]) => `<section class="setting-group"><h3>${title}</h3>${s.specs.filter((x) => x.group === g).map(field).join("")}</section>`)
      .join("")}
    <div class="setting-actions"><button class="btn" type="submit">Lưu thay đổi</button><button class="btn ghost" type="button" id="resetDefaults">Khôi phục mặc định</button></div>
    <p class="muted small">Mỗi kiếp chụp lại cấu hình lúc bắt đầu, nên đổi chỉ số không ảnh hưởng các kiếp đang chơi dở.</p>
  </form>`;
  const form = document.getElementById("settingsForm");
  form.querySelectorAll('input[type="checkbox"]').forEach((c) => c.addEventListener("change", () => (c.nextElementSibling.textContent = c.checked ? "Bật" : "Tắt")));
  const collect = () =>
    Object.fromEntries(s.specs.map((spec) => {
      const el = form.elements[spec.key];
      return [spec.key, spec.type === "boolean" ? el.checked : Number(el.value)];
    }));
  const save = async (values) => {
    form.querySelectorAll("[data-err]").forEach((e) => (e.textContent = ""));
    try {
      await api("/api/admin/settings", { method: "PUT", body: values });
      toast("Đã lưu cấu hình.");
      renderAdmin("settings");
    } catch (e) {
      toast(e.message);
    }
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/admin/settings", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(collect()) });
    if (res.ok) {
      toast("Đã lưu cấu hình.");
      return renderAdmin("settings");
    }
    const data = await res.json().catch(() => ({}));
    for (const [k, msg] of Object.entries(data.errors ?? {})) {
      const el = form.querySelector(`[data-err="${k}"]`);
      if (el) el.textContent = msg;
    }
    toast("Có giá trị chưa hợp lệ.");
  };
  document.getElementById("resetDefaults").onclick = () => {
    if (confirm("Đưa mọi chỉ số về mặc định?")) save({ ...s.defaults });
  };
}

// ---------------------------------------------------------------- Quản trị: ngân hàng câu hỏi

const qa = { path: "", level: "", q: "", deleted: false, shown: 30 };

async function renderAdminQuestions() {
  const body = document.getElementById("adminBody");
  const data = await api(`/api/admin/questions${qa.deleted ? "?deleted=1" : ""}`);
  const paths = app.codex.paths;
  const pathName = (id) => paths.find((p) => p.id === id)?.name ?? id;
  const needle = qa.q.trim().toLowerCase();
  const items = data.items.filter(
    (it) => (!qa.path || it.path === qa.path) && (!qa.level || String(it.level) === qa.level) && (!needle || `${it.prompt} ${it.options.join(" ")} ${it.explain}`.toLowerCase().includes(needle)),
  );
  const countRow = (p) => {
    const c = data.counts[p.id] ?? [0, 0, 0];
    return `<tr><td>${esc(p.glyph)} ${esc(p.name)}</td><td>${c[0]}</td><td>${c[1]}</td><td>${c[2]}</td><td><b>${c[0] + c[1] + c[2]}</b></td></tr>`;
  };
  body.innerHTML = `
    <p class="muted small">Phiên bản ngân hàng hiện tại: <b>v${data.version}</b>. Thay đổi áp dụng cho kiếp và trận luận đạo <b>mới</b>; kiếp đang chơi giữ nguyên bộ câu hỏi lúc bắt đầu.</p>
    <table class="table qa-counts"><tr><th>Đạo đồ</th><th>Cấp 1</th><th>Cấp 2</th><th>Cấp 3</th><th>Tổng</th></tr>${paths.map(countRow).join("")}</table>
    <div class="qa-toolbar">
      <select id="qaPath" aria-label="Đạo đồ"><option value="">Mọi đạo đồ</option>${paths.map((p) => `<option value="${p.id}" ${qa.path === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
      <select id="qaLevel" aria-label="Cấp độ"><option value="">Mọi cấp</option>${[1, 2, 3].map((l) => `<option value="${l}" ${qa.level === String(l) ? "selected" : ""}>Cấp ${l}</option>`).join("")}</select>
      <input id="qaSearch" type="search" placeholder="Tìm trong câu hỏi, đáp án, lời giảng…" value="${esc(qa.q)}"/>
      <label class="qa-del"><input type="checkbox" id="qaDeleted" ${qa.deleted ? "checked" : ""}/> Đã xoá</label>
    </div>
    <div class="qa-actions">
      <button class="btn" id="qaAdd">+ Thêm câu hỏi</button>
      <a class="btn ghost" href="/api/admin/questions/export" download>Xuất JSON</a>
      <label class="btn ghost qa-import">Nhập JSON<input type="file" id="qaFile" accept="application/json,.json" hidden/></label>
    </div>
    <p class="muted small">${fmt(items.length)} câu${qa.deleted ? " đã xoá" : ""} khớp bộ lọc.</p>
    <div class="qa-list">${items
      .slice(0, qa.shown)
      .map(
        (it) => `<article class="qa-item">
          <div class="qa-meta"><span class="qa-lv lv${it.level}">Cấp ${it.level}</span><span class="muted small">${esc(pathName(it.path))}</span><span class="muted small">· sửa ${new Date(it.updatedAt).toLocaleDateString("vi-VN")}${it.updatedBy && it.updatedBy !== "seed" ? ` bởi ${esc(it.updatedBy)}` : ""}</span></div>
          <div class="qa-prompt">${esc(it.prompt)}</div>
          <ol class="qa-opts">${it.options.map((o, i) => `<li class="${i === it.answer ? "right" : ""}">${esc(o)}${i === it.answer ? " ✓" : ""}</li>`).join("")}</ol>
          <details class="small"><summary>Lời giảng</summary>${esc(it.explain)}</details>
          <div class="qa-row-actions">${
            qa.deleted
              ? `<button class="btn ghost small" data-restore="${esc(it.id)}">Khôi phục</button>`
              : `<button class="btn ghost small" data-edit="${esc(it.id)}">Sửa</button><button class="btn ghost small danger" data-del="${esc(it.id)}">Xoá</button>`
          }</div>
        </article>`,
      )
      .join("")}</div>
    ${items.length > qa.shown ? `<p style="text-align:center"><button class="btn ghost" id="qaMore">Xem thêm ${fmt(Math.min(30, items.length - qa.shown))} câu</button></p>` : ""}`;

  const rerender = () => renderAdminQuestions();
  body.querySelector("#qaPath").onchange = (e) => ((qa.path = e.target.value), (qa.shown = 30), rerender());
  body.querySelector("#qaLevel").onchange = (e) => ((qa.level = e.target.value), (qa.shown = 30), rerender());
  body.querySelector("#qaDeleted").onchange = (e) => ((qa.deleted = e.target.checked), (qa.shown = 30), rerender());
  let t;
  body.querySelector("#qaSearch").oninput = (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      qa.q = e.target.value;
      qa.shown = 30;
      rerender().then(() => {
        const el = document.getElementById("qaSearch");
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      });
    }, 300);
  };
  body.querySelector("#qaMore")?.addEventListener("click", () => ((qa.shown += 30), rerender()));
  body.querySelector("#qaAdd").onclick = () => openQuestionEditor(null, rerender);
  body.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => openQuestionEditor(items.find((x) => x.id === b.dataset.edit), rerender)));
  body.querySelectorAll("[data-del]").forEach(
    (b) =>
      (b.onclick = async () => {
        const it = items.find((x) => x.id === b.dataset.del);
        if (!confirm(`Xoá câu hỏi này?\n\n"${it.prompt}"\n\nKiếp đang chơi vẫn dùng được; có thể khôi phục sau.`)) return;
        try {
          await api(`/api/admin/questions/${encodeURIComponent(it.id)}`, { method: "DELETE" });
          toast("Đã xoá câu hỏi.");
          rerender();
        } catch (e) {
          toast(e.message);
        }
      }),
  );
  body.querySelectorAll("[data-restore]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await api(`/api/admin/questions/${encodeURIComponent(b.dataset.restore)}/restore`, { method: "POST", body: {} });
          toast("Đã khôi phục câu hỏi.");
          rerender();
        } catch (e) {
          toast(e.message);
        }
      }),
  );
  body.querySelector("#qaFile").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    let json;
    try {
      json = JSON.parse(await file.text());
    } catch {
      return toast("File không phải JSON hợp lệ.");
    }
    const items = Array.isArray(json) ? json : json.items;
    if (!confirm(`Nhập ${items?.length ?? 0} câu hỏi mới vào ngân hàng?`)) return;
    const res = await fetch("/api/admin/questions/import", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast(`Đã nhập ${data.added} câu hỏi.`);
      return rerender();
    }
    const rows = (data.rows ?? []).map((r) => `Câu ${r.row}: ${Object.values(r.errors).join(", ")}`).join("\n");
    alert(`${data.message ?? "Không nhập được."}\n\n${rows}`);
  };
}

function openQuestionEditor(item, onSaved) {
  const paths = app.codex.paths;
  const isEdit = !!item;
  const v = item ?? { path: qa.path || paths[0].id, level: Number(qa.level) || 1, prompt: "", options: ["", "", "", ""], answer: 0, explain: "" };
  const m = openModal(`<div class="head"><span>${isEdit ? "Sửa câu hỏi" : "Thêm câu hỏi"}</span><button class="icon-btn" data-close>×</button></div>
    <form class="body qa-form" id="qaForm">
      <div class="qa-grid">
        <div class="field"><label>Đạo đồ</label><select name="path" ${isEdit ? "disabled" : ""}>${paths.map((p) => `<option value="${p.id}" ${v.path === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select><div class="err" data-err="path"></div></div>
        <div class="field"><label>Cấp độ</label><div class="qa-levels">${[1, 2, 3].map((l) => `<label><input type="radio" name="level" value="${l}" ${v.level === l ? "checked" : ""}/> Cấp ${l}</label>`).join("")}</div><div class="err" data-err="level"></div></div>
      </div>
      <div class="field"><label>Câu hỏi</label><textarea name="prompt" rows="2" maxlength="300">${esc(v.prompt)}</textarea><div class="err" data-err="prompt"></div></div>
      <div class="field"><label>Phương án <span class="muted">(chọn ● ở đáp án đúng; 2–6 phương án)</span></label><div id="qaOpts"></div>
        <button type="button" class="btn ghost small" id="qaAddOpt">+ Thêm phương án</button><div class="err" data-err="options"></div><div class="err" data-err="answer"></div></div>
      <div class="field"><label>Lời giảng (hiện sau khi trả lời)</label><textarea name="explain" rows="3" maxlength="600">${esc(v.explain)}</textarea><div class="err" data-err="explain"></div></div>
      ${isEdit ? `<p class="muted small">Sửa sẽ tạo phiên bản mới; kiếp đang chơi vẫn dùng bản cũ.</p>` : ""}
      <button class="btn" type="submit" style="width:100%">${isEdit ? "Lưu thay đổi" : "Thêm vào ngân hàng"}</button>
    </form>`);
  const opts = [...v.options];
  let answer = v.answer;
  const drawOpts = () => {
    const box = m.querySelector("#qaOpts");
    box.innerHTML = opts
      .map(
        (o, i) => `<div class="qa-opt"><input type="radio" name="answer" value="${i}" ${i === answer ? "checked" : ""} aria-label="Đáp án đúng"/><input type="text" data-i="${i}" value="${esc(o)}" maxlength="120" placeholder="Phương án ${i + 1}"/>${opts.length > 2 ? `<button type="button" class="icon-btn" data-rm="${i}" aria-label="Bỏ phương án">×</button>` : ""}</div>`,
      )
      .join("");
    box.querySelectorAll('input[type="text"]').forEach((el) => (el.oninput = () => (opts[Number(el.dataset.i)] = el.value)));
    box.querySelectorAll('input[type="radio"]').forEach((el) => (el.onchange = () => (answer = Number(el.value))));
    box.querySelectorAll("[data-rm]").forEach(
      (b) =>
        (b.onclick = () => {
          const i = Number(b.dataset.rm);
          opts.splice(i, 1);
          if (answer === i) answer = 0;
          else if (answer > i) answer--;
          drawOpts();
        }),
    );
    m.querySelector("#qaAddOpt").style.display = opts.length >= 6 ? "none" : "";
  };
  drawOpts();
  m.querySelector("#qaAddOpt").onclick = () => {
    opts.push("");
    drawOpts();
  };
  m.querySelector("#qaForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const payload = {
      path: isEdit ? item.path : f.elements.path.value,
      level: Number(f.querySelector('input[name="level"]:checked')?.value),
      prompt: f.elements.prompt.value,
      options: opts,
      answer,
      explain: f.elements.explain.value,
    };
    m.querySelectorAll("[data-err]").forEach((x) => (x.textContent = ""));
    const res = await fetch(isEdit ? `/api/admin/questions/${encodeURIComponent(item.id)}` : "/api/admin/questions", {
      method: isEdit ? "PUT" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      closeModal();
      toast(isEdit ? "Đã lưu câu hỏi." : "Đã thêm câu hỏi.");
      return onSaved();
    }
    for (const [k, msg] of Object.entries(data.errors ?? {})) {
      const el = m.querySelector(`[data-err="${k}"]`);
      if (el) el.textContent = msg;
    }
    if (!data.errors) toast(data.message ?? "Không lưu được.");
  };
}

// Chỉ khi chạy local: cho phép gọi thử các cảnh đột phá từ console để xem hiệu ứng
if (location.hostname === "localhost") window.__tt = { openBreakthrough, chargeScene, resultScene, buildFateCard, app };

boot().catch((e) => ($view.innerHTML = `<div class="empty">Không khởi động được: ${esc(e.message)}</div>`));

// ---------------------------------------------------------------- Môn phái: thi đấu & bầu chưởng môn

const PHASE = { contest: "Đại bỉ", vote: "Bầu chưởng môn", none: "" };
function timeLeft(ts) {
  const ms = Math.max(0, (ts ?? 0) - Date.now());
  const h = Math.floor(ms / 3600_000), m = Math.floor((ms % 3600_000) / 60_000);
  return h >= 24 ? `${Math.floor(h / 24)} ngày ${h % 24} giờ` : h ? `${h} giờ ${m} phút` : `${Math.max(1, m)} phút`;
}
const dmy = (ms) => new Date(ms).toLocaleDateString("vi-VN");
const realmOf = (i) => app.codex.realms[i]?.name ?? "—";

async function renderSects() {
  const [list, current] = await Promise.all([api("/api/sects"), api("/api/game/runs/current").catch(() => null)]);
  const c = app.codex;
  const mySect = current?.sectId && current.sect !== "outcast" ? current.sectId : null;
  const max = Math.max(1, ...list.map((x) => x.points));
  $view.innerHTML = `<div class="page sects-page">
    <h1>Môn phái</h1>
    <p class="muted">Đệ tử thắng <b>luận đạo xếp hạng</b> được điểm tỷ võ cho phái (thắng +3, hòa +1). Khi ghế chưởng môn trống, phái mở <b>đại bỉ</b>: ba đệ tử nhiều điểm nhất thành ứng viên, rồi toàn phái <b>bỏ phiếu</b>. Danh vị gắn với nhân vật của kiếp này — nhân vật tọa hóa, ghế chưởng môn cũng bỏ trống.</p>
    ${mySect ? `<a class="nudge sect-mine" href="#/sects/${mySect}">${esc(byId(c.sects, mySect)?.glyph ?? "")} Nhân vật <b>${esc(current.profile.name)}</b> là đệ tử <b>${esc(byId(c.sects, mySect)?.name ?? "")}</b> — vào chính sự môn phái ›</a>`
      : `<div class="nudge">Nhân vật hiện tại chưa bái nhập môn phái nào. Gia nhập tông môn trong lúc <a href="#/play">tu tiên</a> để thi đấu và bầu chưởng môn.</div>`}
    <div class="list sect-board">${list
      .map((s, i) => {
        const d = byId(c.sects, s.id);
        return `<a class="item link" href="#/sects/${s.id}">
          <div class="no ${i < 3 && s.points ? "top" : ""}">${i + 1}</div>
          <span class="sflag">${flagSvg(s.id, d?.glyph ?? "", { size: 46, wave: false, title: `Cờ ${d?.name ?? ""}` })}</span>
          <div class="main"><div class="title">${esc(d?.name ?? s.id)}${s.id === mySect ? ' <span class="crown">phái của ngươi</span>' : ""}</div>
            <div class="sub">${esc(byId(c.worlds, d?.world)?.name ?? "")} · ${fmt(s.disciples)} đệ tử tại thế</div>
            <div class="sub">${s.chief ? `掌 <b>${esc(s.chief.name)}</b> — ${esc(realmOf(s.chief.realm))}` : `<span class="phase-tag ${s.phase}">${PHASE[s.phase] || "Ghế trống"}</span> còn ${timeLeft(s.phaseEnds)}`}</div>
            <div class="power"><i style="width:${(s.points / max) * 100}%"></i></div></div>
          <div class="sect-power"><b>${fmt(s.points)}</b><small>điểm tỷ võ</small></div></a>`;
      })
      .join("")}</div>
  </div>`;
}

async function renderSect(id) {
  const s = await api(`/api/sects/${id}`);
  const c = app.codex;
  const d = byId(c.sects, id);
  const me = s.me;
  const totalVotes = s.candidates.reduce((a, x) => a + x.votes, 0) || 1;
  const myStatus = !me
    ? ""
    : me.guest
      ? `<div class="nudge">Khách chỉ xem được. <a href="#" id="sectSave">Lưu tiến trình</a> để thi đấu tính điểm, ứng cử và bỏ phiếu.</div>`
      : me.disciple
        ? `<div class="nudge">Nhân vật <b>${esc(me.character)}</b> là đệ tử phái này · điểm tỷ võ: <b>${fmt(me.points)}</b>.</div>`
        : `<div class="nudge">${me.character ? `Nhân vật <b>${esc(me.character)}</b> không thuộc phái này` : "Ngươi chưa có nhân vật đang tu hành"} — chỉ đệ tử tại thế mới được bỏ phiếu.</div>`;

  let stage = "";
  if (s.chief) {
    stage = `<section class="chief-card">
      <div class="chief-seal">掌</div>
      <div><div class="muted small">CHƯỞNG MÔN ĐƯƠNG NHIỆM</div><h2>${esc(s.chief.name)}</h2>
        <div class="muted small">${esc(realmOf(s.chief.realm))} · tại vị từ ${dmy(s.chief.since)}</div>
        ${s.motto ? `<blockquote class="motto">“${esc(s.motto)}”</blockquote>` : s.chief.isMe ? "" : `<div class="muted small">Chưa ban lời hiệu triệu.</div>`}
        ${s.chief.isMe ? `<form id="mottoForm" class="motto-form"><input id="motto" maxlength="120" placeholder="Lời hiệu triệu gửi toàn phái (tối đa 120 ký tự)" value="${esc(s.motto ?? "")}"/><button class="btn small">Ban lệnh</button></form>
          <p class="muted small">Giữ mạng nhân vật này để giữ ghế: tọa hóa, luân hồi sớm hoặc bế quan quá lâu đều mất chức.</p>` : ""}
      </div></section>`;
  } else if (s.phase === "contest") {
    stage = `<section class="phase-card"><div class="phase-tag contest">Đại bỉ</div>
      <h2>Ghế chưởng môn đang trống</h2>
      <p>Đại bỉ kết thúc sau <b>${timeLeft(s.phaseEnds)}</b>. Ba đệ tử nhiều điểm tỷ võ nhất sẽ thành ứng viên. Thắng luận đạo xếp hạng để lấy điểm.</p>
      <a class="btn" href="#/duel">Vào luận đạo</a></section>`;
  } else if (s.phase === "vote") {
    stage = `<section class="phase-card"><div class="phase-tag vote">Bầu chưởng môn</div>
      <h2>Toàn phái bỏ phiếu</h2>
      <p class="muted">Kiểm phiếu sau <b>${timeLeft(s.phaseEnds)}</b>. Mỗi đệ tử một phiếu, được đổi phiếu trước khi kết thúc. Hòa phiếu thì xét điểm tỷ võ rồi cảnh giới; ứng viên tọa hóa giữa chừng bị loại.</p>
      <div class="cands">${s.candidates
        .map(
          (x) => `<div class="cand ${me?.vote === x.run ? "mine" : ""} ${x.alive ? "" : "dead"}">
            <div class="title">${esc(x.name)}${x.alive ? "" : ' <span class="muted small">(đã tọa hóa)</span>'}</div>
            <div class="sub">${esc(realmOf(x.realm))} · ${fmt(x.points)} điểm</div>
            <div class="power"><i style="width:${(x.votes / totalVotes) * 100}%"></i></div>
            <div class="sub"><b>${fmt(x.votes)}</b> phiếu</div>
            ${me?.canVote && x.alive ? `<button class="btn small ${me.vote === x.run ? "" : "ghost"}" data-vote="${x.run}">${me.vote === x.run ? "Đã bầu ✓" : "Bầu người này"}</button>` : ""}
          </div>`,
        )
        .join("")}</div></section>`;
  }

  $view.innerHTML = `<div class="page sect-page">
    <p><a href="#/sects" class="muted small">‹ Môn phái</a></p>
    <div class="wd-head"><span class="sflag big">${flagSvg(id, d?.glyph ?? "", { size: 110, title: `Cờ ${d?.name ?? ""}` })}</span><div><h1>${esc(d?.name ?? id)}</h1>
      <div class="muted small">${esc(byId(c.worlds, d?.world)?.name ?? "")} · ${esc(d?.desc ?? "")} · ${fmt(s.disciples)} đệ tử tại thế</div>
      ${d?.perk ? `<div class="sect-perk">✦ ${esc(d.perk)}</div>` : ""}</div></div>
    ${myStatus}
    ${stage}
    <h3>Bảng tỷ võ</h3>
    ${s.ranking.length
      ? `<div class="list">${s.ranking
          .map(
            (r, i) => `<div class="item has-av"><div class="no ${i < 3 ? "top" : ""}">${i + 1}</div>
              <span class="row-av">${avatarSvg(r.realm, r.gender, { seed: nameSeed(r.name), size: 40, animate: false })}</span>
              <div class="main"><div class="title">${esc(r.name)}${s.chief?.run === r.run ? ' <span class="crown">chưởng môn</span>' : r.elder ? ' <span class="muted small">trưởng lão</span>' : ""}</div>
                <div class="sub">${esc(r.account)} · ${esc(realmOf(r.realm))} · ${fmt(r.age)} tuổi · ${r.wins} thắng${r.draws ? ` · ${r.draws} hòa` : ""}</div></div>
              <div class="sect-power"><b>${fmt(r.points)}</b><small>điểm</small></div></div>`,
          )
          .join("")}</div>`
      : `<div class="empty">Chưa đệ tử nào tỷ võ. Thắng một trận luận đạo xếp hạng để ghi danh.</div>`}
    <h3>Các đời chưởng môn</h3>
    ${s.history.length
      ? `<div class="list">${s.history
          .map(
            (h) => `<div class="item"><div class="no">掌</div><div class="main"><div class="title">${esc(h.name)}</div>
              <div class="sub">${esc(realmOf(h.realm))} · ${fmt(h.votes)} phiếu · ${dmy(h.from_at)} → ${h.to_at ? `${dmy(h.to_at)} (${esc(h.end_reason ?? "")})` : "nay"}</div></div></div>`,
          )
          .join("")}</div>`
      : `<div class="empty">Phái chưa từng có chưởng môn do đệ tử bầu.</div>`}
  </div>`;

  document.getElementById("sectSave")?.addEventListener("click", (e) => {
    e.preventDefault();
    openAccount();
  });
  $view.querySelectorAll("[data-vote]").forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        try {
          await api(`/api/sects/${id}/vote`, { method: "POST", body: { run: b.dataset.vote } });
          toast("Đã bỏ phiếu.");
          renderSect(id);
        } catch (e) {
          toast(e.message);
          b.disabled = false;
        }
      }),
  );
  document.getElementById("mottoForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api(`/api/sects/${id}/motto`, { method: "PUT", body: { motto: document.getElementById("motto").value } });
      toast("Lời hiệu triệu đã ban xuống toàn phái.");
      renderSect(id);
    } catch (err) {
      toast(err.message);
    }
  });
}

async function renderAdminSects() {
  const list = await api("/api/sects");
  const body = document.getElementById("adminBody");
  const c = app.codex;
  body.innerHTML = `<p class="muted small">Chu kỳ tự chạy: ghế trống → đại bỉ → bỏ phiếu → chưởng môn. Thời gian mỗi giai đoạn chỉnh ở tab Cấu hình chỉ số.</p>
    <table class="table"><tr><th>Môn phái</th><th>Điểm</th><th>Đệ tử</th><th>Chưởng môn / giai đoạn</th><th></th></tr>${list
      .map(
        (s) => `<tr><td>${esc(byId(c.sects, s.id)?.name ?? s.id)}</td><td>${fmt(s.points)}</td><td>${fmt(s.disciples)}</td>
          <td>${s.chief ? `${esc(s.chief.name)}${s.motto ? `<div class="muted small">“${esc(s.motto)}”</div>` : ""}` : `${PHASE[s.phase] || "—"} · còn ${timeLeft(s.phaseEnds)}`}</td>
          <td class="actions">${s.chief ? `${s.motto ? `<button class="btn small ghost" data-a="motto" data-id="${s.id}">Gỡ hiệu triệu</button>` : ""}<button class="btn small ghost" data-a="depose" data-id="${s.id}">Bãi nhiệm</button>` : `<button class="btn small ghost" data-a="advance" data-id="${s.id}">Chuyển vòng ngay</button>`}</td></tr>`,
      )
      .join("")}</table>`;
  body.querySelectorAll("[data-a]").forEach(
    (b) =>
      (b.onclick = async () => {
        const { a, id } = b.dataset;
        if (a === "depose" && !confirm("Bãi nhiệm chưởng môn phái này?")) return;
        try {
          if (a === "motto") await api(`/api/admin/sects/${id}/motto`, { method: "DELETE" });
          else await api(`/api/admin/sects/${id}/${a}`, { method: "POST" });
          toast("Đã cập nhật.");
          renderAdminSects();
        } catch (e) {
          toast(e.message);
        }
      }),
  );
}
