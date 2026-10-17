-- Bản đồ thế giới: lưu môn phái, cấp bậc trong phái và đạo đồ của mỗi kiếp để thống kê
ALTER TABLE "runs" ADD COLUMN "sect_id" TEXT;
ALTER TABLE "runs" ADD COLUMN "sect_rank" TEXT; -- member | elder | outcast
ALTER TABLE "runs" ADD COLUMN "path" TEXT;
CREATE INDEX "runs_world_idx" ON "runs"("world", "best_realm" DESC);
CREATE INDEX "runs_sect_idx" ON "runs"("sect_id", "best_realm" DESC);
