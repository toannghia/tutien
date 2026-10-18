// API ôn tập ngắt quãng: tổng quan sổ nhớ, phiên ôn (câu đến hạn + câu mới), chấm từng câu.
import { Hono } from "hono";
import { createAuth, type Env } from "./auth";
import { currentBanks, questionById } from "./quiz-store";
import { recordAnswers, retention, type Card } from "./srs";

type User = { id: string; isAnonymous?: boolean | null };
export const review = new Hono<{ Bindings: Env; Variables: { user: User } }>();

review.use("*", async (c, next) => {
  const session = await createAuth(c.env).api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "unauthenticated" }, 401);
  c.set("user", session.user as User);
  await next();
});

const DAY = 86_400_000;
const vnDay = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10);

review.get("/summary", async (c) => {
  const now = Date.now();
  const { results } = await c.env.DB.prepare("SELECT family, path, ease, interval, reps, lapses, seen, correct, due_at, last_at FROM user_srs WHERE user_id = ?")
    .bind(c.get("user").id)
    .all<Card & { family: string; path: string }>();
  const { banks } = await currentBanks(c.env.DB);
  const endToday = Date.parse(`${vnDay(now)}T23:59:59+07:00`);
  const upcoming = Array.from({ length: 7 }, (_, i) => ({ d: vnDay(now + i * DAY), n: 0 }));
  for (const r of results) {
    const idx = r.due_at <= now ? 0 : upcoming.findIndex((u) => u.d === vnDay(r.due_at));
    if (idx >= 0) upcoming[idx].n++;
  }
  const byPath = Object.fromEntries(
    Object.entries(banks).map(([p, list]) => {
      const mine = results.filter((r) => r.path === p);
      return [p, { total: list.length, learned: mine.length, mastered: mine.filter((r) => r.interval >= 21).length, due: mine.filter((r) => r.due_at <= now).length }];
    }),
  );
  return c.json({
    due: results.filter((r) => r.due_at <= now).length,
    dueToday: results.filter((r) => r.due_at <= endToday).length,
    learned: results.length,
    learning: results.filter((r) => r.interval < 21).length,
    mastered: results.filter((r) => r.interval >= 21).length,
    accuracy: results.reduce((a, r) => a + r.seen, 0) ? results.reduce((a, r) => a + r.correct, 0) / results.reduce((a, r) => a + r.seen, 0) : null,
    retention: results.length ? results.reduce((a, r) => a + retention(r, now), 0) / results.length : null,
    hardest: results
      .filter((r) => r.lapses > 0)
      .sort((a, b) => b.lapses - a.lapses)
      .slice(0, 5)
      .map((r) => ({ family: r.family, lapses: r.lapses })),
    upcoming,
    byPath,
  });
});

// Phiên ôn: câu đến hạn trước (quá hạn lâu nhất), thiếu thì thêm câu mới chưa từng gặp (dễ trước)
review.get("/session", async (c) => {
  const n = Math.min(20, Math.max(1, Number(c.req.query("n") ?? 10)));
  const path = c.req.query("path") || undefined;
  const db = c.env.DB;
  const userId = c.get("user").id;
  const now = Date.now();
  const { banks } = await currentBanks(db);
  const pool = path ? { [path]: banks[path] ?? [] } : banks;
  const all = Object.entries(pool).flatMap(([p, list]) => list.map((q) => ({ q, path: p })));
  const { results } = await db.prepare("SELECT family, path, due_at, interval, lapses, reps FROM user_srs WHERE user_id = ?").bind(userId).all<{ family: string; path: string; due_at: number; interval: number; lapses: number; reps: number }>();
  const mine = new Map(results.map((r) => [r.family, r]));
  // family của câu hiện hành: id câu trong code = family; câu do admin thêm có family riêng → tra trong D1
  const { results: fam } = await db.prepare("SELECT id, family FROM questions WHERE deleted_v IS NULL").all<{ id: string; family: string }>();
  const familyOfId = new Map(fam.map((r) => [r.id, r.family]));
  const withFam = all.map((x) => ({ ...x, family: familyOfId.get(x.q.id) ?? x.q.id }));
  const due = withFam.filter((x) => (mine.get(x.family)?.due_at ?? Infinity) <= now).sort((a, b) => mine.get(a.family)!.due_at - mine.get(b.family)!.due_at);
  const fresh = withFam.filter((x) => !mine.has(x.family)).sort((a, b) => a.q.level - b.q.level || Math.random() - 0.5);
  const picked = [...due.map((x) => ({ ...x, isNew: false })), ...fresh.map((x) => ({ ...x, isNew: true }))].slice(0, n);
  return c.json({
    items: picked.map(({ q, path, family, isNew }) => ({
      qid: q.id,
      path,
      level: q.level,
      prompt: q.prompt,
      isNew,
      lapses: mine.get(family)?.lapses ?? 0,
      options: [...q.options].sort(() => Math.random() - 0.5).map(({ id, text }) => ({ id, text })),
    })),
  });
});

review.post("/answer", async (c) => {
  const body = await c.req.json<{ qid?: string; choiceId?: string }>().catch(() => ({}) as { qid?: string; choiceId?: string });
  const q = body.qid ? await questionById(c.env.DB, body.qid) : null;
  if (!q) return c.json({ error: "not_found" }, 404);
  const skipped = body.choiceId === "skip";
  if (!skipped && !q.options.some((o) => o.id === body.choiceId)) return c.json({ error: "invalid_choice" }, 400);
  const ok = !skipped && body.choiceId === q.answer;
  const userId = c.get("user").id;
  await recordAnswers(c.env.DB, userId, [{ family: q.family, path: q.path, grade: skipped ? "skip" : ok ? "good" : "again" }]);
  const card = await c.env.DB.prepare("SELECT interval, due_at, reps FROM user_srs WHERE user_id = ? AND family = ?").bind(userId, q.family).first<{ interval: number; due_at: number; reps: number }>();
  return c.json({ ok, skipped, answer: q.answer, answerText: q.options.find((o) => o.id === q.answer)!.text, explain: q.explain, interval: card?.interval ?? 0, dueAt: card?.due_at ?? null, reps: card?.reps ?? 0 });
});
