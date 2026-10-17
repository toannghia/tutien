// Trang quản trị: báo cáo người chơi + cấu hình chỉ số. Chỉ email trong ADMIN_EMAILS (tài khoản đã đăng ký) mới vào được.
import { Hono } from "hono";
import { createAuth, type Env } from "./auth";
import { REALMS, WORLDS, PATHS } from "./game/data";
import { clearSettingsCache, DEFAULTS, getSettings, SETTINGS, validateSettings } from "./settings";

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
