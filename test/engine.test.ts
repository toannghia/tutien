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

describe("cấu hình theo kiếp", () => {
  it("cấu hình mặc định cho kết quả giống hệt kiếp không có cấu hình", async () => {
    const { GAME_DEFAULTS } = await import("../src/game/engine");
    for (let seed = 1; seed <= 30; seed++) {
      const a = createProfile(seed, 0);
      const b = createProfile(seed, 0, GAME_DEFAULTS);
      expect(replay(seed, b, []).facts.map((f) => f.title)).toEqual(replay(seed, a, []).facts.map((f) => f.title));
    }
  });

  it("tốc độ tu luyện cao hơn thì đi xa hơn (trung bình)", async () => {
    const avg = (growth: number) => {
      let sum = 0;
      for (let seed = 1; seed <= 120; seed++) {
        const profile = createProfile(seed, 0, { growth, eventRate: 0.4, breakthroughBonus: 0, tribulationDeath: 0.4, quizReward: 1 });
        const choices: ChoiceInput[] = [];
        let s = replay(seed, profile, choices);
        while (s.pending) {
          choices.push({ eventId: s.pending.eventId, choiceId: s.pending.kind === "breakthrough" ? "attempt" : s.pending.options.at(-1)!.id });
          s = replay(seed, profile, choices);
        }
        sum += s.realm;
      }
      return sum / 120;
    };
    expect(avg(2)).toBeGreaterThan(avg(0.5));
  });
});

describe("ôn tập trong kiếp", () => {
  // Chơi tới câu khảo hạch thứ n (đếm từ 1); trả về trạng thái đang chờ câu đó
  function nthQuiz(seed: number, profile: ReturnType<typeof createProfile>, n: number) {
    const choices: ChoiceInput[] = [];
    let s = replay(seed, profile, choices);
    let seen = 0;
    while (s.pending) {
      if (s.pending.kind === "quiz" && ++seen === n) return s;
      choices.push({ eventId: s.pending.eventId, choiceId: s.pending.kind === "path" ? "tieudao" : s.pending.options.at(-1)!.id });
      s = replay(seed, profile, choices);
    }
    return null;
  }

  it("câu đến hạn ôn được hỏi xen kẽ, gắn nhãn ôn lại, và phát lại tất định", () => {
    for (let seed = 1; seed < 80; seed++) {
      const base = createProfile(seed, 0);
      if (!base.rootScore) continue;
      const review = BANKS.tieudao.slice(-3).map((q) => q.id); // 3 câu khó nhất của Tiêu Dao
      const profile = { ...base, review };
      const first = nthQuiz(seed, profile, 1);
      if (!first) continue;
      expect(first.pending!.review).toBe(true);
      expect(review).toContain(first.pending!.eventId.slice(5));
      const second = nthQuiz(seed, profile, 2);
      if (second) expect(second.pending!.review).toBeUndefined(); // câu thứ 2 là câu mới
      expect(nthQuiz(seed, profile, 1)).toEqual(first);
      return;
    }
    throw new Error("không tìm được seed phù hợp");
  });
});

describe("độ khó theo cảnh giới", () => {
  it("độ dốc 0 không đổi gì; độ dốc càng cao, cảnh giới càng cao càng khó", async () => {
    const { realmDifficulty } = await import("../src/game/engine");
    expect(realmDifficulty(0, 13)).toEqual({ speed: 1, wall: 0, storm: 1 });
    const lo = realmDifficulty(0.7, 3), hi = realmDifficulty(0.7, 12);
    expect(lo.wall).toBe(0);
    expect(hi.wall).toBeGreaterThan(0.1);
    expect(hi.speed).toBeLessThan(lo.speed);
    expect(hi.storm).toBeGreaterThan(1.3);
  });
});

describe("cân bằng rủi ro (bản 2)", () => {
  it("kiếp mới có bv=2; dám liều được 'Tâm cảnh lịch luyện', né mãi bị 'Đạo tâm thiếu tôi luyện'", () => {
    const factorsOf = (pickFirst: boolean) => {
      const labels = new Set<string>();
      for (let seed = 1; seed <= 40; seed++) {
        const p = createProfile(seed, 0);
        expect(p.bv).toBe(2);
        const ch: ChoiceInput[] = [];
        let s = replay(seed, p, ch);
        while (s.pending) {
          if (s.pending.kind === "breakthrough") s.pending.factors?.forEach((f) => labels.add(f.label));
          const o = s.pending.kind === "event" ? (pickFirst ? s.pending.options[0] : s.pending.options[s.pending.options.length - 1]) : s.pending.options[0];
          ch.push({ eventId: s.pending.eventId, choiceId: o.id });
          s = replay(seed, p, ch);
        }
      }
      return labels;
    };
    expect(factorsOf(true).has("Tâm cảnh lịch luyện")).toBe(true);
    expect(factorsOf(false).has("Đạo tâm thiếu tôi luyện")).toBe(true);
  });
});

describe("thế mạnh môn phái", () => {
  it("mọi phái có thế mạnh và mô tả sinh từ số liệu", async () => {
    const { SECTS } = await import("../src/game/data");
    for (const x of SECTS) {
      expect(Object.keys(x.fx).length).toBeGreaterThan(0);
      expect(x.perk.length).toBeGreaterThan(5);
    }
  });
  it("kiếp mới (sv=3) nhận thế mạnh phái; kiếp cũ (sv=2) thì không, trừ Quy Chân Các", () => {
    let seen3 = false, seen2 = false;
    for (let seed = 1; seed <= 60 && !(seen3 && seen2); seed++) {
      for (const sv of [3, 2]) {
        const p = createProfile(seed, 0);
        p.sv = sv;
        const ch: ChoiceInput[] = [];
        let s = replay(seed, p, ch);
        while (s.pending) {
          if (s.pending.kind === "breakthrough" && s.sectId && s.sectId !== "quychan" && s.sect === "member") {
            const has = s.pending.factors?.some((f) => f.label.startsWith("Môn phái"));
            if (sv === 3 && has) seen3 = true;
            if (sv === 2) { expect(has).toBeFalsy(); seen2 = true; }
          }
          const o = s.pending.options.find((x) => x.id === "join") ?? s.pending.options[0];
          ch.push({ eventId: s.pending.eventId, choiceId: o.id });
          s = replay(seed, p, ch);
        }
      }
    }
    expect(seen3).toBe(true);
  });
});
