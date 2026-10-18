// Nhân quả luân hồi phía máy chủ: tính những gì các kiếp trước để lại (chụp vào profile lúc tạo kiếp),
// ghi nghiệp lực từng kiếp, lập / đánh dấu động phủ.
import { GIVEN_NAMES, REALMS, SURNAMES } from "./game/data";
import type { Karma, Profile, RunState } from "./game/engine";

type PastRun = { id: string; number: number; seed: number; status: string; best_realm: number; ending_reason: string | null; profile_json: string; karma_json: string | null };
type RunKarma = { v: number; s: number; partner: string; res: number; realm: number };

const DECAY = 0.5; // mỗi kiếp nghiệp lực cũ phai một nửa
const parse = <T,>(j: string | null, d: T): T => {
  try { return j ? (JSON.parse(j) as T) : d; } catch { return d; }
};
const hashName = (seed: number, salt: number, gender: "male" | "female") => {
  const h = (n: number) => (Math.imul((seed ^ salt) >>> 0, 2654435761 + n) >>> 0);
  const names = GIVEN_NAMES[gender];
  return `${SURNAMES[h(1) % SURNAMES.length]} ${names[h(2) % names.length]}`;
};

/** Tính nhân quả từ các kiếp đã khép lại (mới nhất trước). Thuần — dùng chung cho tạo kiếp và Sổ Sinh Tử. */
export function computeKarma(past: PastRun[], legacy: Karma["legacy"] | null): Karma {
  const k: Karma = { v: 0, s: 0, insight: 0, pastBest: 0 };
  // Nghiệp lực: cộng dồn từ cũ đến mới, mỗi kiếp suy giảm một nửa.
  // Luân hồi sớm không xóa được ác nghiệp, nhưng thiện nghiệp chỉ tính khi đi hết một đời.
  for (const r of [...past].reverse()) {
    const rk = parse<RunKarma | null>(r.karma_json, null);
    k.v = k.v * DECAY + (r.status === "finished" ? rk?.v ?? 0 : 0);
    k.s = k.s * DECAY + (rk?.s ?? 0);
  }
  k.v = Math.round(k.v);
  k.s = Math.round(k.s);
  // Túc tuệ: ký ức đạo pháp từ các kiếp đã tu (mới nhất nặng nhất), tối đa 60
  past.slice(0, 5).forEach((r, i) => {
    k.insight += r.best_realm * 6 * Math.pow(DECAY, i) * (r.status === "finished" ? 1 : 0.5);
  });
  k.insight = Math.min(60, Math.round(k.insight));
  k.pastBest = Math.max(0, ...past.filter((r) => r.status === "finished").slice(0, 3).map((r) => r.best_realm));

  const last = past[0];
  if (last) {
    const lp = parse<Partial<Profile>>(last.profile_json, {});
    const lk = parse<RunKarma | null>(last.karma_json, null);
    const name = lp.name ?? "Vô danh";
    k.prev = { name, number: last.number, realm: last.best_realm, ending: last.ending_reason ?? "Luân hồi sớm" };
    if (last.status === "finished") {
      const end = last.ending_reason ?? "";
      const r = last.best_realm;
      // Chấp niệm: cảnh giới mà kiếp trước gục ngã khi cố vượt qua
      if (end.startsWith("Tan biến trước bình cảnh")) k.obsession = { realm: REALMS.length, kind: "tribulation", name };
      else if (end.startsWith("Hồn phi phách tán") && r + 1 < REALMS.length) k.obsession = { realm: r + 1, kind: "tribulation", name };
      else if (end.startsWith("Đột phá thất bại") && r + 1 < REALMS.length) k.obsession = { realm: r + 1, kind: "breakthrough", name };
      else if (end === "Thọ nguyên cạn kiệt" && r >= 1 && r + 1 < REALMS.length) k.obsession = { realm: r + 1, kind: "lifespan", name };
      // Tiền duyên: kiếp trước có đạo lữ (còn sống hay đã khuất)
      if (lk && (lk.partner === "partner" || lk.partner === "widowed")) k.bond = { name: hashName(last.seed, 0xb0d, lp.gender === "female" ? "male" : "female") };
    }
    // Oan gia: kiếp trước gây ác nghiệp nặng
    if ((lk?.s ?? 0) >= 25) k.feud = { name: hashName(last.seed, 0xfe0d, (last.seed & 1) === 0 ? "male" : "female") };
  }
  if (legacy) k.legacy = legacy;
  return k;
}

async function loadPast(db: D1Database, userId: string) {
  const { results } = await db
    .prepare(`SELECT id, number, seed, status, best_realm, ending_reason, profile_json, karma_json FROM runs
              WHERE user_id = ? AND status != 'active' ORDER BY number DESC LIMIT 8`)
    .bind(userId).all<PastRun>();
  return results;
}

async function openLegacy(db: D1Database, userId: string): Promise<Karma["legacy"] | null> {
  const l = await db
    .prepare("SELECT id, name, realm, res, world, ascended FROM legacies WHERE user_id = ? AND claimed_run IS NULL ORDER BY realm DESC, created_at DESC LIMIT 1")
    .bind(userId).first<{ id: string; name: string; realm: number; res: number; world: string; ascended: number }>();
  return l ? { id: l.id, name: l.name, realm: l.realm, res: l.res, world: l.world, ascended: !!l.ascended } : null;
}

/** Nhân quả cho kiếp sắp tạo. */
export async function inheritKarma(db: D1Database, userId: string): Promise<Karma> {
  const [past, legacy] = await Promise.all([loadPast(db, userId), openLegacy(db, userId)]);
  return computeKarma(past, legacy);
}

/** Ghi nghiệp lực của kiếp + xử lý động phủ. Gọi trong saveProgress. */
export function karmaStatements(db: D1Database, runId: string, userId: string, profile: Profile, s: RunState, finished: boolean): D1PreparedStatement[] {
  const out: D1PreparedStatement[] = [
    db.prepare("UPDATE runs SET karma_json = ? WHERE id = ?")
      .bind(JSON.stringify({ v: s.karma.virtue, s: s.karma.sin, partner: s.partner, res: s.resources, realm: s.realm } satisfies RunKarma), runId),
  ];
  // Kiếp này đã kế thừa động phủ → đánh dấu để kiếp sau không nhận lại
  if (profile.karma?.legacy && s.flags.includes("legacy_claimed")) {
    out.push(db.prepare("UPDATE legacies SET claimed_run = ?, claimed_at = ? WHERE id = ? AND claimed_run IS NULL").bind(runId, Date.now(), profile.karma.legacy.id));
  }
  // Tu đến Kim Đan trở lên → để lại động phủ (một nửa linh tài, tối thiểu theo cảnh giới)
  if (finished && profile.karma && s.realm >= 3) {
    const res = Math.max(40 * s.realm, Math.round(s.resources * 0.5));
    out.push(
      db.prepare("INSERT OR IGNORE INTO legacies (id, user_id, from_run, name, realm, res, world, ascended, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(`lg_${runId}`, userId, runId, profile.name, s.realm, Math.min(res, 5000), profile.world, s.ascended ? 1 : 0, Date.now()),
    );
  }
  return out;
}
