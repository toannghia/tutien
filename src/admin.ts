// Trang quản trị: báo cáo người chơi + cấu hình chỉ số. Chỉ email trong ADMIN_EMAILS (tài khoản đã đăng ký) mới vào được.
import { Hono } from "hono";
import { createAuth, type Env } from "./auth";
import { REALMS, WORLDS, PATHS } from "./game/data";
import { clearSettingsCache, DEFAULTS, getSettings, SETTINGS, validateSettings } from "./settings";
import { makeQuestion } from "./game/quiz/types";
import { clearQuizCache, currentVersion, rowToQuestion, type QuestionRow } from "./quiz-store";

type User = { id: string; name: string; email: string; isAnonymous?: boolean | null };

export const isAdmin = (env: Env, user: User | null | undefined) => {
  if (!user || user.isAnonymous) return false;
  const list = (env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(user.email.toLowerCase());
};

export const admin = new Hono<{ Bindings: Env; Variables: { user: User } }>();

admin.use("*", async (c, next) => {
  const session = await createAuth(c.env).api.getSession({ headers: c.req.raw.headers });
  const user = session?.user as User | undefined;
  if (!user) return c.json({ error: "unauthenticated" }, 401);
  if (!isAdmin(c.env, user)) return c.json({ error: "forbidden" }, 403);
  c.set("user", user);
  await next();
});

// Ngày theo giờ Việt Nam (UTC+7)
const TZ = "'+7 hours'";
const dayKey = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10);

admin.get("/report", async (c) => {
  const days = Math.min(90, Math.max(7, Number(c.req.query("days") ?? 14)));
  const now = Date.now();
  const since = now - days * 86_400_000;
  const sinceIso = new Date(since).toISOString();
  const db = c.env.DB;
  // Người hoạt động = có tạo kiếp, đưa ra lựa chọn, hoặc đấu luận đạo trong ngày
  const activity = `
    SELECT date(c.created_at / 1000, 'unixepoch', ${TZ}) AS d, r.user_id AS uid, c.created_at AS t FROM run_choices c JOIN runs r ON r.id = c.run_id WHERE c.created_at >= ?1
    UNION ALL SELECT date(created_at / 1000, 'unixepoch', ${TZ}), user_id, created_at FROM runs WHERE created_at >= ?1
    UNION ALL SELECT date(created_at / 1000, 'unixepoch', ${TZ}), player_a, created_at FROM duels WHERE created_at >= ?1 AND player_a IS NOT NULL
    UNION ALL SELECT date(created_at / 1000, 'unixepoch', ${TZ}), player_b, created_at FROM duels WHERE created_at >= ?1 AND player_b IS NOT NULL`;
  const since30 = now - 30 * 86_400_000;
  const [users, newUsers, runsDay, activeDay, duelsDay, actWindows, lives, realms, worlds, paths, endings, duelTotals, top] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS total, SUM(isAnonymous = 1) AS guests FROM "user"`),
    db.prepare(`SELECT date(createdAt, ${TZ}) AS d, COUNT(*) AS n, SUM(COALESCE(isAnonymous, 0) = 0) AS registered FROM "user" WHERE createdAt >= ?1 GROUP BY d`).bind(sinceIso),
    db.prepare(`SELECT date(created_at / 1000, 'unixepoch', ${TZ}) AS d, COUNT(*) AS n FROM runs WHERE created_at >= ?1 GROUP BY d`).bind(since),
    db.prepare(`SELECT d, COUNT(DISTINCT uid) AS n FROM (${activity}) GROUP BY d`).bind(since),
    db.prepare(`SELECT date(created_at / 1000, 'unixepoch', ${TZ}) AS d, COALESCE(kind, 'ranked') AS kind, COUNT(*) AS n FROM duels WHERE created_at >= ?1 GROUP BY d, kind`).bind(since),
    db
      .prepare(
        `SELECT COUNT(DISTINCT CASE WHEN t >= ?2 THEN uid END) AS dau, COUNT(DISTINCT CASE WHEN t >= ?3 THEN uid END) AS wau, COUNT(DISTINCT uid) AS mau FROM (${activity})`,
      )
      .bind(since30, now - 86_400_000, now - 7 * 86_400_000),
    db.prepare(`SELECT COUNT(*) AS total, SUM(status = 'finished') AS finished, SUM(status = 'active') AS active, SUM(status = 'abandoned') AS abandoned, CAST(AVG(CASE WHEN status = 'finished' THEN age END) AS INTEGER) AS avg_age FROM runs`),
    db.prepare(`SELECT best_realm AS k, COUNT(*) AS n FROM runs WHERE status = 'finished' GROUP BY best_realm`),
    db.prepare(`SELECT world AS k, COUNT(*) AS n FROM runs GROUP BY world`),
    db.prepare(`SELECT COALESCE(path, '') AS k, COUNT(*) AS n FROM runs WHERE best_realm > 0 GROUP BY path`),
    db.prepare(`SELECT ending_reason AS k, COUNT(*) AS n FROM runs WHERE status = 'finished' GROUP BY ending_reason ORDER BY n DESC LIMIT 8`),
    db.prepare(`SELECT COALESCE(kind, 'ranked') AS kind, COUNT(*) AS n FROM duels GROUP BY kind`),
    db.prepare(
      `SELECT u.name, u.isAnonymous, MAX(r.best_realm) AS realm, MAX(r.age) AS age, COUNT(*) AS lives FROM runs r JOIN "user" u ON u.id = r.user_id GROUP BY r.user_id ORDER BY realm DESC, age DESC LIMIT 10`,
    ),
  ]);
  type Row = Record<string, unknown>;
  const rows = (r: D1Result) => r.results as Row[];
  const series = (r: D1Result, pick: (row: Row) => number = (row) => Number(row.n)) => {
    const map = new Map(rows(r).map((row) => [row.d as string, pick(row)]));
    return Array.from({ length: days }, (_, i) => {
      const d = dayKey(since + (i + 1) * 86_400_000);
      return { d, n: map.get(d) ?? 0 };
    });
  };
  const duelSeries = (kind: string) => {
    const map = new Map(rows(duelsDay).filter((r) => r.kind === kind).map((r) => [r.d as string, Number(r.n)]));
    return Array.from({ length: days }, (_, i) => {
      const d = dayKey(since + (i + 1) * 86_400_000);
      return { d, n: map.get(d) ?? 0 };
    });
  };
  const u = rows(users)[0] ?? {};
  return c.json({
    days,
    users: { total: u.total ?? 0, guests: u.guests ?? 0, registered: Number(u.total ?? 0) - Number(u.guests ?? 0) },
    active: rows(actWindows)[0] ?? { dau: 0, wau: 0, mau: 0 },
    lives: rows(lives)[0] ?? {},
    duels: Object.fromEntries(rows(duelTotals).map((r) => [r.kind, r.n])),
    series: {
      newUsers: series(newUsers),
      newRegistered: series(newUsers, (r) => Number(r.registered)),
      active: series(activeDay),
      lives: series(runsDay),
      duelsRanked: duelSeries("ranked"),
      duelsBot: duelSeries("bot"),
      duelsFriendly: duelSeries("friendly"),
    },
    dist: {
      realms: REALMS.map((r, i) => ({ k: r.name, n: Number(rows(realms).find((x) => Number(x.k) === i)?.n ?? 0) })),
      worlds: WORLDS.map((w) => ({ k: w.name, n: Number(rows(worlds).find((x) => x.k === w.id)?.n ?? 0) })),
      paths: [...PATHS.map((p) => ({ k: p.name, n: Number(rows(paths).find((x) => x.k === p.id)?.n ?? 0) })), { k: "Chưa ghi nhận", n: Number(rows(paths).find((x) => x.k === "")?.n ?? 0) }],
      endings: rows(endings).map((r) => ({ k: String(r.k ?? "—"), n: Number(r.n) })),
    },
    top: rows(top).map((r) => ({ name: r.isAnonymous ? "Vô danh tu sĩ" : r.name, realm: REALMS[Number(r.realm)]?.name, age: r.age, lives: r.lives })),
  });
});

admin.get("/settings", async (c) => {
  const values = await getSettings(c.env.DB);
  const { results } = await c.env.DB.prepare("SELECT key, updated_at, updated_by FROM settings").all<{ key: string; updated_at: number; updated_by: string }>();
  return c.json({ specs: SETTINGS, values, defaults: DEFAULTS, meta: Object.fromEntries(results.map((r) => [r.key, r])) });
});

admin.put("/settings", async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}));
  const { values, errors } = validateSettings(body);
  if (Object.keys(errors).length) return c.json({ error: "invalid", errors }, 400);
  const db = c.env.DB;
  const now = Date.now();
  const by = c.get("user").email;
  const stmts = Object.entries(values).map(([k, v]) =>
    v === DEFAULTS[k]
      ? db.prepare("DELETE FROM settings WHERE key = ?").bind(k) // về mặc định thì xoá dòng
      : db.prepare("INSERT INTO settings (key, value, updated_at, updated_by) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = ?3, updated_by = ?4").bind(k, JSON.stringify(v), now, by),
  );
  if (stmts.length) await db.batch(stmts);
  clearSettingsCache();
  return c.json({ ok: true, values: await getSettings(db) });
});

// ---------------------------------------------------------------- Quản lý câu hỏi (có phiên bản)
// Mỗi thay đổi = một phiên bản mới. Sửa = ẩn dòng cũ + thêm dòng mới cùng family/ord. Xoá = ẩn. Không bao giờ ghi đè.

const MIN_PER_PATH = 6;
const PATH_IDS = PATHS.map((p) => p.id) as string[];

type QuestionInput = { path?: unknown; level?: unknown; prompt?: unknown; options?: unknown; answer?: unknown; explain?: unknown };

function validateQuestion(b: QuestionInput): { value?: { path: string; level: 1 | 2 | 3; prompt: string; options: string[]; answer: number; explain: string }; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const path = String(b.path ?? "");
  const level = Number(b.level);
  const prompt = String(b.prompt ?? "").trim();
  const options = Array.isArray(b.options) ? b.options.map((o) => String(o ?? "").trim()) : [];
  const answer = Number(b.answer);
  const explain = String(b.explain ?? "").trim();
  if (!PATH_IDS.includes(path)) errors.path = "Chọn đạo đồ";
  if (![1, 2, 3].includes(level)) errors.level = "Cấp độ 1–3";
  if (prompt.length < 5 || prompt.length > 300) errors.prompt = "Câu hỏi 5–300 ký tự";
  if (options.length < 2 || options.length > 6) errors.options = "Cần 2–6 phương án";
  else if (options.some((o) => !o || o.length > 120)) errors.options = "Mỗi phương án 1–120 ký tự";
  else if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) errors.options = "Các phương án không được trùng nhau";
  if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) errors.answer = "Chọn đáp án đúng";
  if (explain.length < 5 || explain.length > 600) errors.explain = "Lời giảng 5–600 ký tự";
  return Object.keys(errors).length ? { errors } : { value: { path, level: level as 1 | 2 | 3, prompt, options, answer, explain }, errors };
}

const newId = (path: string) => `${path}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

function insertRow(db: D1Database, v: { path: string; level: 1 | 2 | 3; prompt: string; options: string[]; answer: number; explain: string }, id: string, family: string, ord: number, version: number, by: string) {
  const q = makeQuestion(id, v.level, v.prompt, v.options, v.answer, v.explain);
  return db
    .prepare(
      `INSERT INTO questions (id, family, path, level, prompt, options_json, answer, explain, ord, created_v, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, family, v.path, v.level, v.prompt, JSON.stringify(q.options), q.answer, v.explain, ord, version, Date.now(), by);
}

const bump = (db: D1Database, version: number) => db.prepare("UPDATE quiz_meta SET v = ? WHERE k = 'version'").bind(version);

const toAdminRow = (r: QuestionRow) => {
  const q = rowToQuestion(r);
  return { id: r.id, family: r.family, path: r.path, level: r.level, prompt: r.prompt, options: q.options.map((o) => o.text), answer: q.options.findIndex((o) => o.id === q.answer), explain: r.explain, ord: r.ord, createdV: r.created_v, deletedV: r.deleted_v, updatedAt: r.updated_at, updatedBy: r.updated_by };
};

admin.get("/questions", async (c) => {
  const db = c.env.DB;
  const version = await currentVersion(db);
  const deleted = c.req.query("deleted") === "1";
  const { results } = await db.prepare("SELECT * FROM questions ORDER BY path, ord, created_v").all<QuestionRow>();
  const current = results.filter((r) => r.deleted_v === null);
  const liveFamilies = new Set(current.map((r) => r.family));
  // Đã xoá: bản cuối của mỗi family không còn bản đang dùng
  const removed = [...new Map(results.filter((r) => r.deleted_v !== null && !liveFamilies.has(r.family)).map((r) => [r.family, r] as const)).values()];
  const counts: Record<string, number[]> = {};
  for (const r of current) (counts[r.path] ??= [0, 0, 0])[r.level - 1]++;
  return c.json({ version, counts, items: (deleted ? removed : current).map(toAdminRow) });
});

admin.post("/questions", async (c) => {
  const { value, errors } = validateQuestion(await c.req.json<QuestionInput>().catch(() => ({})));
  if (!value) return c.json({ error: "invalid", errors }, 400);
  const db = c.env.DB;
  const v = (await currentVersion(db)) + 1;
  const max = await db.prepare("SELECT COALESCE(MAX(ord), -1) AS m FROM questions WHERE path = ?").bind(value.path).first<{ m: number }>();
  const id = newId(value.path);
  await db.batch([insertRow(db, value, id, id, (max?.m ?? -1) + 1, v, c.get("user").email), bump(db, v)]);
  clearQuizCache();
  return c.json({ ok: true, id, version: v }, 201);
});

admin.put("/questions/:id", async (c) => {
  const { value, errors } = validateQuestion(await c.req.json<QuestionInput>().catch(() => ({})));
  if (!value) return c.json({ error: "invalid", errors }, 400);
  const db = c.env.DB;
  const old = await db.prepare("SELECT * FROM questions WHERE id = ? AND deleted_v IS NULL").bind(c.req.param("id")).first<QuestionRow>();
  if (!old) return c.json({ error: "not_found" }, 404);
  if (old.path !== value.path) return c.json({ error: "invalid", errors: { path: "Không đổi đạo đồ khi sửa — hãy xoá và thêm câu mới" } }, 400);
  const v = (await currentVersion(db)) + 1;
  const id = newId(value.path);
  await db.batch([
    db.prepare("UPDATE questions SET deleted_v = ? WHERE id = ?").bind(v, old.id),
    insertRow(db, value, id, old.family, old.ord, v, c.get("user").email),
    bump(db, v),
  ]);
  clearQuizCache();
  return c.json({ ok: true, id, version: v });
});

admin.delete("/questions/:id", async (c) => {
  const db = c.env.DB;
  const old = await db.prepare("SELECT * FROM questions WHERE id = ? AND deleted_v IS NULL").bind(c.req.param("id")).first<QuestionRow>();
  if (!old) return c.json({ error: "not_found" }, 404);
  const left = await db.prepare("SELECT COUNT(*) AS n FROM questions WHERE path = ? AND deleted_v IS NULL").bind(old.path).first<{ n: number }>();
  if ((left?.n ?? 0) <= MIN_PER_PATH) return c.json({ error: "too_few", message: `Mỗi đạo đồ cần giữ ít nhất ${MIN_PER_PATH} câu hỏi.` }, 400);
  const v = (await currentVersion(db)) + 1;
  await db.batch([db.prepare("UPDATE questions SET deleted_v = ? WHERE id = ?").bind(v, old.id), bump(db, v)]);
  clearQuizCache();
  return c.json({ ok: true, version: v });
});

admin.post("/questions/:id/restore", async (c) => {
  const db = c.env.DB;
  const old = await db.prepare("SELECT * FROM questions WHERE id = ? AND deleted_v IS NOT NULL").bind(c.req.param("id")).first<QuestionRow>();
  if (!old) return c.json({ error: "not_found" }, 404);
  const live = await db.prepare("SELECT 1 FROM questions WHERE family = ? AND deleted_v IS NULL").bind(old.family).first();
  if (live) return c.json({ error: "exists", message: "Câu này đang có bản dùng được." }, 400);
  const v = (await currentVersion(db)) + 1;
  const a = toAdminRow(old);
  const id = newId(old.path);
  await db.batch([insertRow(db, { path: old.path, level: old.level as 1 | 2 | 3, prompt: a.prompt, options: a.options, answer: a.answer, explain: a.explain }, id, old.family, old.ord, v, c.get("user").email), bump(db, v)]);
  clearQuizCache();
  return c.json({ ok: true, id, version: v });
});

admin.get("/questions/export", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM questions WHERE deleted_v IS NULL ORDER BY path, ord").all<QuestionRow>();
  const items = results.map((r) => {
    const a = toAdminRow(r);
    return { path: a.path, level: a.level, prompt: a.prompt, options: a.options, answer: a.answer, explain: a.explain };
  });
  return new Response(JSON.stringify({ items }, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="cau-hoi-tu-tien.json"` },
  });
});

// Nhập hàng loạt: chỉ THÊM câu mới (không sửa câu cũ), tất cả trong một phiên bản
admin.post("/questions/import", async (c) => {
  const body = await c.req.json<{ items?: QuestionInput[] }>().catch(() => ({ items: undefined }));
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length || items.length > 500) return c.json({ error: "invalid", message: "Cần 1–500 câu trong trường items." }, 400);
  const parsed = items.map((it, i) => ({ i, ...validateQuestion(it) }));
  const bad = parsed.filter((p) => !p.value).slice(0, 20).map((p) => ({ row: p.i + 1, errors: p.errors }));
  if (bad.length) return c.json({ error: "invalid", message: "Có câu chưa hợp lệ, chưa nhập câu nào.", rows: bad }, 400);
  const db = c.env.DB;
  const v = (await currentVersion(db)) + 1;
  const { results } = await db.prepare("SELECT path, COALESCE(MAX(ord), -1) AS m FROM questions GROUP BY path").all<{ path: string; m: number }>();
  const nextOrd: Record<string, number> = Object.fromEntries(results.map((r) => [r.path, r.m + 1]));
  const by = c.get("user").email;
  const stmts = parsed.map(({ value }) => {
    const id = newId(value!.path) + Math.floor(Math.random() * 1e4).toString(36);
    const ord = (nextOrd[value!.path] ??= 0);
    nextOrd[value!.path]++;
    return insertRow(db, value!, id, id, ord, v, by);
  });
  await db.batch([...stmts, bump(db, v)]);
  clearQuizCache();
  return c.json({ ok: true, added: stmts.length, version: v });
});
