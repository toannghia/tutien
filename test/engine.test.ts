import { describe, expect, it } from "vitest";
import { createProfile, InvalidChoiceError, replay, type ChoiceInput } from "../src/game/engine";
import { BANKS } from "../src/game/quiz";

// Chơi hết một kiếp bằng cách luôn chọn phương án đầu tiên
function playOut(seed: number) {
  const profile = createProfile(seed, 0);
  const choices: ChoiceInput[] = [];
  let state = replay(seed, profile, choices);
  while (state.pending) {
    choices.push({ eventId: state.pending.eventId, choiceId: state.pending.options[0].id });
    state = replay(seed, profile, choices);
  }
  return { profile, choices, state };
}

describe("engine", () => {
  it("tất định: cùng seed + lựa chọn → cùng kết quả", () => {
    const a = playOut(12345);
    const b = replay(12345, a.profile, a.choices);
    expect(b).toEqual(a.state);
  });

  it("mọi kiếp đều khép lại", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { state } = playOut(seed);
      expect(state.phase).toBe("finished");
      expect(state.endingReason).toBeTruthy();
    }
  });

  it("từ chối lựa chọn không khớp sự kiện đang chờ", () => {
    for (let seed = 1; seed < 100; seed++) {
      const profile = createProfile(seed, 0);
      if (!replay(seed, profile, []).pending) continue;
      expect(() => replay(seed, profile, [{ eventId: "khong-ton-tai", choiceId: "x" }])).toThrow(InvalidChoiceError);
      return;
    }
    throw new Error("không tìm thấy seed có lựa chọn");
  });

  it("bảo hiểm số mệnh: xui đủ lâu thì linh căn tốt", () => {
    for (let seed = 1; seed <= 200; seed++) expect(createProfile(seed, 5).rootScore).toBeGreaterThanOrEqual(48);
  });
});

describe("nội dung", () => {
  it("người phàm căn sống trọn kiếp phàm nhân", () => {
    let found = 0;
    for (let seed = 1; seed <= 400 && found < 5; seed++) {
      const { profile, state } = playOut(seed);
      if (profile.rootScore !== 0 || state.flags.includes("root_awakened")) continue;
      found++;
      expect(state.realm).toBe(0);
    }
    expect(found).toBeGreaterThan(0);
  });

  it("đột phá luôn có lựa chọn chờ, và thọ nguyên không vượt khi đã kết thúc", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { state } = playOut(seed);
      expect(state.age).toBeLessThanOrEqual(state.lifespan);
      if (state.ascended) expect(state.achievements).toContain("dao");
    }
  });
});

describe("khảo hạch", () => {
  const ALL = Object.values(BANKS).flat();
  const answerOf = (eventId: string) => ALL.find((q) => `quiz:${q.id}` === eventId)!;

  // Chơi tới khi gặp câu hỏi đầu tiên
  function untilQuiz(seed: number) {
    const profile = createProfile(seed, 0);
    const choices: ChoiceInput[] = [];
    let state = replay(seed, profile, choices);
    while (state.pending && state.pending.kind !== "quiz") {
      choices.push({ eventId: state.pending.eventId, choiceId: state.pending.options[0].id });
      state = replay(seed, profile, choices);
    }
    return { profile, choices, state };
  }

  it("có chọn đạo đồ khi thức tỉnh linh căn", () => {
    const { state } = playOut(7);
    const s0 = createProfile(7, 0);
    if (s0.rootScore > 0) expect(state.path).not.toBeNull();
  });

  it("câu hỏi gửi cho client không lộ đáp án hay lời giảng", () => {
    for (let seed = 1; seed < 60; seed++) {
      const { state } = untilQuiz(seed);
      if (!state.pending) continue;
      const json = JSON.stringify(state.pending);
      const q = answerOf(state.pending.eventId);
      expect(json).not.toContain(q.explain);
      expect(json).not.toContain('"answer"');
      expect(state.pending.options.some((o) => o.id === "skip")).toBe(true);
      return;
    }
    throw new Error("không gặp câu hỏi nào");
  });

  it("đáp đúng được thưởng, đáp sai thì không; kết quả có lời giảng", () => {
    for (let seed = 1; seed < 80; seed++) {
      const { profile, choices, state } = untilQuiz(seed);
      if (!state.pending) continue;
      const q = answerOf(state.pending.eventId);
      const wrong = q.options.find((o) => o.id !== q.answer)!.id;
      const right = replay(seed, profile, [...choices, { eventId: state.pending.eventId, choiceId: q.answer }]);
      const bad = replay(seed, profile, [...choices, { eventId: state.pending.eventId, choiceId: wrong }]);
      const fr = right.facts.find((f) => f.kind === "quiz")!;
      const fb = bad.facts.find((f) => f.kind === "quiz")!;
      expect(fr.quiz!.ok).toBe(true);
      expect(fr.delta).toBeTruthy();
      expect(fb.quiz!.ok).toBe(false);
      expect(fb.delta).toBeUndefined();
      expect(fb.quiz!.explain).toBe(q.explain);
      expect(right.quiz.correct).toBe(bad.quiz.correct + 1);
      return;
    }
    throw new Error("không gặp câu hỏi nào");
  });

  it("không hỏi lại cùng một câu trong một kiếp khi ngân hàng còn câu mới", () => {
    const { state } = playOut(11);
    const asked = state.facts.filter((f) => f.kind === "quiz").map((f) => f.quiz!.question);
    expect(new Set(asked).size).toBe(asked.length);
  });

  it("đáp án đúng được xáo trộn, không dồn về một vị trí", () => {
    const pos = [0, 0, 0, 0];
    for (let seed = 1; seed <= 120; seed++) {
      const profile = createProfile(seed, 0);
      const choices: ChoiceInput[] = [];
      let state = replay(seed, profile, choices);
      while (state.pending) {
        if (state.pending.kind === "quiz") pos[state.pending.options.findIndex((o) => o.id === answerOf(state.pending!.eventId).answer)]++;
        choices.push({ eventId: state.pending.eventId, choiceId: state.pending.options[state.pending.options.length - 1].id });
        state = replay(seed, profile, choices);
      }
    }
    const total = pos.reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(50);
    for (const n of pos) expect(n / total).toBeLessThan(0.4);
  });
});

describe("đột phá", () => {
  it("mỗi lần đột phá có thông tin kết quả; thất bại luôn có lý do; các yếu tố cộng lại khớp tỉ lệ", () => {
    let fails = 0, wins = 0, pendings = 0;
    for (let seed = 1; seed <= 150; seed++) {
      const profile = createProfile(seed, 0);
      const choices: ChoiceInput[] = [];
      let state = replay(seed, profile, choices);
      while (state.pending) {
        const p = state.pending;
        if (p.kind === "breakthrough") {
          pendings++;
          const sum = p.factors!.reduce((a, f) => a + f.value, 0);
          expect(Math.abs(sum - p.chance!)).toBeLessThanOrEqual(p.factors!.length); // sai số làm tròn
          if (p.aidChance !== undefined) expect(p.aidChance).toBeGreaterThanOrEqual(p.chance!);
        }
        choices.push({ eventId: p.eventId, choiceId: p.kind === "breakthrough" ? "attempt" : p.options[0].id });
        state = replay(seed, profile, choices);
      }
      for (const f of state.facts.filter((f) => f.breakthrough)) {
        const b = f.breakthrough!;
        if (b.result === "fail" || b.result === "death") {
          fails++;
          expect(b.reason).toBeTruthy();
        }
        if (b.result === "success") {
          wins++;
          expect(b.lifespan![1]).toBeGreaterThanOrEqual(b.lifespan![0]);
        }
      }
    }
    expect(pendings).toBeGreaterThan(50);
    expect(fails).toBeGreaterThan(0);
    expect(wins).toBeGreaterThan(0);
  });
});

describe("chỉ số theo mốc", () => {
  it("mọi mốc đều có chỉ số; mốc cuối khớp trạng thái cuối", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const { state } = playOut(seed);
      expect(state.facts.every((f) => f.stat)).toBe(true);
      const last = state.facts.at(-1)!.stat!;
      expect(last.h).toBe(state.health);
      expect(last.l).toBe(state.lifespan);
      expect(last.r).toBe(state.resources);
      expect(last.sc).toBe(state.sect);
    }
  });
});
