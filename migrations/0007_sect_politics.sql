-- Thi đấu môn phái & bầu chưởng môn. Mọi danh vị gắn với NHÂN VẬT (kiếp), không phải tài khoản:
-- nhân vật chết thì điểm tỷ võ và ghế chưởng môn cũng mất.

-- Điểm tỷ võ của nhân vật trong phái (thắng luận đạo xếp hạng +3, hòa +1)
CREATE TABLE "sect_points" (
  "run_id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "sect_id" TEXT NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  "wins" INTEGER NOT NULL DEFAULT 0,
  "draws" INTEGER NOT NULL DEFAULT 0,
  "updated_at" INTEGER NOT NULL
);
CREATE INDEX "sect_points_sect_idx" ON "sect_points"("sect_id", "points" DESC);

-- Trạng thái mỗi phái: chưởng môn hiện tại + vòng bầu đang diễn ra
CREATE TABLE "sect_state" (
  "sect_id" TEXT PRIMARY KEY NOT NULL,
  "leader_run" TEXT,
  "leader_user" TEXT,
  "leader_name" TEXT,
  "leader_realm" INTEGER,
  "leader_since" INTEGER,
  "motto" TEXT,
  "phase" TEXT NOT NULL DEFAULT 'none', -- none | contest (đại bỉ) | vote (bỏ phiếu)
  "phase_ends" INTEGER,
  "cycle" INTEGER NOT NULL DEFAULT 0,
  "updated_at" INTEGER NOT NULL
);

CREATE TABLE "sect_candidates" (
  "sect_id" TEXT NOT NULL,
  "cycle" INTEGER NOT NULL,
  "run_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "realm" INTEGER NOT NULL,
  PRIMARY KEY ("sect_id", "cycle", "run_id")
);

CREATE TABLE "sect_votes" (
  "sect_id" TEXT NOT NULL,
  "cycle" INTEGER NOT NULL,
  "voter_user" TEXT NOT NULL,
  "voter_run" TEXT NOT NULL,
  "candidate_run" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL,
  PRIMARY KEY ("sect_id", "cycle", "voter_user")
);

-- Lịch sử chưởng môn các đời
CREATE TABLE "sect_leaders" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "sect_id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "realm" INTEGER NOT NULL,
  "votes" INTEGER NOT NULL DEFAULT 0,
  "from_at" INTEGER NOT NULL,
  "to_at" INTEGER,
  "end_reason" TEXT
);
CREATE INDEX "sect_leaders_sect_idx" ON "sect_leaders"("sect_id", "from_at" DESC);
