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

// Phiên bản hiện hành: cache 15 giây mỗi isolate (admin sửa câu hỏi thì isolate đó xoá cache ngay; isolate khác trễ tối đa 15 giây)
let versionCache: { v: number; at: number } | null = null;
export async function currentVersion(db: D1Database): Promise<number> {
  if (versionCache && Date.now() - versionCache.at < 15_000) return versionCache.v;
  const r = await db.prepare("SELECT v FROM quiz_meta WHERE k = 'version'").first<{ v: number }>();
  versionCache = { v: r?.v ?? 0, at: Date.now() };
  return versionCache.v;
}

/** Nạp toàn bộ dòng (kể cả đã ẩn). Dòng là bất biến nên chỉ cần nạp lại khi có phiên bản mới hơn. */
async function rowsAtLeast(db: D1Database, version: number): Promise<{ version: number; rows: QuestionRow[] }> {
  // Dòng câu hỏi là bất biến: đã có đủ đến phiên bản cần thì dùng lại mãi, không cần nạp lại
  if (cache && cache.version >= version) return cache;
  versionCache = null;
  const [v, list] = await Promise.all([currentVersion(db), db.prepare("SELECT * FROM questions").all<QuestionRow>()]);
  cache = { version: v, rows: list.results, at: Date.now() };
  return cache;
}

export function clearQuizCache() {
  cache = null;
  versionCache = null;
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

/** family + đạo đồ của một câu (theo id bất kỳ phiên bản); câu trong code có family = id. */
export async function familyOf(db: D1Database, ids: string[]): Promise<Map<string, { family: string; path: string }>> {
  const { rows } = await rowsAtLeast(db, 0);
  const byId = new Map(rows.map((r) => [r.id, { family: r.family, path: r.path }]));
  const out = new Map<string, { family: string; path: string }>();
  for (const id of ids) {
    let hit = byId.get(id);
    if (!hit) {
      // Có thể là câu mới hơn cache: nạp lại một lần
      cache = null;
      const fresh = await rowsAtLeast(db, 0);
      hit = new Map(fresh.rows.map((r) => [r.id, { family: r.family, path: r.path }])).get(id);
    }
    if (hit) out.set(id, hit);
  }
  return out;
}

/** id câu đang dùng (tại phiên bản v) cho từng family. */
export async function idsForFamilies(db: D1Database, v: number, families: string[]): Promise<Map<string, string>> {
  const { rows } = await rowsAtLeast(db, v);
  const live = rows.filter((r) => r.created_v <= v && (r.deleted_v === null || r.deleted_v > v));
  const byFam = new Map(live.map((r) => [r.family, r.id]));
  return new Map(families.filter((f) => byFam.has(f)).map((f) => [f, byFam.get(f)!]));
}

/** Tìm câu theo id (mọi phiên bản). */
export async function questionById(db: D1Database, id: string): Promise<(Question & { path: string; family: string }) | null> {
  let { rows } = await rowsAtLeast(db, 0);
  let r = rows.find((x) => x.id === id);
  if (!r) {
    cache = null;
    rows = (await rowsAtLeast(db, 0)).rows;
    r = rows.find((x) => x.id === id);
  }
  return r ? { ...rowToQuestion(r), path: r.path, family: r.family } : null;
}
