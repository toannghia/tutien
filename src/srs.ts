// Ôn tập ngắt quãng theo đường cong quên lãng (biến thể SM-2, giống Anki).
// Kết quả mỗi lần gặp câu: "good" (đúng), "again" (sai), "skip" (bỏ qua = chưa thuộc, không phạt độ dễ).

export type Grade = "good" | "again" | "skip";
export type Card = { ease: number; interval: number; reps: number; lapses: number; seen: number; correct: number; due_at: number; last_at: number };

const DAY = 86_400_000;
export const NEW_CARD = (now: number): Card => ({ ease: 2.5, interval: 0, reps: 0, lapses: 0, seen: 0, correct: 0, due_at: now, last_at: now });

/** Lịch ôn mới sau một lần trả lời. */
export function schedule(card: Card, grade: Grade, now = Date.now()): Card {
  const c = { ...card, seen: card.seen + 1, last_at: now };
  if (grade === "good") {
    c.correct++;
    c.reps++;
    // 1 ngày → 3 ngày → khoảng cách × độ dễ (có trần 365 ngày)
    c.interval = c.reps === 1 ? 1 : c.reps === 2 ? 3 : Math.min(365, Math.round(card.interval * c.ease * 10) / 10);
    c.ease = Math.min(3, c.ease + 0.05);
  } else {
    if (grade === "again") {
      c.lapses++;
      c.ease = Math.max(1.3, c.ease - 0.2);
    }
    c.reps = 0;
    // Sai/bỏ qua: hỏi lại sớm — sau 10 phút (cùng phiên tu luyện có thể gặp lại)
    c.interval = 10 / 1440;
  }
  c.due_at = now + c.interval * DAY;
  return c;
}

/** Độ nhớ ước lượng theo đường cong quên lãng R = e^(−t/S), với S ≈ khoảng cách ôn. */
export function retention(card: Card, now = Date.now()) {
  const t = Math.max(0, now - card.last_at) / DAY;
  const s = Math.max(card.interval, 0.5);
  return Math.exp(-t / (s * 1.4)); // tại thời điểm đến hạn R ≈ 0.49 → nên ôn
}

/** Ghi kết quả nhiều câu cho một người (upsert theo family). */
export async function recordAnswers(db: D1Database, userId: string, answers: { family: string; path: string; grade: Grade }[], now = Date.now()) {
  if (!answers.length) return;
  const fams = [...new Set(answers.map((a) => a.family))];
  const { results } = await db
    .prepare(`SELECT * FROM user_srs WHERE user_id = ? AND family IN (${fams.map(() => "?").join(",")})`)
    .bind(userId, ...fams)
    .all<Card & { family: string }>();
  const cards = new Map(results.map((r) => [r.family, r as Card]));
  for (const a of answers) cards.set(a.family, schedule(cards.get(a.family) ?? NEW_CARD(now), a.grade, now));
  const pathOf = new Map(answers.map((a) => [a.family, a.path]));
  await db.batch(
    [...cards.entries()]
      .filter(([f]) => fams.includes(f))
      .map(([family, c]) =>
        db
          .prepare(
            `INSERT INTO user_srs (user_id, family, path, ease, interval, reps, lapses, seen, correct, due_at, last_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
             ON CONFLICT(user_id, family) DO UPDATE SET ease = ?4, interval = ?5, reps = ?6, lapses = ?7, seen = ?8, correct = ?9, due_at = ?10, last_at = ?11`,
          )
          .bind(userId, family, pathOf.get(family), c.ease, c.interval, c.reps, c.lapses, c.seen, c.correct, c.due_at, c.last_at),
      ),
  );
}

/** Các câu đến hạn ôn (quá hạn lâu nhất trước). */
export async function dueFamilies(db: D1Database, userId: string, opts: { path?: string; limit?: number; now?: number } = {}) {
  const now = opts.now ?? Date.now();
  const { results } = await db
    .prepare(`SELECT family, path FROM user_srs WHERE user_id = ? AND due_at <= ? ${opts.path ? "AND path = ?" : ""} ORDER BY due_at LIMIT ?`)
    .bind(...[userId, now, ...(opts.path ? [opts.path] : []), opts.limit ?? 30])
    .all<{ family: string; path: string }>();
  return results;
}
