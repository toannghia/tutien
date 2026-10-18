import { describe, expect, it } from "vitest";
import { pickCandidates, pickWinner } from "../src/sect";

const c = (run_id: string, points: number, realm: number) => ({ run_id, user_id: "u" + run_id, name: run_id, points, realm });

describe("bầu chưởng môn", () => {
  it("ứng viên: 3 người điểm cao nhất, bằng điểm xét cảnh giới, bỏ người 0 điểm", () => {
    const got = pickCandidates([c("a", 9, 1), c("b", 12, 0), c("c", 9, 5), c("d", 3, 9), c("e", 0, 13)]);
    expect(got.map((x) => x.run_id)).toEqual(["b", "c", "a"]);
    expect(pickCandidates([c("e", 0, 13)])).toEqual([]);
  });
  it("thắng cử: nhiều phiếu nhất; hòa phiếu xét điểm rồi cảnh giới", () => {
    const cands = [c("a", 9, 1), c("b", 12, 0), c("c", 9, 5)];
    expect(pickWinner(cands, { a: 3, b: 1, c: 2 })!.run_id).toBe("a");
    expect(pickWinner(cands, { a: 2, c: 2 })!.run_id).toBe("c");
    expect(pickWinner(cands, {})!.run_id).toBe("b");
    expect(pickWinner([], {})).toBeNull();
  });
});
