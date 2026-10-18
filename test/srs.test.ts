import { describe, expect, it } from "vitest";
import { NEW_CARD, retention, schedule } from "../src/srs";

const DAY = 86_400_000;

describe("ôn tập ngắt quãng", () => {
  it("đúng liên tiếp thì khoảng cách giãn dần: 1 → 3 → ~7.8 → ~20 ngày", () => {
    let c = NEW_CARD(0);
    const intervals: number[] = [];
    for (let i = 0; i < 4; i++) {
      c = schedule(c, "good", c.due_at);
      intervals.push(c.interval);
    }
    expect(intervals[0]).toBe(1);
    expect(intervals[1]).toBe(3);
    expect(intervals[2]).toBeGreaterThan(7);
    expect(intervals[3]).toBeGreaterThan(18);
    expect(c.due_at).toBeGreaterThan(30 * DAY);
  });

  it("sai thì quay lại ôn sớm, giảm độ dễ, đếm số lần quên", () => {
    let c = NEW_CARD(0);
    c = schedule(c, "good", 0);
    c = schedule(c, "good", DAY);
    c = schedule(c, "again", 4 * DAY);
    expect(c.reps).toBe(0);
    expect(c.lapses).toBe(1);
    expect(c.ease).toBeLessThan(2.6);
    expect(c.due_at - 4 * DAY).toBeLessThan(DAY);
  });

  it("bỏ qua không phạt độ dễ", () => {
    const c = schedule(NEW_CARD(0), "skip", 0);
    expect(c.ease).toBe(2.5);
    expect(c.lapses).toBe(0);
  });

  it("độ nhớ giảm dần theo thời gian (đường cong quên lãng)", () => {
    const c = schedule(NEW_CARD(0), "good", 0); // khoảng cách 1 ngày
    expect(retention(c, 0)).toBeCloseTo(1);
    expect(retention(c, DAY)).toBeLessThan(retention(c, DAY / 4));
    expect(retention(c, 5 * DAY)).toBeLessThan(0.1);
  });
});
