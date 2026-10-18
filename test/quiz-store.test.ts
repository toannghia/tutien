import { describe, expect, it } from "vitest";
import { createProfile, replay, type ChoiceInput } from "../src/game/engine";
import { BANKS } from "../src/game/quiz";
import { makeQuestion } from "../src/game/quiz/types";
import { banksAt, type QuestionRow } from "../src/quiz-store";

// Dòng D1 giống hệt migration 0005 (sinh từ ngân hàng trong code, phiên bản 1)
const seedRows = (): QuestionRow[] =>
  Object.entries(BANKS).flatMap(([path, list]) =>
    list.map((q, i) => ({
      id: q.id, family: q.id, path, level: q.level, prompt: q.prompt, options_json: JSON.stringify(q.options),
      answer: q.answer, explain: q.explain, ord: i, created_v: 1, deleted_v: null, updated_at: 0, updated_by: "seed",
    })),
  );

function playOut(seed: number, banks: typeof BANKS) {
  const profile = createProfile(seed, 0);
  const choices: ChoiceInput[] = [];
  let s = replay(seed, profile, choices, banks);
  while (s.pending) {
    choices.push({ eventId: s.pending.eventId, choiceId: s.pending.options[0].id });
    s = replay(seed, profile, choices, banks);
  }
  return { profile, choices, state: s };
}

describe("kho câu hỏi có phiên bản", () => {
  it("phiên bản 1 trong D1 giống hệt ngân hàng trong code", () => {
    expect(banksAt(seedRows(), 1)).toEqual(BANKS);
  });

  it("kiếp chơi bằng ngân hàng D1 v1 cho kết quả giống ngân hàng code", () => {
    const v1 = banksAt(seedRows(), 1);
    for (let seed = 1; seed <= 25; seed++) expect(playOut(seed, v1).state).toEqual(playOut(seed, BANKS).state);
  });

  it("admin sửa/xoá câu hỏi (v2) không làm lệch kiếp tạo ở v1", () => {
    const rows = seedRows();
    // v2: sửa câu đầu mỗi ngân hàng (ẩn bản cũ, thêm bản mới cùng ord) và xoá câu thứ hai
    for (const path of Object.keys(BANKS)) {
      const list = rows.filter((r) => r.path === path);
      const old = list[0];
      old.deleted_v = 2;
      const nq = makeQuestion(`${old.id}~2`, 3, "Câu đã sửa?", ["Đúng", "Sai"], 0, "Giảng giải mới");
      rows.push({ ...old, id: nq.id, level: 3, prompt: nq.prompt, options_json: JSON.stringify(nq.options), answer: nq.answer, explain: nq.explain, created_v: 2, deleted_v: null });
      list[1].deleted_v = 2;
    }
    const v1 = banksAt(rows, 1), v2 = banksAt(rows, 2);
    expect(v1).toEqual(BANKS);
    expect(v2.dich[0].prompt).toBe("Câu đã sửa?");
    expect(v2.dich.length).toBe(BANKS.dich.length - 1);
    for (let seed = 1; seed <= 20; seed++) {
      const ref = playOut(seed, BANKS);
      // Phát lại lựa chọn cũ bằng ngân hàng tại v1 (như máy chủ làm với profile.qv = 1) → không lệch
      expect(replay(seed, ref.profile, ref.choices, v1)).toEqual(ref.state);
    }
  });
});
