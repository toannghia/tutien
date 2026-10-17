-- ============ Better Auth (core + plugin anonymous) ============
CREATE TABLE "user" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER NOT NULL DEFAULT 0,
  "image" TEXT,
  "isAnonymous" INTEGER DEFAULT 0,
  "createdAt" DATE NOT NULL,
  "updatedAt" DATE NOT NULL
);

CREATE TABLE "session" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "expiresAt" DATE NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" DATE NOT NULL,
  "updatedAt" DATE NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- Mỗi danh tính (email/mật khẩu, google...) là một dòng: tương ứng bảng identities trong thiết kế
CREATE TABLE "account" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" DATE,
  "refreshTokenExpiresAt" DATE,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" DATE NOT NULL,
  "updatedAt" DATE NOT NULL
);
CREATE INDEX "account_userId_idx" ON "account"("userId");

CREATE TABLE "verification" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" DATE NOT NULL,
  "createdAt" DATE NOT NULL,
  "updatedAt" DATE NOT NULL
);
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- ============ Dữ liệu game ============
-- Một kiếp. Máy chủ giữ seed; trạng thái luôn được dựng lại từ seed + run_choices.
CREATE TABLE "runs" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "number" INTEGER NOT NULL,              -- kiếp thứ mấy của người chơi
  "seed" INTEGER NOT NULL,
  "world" TEXT NOT NULL,
  "profile_json" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active', -- active | finished | abandoned
  "best_realm" INTEGER NOT NULL DEFAULT 0,
  "age" INTEGER NOT NULL DEFAULT 0,
  "ending_reason" TEXT,
  "created_at" INTEGER NOT NULL,
  "ended_at" INTEGER
);
CREATE INDEX "runs_user_idx" ON "runs"("user_id", "created_at");
CREATE INDEX "runs_leaderboard_idx" ON "runs"("status", "best_realm" DESC, "age" DESC);

-- Mỗi lựa chọn đã gửi. (run_id, step) là khoá: gửi lại cùng step thì bỏ qua → an toàn khi mạng chập chờn.
CREATE TABLE "run_choices" (
  "run_id" TEXT NOT NULL REFERENCES "runs"("id") ON DELETE CASCADE,
  "step" INTEGER NOT NULL,
  "event_id" TEXT NOT NULL,
  "choice_id" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL,
  PRIMARY KEY ("run_id", "step")
);

CREATE TABLE "user_stats" (
  "user_id" TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "best_realm" INTEGER NOT NULL DEFAULT 0,
  "longest_age" INTEGER NOT NULL DEFAULT 0,
  "total_runs" INTEGER NOT NULL DEFAULT 0,
  "pity_count" INTEGER NOT NULL DEFAULT 0,
  "achievements_json" TEXT NOT NULL DEFAULT '[]',
  "updated_at" INTEGER NOT NULL
);
