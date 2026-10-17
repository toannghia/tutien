import { describe, expect, it } from "vitest";
import { botAnswer, DUEL, eloDelta, makeBot, pickDuelQuestions, points, ratingWindow, winnerOf } from "../src/duel/logic";

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe("luận đạo", () => {
  it("chấm điểm: đúng nhanh nhiều điểm hơn đúng chậm, sai = 0", () => {
    expect(points(true, 0)).toBe(150);
    expect(points(true, DUEL.answerMs)).toBe(100);
    expect(points(true, 3000)).toBeGreaterThan(points(true, 9000));
    expect(points(false, 1000)).toBe(0);
  });

  it("Elo: thắng người mạnh hơn được nhiều điểm hơn, tổng bảo toàn", () => {
    expect(eloDelta(1000, 1200, 1)).toBeGreaterThan(eloDelta(1000, 800, 1));
    expect(eloDelta(1000, 1000, 0.5)).toBe(0);
    expect(eloDelta(1100, 1000, 1) + eloDelta(1000, 1100, 0)).toBe(0);
    expect(winnerOf(300, 300)).toBe("draw");
  });

  it("đề gồm 5 câu khác nhau, độ khó tăng dần", () => {
    for (let s = 1; s < 50; s++) {
      const qs = pickDuelQuestions(seeded(s));
      expect(qs).toHaveLength(5);
      expect(new Set(qs.map((q) => q.id)).size).toBe(5);
      expect(qs.map((q) => q.level)).toEqual([1, 1, 2, 2, 3]);
    }
  });

  it("bot có hồ sơ gần người chơi và trả lời trong thời gian hợp lệ", () => {
    const me = { id: "u", name: "A", rating: 1200, realm: 4, path: null, guest: false, bot: false };
    const rand = seeded(7);
    let correct = 0;
    let total = 0;
    for (let i = 0; i < 400; i++) {
      const bot = makeBot(me, rand);
      expect(bot.bot).toBe(true);
      expect(Math.abs(bot.rating - me.rating)).toBeLessThanOrEqual(60);
      for (const q of pickDuelQuestions(rand)) {
        const a = botAnswer(q, bot.rating, rand);
        expect(a.ms).toBeGreaterThan(0);
        expect(a.ms).toBeLessThanOrEqual(DUEL.answerMs);
        total++;
        if (a.choiceId === q.answer) correct++;
      }
    }
    // Không hoàn hảo, cũng không quá kém
    expect(correct / total).toBeGreaterThan(0.5);
    expect(correct / total).toBeLessThan(0.9);
  });

  it("biên độ ghép cặp nới rộng theo thời gian chờ", () => {
    expect(ratingWindow(10_000)).toBeGreaterThan(ratingWindow(0));
  });
});
