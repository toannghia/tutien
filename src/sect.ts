// Chính sự môn phái: điểm tỷ võ, đại bỉ → bỏ phiếu → chưởng môn.
// Mọi danh vị gắn với NHÂN VẬT (run). Nhân vật chết / luân hồi / bế quan quá lâu → ghế trống, phái tự bầu lại.
import { SECTS } from "./game/data";
import type { Settings } from "./settings";

const H = 3600_000;
const DAY = 24 * H;

export type Candidate = { run_id: string; user_id: string; name: string; points: number; realm: number };

/** Chọn 3 ứng viên: điểm cao trước, bằng điểm xét cảnh giới. */
export function pickCandidates<T extends { points: number; realm: number }>(rows: T[], n = 3): T[] {
  return [...rows].filter((r) => r.points > 0).sort((a, b) => b.points - a.points || b.realm - a.realm).slice(0, n);
}

/** Người thắng cử: nhiều phiếu nhất, hòa thì điểm, rồi cảnh giới. */
export function pickWinner<T extends Candidate>(cands: T[], votes: Record<string, number>): T | null {
  if (!cands.length) return null;
  return [...cands].sort((a, b) => (votes[b.run_id] ?? 0) - (votes[a.run_id] ?? 0) || b.points - a.points || b.realm - a.realm)[0];
}

async function nameOf(db: D1Database, runId: string) {
  const r = await db.prepare("SELECT profile_json FROM runs WHERE id = ?").bind(runId).first<{ profile_json: string }>();
  try { return (JSON.parse(r?.profile_json ?? "{}").name as string) || "Vô danh"; } catch { return "Vô danh"; }
}

async function ensureState(db: D1Database, sectId: string, now: number) {
  await db.prepare("INSERT OR IGNORE INTO sect_state (sect_id, phase, cycle, updated_at) VALUES (?, 'none', 0, ?)").bind(sectId, now).run();
  return (await db.prepare("SELECT * FROM sect_state WHERE sect_id = ?").bind(sectId).first<Record<string, any>>())!;
}

/** Bãi nhiệm chưởng môn đang gắn với nhân vật này (nếu có). */
export async function vacateByRun(db: D1Database, runId: string, reason: string, now = Date.now()) {
  const s = await db.prepare("SELECT sect_id FROM sect_state WHERE leader_run = ?").bind(runId).first<{ sect_id: string }>();
  if (!s) return false;
  await db.batch([
    db.prepare("UPDATE sect_leaders SET to_at = ?, end_reason = ? WHERE run_id = ? AND to_at IS NULL").bind(now, reason, runId),
    db.prepare("UPDATE sect_state SET leader_run = NULL, leader_user = NULL, leader_name = NULL, leader_realm = NULL, leader_since = NULL, phase = 'none', phase_ends = NULL, updated_at = ? WHERE sect_id = ?").bind(now, s.sect_id),
  ]);
  return true;
}

/** Nhân vật kết thúc kiếp: mất điểm tỷ võ, mất ghế. Gọi từ saveProgress khi run không còn active. */
export async function onRunEnded(db: D1Database, runId: string, reason: string) {
  await vacateByRun(db, runId, reason);
  await db.prepare("DELETE FROM sect_points WHERE run_id = ?").bind(runId).run();
}

/** Cộng điểm tỷ võ cho kiếp đang sống của người chơi (chỉ tài khoản đã đăng ký, chỉ trận xếp hạng). */
export async function awardDuel(db: D1Database, userId: string, result: "win" | "draw" | "loss", now = Date.now()) {
  if (result === "loss") return;
  const run = await db
    .prepare(`SELECT r.id, r.sect_id FROM runs r JOIN "user" u ON u.id = r.user_id
              WHERE r.user_id = ? AND r.status = 'active' AND r.sect_id IS NOT NULL AND COALESCE(r.sect_rank,'member') != 'outcast' AND COALESCE(u.isAnonymous,0) = 0
              ORDER BY r.created_at DESC LIMIT 1`)
    .bind(userId).first<{ id: string; sect_id: string }>();
  if (!run) return;
  const pts = result === "win" ? 3 : 1;
  await db
    .prepare(`INSERT INTO sect_points (run_id, user_id, sect_id, points, wins, draws, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
              ON CONFLICT(run_id) DO UPDATE SET points = points + ?4, wins = wins + ?5, draws = draws + ?6, sect_id = ?3, updated_at = ?7`)
    .bind(run.id, userId, run.sect_id, pts, result === "win" ? 1 : 0, result === "draw" ? 1 : 0, now).run();
}

/** Tiến trình bầu cử của một phái — lười: chạy khi có người xem phái hoặc cron. */
export async function tickSect(db: D1Database, sectId: string, cfg: Settings, now = Date.now()) {
  let s = await ensureState(db, sectId, now);

  // Chưởng môn còn sống không? còn ở phái không? bế quan quá lâu không?
  if (s.leader_run) {
    const r = await db.prepare("SELECT status, ending_reason, sect_id, sect_rank, best_realm, created_at FROM runs WHERE id = ?").bind(s.leader_run).first<Record<string, any>>();
    const last = await db.prepare("SELECT MAX(created_at) AS t FROM run_choices WHERE run_id = ?").bind(s.leader_run).first<{ t: number | null }>();
    const idle = now - (last?.t ?? r?.created_at ?? 0) > Number(cfg.leaderIdleDays ?? 7) * DAY;
    const reason = !r ? "Tọa hóa" : r.status === "finished" ? "Tọa hóa" : r.status !== "active" ? (r.ending_reason ?? "Luân hồi sớm") : r.sect_id !== sectId || r.sect_rank === "outcast" ? "Rời tông môn" : idle ? "Bế quan quá lâu" : null;
    if (reason) await vacateByRun(db, s.leader_run, reason, now);
    else if (r!.best_realm !== s.leader_realm) await db.prepare("UPDATE sect_state SET leader_realm = ? WHERE sect_id = ?").bind(r!.best_realm, sectId).run();
    s = await ensureState(db, sectId, now);
  }
  if (s.leader_run) return s;

  if (s.phase === "none") {
    await db.prepare("UPDATE sect_state SET phase = 'contest', phase_ends = ?, cycle = cycle + 1, updated_at = ? WHERE sect_id = ?")
      .bind(now + Number(cfg.sectContestHours ?? 24) * H, now, sectId).run();
    return ensureState(db, sectId, now);
  }
  if (s.phase_ends > now) return s;

  if (s.phase === "contest") {
    const { results } = await db
      .prepare(`SELECT p.run_id, p.user_id, p.points, r.best_realm AS realm FROM sect_points p JOIN runs r ON r.id = p.run_id
                WHERE p.sect_id = ? AND r.status = 'active' AND r.sect_id = p.sect_id`)
      .bind(sectId).all<{ run_id: string; user_id: string; points: number; realm: number }>();
    const cands = pickCandidates(results);
    if (!cands.length) {
      // chưa ai tỷ võ → kéo dài đại bỉ
      await db.prepare("UPDATE sect_state SET phase_ends = ?, updated_at = ? WHERE sect_id = ?").bind(now + Number(cfg.sectContestHours ?? 24) * H, now, sectId).run();
      return ensureState(db, sectId, now);
    }
    const stmts = [];
    for (const c of cands)
      stmts.push(db.prepare("INSERT OR IGNORE INTO sect_candidates (sect_id, cycle, run_id, user_id, name, points, realm) VALUES (?,?,?,?,?,?,?)")
        .bind(sectId, s.cycle, c.run_id, c.user_id, await nameOf(db, c.run_id), c.points, c.realm));
    stmts.push(db.prepare("UPDATE sect_state SET phase = 'vote', phase_ends = ?, updated_at = ? WHERE sect_id = ?").bind(now + Number(cfg.sectVoteHours ?? 12) * H, now, sectId));
    await db.batch(stmts);
    return ensureState(db, sectId, now);
  }

  // phase === 'vote' hết hạn → kiểm phiếu; ứng viên đã chết bị loại
  const { results: cands } = await db
    .prepare(`SELECT c.* FROM sect_candidates c JOIN runs r ON r.id = c.run_id WHERE c.sect_id = ? AND c.cycle = ? AND r.status = 'active' AND r.sect_id = c.sect_id`)
    .bind(sectId, s.cycle).all<Candidate>();
  const { results: vs } = await db.prepare("SELECT candidate_run, COUNT(*) AS n FROM sect_votes WHERE sect_id = ? AND cycle = ? GROUP BY candidate_run")
    .bind(sectId, s.cycle).all<{ candidate_run: string; n: number }>();
  const votes = Object.fromEntries(vs.map((v) => [v.candidate_run, v.n]));
  const w = pickWinner(cands, votes);
  if (!w) {
    await db.prepare("UPDATE sect_state SET phase = 'none', phase_ends = NULL WHERE sect_id = ?").bind(sectId).run();
    return tickSect(db, sectId, cfg, now);
  }
  await db.batch([
    db.prepare("UPDATE sect_state SET leader_run = ?, leader_user = ?, leader_name = ?, leader_realm = ?, leader_since = ?, motto = NULL, phase = 'none', phase_ends = NULL, updated_at = ? WHERE sect_id = ?")
      .bind(w.run_id, w.user_id, w.name, w.realm, now, now, sectId),
    db.prepare("INSERT INTO sect_leaders (sect_id, run_id, user_id, name, realm, votes, from_at) VALUES (?,?,?,?,?,?,?)")
      .bind(sectId, w.run_id, w.user_id, w.name, w.realm, votes[w.run_id] ?? 0, now),
  ]);
  return ensureState(db, sectId, now);
}

/** Bỏ phiếu: đệ tử đang sống, tài khoản đã đăng ký, 1 phiếu mỗi vòng (được đổi phiếu trong hạn). */
export async function castVote(db: D1Database, userId: string, sectId: string, candidateRun: string, now = Date.now()) {
  const s = await db.prepare("SELECT phase, phase_ends, cycle FROM sect_state WHERE sect_id = ?").bind(sectId).first<Record<string, any>>();
  if (!s || s.phase !== "vote" || s.phase_ends <= now) return "Chưa đến kỳ bỏ phiếu";
  const me = await db
    .prepare(`SELECT r.id FROM runs r JOIN "user" u ON u.id = r.user_id WHERE r.user_id = ? AND r.status = 'active' AND r.sect_id = ? AND COALESCE(r.sect_rank,'member') != 'outcast' AND COALESCE(u.isAnonymous,0) = 0 LIMIT 1`)
    .bind(userId, sectId).first<{ id: string }>();
  if (!me) return "Chỉ đệ tử đang tại thế (tài khoản đã đăng ký) mới được bỏ phiếu";
  const c = await db.prepare("SELECT 1 FROM sect_candidates WHERE sect_id = ? AND cycle = ? AND run_id = ?").bind(sectId, s.cycle, candidateRun).first();
  if (!c) return "Ứng viên không hợp lệ";
  await db
    .prepare(`INSERT INTO sect_votes (sect_id, cycle, voter_user, voter_run, candidate_run, created_at) VALUES (?,?,?,?,?,?)
              ON CONFLICT(sect_id, cycle, voter_user) DO UPDATE SET candidate_run = excluded.candidate_run, created_at = excluded.created_at`)
    .bind(sectId, s.cycle, userId, me.id, candidateRun, now).run();
  return null;
}

/** Danh xưng luận đạo: "Chưởng môn <phái>" nếu kiếp đang sống của người chơi đang giữ ghế. */
export async function leaderTitle(db: D1Database, userId: string) {
  const r = await db
    .prepare(`SELECT s.sect_id FROM sect_state s JOIN runs r ON r.id = s.leader_run WHERE s.leader_user = ? AND r.status = 'active' LIMIT 1`)
    .bind(userId).first<{ sect_id: string }>();
  return r ? `Chưởng môn ${SECTS.find((x) => x.id === r.sect_id)?.name ?? ""}`.trim() : null;
}

/** Chạy tiến trình cho các phái đến hạn (all = kiểm cả chưởng môn bế quan, dùng cho cron). */
export async function tickAll(db: D1Database, cfg: Settings, all = false, now = Date.now()) {
  const { results } = await db.prepare("SELECT s.sect_id, s.leader_run, s.phase, s.phase_ends, s.sect_id = r.sect_id AS same, r.status, r.sect_rank FROM sect_state s LEFT JOIN runs r ON r.id = s.leader_run")
    .all<Record<string, any>>();
  const known = new Map(results.map((r) => [r.sect_id as string, r]));
  for (const x of SECTS) {
    const s = known.get(x.id);
    const due =
      all || !s ||
      (s.leader_run ? s.status !== "active" || !s.same || s.sect_rank === "outcast" : s.phase === "none" || (s.phase_ends ?? 0) <= now);
    if (due) await tickSect(db, x.id, cfg, now);
  }
}
