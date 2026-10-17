-- Cấu hình game do admin chỉnh. Giá trị lưu dạng JSON; khoá không có ở đây thì dùng mặc định trong code.
CREATE TABLE "settings" (
  "key" TEXT PRIMARY KEY NOT NULL,
  "value" TEXT NOT NULL,
  "updated_at" INTEGER NOT NULL,
  "updated_by" TEXT
);

-- Phân loại trận luận đạo để báo cáo: ranked (xếp hạng) | bot | friendly (giao hữu)
ALTER TABLE "duels" ADD COLUMN "kind" TEXT;
UPDATE "duels" SET "kind" = CASE WHEN "b_bot" = 1 THEN 'bot' WHEN "a_delta" = 0 AND "b_delta" = 0 THEN 'friendly' ELSE 'ranked' END;
