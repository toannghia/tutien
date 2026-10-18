-- Sổ nhớ ôn tập ngắt quãng (SM-2) cho từng người chơi × từng câu hỏi (theo family để qua được các lần sửa câu)
CREATE TABLE "user_srs" (
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "family" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "ease" REAL NOT NULL DEFAULT 2.5,      -- độ dễ (1.3 .. 3.0)
  "interval" REAL NOT NULL DEFAULT 0,    -- khoảng cách ôn hiện tại (ngày)
  "reps" INTEGER NOT NULL DEFAULT 0,     -- số lần nhớ liên tiếp
  "lapses" INTEGER NOT NULL DEFAULT 0,   -- số lần quên
  "seen" INTEGER NOT NULL DEFAULT 0,     -- tổng số lần gặp
  "correct" INTEGER NOT NULL DEFAULT 0,  -- tổng số lần đúng
  "due_at" INTEGER NOT NULL,             -- thời điểm cần ôn lại (ms)
  "last_at" INTEGER NOT NULL,            -- lần ôn gần nhất (ms)
  PRIMARY KEY ("user_id", "family")
);
CREATE INDEX "user_srs_due_idx" ON "user_srs"("user_id", "due_at");
