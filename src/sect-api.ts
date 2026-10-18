// API môn phái: bảng xếp hạng phái, chi tiết một phái (đệ tử tỷ võ, ứng viên, lịch sử chưởng môn), bỏ phiếu, lời hiệu triệu.
import { Hono } from "hono";
import { createAuth, GUEST_NAME, type Env } from "./auth";
import { SECTS } from "./game/data";
import { castVote, tickAll, tickSect } from "./sect";
import { getSettings } from "./settings";

type User = { id: string; name: string; isAnonymous?: boolean | null };
export const sects = new Hono<{ Bindings: Env }>();

async function userOf(c: { env: Env; req: { raw: Request } }) {
  const session = await createAuth(c.env).api.getSession({ headers: c.req.raw.headers });
  return (session?.user as User | undefined) ?? null;
}

const nameFrom = (profile_json: string) => {
  try { return (JSON.parse(profile_json).name as string) || "Vô danh"; } catch { return "Vô danh"; }
};

const genderFrom = (profile_json: string) => {
  try { return JSON.parse(profile_json).gender === "female" ? "female" : "male"; } catch { return "male"; }
};

// Lời hiệu triệu: ngắn, không link, lọc vài từ thô tục; admin có thể gỡ.
const BAD = ["địt", "đụ", "lồn", "cặc", "buồi", "đéo", "vãi l", "đm ", "dm ", "clm", "vcl", "fuck", "shit"];
export function cleanMotto(raw: unknown): string | { error: string } {
  const t = String(raw ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (t.length > 120) return { error: "Lời hiệu triệu tối đa 120 ký tự" };
  if (/(https?:\/\/|www\.|\.(com|net|vn|io|xyz)\b)/i.test(t)) return { error: "Không được chèn đường dẫn" };
  const low = ` ${t.toLowerCase()} `;
  if (BAD.some((w) => low.includes(w))) return { error: "Lời lẽ không hợp đạo, xin sửa lại" };
  return t;
}

// Bảng xếp hạng môn phái theo tổng điểm tỷ võ của đệ tử đang tại thế
sects.get("/", async (c) => {
  const db = c.env.DB;
  await tickAll(db, await getSettings(db));
  const [pts, members, states] = await db.batch([
    db.prepare(`SELECT p.sect_id, SUM(p.points) AS points, COUNT(*) AS fighters FROM sect_points p JOIN runs r ON r.id = p.run_id
                WHERE r.status = 'active' AND r.sect_id = p.sect_id GROUP BY p.sect_id`),
    db.prepare(`SELECT sect_id, COUNT(*) AS n FROM runs WHERE status = 'active' AND sect_id IS NOT NULL AND COALESCE(sect_rank,'member') != 'outcast' GROUP BY sect_id`),
    db.prepare(`SELECT sect_id, leader_name, leader_realm, leader_since, motto, phase, phase_ends FROM sect_state`),
  ]);
  const by = <T,>(r: D1Result) => new Map((r.results as any[]).map((x) => [x.sect_id as string, x as T]));
  const P = by<any>(pts), M = by<any>(members), S = by<any>(states);
  const list = SECTS.map((x) => {
    const s = S.get(x.id);
    return {
      id: x.id,
      points: P.get(x.id)?.points ?? 0,
      fighters: P.get(x.id)?.fighters ?? 0,
      disciples: M.get(x.id)?.n ?? 0,
      chief: s?.leader_name ? { name: s.leader_name, realm: s.leader_realm, since: s.leader_since } : null,
      motto: s?.motto ?? null,
      phase: s?.phase ?? "none",
      phaseEnds: s?.phase_ends ?? null,
    };
  }).sort((a, b) => b.points - a.points || b.disciples - a.disciples);
  return c.json(list);
});

// Chi tiết một phái + tình trạng của người xem
sects.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!SECTS.some((x) => x.id === id)) return c.json({ error: "not_found" }, 404);
  const db = c.env.DB;
  const state = await tickSect(db, id, await getSettings(db));
  const user = await userOf(c);
  const [ranking, cands, votes, history, disciples, mine] = await db.batch([
    db.prepare(`SELECT p.run_id, p.points, p.wins, p.draws, r.best_realm AS realm, r.age, r.profile_json, r.sect_rank, u.name AS account, u.isAnonymous
                FROM sect_points p JOIN runs r ON r.id = p.run_id JOIN "user" u ON u.id = r.user_id
                WHERE p.sect_id = ?1 AND r.status = 'active' AND r.sect_id = ?1 ORDER BY p.points DESC, r.best_realm DESC LIMIT 20`).bind(id),
    db.prepare(`SELECT c.run_id, c.name, c.points, c.realm, r.status = 'active' AND r.sect_id = c.sect_id AS alive
                FROM sect_candidates c JOIN runs r ON r.id = c.run_id WHERE c.sect_id = ? AND c.cycle = ?`).bind(id, state.cycle),
    db.prepare(`SELECT candidate_run, COUNT(*) AS n FROM sect_votes WHERE sect_id = ? AND cycle = ? GROUP BY candidate_run`).bind(id, state.cycle),
    db.prepare(`SELECT name, realm, votes, from_at, to_at, end_reason FROM sect_leaders WHERE sect_id = ? ORDER BY from_at DESC LIMIT 10`).bind(id),
    db.prepare(`SELECT COUNT(*) AS n FROM runs WHERE status = 'active' AND sect_id = ? AND COALESCE(sect_rank,'member') != 'outcast'`).bind(id),
    db.prepare(`SELECT r.id, r.sect_id, r.sect_rank, r.profile_json, p.points FROM runs r LEFT JOIN sect_points p ON p.run_id = r.id
                WHERE r.user_id = ? AND r.status = 'active' ORDER BY r.created_at DESC LIMIT 1`).bind(user?.id ?? ""),
  ]);
  const voteMap = Object.fromEntries((votes.results as any[]).map((v) => [v.candidate_run, v.n]));
  const myRun = (mine.results as any[])[0];
  const myVote = user
    ? await db.prepare("SELECT candidate_run FROM sect_votes WHERE sect_id = ? AND cycle = ? AND voter_user = ?").bind(id, state.cycle, user.id).first<{ candidate_run: string }>()
    : null;
  const disciple = !!myRun && myRun.sect_id === id && myRun.sect_rank !== "outcast";
  return c.json({
    id,
    phase: state.phase,
    phaseEnds: state.phase_ends,
    cycle: state.cycle,
    motto: state.motto,
    disciples: (disciples.results as any[])[0]?.n ?? 0,
    chief: state.leader_run ? { run: state.leader_run, name: state.leader_name, realm: state.leader_realm, since: state.leader_since, isMe: !!user && state.leader_user === user.id } : null,
    ranking: (ranking.results as any[]).map((r) => ({
      run: r.run_id, name: nameFrom(r.profile_json), gender: genderFrom(r.profile_json), account: r.isAnonymous ? GUEST_NAME : r.account, points: r.points, wins: r.wins, draws: r.draws, realm: r.realm, age: r.age, elder: r.sect_rank === "elder",
    })),
    candidates: (cands.results as any[]).map((x) => ({ run: x.run_id, name: x.name, points: x.points, realm: x.realm, alive: !!x.alive, votes: voteMap[x.run_id] ?? 0 })),
    history: history.results,
    me: user
      ? {
          guest: !!user.isAnonymous,
          disciple,
          character: myRun ? nameFrom(myRun.profile_json) : null,
          sect: myRun?.sect_id ?? null,
          points: disciple ? (myRun.points ?? 0) : 0,
          vote: myVote?.candidate_run ?? null,
          canVote: disciple && !user.isAnonymous && state.phase === "vote",
        }
      : null,
  });
});

sects.post("/:id/vote", async (c) => {
  const user = await userOf(c);
  if (!user) return c.json({ error: "Cần đăng nhập" }, 401);
  const { run } = await c.req.json<{ run: string }>();
  const err = await castVote(c.env.DB, user.id, c.req.param("id"), String(run ?? ""));
  return err ? c.json({ error: err }, 400) : c.json({ ok: true });
});

sects.put("/:id/motto", async (c) => {
  const user = await userOf(c);
  if (!user) return c.json({ error: "Cần đăng nhập" }, 401);
  const id = c.req.param("id");
  const db = c.env.DB;
  const s = await db.prepare(`SELECT s.leader_user FROM sect_state s JOIN runs r ON r.id = s.leader_run WHERE s.sect_id = ? AND r.status = 'active'`).bind(id).first<{ leader_user: string }>();
  if (!s || s.leader_user !== user.id) return c.json({ error: "Chỉ chưởng môn đương nhiệm mới được ban lời hiệu triệu" }, 403);
  const t = cleanMotto((await c.req.json<{ motto: string }>()).motto);
  if (typeof t !== "string") return c.json(t, 400);
  await db.prepare("UPDATE sect_state SET motto = ?, updated_at = ? WHERE sect_id = ?").bind(t || null, Date.now(), id).run();
  return c.json({ ok: true, motto: t || null });
});
