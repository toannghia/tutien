-- Điểm Đạo vị (Elo) — chỉ tài khoản đã đăng ký mới có dòng ở đây
CREATE TABLE "ratings" (
  "user_id" TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "rating" INTEGER NOT NULL DEFAULT 1000,
  "best_rating" INTEGER NOT NULL DEFAULT 1000,
  "wins" INTEGER NOT NULL DEFAULT 0,
  "losses" INTEGER NOT NULL DEFAULT 0,
  "draws" INTEGER NOT NULL DEFAULT 0,
  "updated_at" INTEGER NOT NULL
);
CREATE INDEX "ratings_board_idx" ON "ratings"("rating" DESC);

-- Mỗi trận luận đạo. Đối thủ là bot thì player_b = NULL, b_bot = 1.
-- Không đặt khoá ngoại: user khách có thể bị xoá/gộp, lịch sử trận vẫn giữ.
CREATE TABLE "duels" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "player_a" TEXT,
  "player_b" TEXT,
  "a_name" TEXT NOT NULL,
  "b_name" TEXT NOT NULL,
  "b_bot" INTEGER NOT NULL DEFAULT 0,
  "a_score" INTEGER NOT NULL,
  "b_score" INTEGER NOT NULL,
  "winner" TEXT NOT NULL, -- 'a' | 'b' | 'draw'
  "a_delta" INTEGER NOT NULL DEFAULT 0,
  "b_delta" INTEGER NOT NULL DEFAULT 0,
  "a_correct" INTEGER NOT NULL DEFAULT 0,
  "b_correct" INTEGER NOT NULL DEFAULT 0,
  "questions_json" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL
);
CREATE INDEX "duels_a_idx" ON "duels"("player_a", "created_at");
CREATE INDEX "duels_b_idx" ON "duels"("player_b", "created_at");
