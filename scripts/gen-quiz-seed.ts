// Sinh migration đưa ngân hàng câu hỏi trong code vào D1 (phiên bản 1).
// Chạy: npx tsx scripts/gen-quiz-seed.ts > migrations/0005_questions.sql
import { BANKS } from "../src/game/quiz";

const sql = (v: string) => `'${v.replaceAll("'", "''")}'`;
const now = Date.now();
const lines: string[] = [
  "-- Ngân hàng câu hỏi có phiên bản: mỗi thay đổi tạo phiên bản mới, dòng cũ không bị ghi đè.",
  "-- Một kiếp nhớ phiên bản lúc tạo (profile.qv) → luôn phát lại đúng dù admin sửa câu hỏi về sau.",
  `CREATE TABLE "questions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "family" TEXT NOT NULL,          -- các phiên bản của cùng một câu dùng chung family
  "path" TEXT NOT NULL,            -- đạo đồ
  "level" INTEGER NOT NULL,        -- 1..3
  "prompt" TEXT NOT NULL,
  "options_json" TEXT NOT NULL,    -- [{id, text}]
  "answer" TEXT NOT NULL,          -- id phương án đúng
  "explain" TEXT NOT NULL,
  "ord" INTEGER NOT NULL,          -- thứ tự trong ngân hàng (ảnh hưởng cách bốc câu → không đổi khi sửa)
  "created_v" INTEGER NOT NULL,
  "deleted_v" INTEGER,
  "updated_at" INTEGER NOT NULL,
  "updated_by" TEXT
);`,
  `CREATE INDEX "questions_path_idx" ON "questions"("path", "ord");`,
  `CREATE INDEX "questions_family_idx" ON "questions"("family");`,
  `CREATE TABLE "quiz_meta" ("k" TEXT PRIMARY KEY NOT NULL, "v" INTEGER NOT NULL);`,
  `INSERT INTO "quiz_meta" ("k", "v") VALUES ('version', 1);`,
];
for (const [path, list] of Object.entries(BANKS)) {
  list.forEach((q, i) => {
    lines.push(
      `INSERT INTO "questions" (id, family, path, level, prompt, options_json, answer, explain, ord, created_v, updated_at, updated_by) VALUES (${sql(q.id)}, ${sql(q.id)}, ${sql(path)}, ${q.level}, ${sql(q.prompt)}, ${sql(JSON.stringify(q.options))}, ${sql(q.answer)}, ${sql(q.explain)}, ${i}, 1, ${now}, 'seed');`,
    );
  });
}
console.log(lines.join("\n"));
