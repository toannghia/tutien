-- Nhân quả luân hồi: nghiệp lực của từng kiếp + động phủ để lại cho kiếp sau.
ALTER TABLE "runs" ADD COLUMN "karma_json" TEXT; -- {v, s, partner, res, realm} cập nhật mỗi lần lưu

CREATE TABLE "legacies" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "from_run" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "realm" INTEGER NOT NULL,
  "res" INTEGER NOT NULL,
  "world" TEXT NOT NULL,
  "ascended" INTEGER NOT NULL DEFAULT 0,
  "created_at" INTEGER NOT NULL,
  "claimed_run" TEXT,
  "claimed_at" INTEGER
);
CREATE INDEX "legacies_user_idx" ON "legacies"("user_id", "created_at" DESC);
