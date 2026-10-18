import { Hono } from "hono";
import { createAuth, GUEST_NAME, type Env } from "./auth";
import { ACHIEVEMENTS, ORIGINS, PATHS, PHYSIQUES, REALMS, ROOTS, SECTS, WORLDS } from "./game/data";
import { DUEL, type Fighter } from "./duel/logic";

import { admin, isAdmin } from "./admin";
import { gameConfigOf, getSettings } from "./settings";
import { banksFor, currentBanks } from "./quiz-store";

export { Matchmaker } from "./duel/matchmaker";
export { DuelRoom } from "./duel/room";
import { createProfile, InvalidChoiceError, replay, type ChoiceInput, type Profile, type RunState } from "./game/engine";

type User = { id: string; name: string; email: string; isAnonymous?: boolean | null };
type Vars = { user: User };
type RunRow = { id: string; user_id: string; number: number; seed: number; world: string; profile_json: string; status: string };


const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.on(["GET", "POST"], "/api/auth/*", (c) => createAuth(c.env).handler(c.req.raw));

// Cẩm nang + cấu hình: công khai, client tải một lần lúc mở game
app.get("/api/codex", async (c) => {
  const { banks } = await currentBanks(c.env.DB);
  return c.json({
    realms: REALMS,
    roots: ROOTS,
    physiques: PHYSIQUES,
    // Chỉ gửi thông tin đạo đồ và số câu — tuyệt đối không gửi ngân hàng câu hỏi
    paths: PATHS.map(({ id, name, glyph, desc, perk }) => ({ id, name, glyph, desc, perk, questions: banks[id]?.length ?? 0 })),
    origins: ORIGINS.map(({ id, name, resources, sect }) => ({ id, name, resources, sect })),
    worlds: WORLDS,
    sects: SECTS,
    achievements: ACHIEVEMENTS.map(({ id, name, desc }) => ({ id, name, desc })),
    google: !!(c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET),
  });
});

// Mọi API game đều cần phiên (khách hoặc thật). Client gọi /api/auth/sign-in/anonymous lúc mở game.
app.use("/api/game/*", async (c, next) => {
  const session = await createAuth(c.env).api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "unauthenticated" }, 401);
  c.set("user", session.user as User);
  await next();
});

app.get("/api/game/me", async (c) => {
  const user = c.get("user");
  const stats = await c.env.DB.prepare("SELECT best_realm, longest_age, total_runs, achievements_json FROM user_stats WHERE user_id = ?")
    .bind(user.id)
    .first<{ best_realm: number; longest_age: number; total_runs: number; achievements_json: string }>();
  return c.json({
    id: user.id,
    name: user.name,
    email: user.isAnonymous ? null : user.email,
    isGuest: !!user.isAnonymous,
    isAdmin: isAdmin(c.env, user),
    stats: { best_realm: stats?.best_realm ?? 0, longest_age: stats?.longest_age ?? 0, total_runs: stats?.total_runs ?? 0 },
    achievements: JSON.parse(stats?.achievements_json ?? "[]") as string[],
  });
});

// Bắt đầu kiếp mới. Kiếp đang dở (nếu có) được tính là luân hồi sớm.
app.post("/api/game/runs", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const stats = await db.prepare("SELECT pity_count FROM user_stats WHERE user_id = ?").bind(user.id).first<{ pity_count: number }>();
  const last = await db.prepare("SELECT COALESCE(MAX(number), 0) AS n FROM runs WHERE user_id = ?").bind(user.id).first<{ n: number }>();

  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  // Chụp cấu hình hiện tại vào kiếp: admin đổi chỉ số sau này không ảnh hưởng kiếp đang chơi
  const settings = await getSettings(db);
  const profile = createProfile(seed, stats?.pity_count ?? 0, gameConfigOf(settings), Number(settings.pityLimit));
  // Chụp phiên bản ngân hàng câu hỏi: admin sửa câu hỏi sau này không làm lệch kiếp này
  const { version: qv, banks } = await currentBanks(db);
  if (qv) profile.qv = qv;
  const state = replay(seed, profile, [], banks);
  const id = crypto.randomUUID();
  const now = Date.now();
  const pity = profile.isGood ? 0 : (stats?.pity_count ?? 0) + 1;

  await db.batch([
    db.prepare("UPDATE runs SET status = 'abandoned', ended_at = ?, ending_reason = 'Luân hồi sớm' WHERE user_id = ? AND status = 'active'").bind(now, user.id),
    db.prepare("INSERT INTO runs (id, user_id, number, seed, world, profile_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(id, user.id, (last?.n ?? 0) + 1, seed, profile.world, JSON.stringify(profile), now),
    db.prepare(
      `INSERT INTO user_stats (user_id, total_runs, pity_count, updated_at) VALUES (?1, 1, ?2, ?3)
       ON CONFLICT(user_id) DO UPDATE SET total_runs = total_runs + 1, pity_count = ?2, updated_at = ?3`,
    ).bind(user.id, pity, now),
  ]);
  const unlocked = await saveProgress(db, id, user.id, state);
  return c.json({ ...view(id, (last?.n ?? 0) + 1, profile, state), unlocked }, 201);
});

app.get("/api/game/runs/current", async (c) => {
  const user = c.get("user");
  const run = await c.env.DB.prepare("SELECT * FROM runs WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1").bind(user.id).first<RunRow>();
  if (!run) return c.json(null);
  const profile = JSON.parse(run.profile_json) as Profile;
  try {
    return c.json(view(run.id, run.number, profile, replay(run.seed, profile, await loadChoices(c.env.DB, run.id), await banksFor(c.env.DB, profile.qv))));
  } catch (e) {
    // Nội dung game đã thay đổi khiến lựa chọn cũ không còn khớp: khép kiếp dở thay vì báo lỗi mãi
    if (!(e instanceof InvalidChoiceError)) throw e;
    await c.env.DB.prepare("UPDATE runs SET status = 'abandoned', ended_at = ?, ending_reason = 'Thiên đạo biến đổi (cập nhật nội dung)' WHERE id = ?")
      .bind(Date.now(), run.id).run();
    return c.json(null);
  }
});

// Gửi một lựa chọn. `step` = thứ tự lựa chọn; gửi lại cùng step + cùng lựa chọn thì trả lại trạng thái (idempotent).
app.post("/api/game/runs/:id/choices", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const body = await c.req.json<{ step: number } & ChoiceInput>();
  const run = await db.prepare("SELECT * FROM runs WHERE id = ? AND user_id = ?").bind(c.req.param("id"), user.id).first<RunRow>();
  if (!run) return c.json({ error: "not_found" }, 404);

  const profile = JSON.parse(run.profile_json) as Profile;
  const choices = await loadChoices(db, run.id);
  if (run.status !== "active") return c.json({ error: "run_closed" }, 409);

  if (body.step < choices.length) {
    const prev = choices[body.step];
    if (prev.eventId === body.eventId && prev.choiceId === body.choiceId) {
      return c.json({ ...view(run.id, run.number, profile, replay(run.seed, profile, choices, await banksFor(db, profile.qv))), unlocked: [] });
    }
    return c.json({ error: "step_conflict" }, 409);
  }
  if (body.step !== choices.length) return c.json({ error: "step_gap", expected: choices.length }, 409);

  let state: RunState;
  try {
    state = replay(run.seed, profile, [...choices, { eventId: body.eventId, choiceId: body.choiceId }], await banksFor(db, profile.qv));
  } catch (e) {
    if (e instanceof InvalidChoiceError) return c.json({ error: "invalid_choice" }, 400);
    throw e;
  }
  await db.prepare("INSERT INTO run_choices (run_id, step, event_id, choice_id, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING")
    .bind(run.id, body.step, body.eventId, body.choiceId, Date.now()).run();
  const unlocked = await saveProgress(db, run.id, user.id, state);
  return c.json({ ...view(run.id, run.number, profile, state), unlocked });
});

// Xem lại toàn bộ một kiếp đã qua (dựng lại từ seed + lựa chọn)
app.get("/api/game/runs/:id", async (c) => {
  const run = await c.env.DB.prepare("SELECT * FROM runs WHERE id = ? AND user_id = ?").bind(c.req.param("id"), c.get("user").id).first<RunRow>();
  if (!run) return c.json({ error: "not_found" }, 404);
  const profile = JSON.parse(run.profile_json) as Profile;
  const choices = await loadChoices(c.env.DB, run.id);
  // Kiếp từ phiên bản nội dung cũ có thể không dựng lại trọn vẹn: phát lại tới lựa chọn cuối còn hợp lệ
  const banks = await banksFor(c.env.DB, profile.qv);
  for (let n = choices.length; n >= 0; n--) {
    try {
      return c.json({ ...view(run.id, run.number, profile, replay(run.seed, profile, choices.slice(0, n), banks)), status: run.status, storedEnding: (run as RunRow & { ending_reason: string | null }).ending_reason });
    } catch (e) {
      if (!(e instanceof InvalidChoiceError)) throw e;
    }
  }
  return c.json({ error: "replay_failed" }, 500);
});

app.get("/api/game/runs", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, number, world, status, best_realm, age, ending_reason, created_at, ended_at FROM runs WHERE user_id = ? ORDER BY number DESC LIMIT 50",
  ).bind(c.get("user").id).all();
  return c.json(results);
});

// Công khai. Mỗi người chỉ hiện kiếp tốt nhất. Khách vẫn lên bảng nhưng hiện "Vô danh tu sĩ" cho đến khi đăng ký.
// ?by=realm (mặc định): cảnh giới rồi tuổi · ?by=age: sống lâu nhất
app.get("/api/leaderboard", async (c) => {
  const order = c.req.query("by") === "age" ? "r.age DESC, r.best_realm DESC" : "r.best_realm DESC, r.age DESC";
  const { results } = await c.env.DB.prepare(
    `SELECT name, isAnonymous, user_id, best_realm, age, world, ending_reason FROM (
       SELECT u.name, u.isAnonymous, r.user_id, r.best_realm, r.age, r.world, r.ending_reason,
              ROW_NUMBER() OVER (PARTITION BY r.user_id ORDER BY ${order}, r.ended_at) AS rn
       FROM runs r JOIN "user" u ON u.id = r.user_id
       WHERE r.status = 'finished'
     ) r WHERE rn = 1 ORDER BY ${order} LIMIT 50`,
  ).all<{ name: string; isAnonymous: number; user_id: string }>();
  return c.json(results.map(({ user_id, isAnonymous, ...r }) => ({ ...r, name: isAnonymous ? GUEST_NAME : r.name, userId: user_id })));
});

app.route("/api/admin", admin);

// ---------------------------------------------------------------- Bản đồ thế giới

// Công khai, cache 60 giây ở edge. Mỗi người chỉ tính kiếp tốt nhất khi xếp hạng.
app.get("/api/world", async (c) => {
  const cache = caches.default;
  const key = new Request(new URL("/api/world?v=1", c.req.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  const db = c.env.DB;
  const name = (r: { name: string; isAnonymous: number | null }) => (r.isAnonymous ? GUEST_NAME : r.name);
  const [totals, worlds, worldTop, sects, sectTop] = await db.batch([
    db.prepare(`SELECT COUNT(DISTINCT user_id) AS players, COUNT(*) AS lives, SUM(status = 'active') AS active FROM runs`),
    db.prepare(
      `SELECT world, COUNT(DISTINCT user_id) AS players, COUNT(*) AS lives, SUM(status = 'active') AS active,
              CAST(AVG(CASE WHEN status = 'finished' THEN age END) AS INTEGER) AS avg_age, MAX(age) AS max_age, MAX(best_realm) AS top_realm
       FROM runs GROUP BY world`,
    ),
    db.prepare(
      `SELECT world, name, isAnonymous, best_realm, age, sect_id FROM (
         SELECT r.world, u.name, u.isAnonymous, r.best_realm, r.age, r.sect_id,
                ROW_NUMBER() OVER (PARTITION BY r.world ORDER BY r.best_realm DESC, r.age DESC) AS rn
         FROM runs r JOIN "user" u ON u.id = r.user_id) WHERE rn <= 3`,
    ),
    db.prepare(
      `WITH best AS (
         SELECT sect_id, user_id, MAX(best_realm) AS realm, MAX(sect_rank = 'elder') AS elder
         FROM runs WHERE sect_id IS NOT NULL AND sect_rank IN ('member', 'elder') GROUP BY sect_id, user_id)
       SELECT sect_id, COUNT(*) AS members, SUM(elder) AS elders, SUM((realm + 1) * (realm + 1)) AS power, MAX(realm) AS top_realm
       FROM best GROUP BY sect_id`,
    ),
    db.prepare(
      `SELECT sect_id, name, isAnonymous, best_realm, age, sect_rank FROM (
         SELECT r.sect_id, u.name, u.isAnonymous, r.best_realm, r.age, r.sect_rank,
                ROW_NUMBER() OVER (PARTITION BY r.sect_id ORDER BY r.best_realm DESC, r.age DESC) AS rn
         FROM runs r JOIN "user" u ON u.id = r.user_id
         WHERE r.sect_id IS NOT NULL AND r.sect_rank IN ('member', 'elder')) WHERE rn = 1`,
    ),
  ]);
  type Row = Record<string, unknown>;
  const rows = (r: D1Result) => r.results as Row[];
  const sectStats = new Map(rows(sects).map((r) => [r.sect_id as string, r]));
  const sectLead = new Map(rows(sectTop).map((r) => [r.sect_id as string, r]));
  const worldStats = new Map(rows(worlds).map((r) => [r.world as string, r]));
  const body = {
    totals: rows(totals)[0] ?? { players: 0, lives: 0, active: 0 },
    worlds: WORLDS.map((w) => {
      const st = worldStats.get(w.id) ?? {};
      return {
        id: w.id,
        players: st.players ?? 0,
        lives: st.lives ?? 0,
        active: st.active ?? 0,
        avgAge: st.avg_age ?? null,
        maxAge: st.max_age ?? null,
        topRealm: st.top_realm ?? null,
        top: rows(worldTop)
          .filter((r) => r.world === w.id)
          .map((r) => ({ name: name(r as { name: string; isAnonymous: number }), realm: r.best_realm, age: r.age, sect: r.sect_id })),
        sects: SECTS.filter((x) => x.world === w.id)
          .map((x) => {
            const st = sectStats.get(x.id);
            const lead = sectLead.get(x.id);
            return {
              id: x.id,
              members: st?.members ?? 0,
              elders: st?.elders ?? 0,
              power: st?.power ?? 0,
              topRealm: st?.top_realm ?? null,
              leader: lead ? { name: name(lead as { name: string; isAnonymous: number }), realm: lead.best_realm, age: lead.age, rank: lead.sect_rank } : null,
            };
          })
          .sort((a, b) => Number(b.power) - Number(a.power)),
      };
    }),
  };
  const res = new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" } });
  c.executionCtx.waitUntil(cache.put(key, res.clone()));
  return res;
});

// ---------------------------------------------------------------- Luận đạo (đấu trực tiếp)

async function sessionUser(c: { env: Env; req: { raw: Request } }) {
  const session = await createAuth(c.env).api.getSession({ headers: c.req.raw.headers });
  return (session?.user as User | undefined) ?? null;
}

async function fighterOf(env: Env, user: User): Promise<Fighter> {
  const [r, st] = await Promise.all([
    env.DB.prepare("SELECT rating FROM ratings WHERE user_id = ?").bind(user.id).first<{ rating: number }>(),
    env.DB.prepare("SELECT best_realm FROM user_stats WHERE user_id = ?").bind(user.id).first<{ best_realm: number }>(),
  ]);
  return {
    id: user.id,
    name: user.isAnonymous ? GUEST_NAME : user.name,
    rating: r?.rating ?? DUEL.baseRating,
    realm: Math.max(1, st?.best_realm ?? 1),
    path: null,
    guest: !!user.isAnonymous,
    bot: false,
  };
}

// WebSocket: vào hàng chờ ghép cặp
app.get("/api/duel/queue", async (c) => {
  if (c.req.header("Upgrade") !== "websocket") return c.text("Cần WebSocket", 426);
  const user = await sessionUser(c);
  if (!user) return c.text("unauthenticated", 401);
  const headers = new Headers(c.req.raw.headers);
  headers.set("X-Fighter", JSON.stringify(await fighterOf(c.env, user)));
  // ?mode=host: tạo phòng mời bạn · ?mode=join&code=XXXXX: vào phòng bằng mã · mặc định: hàng chờ thường
  const mode = c.req.query("mode");
  headers.set("X-Mode", mode === "host" || mode === "join" ? mode : "queue");
  if (mode === "join") headers.set("X-Code", c.req.query("code") ?? "");
  const stub = c.env.MATCHMAKER.get(c.env.MATCHMAKER.idFromName("global"));
  return stub.fetch(c.req.raw.url, { headers });
});

// WebSocket: vào phòng đấu đã được ghép
app.get("/api/duel/room/:id", async (c) => {
  if (c.req.header("Upgrade") !== "websocket") return c.text("Cần WebSocket", 426);
  const user = await sessionUser(c);
  if (!user) return c.text("unauthenticated", 401);
  let id: DurableObjectId;
  try {
    id = c.env.DUEL_ROOM.idFromString(c.req.param("id"));
  } catch {
    return c.text("not found", 404);
  }
  const headers = new Headers(c.req.raw.headers);
  headers.set("X-User-Id", user.id);
  return c.env.DUEL_ROOM.get(id).fetch(c.req.raw.url, { headers });
});

app.get("/api/duel/me", async (c) => {
  const user = await sessionUser(c);
  if (!user) return c.json({ error: "unauthenticated" }, 401);
  const db = c.env.DB;
  const [r, rank, recent] = await Promise.all([
    db.prepare("SELECT rating, best_rating, wins, losses, draws FROM ratings WHERE user_id = ?").bind(user.id).first(),
    db.prepare("SELECT COUNT(*) + 1 AS n FROM ratings WHERE rating > (SELECT rating FROM ratings WHERE user_id = ?)").bind(user.id).first<{ n: number }>(),
    db
      .prepare(
        `SELECT id, created_at,
           CASE WHEN player_a = ?1 THEN b_name ELSE a_name END AS opponent,
           CASE WHEN player_a = ?1 THEN a_score ELSE b_score END AS my_score,
           CASE WHEN player_a = ?1 THEN b_score ELSE a_score END AS opp_score,
           CASE WHEN player_a = ?1 THEN a_delta ELSE b_delta END AS delta,
           CASE WHEN winner = 'draw' THEN 'draw' WHEN (winner = 'a') = (player_a = ?1) THEN 'win' ELSE 'lose' END AS result
         FROM duels WHERE player_a = ?1 OR player_b = ?1 ORDER BY created_at DESC LIMIT 10`,
      )
      .bind(user.id)
      .all(),
  ]);
  return c.json({
    guest: !!user.isAnonymous,
    rating: (r as { rating?: number } | null)?.rating ?? DUEL.baseRating,
    stats: r ?? { rating: DUEL.baseRating, best_rating: DUEL.baseRating, wins: 0, losses: 0, draws: 0 },
    rank: r ? rank?.n ?? null : null,
    recent: recent.results,
  });
});

// Bảng Đạo vị: chỉ tài khoản đã đăng ký, đã đấu ít nhất 1 trận
app.get("/api/duel/leaderboard", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT r.user_id AS userId, u.name, r.rating, r.wins, r.losses, r.draws
     FROM ratings r JOIN "user" u ON u.id = r.user_id
     WHERE u.isAnonymous = 0 OR u.isAnonymous IS NULL
     ORDER BY r.rating DESC, r.wins DESC LIMIT 50`,
  ).all();
  return c.json(results);
});

async function loadChoices(db: D1Database, runId: string): Promise<ChoiceInput[]> {
  const { results } = await db.prepare("SELECT event_id, choice_id FROM run_choices WHERE run_id = ? ORDER BY step").bind(runId).all<{ event_id: string; choice_id: string }>();
  return results.map((r) => ({ eventId: r.event_id, choiceId: r.choice_id }));
}

// Trả về danh sách thành tựu mới mở khoá (nếu kiếp vừa kết thúc)
async function saveProgress(db: D1Database, runId: string, userId: string, s: RunState): Promise<string[]> {
  const finished = s.phase === "finished";
  let unlocked: string[] = [];
  let all: string[] = [];
  if (finished) {
    const row = await db.prepare("SELECT achievements_json FROM user_stats WHERE user_id = ?").bind(userId).first<{ achievements_json: string }>();
    const had = JSON.parse(row?.achievements_json ?? "[]") as string[];
    unlocked = s.achievements.filter((a) => !had.includes(a));
    all = [...had, ...unlocked];
  }
  const stmts = [
    db.prepare("UPDATE runs SET best_realm = ?, age = ?, status = ?, ending_reason = ?, ended_at = ?, sect_id = ?, sect_rank = ?, path = ? WHERE id = ? AND status = 'active'")
      .bind(s.realm, s.age, finished ? "finished" : "active", s.endingReason, finished ? Date.now() : null, s.sectId, s.sectId && s.sect !== "none" ? s.sect : null, s.path, runId),
  ];
  if (finished) {
    stmts.push(
      db.prepare("UPDATE user_stats SET best_realm = MAX(best_realm, ?), longest_age = MAX(longest_age, ?), achievements_json = ?, updated_at = ? WHERE user_id = ?")
        .bind(s.realm, s.age, JSON.stringify(all), Date.now(), userId),
    );
  }
  await db.batch(stmts);
  return unlocked;
}

function view(id: string, number: number, profile: Profile, s: RunState) {
  return { id, number, profile, ...s };
}

export default {
  fetch: app.fetch,
  // Dọn tài khoản khách không hoạt động quá 90 ngày (kiếp, thống kê, phiên bị xoá theo ON DELETE CASCADE)
  async scheduled(_event: ScheduledController, env: Env) {
    // Better Auth lưu ngày dạng chuỗi ISO trên D1 → so sánh chuỗi
    const ttlDays = Number((await getSettings(env.DB)).guestTtlDays);
    const cutoff = new Date(Date.now() - ttlDays * 86_400_000).toISOString();
    await env.DB.prepare(
      `DELETE FROM "user" WHERE isAnonymous = 1 AND createdAt < ?1
       AND NOT EXISTS (SELECT 1 FROM session s WHERE s.userId = "user".id AND s.updatedAt >= ?1)`,
    ).bind(cutoff).run();
  },
} satisfies ExportedHandler<Env>;
