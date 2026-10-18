// Gộp toàn bộ dữ liệu game của một tài khoản khách vào tài khoản thật.
// Better Auth luôn tạo user mới khi khách đăng ký/đăng nhập rồi xoá user khách,
// nên hàm này phải chạy XONG trước khi user khách bị xoá (nếu không ON DELETE CASCADE sẽ xoá hết kiếp).
// Dùng chung cho cả hai trường hợp: tài khoản mới tinh, và tài khoản đã có dữ liệu từ máy khác.

type StatsRow = {
  best_realm: number;
  longest_age: number;
  pity_count: number;
  achievements_json: string;
};

export async function mergeGuestInto(db: D1Database, guestId: string, targetId: string) {
  if (guestId === targetId) return;

  const [guestStats, targetStats, guestActive] = await Promise.all([
    db.prepare("SELECT best_realm, longest_age, pity_count, achievements_json FROM user_stats WHERE user_id = ?").bind(guestId).first<StatsRow>(),
    db.prepare("SELECT best_realm, longest_age, pity_count, achievements_json FROM user_stats WHERE user_id = ?").bind(targetId).first<StatsRow>(),
    db.prepare("SELECT 1 FROM runs WHERE user_id = ? AND status = 'active' LIMIT 1").bind(guestId).first(),
  ]);

  const now = Date.now();
  const achievements = [
    ...new Set([...JSON.parse(guestStats?.achievements_json ?? "[]"), ...JSON.parse(targetStats?.achievements_json ?? "[]")]),
  ];

  const stmts: D1PreparedStatement[] = [];

  // Kiếp đang chơi dở: giữ kiếp của phiên khách (thứ người chơi vừa làm), khép kiếp dở cũ của tài khoản thật
  if (guestActive) {
    stmts.push(
      db.prepare("UPDATE runs SET status = 'abandoned', ended_at = ?, ending_reason = 'Luân hồi sớm (gộp tài khoản)' WHERE user_id = ? AND status = 'active'").bind(now, targetId),
    );
  }

  stmts.push(
    db.prepare("UPDATE runs SET user_id = ? WHERE user_id = ?").bind(targetId, guestId),
    db.prepare("UPDATE legacies SET user_id = ? WHERE user_id = ?").bind(targetId, guestId),
    // Đánh lại số kiếp theo thời gian chơi
    db.prepare(
      `UPDATE runs SET number = (
         SELECT rn FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn FROM runs WHERE user_id = ?1) x
         WHERE x.id = runs.id
       ) WHERE user_id = ?1`,
    ).bind(targetId),
    db.prepare(
      `INSERT INTO user_stats (user_id, best_realm, longest_age, total_runs, pity_count, achievements_json, updated_at)
       VALUES (?1, ?2, ?3, (SELECT COUNT(*) FROM runs WHERE user_id = ?1), ?4, ?5, ?6)
       ON CONFLICT(user_id) DO UPDATE SET
         best_realm = excluded.best_realm,
         longest_age = excluded.longest_age,
         total_runs = excluded.total_runs,
         pity_count = excluded.pity_count,
         achievements_json = excluded.achievements_json,
         updated_at = excluded.updated_at`,
    ).bind(
      targetId,
      Math.max(guestStats?.best_realm ?? 0, targetStats?.best_realm ?? 0),
      Math.max(guestStats?.longest_age ?? 0, targetStats?.longest_age ?? 0),
      Math.max(guestStats?.pity_count ?? 0, targetStats?.pity_count ?? 0),
      JSON.stringify(achievements),
      now,
    ),
    db.prepare("DELETE FROM user_stats WHERE user_id = ?").bind(guestId),
    // Lịch sử luận đạo của khách đi theo sang tài khoản (khách không có điểm Đạo vị nên không cần gộp ratings)
    db.prepare("UPDATE duels SET player_a = ? WHERE player_a = ?").bind(targetId, guestId),
    db.prepare("UPDATE duels SET player_b = ? WHERE player_b = ?").bind(targetId, guestId),
    // Sổ nhớ ôn tập: câu chưa có ở tài khoản thì chuyển sang; câu trùng thì giữ bản ôn gần nhất
    db.prepare(
      `INSERT INTO user_srs (user_id, family, path, ease, interval, reps, lapses, seen, correct, due_at, last_at)
       SELECT ?1, family, path, ease, interval, reps, lapses, seen, correct, due_at, last_at FROM user_srs WHERE user_id = ?2
       ON CONFLICT(user_id, family) DO UPDATE SET ease = excluded.ease, interval = excluded.interval, reps = excluded.reps,
         lapses = user_srs.lapses + excluded.lapses, seen = user_srs.seen + excluded.seen, correct = user_srs.correct + excluded.correct,
         due_at = excluded.due_at, last_at = excluded.last_at
       WHERE excluded.last_at > user_srs.last_at`,
    ).bind(targetId, guestId),
    db.prepare("DELETE FROM user_srs WHERE user_id = ?").bind(guestId),
  );

  // D1 batch chạy trong một transaction: hoặc gộp hết, hoặc không gộp gì
  await db.batch(stmts);
}
