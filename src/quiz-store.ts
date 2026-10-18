// Kho câu hỏi trong D1 có phiên bản. Mỗi kiếp dùng ngân hàng "tại phiên bản lúc tạo" để phát lại tất định.
import { BANKS, type Question } from "./game/quiz";

export type Banks = Record<string, Question[]>;
export type QuestionRow = {
  id: string;
  family: string;
  path: string;
  level: number;
  prompt: string;
  options_json: string;
  answer: string;
  explain: string;
  ord: number;
  created_v: number;
  deleted_v: number | null;
  updated_at: number;
  updated_by: string | null;
};

let cache: { version: number; rows: QuestionRow[]; at: number } | null = null;

export async function currentVersion(db: D1Database): Promise<number> {
  const r = await db.prepare("SELECT v FROM quiz_meta WHERE k = 'version'").first<{ v: number }>();
  return r?.v ?? 0;
}

/** Nạp toàn bộ dòng (kể cả đã ẩn). Dòng là bất biến nên chỉ cần nạp lại khi có phiên bản mới hơn. */
async function rowsAtLeast(db: D1Database, version: number): Promise<{ version: number; rows: QuestionRow[] }> {
  if (cache && cache.version >= version && Date.now() - cache.at < 60_000) return cache;
  const [v, list] = await Promise.all([currentVersion(db), db.prepare("SELECT * FROM questions").all<QuestionRow>()]);
  cache = { version: v, rows: list.results, at: Date.now() };
  return cache;
}

export function clearQuizCache() {
  cache = null;
}

export const rowToQuestion = (r: QuestionRow): Question => ({
  id: r.id,
  level: r.level as 1 | 2 | 3,
  prompt: r.prompt,
  options: JSON.parse(r.options_json),
  answer: r.answer,
  explain: r.explain,
});

/** Ngân hàng tại phiên bản v: câu tạo ≤ v và chưa ẩn tại v, sắp theo ord (thứ tự ảnh hưởng cách bốc câu). */
export function banksAt(rows: QuestionRow[], v: number): Banks {
  const out: Banks = {};
  rows
    .filter((r) => r.created_v <= v && (r.deleted_v === null || r.deleted_v > v))
    .sort((a, b) => a.ord - b.ord || a.created_v - b.created_v)
    .forEach((r) => (out[r.path] ??= []).push(rowToQuestion(r)));
  return out;
}

/** Ngân hàng cho một kiếp: kiếp cũ (chưa có qv) dùng ngân hàng trong code như trước. */
export async function banksFor(db: D1Database, qv: number | undefined): Promise<Banks> {
  if (!qv) return BANKS;
  const { rows } = await rowsAtLeast(db, qv);
  return banksAt(rows, qv);
}

export async function currentBanks(db: D1Database): Promise<{ version: number; banks: Banks }> {
  const v = await currentVersion(db);
  const { rows } = await rowsAtLeast(db, v);
  return { version: v, banks: banksAt(rows, v) };
}
