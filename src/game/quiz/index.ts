import { DAOLUAN } from "./daoluan";
import { DICH } from "./dich";
import { NGUHANH } from "./nguhanh";
import type { Question } from "./types";

export type { Question } from "./types";

// Ngân hàng câu hỏi theo đạo đồ (id khớp PATHS trong data.ts)
export const BANKS: Record<string, Question[]> = { nguhanh: NGUHANH, dich: DICH, daoluan: DAOLUAN };

// Kiểm tra sớm: id trùng, đáp án trùng nhau trong một câu
for (const [bank, list] of Object.entries(BANKS)) {
  const ids = new Set<string>();
  for (const q of list) {
    if (ids.has(q.id)) throw new Error(`Trùng id câu hỏi ${q.id} (${bank})`);
    ids.add(q.id);
    if (new Set(q.options.map((o) => o.text)).size !== q.options.length) throw new Error(`Phương án trùng trong ${q.id}`);
    if (q.options.length < 2) throw new Error(`Câu ${q.id} thiếu phương án`);
  }
}
