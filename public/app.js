// Tu Tiên Lộ — client. Không cần build: ES module thuần.
// Mọi logic game nằm trên máy chủ; client chỉ hiển thị và gửi lựa chọn.

const $view = document.getElementById("view");
const HUES = [30, 140, 155, 45, 210, 270, 230, 190, 0, 50, 40, 280, 300, 15];
const SPEEDS = { 1: 1100, 2: 550, 4: 220 };
const STAT_LABEL = { cultivation: "tu vi", health: "thể trạng", resources: "linh tài", luck: "khí vận", comprehension: "ngộ tính", lifespan: "thọ nguyên" };
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
  const [name, arg] = location.hash.replace(/^#\/?/, "").split("/");
  document.querySelectorAll("a[data-route]").forEach((a) => a.classList.toggle("active", a.dataset.route === name));
  window.scrollTo(0, 0);
  closeDuel();
  const pages = { "": renderHome, play: renderPlay, duel: renderDuel, history: arg ? () => renderHistoryDetail(arg) : renderHistory, rank: renderRank, codex: renderCodex };
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
      ${s.total_runs ? `<div class="home-stats"><span>${s.total_runs} kiếp đã qua</span><span>Cao nhất: ${esc(app.codex.realms[s.best_realm].name)}</span><span>Thọ lâu nhất: ${fmt(s.longest_age)} tuổi</span><span>${app.me.achievements.length}/${app.codex.achievements.length} thành tựu</span></div>` : ""}
    </section>
    <section class="pillars">
      <div><div class="num">壹</div><h3>Gieo một số mệnh</h3><p class="muted small">Luân hồi định giới diện, xuất thân, linh căn và thể chất. Không có hai đời giống nhau.</p></div>
      <div><div class="num">貳</div><h3>Đi qua tiên lộ</h3><p class="muted small">Cơ duyên và kiếp nạn đan xen. Đến ngã rẽ tự chọn; chạm bình cảnh, tự quyết có đột phá hay không.</p></div>
      <div><div class="num">叁</div><h3>Lưu danh vạn giới</h3><p class="muted small">Mỗi kiếp được ghi lại. Mở khoá thành tựu, leo bảng xếp hạng, đồng bộ trên mọi thiết bị.</p></div>
    </section>`;
}

const pad = (n) => String(n).padStart(3, "0");

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
  document.getElementById("rootDesc").textContent = root.desc;
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
    .map(([k, v]) => `<span class="delta ${v > 0 ? "up" : "down"}">${v > 0 ? "+" : ""}${fmt(v)} ${STAT_LABEL[k]}</span>`)
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

const statOf = (run) => ({ health: run.health, lifespan: run.lifespan, progress: run.progress, resources: run.resources, luck: run.luck, comprehension: run.comprehension, sect: run.sect, partner: run.partner, path: run.path });
const statFromFact = (t) => ({ health: t.h, lifespan: t.l, progress: t.p, resources: t.r, luck: t.lk, comprehension: t.c, sect: t.sc, partner: t.pt, path: t.pa });

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
  el.innerHTML = `
    <div class="who">
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
      <div class="kv"><span class="k">Tông môn</span><span class="v">${sect}</span></div>
      <div class="kv"><span class="k">Đạo lữ</span><span class="v">${partner}</span></div>
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
    .map(([k, v]) => `<span class="delta ${v > 0 ? "up" : "down"}">${v > 0 ? "+" : ""}${fmt(v)} ${STAT_LABEL[k]}</span>`)
    .join("");
  let html = "";
  if (b.result === "success" || b.result === "ascend") {
    const asc = b.result === "ascend";
    const gain = b.lifespan ? b.lifespan[1] - b.lifespan[0] : 0;
    html = `<div class="bt-result success ${asc ? "ascend" : ""}">
      <div class="bt-burst"></div>${particles(asc ? 40 : 26)}
      <div class="bt-big">${asc ? "道" : b.tribulation ? "渡" : "成"}</div>
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
    <div class="glyph">${run.ascended ? "道" : "終"}</div>
    <div class="muted small">KẾT CỤC KIẾP ${pad(run.number)}</div>
    <h2>${esc(run.endingReason)}</h2>
    <div class="muted">${esc(run.realmLabel)} · hưởng thọ ${fmt(run.age)} tuổi</div>
    ${unlocked.length ? `<div class="muted small" style="margin-top:14px">Thành tựu mới</div><div class="ach-list">${achNames(unlocked).map((n) => `<span class="ach">✦ ${esc(n)}</span>`).join("")}</div>` : ""}
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
  g.fillStyle = "rgba(170,140,82,.14)";
  g.beginPath(); g.arc(860, 230, 90, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#a5b497"; g.lineWidth = 2; g.strokeRect(36, 36, 1008, 1278);
  g.strokeStyle = PALETTE.line; g.lineWidth = 1; g.strokeRect(50, 50, 980, 1250);

  // Ấn triện
  const seal = run.ascended ? "道" : "命";
  g.strokeStyle = PALETTE.red; g.lineWidth = 3; g.strokeRect(495, 110, 90, 90);
  center(seal, 178, 60, PALETTE.red);

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
  const ach = (run.achievements ?? []).map((id) => byId(c.achievements, id)?.name).filter(Boolean);
  if (ach.length) {
    font(24, 400); g.fillStyle = PALETTE.green; g.textAlign = "center";
    const chips = ach.slice(0, 5).map((a) => `✦ ${a}`);
    if (ach.length > 5) chips.push(`+${ach.length - 5}`);
    wrapText(g, chips, 540, 1040 + n * 52 + 30, 880, 34, 2);
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
  const rows = await api("/api/game/runs");
  const status = (r) => (r.status === "active" ? "Đang tu hành" : r.status === "abandoned" ? "Luân hồi sớm" : r.ending_reason ?? "");
  $view.innerHTML = `<div class="page"><h1>Lịch sử luân hồi</h1><p class="muted">${rows.length} kiếp gần nhất. Bấm vào một kiếp để đọc lại.</p>
    ${
      rows.length
        ? `<div class="list">${rows
            .map(
              (r) => `<div class="item link" data-id="${esc(r.id)}">
                <div class="no">${pad(r.number)}</div>
                <div class="main"><div class="title realm" style="--hue:${HUES[r.best_realm]}">${esc(app.codex.realms[r.best_realm].name)} · ${fmt(r.age)} tuổi</div>
                  <div class="sub">${esc(byId(app.codex.worlds, r.world)?.name)} · ${esc(status(r))}</div></div>
                <div class="muted">›</div></div>`,
            )
            .join("")}</div>`
        : `<div class="empty">Chưa có kiếp nào. <a href="#/play">Bắt đầu tu tiên</a></div>`
    }</div>`;
  $view.querySelectorAll(".item.link").forEach((el) => (el.onclick = () => (location.hash = `#/history/${el.dataset.id}`)));
}

async function renderHistoryDetail(id) {
  const run = await api(`/api/game/runs/${id}`);
  if (run.status === "active") return void (location.hash = "#/play");
  $view.innerHTML = `<div class="play"><aside class="sheet" id="sheet"></aside><section>
    <p><a href="#/history" class="muted small">‹ Lịch sử</a></p>
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
    `<div class="ending-card ${run.ascended ? "ascended" : ""}"><div class="glyph">${run.ascended ? "道" : "終"}</div><h2>${esc(end)}</h2><div class="muted">${esc(run.realmLabel)} · ${fmt(run.age)} tuổi</div>
      ${run.status === "finished" ? `<div class="actions" style="margin-top:16px"><button class="btn ghost" id="shareOld">Chia sẻ · Lưu ảnh</button></div>` : ""}</div>`,
  );
  document.getElementById("shareOld")?.addEventListener("click", () => openShare(run));
  Object.assign(app, saved);
}

// ---------------------------------------------------------------- Bảng xếp hạng

async function renderRank(by = "realm") {
  const duel = by === "duel";
  const rows = await api(duel ? "/api/duel/leaderboard" : `/api/leaderboard?by=${by}`);
  const tab = (k, label) => `<button data-by="${k}" class="${by === k ? "on" : ""}">${label}</button>`;
  const item = (r, i) =>
    duel
      ? `<div class="item ${r.userId === app.me.id ? "me" : ""}">
          <div class="no ${i < 3 ? "top" : ""}">${i + 1}</div>
          <div class="main"><div class="title">${esc(r.name)}${r.userId === app.me.id ? ' <span class="muted small">(ngươi)</span>' : ""}</div>
            <div class="sub">${r.wins} thắng · ${r.losses} thua · ${r.draws} hòa</div></div>
          <div style="text-align:right"><div class="realm" style="--hue:45">${fmt(r.rating)}</div><div class="end">${esc(rankTitle(r.rating))}</div></div></div>`
      : `<div class="item ${r.userId === app.me.id ? "me" : ""}">
          <div class="no ${i < 3 ? "top" : ""}">${i + 1}</div>
          <div class="main"><div class="title">${esc(r.name)}${r.userId === app.me.id ? ' <span class="muted small">(ngươi)</span>' : ""}</div>
            <div class="sub">${fmt(r.age)} tuổi · ${esc(byId(app.codex.worlds, r.world)?.name)}</div></div>
          <div style="text-align:right"><div class="realm" style="--hue:${HUES[r.best_realm]}">${esc(app.codex.realms[r.best_realm].name)}</div><div class="end">${esc(r.ending_reason)}</div></div></div>`;
  $view.innerHTML = `<div class="page"><h1>Bảng xếp hạng</h1><p class="muted">${
    duel ? "Điểm Đạo vị từ luận đạo trực tiếp. Chỉ tài khoản đã lưu tiến trình mới được xếp hạng." : "Mỗi tu sĩ chỉ tính kiếp tốt nhất. Khách hiện là “Vô danh tu sĩ” cho đến khi lưu tiến trình."
  }</p>
    <div class="tabs">${tab("realm", "Cảnh giới cao nhất")}${tab("age", "Sống lâu nhất")}${tab("duel", "Đạo vị")}</div>
    ${rows.length ? `<div class="list">${rows.map(item).join("")}</div>` : `<div class="empty">${duel ? "Chưa có ai luận đạo." : "Chưa có ai khép lại một kiếp."}</div>`}</div>`;
  $view.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => renderRank(b.dataset.by)));
}

// ---------------------------------------------------------------- Cẩm nang

async function renderCodex(tab = "realms") {
  const c = app.codex;
  const tabs = { paths: "Đạo đồ", realms: "Cảnh giới", roots: "Linh căn", physiques: "Thể chất", origins: "Xuất thân", worlds: "Giới diện", achievements: "Thành tựu" };
  const card = (title, body, locked = false) => `<div class="card ${locked ? "locked" : ""}"><h3>${esc(title)}</h3><div class="muted small">${body}</div></div>`;
  const content = {
    realms: () =>
      c.realms
        .map((r, i) =>
          card(
            `${i}. ${r.name}`,
            i === 0 ? "Thọ nguyên của người thường." : `Thọ nguyên ~${fmt(r.lifespan)} năm · ${r.stages.length} tiểu cảnh giới${r.tribulation ? " · <b>phải độ thiên kiếp</b>" : ""}${r.immortal ? " · tiên giới" : ""}`,
          ),
        )
        .join(""),
    paths: () => c.paths.map((p) => card(`${p.glyph} ${p.name}`, `${esc(p.desc)}<br/><b>${esc(p.perk)}</b><br/>Ngân hàng: ${p.questions} câu hỏi · khảo hạch khi nhập môn, ở giảng đường tông môn, trước mỗi bình cảnh (vấn tâm) và khi gặp kỳ nhân.`)).join(""),
    roots: () => c.roots.map((r) => card(r.name, `${esc(r.desc)}<br/>Điểm linh căn: ${r.score}`)).join(""),
    physiques: () => c.physiques.map((p) => card(p.name, esc(p.desc))).join(""),
    origins: () => c.origins.map((o) => card(o.name, `Linh tài khởi đầu: ${o.resources}${o.sect === "member" ? " · lớn lên trong tông môn" : ""}`)).join(""),
    worlds: () => c.worlds.map((w) => card(w.name, `${esc(w.desc)}<br/>Hiểm họa ×${w.danger} · Cơ duyên ×${w.fortune}`)).join(""),
    achievements: () => c.achievements.map((a) => card((app.me.achievements.includes(a.id) ? "✦ " : "") + a.name, esc(a.desc), !app.me.achievements.includes(a.id))).join(""),
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
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="rename">Lưu đạo hiệu</button><button class="btn ghost" id="signout">Đăng xuất</button></div></div>`);
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
    <button class="btn big" id="findMatch" style="margin:20px 0">Tìm đối thủ</button>
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
  return `<div class="avatar">${esc(f.name[0])}</div><div class="fname">${esc(f.name)}${f.bot ? ' <span class="muted small">(tàn ảnh)</span>' : ""}</div>
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
    <div class="muted">${m.scores[0]} – ${m.scores[1]} điểm · đúng ${m.correct[0]}/5 câu</div>
    ${
      m.ranked
        ? `<div class="duel-delta ${m.delta >= 0 ? "good" : "bad"}">${m.delta >= 0 ? "+" : ""}${m.delta} Đạo vị → ${fmt(m.rating)} · ${esc(rankTitle(m.rating))}</div>`
        : `<div class="nudge">Trận đấu thử của khách không tính Đạo vị. <a href="#" id="endSave">Lưu tiến trình</a> để lên bảng xếp hạng.</div>`
    }
    <div class="actions"><button class="btn" id="again">Đấu tiếp</button><button class="btn ghost" id="lobby">Về sảnh</button></div></div>`;
  document.getElementById("again").onclick = findMatch;
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

// Chỉ khi chạy local: cho phép gọi thử các cảnh đột phá từ console để xem hiệu ứng
if (location.hostname === "localhost") window.__tt = { openBreakthrough, chargeScene, resultScene, app };

boot().catch((e) => ($view.innerHTML = `<div class="empty">Không khởi động được: ${esc(e.message)}</div>`));
