// Luật luận đạo: thuần hàm, không phụ thuộc Durable Object — để test được.
import { GIVEN_NAMES, PATHS, SURNAMES } from "../game/data";
import { BANKS, type Question } from "../game/quiz";

export const DUEL = {
  questions: 5,
  answerMs: 15_000, // thời gian mỗi câu
  revealMs: 4_500, // thời gian xem đáp án giữa hai câu
  countdownMs: 3_500, // đếm ngược trước câu đầu
  connectGraceMs: 20_000, // người chơi không vào phòng trong khoảng này thì huỷ trận
  levels: [1, 1, 2, 2, 3] as const,
  baseRating: 1000,
  k: 32,
};

// Cấu hình mỗi trận (từ trang admin), chụp lúc tạo phòng
export type DuelConfig = { questions: number; answerMs: number; k: number; botLabel: boolean };
export const DUEL_DEFAULTS: DuelConfig = { questions: 5, answerMs: 15_000, k: 32, botLabel: false };

export type Fighter = {
  id: string; // user id, hoặc "bot:…" với bot
  name: string;
  rating: number;
  realm: number;
  path: string | null;
  guest: boolean;
  bot: boolean;
  title?: string | null; // "Chưởng môn …" nếu nhân vật đang giữ ghế
};

// ---------------------------------------------------------------- Chấm điểm

/** Đúng: 100 điểm + tối đa 50 điểm tốc độ. Sai hoặc hết giờ: 0. */
export function points(ok: boolean, ms: number, answerMs = DUEL.answerMs) {
  if (!ok) return 0;
  const left = Math.max(0, answerMs - ms) / answerMs;
  return 100 + Math.round(50 * left);
}

export function winnerOf(a: number, b: number): "a" | "b" | "draw" {
  return a > b ? "a" : b > a ? "b" : "draw";
}

/** Thay đổi Elo cho A (B nhận số đối). score: 1 thắng, 0.5 hòa, 0 thua. */
export function eloDelta(ra: number, rb: number, score: number, k = DUEL.k) {
  const expected = 1 / (1 + 10 ** ((rb - ra) / 400));
  return Math.round(k * (score - expected));
}

// ---------------------------------------------------------------- Đề

/** Chọn N câu từ mọi ngân hàng, độ khó tăng dần (1 → 3), không trùng. */
export function pickDuelQuestions(rand: () => number = Math.random, count = DUEL.questions, all: Question[] = Object.values(BANKS).flat()): Question[] {
  const used = new Set<string>();
  const levels = count === DUEL.questions ? [...DUEL.levels] : Array.from({ length: count }, (_, i) => 1 + Math.floor((i * 3) / count));
  return levels.map((level) => {
    let pool = all.filter((q) => q.level === level && !used.has(q.id));
    if (!pool.length) pool = all.filter((q) => !used.has(q.id)); // thiếu câu đúng cấp độ thì lấy cấp khác
    const q = pool[Math.floor(rand() * pool.length)];
    used.add(q.id);
    return q;
  });
}

// Đáp án xáo trộn theo phòng, dùng chung cho cả hai người
export function shuffled<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------- Bot

const pick = <T>(arr: readonly T[], rand: () => number) => arr[Math.floor(rand() * arr.length)];

/** Tạo một tu sĩ "ẩn danh" có hồ sơ gần với người chơi để trận đấu cân sức. */
export function makeBot(opponent: Fighter, rand: () => number = Math.random): Fighter {
  const gender = rand() < 0.5 ? "male" : "female";
  const realm = Math.max(1, Math.min(13, opponent.realm + Math.floor(rand() * 3) - 1));
  return {
    id: `bot:${Math.floor(rand() * 1e9).toString(36)}`,
    name: `${pick(SURNAMES, rand)} ${pick(GIVEN_NAMES[gender], rand)}`,
    rating: Math.max(600, opponent.rating + Math.floor(rand() * 121) - 60),
    realm,
    path: pick(PATHS, rand).id,
    guest: false,
    bot: true,
  };
}

/**
 * Bot trả lời như người: câu dễ đúng nhiều hơn, chắc chắn thì trả lời nhanh,
 * đoán thì chậm; thỉnh thoảng hết giờ. Điểm Đạo vị càng cao càng giỏi.
 */
export function botAnswer(q: Question, rating: number, rand: () => number = Math.random, answerMs = DUEL.answerMs): { choiceId: string | null; ms: number } {
  const base = q.level === 1 ? 0.78 : q.level === 2 ? 0.62 : 0.47;
  const accuracy = Math.max(0.25, Math.min(0.93, base + (rating - DUEL.baseRating) / 900));
  if (rand() < 0.04) return { choiceId: null, ms: answerMs }; // lơ đãng, hết giờ
  const knows = rand() < accuracy;
  // Thời gian phản ứng: biết thì 2,2–7s; đoán thì 5–13s
  // Co giãn theo thời gian mỗi câu (mặc định 15s)
  const scale = answerMs / DUEL.answerMs;
  const ms = Math.round((knows ? 2200 + rand() * 4800 : 5000 + rand() * 8000) * scale);
  if (knows) return { choiceId: q.answer, ms };
  // Đoán: vẫn có 1/4 cơ hội trúng
  return { choiceId: pick(q.options, rand).id, ms: Math.min(ms, answerMs - 400) };
}

// ---------------------------------------------------------------- Phòng mời bạn

// Bỏ các ký tự dễ nhầm (0/O, 1/I/L) để đọc mã qua điện thoại cho dễ
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_TTL_MS = 10 * 60_000;

export function newRoomCode(rand: () => number = Math.random, length = 5) {
  return Array.from({ length }, () => CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)]).join("");
}

/** Chuẩn hoá mã người dùng gõ: bỏ khoảng trắng/dấu gạch, viết hoa. */
export function normalizeCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

/** Thời gian chờ trước khi ghép bot: 6–12s — đủ để trông như đang tìm người thật. */
export const botWaitMs = (rand: () => number = Math.random, minS = 6, maxS = 12) => Math.round((minS + rand() * Math.max(0, maxS - minS)) * 1000);

/** Biên độ điểm chấp nhận ghép, nới rộng dần theo thời gian chờ. */
export const ratingWindow = (waitedMs: number) => 150 + Math.floor(waitedMs / 1000) * 40;
