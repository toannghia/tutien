import { describe, expect, it } from "vitest";
import { computeKarma } from "../src/karma";
import { createProfile, replay, type ChoiceInput, type Karma } from "../src/game/engine";

const run = (o: Partial<{ number: number; status: string; best_realm: number; ending_reason: string; v: number; s: number; partner: string }>) => ({
  id: `r${o.number ?? 1}`, number: o.number ?? 1, seed: 12345 + (o.number ?? 1), status: o.status ?? "finished", best_realm: o.best_realm ?? 0,
  ending_reason: o.ending_reason ?? "Thọ nguyên cạn kiệt", profile_json: JSON.stringify({ name: `Kiếp ${o.number ?? 1}`, gender: "male" }),
  karma_json: JSON.stringify({ v: o.v ?? 0, s: o.s ?? 0, partner: o.partner ?? "none", res: 0, realm: o.best_realm ?? 0 }),
});

describe("nhân quả: thừa hưởng", () => {
  it("kiếp đầu: không có gì", () => {
    expect(computeKarma([], null)).toEqual({ v: 0, s: 0, insight: 0, pastBest: 0 });
  });
  it("nghiệp lực phai một nửa mỗi kiếp; luân hồi sớm không xóa ác nghiệp, không tính thiện nghiệp", () => {
    // mới nhất trước
    const k = computeKarma([run({ number: 3, v: 10 }), run({ number: 2, status: "abandoned", v: 30, s: 20 }), run({ number: 1, v: 40 })], null);
    // ((40)*0.5 + 0)*0.5 + 10 = 20 ; s: (0*0.5+20)*0.5 + 0 = 10
    expect(k.v).toBe(20);
    expect(k.s).toBe(10);
  });
  it("túc tuệ theo cảnh giới các kiếp gần (tối đa 60) và đường quen", () => {
    const k = computeKarma([run({ number: 2, best_realm: 5 }), run({ number: 1, best_realm: 8 })], null);
    expect(k.insight).toBe(Math.round(5 * 6 + 8 * 6 * 0.5));
    expect(k.pastBest).toBe(8);
    expect(computeKarma([run({ best_realm: 13 }), run({ number: 0, best_realm: 13 })], null).insight).toBe(60);
  });
  it("chấp niệm theo cách kiếp trước gục ngã; tiền duyên; oan gia", () => {
    expect(computeKarma([run({ best_realm: 4, ending_reason: "Hồn phi phách tán dưới thiên kiếp" })], null).obsession).toMatchObject({ realm: 5, kind: "tribulation" });
    expect(computeKarma([run({ best_realm: 2, ending_reason: "Thọ nguyên cạn kiệt" })], null).obsession).toMatchObject({ realm: 3, kind: "lifespan" });
    expect(computeKarma([run({ best_realm: 0, ending_reason: "Thọ nguyên cạn kiệt" })], null).obsession).toBeUndefined();
    expect(computeKarma([run({ partner: "widowed" })], null).bond?.name).toBeTruthy();
    expect(computeKarma([run({ s: 30 })], null).feud?.name).toBeTruthy();
    expect(computeKarma([run({ s: 10 })], null).feud).toBeUndefined();
  });
});

describe("nhân quả: trong kiếp", () => {
  // Chạy hết một kiếp, luôn chọn phương án đầu (trừ "skip")
  const live = (k: Karma, seed = 777) => {
    const p = createProfile(seed, 0);
    p.karma = k;
    const ch: ChoiceInput[] = [];
    let s = replay(seed, p, ch);
    for (let i = 0; i < 3000 && s.pending; i++) {
      const o = s.pending.options.find((x) => x.id !== "skip")!;
      ch.push({ eventId: s.pending.eventId, choiceId: o.id });
      s = replay(seed, p, ch);
    }
    return s;
  };
  it("có ghi nhân quả tiền kiếp lúc sinh và chạy được trọn kiếp", () => {
    const s = live({ v: 30, s: 0, insight: 40, pastBest: 4, prev: { name: "Cố Nhân", number: 1, realm: 4, ending: "Thọ nguyên cạn kiệt" } });
    expect(s.phase).toBe("finished");
    expect(s.facts[1].title).toBe("Nhân quả tiền kiếp");
    expect(s.facts[1].text).toContain("phúc báo");
  });
  it("động phủ tiền kiếp: kế thừa được và đánh dấu", () => {
    let found = 0;
    for (let seed = 1; seed < 40 && !found; seed++) {
      const s = live({ v: 0, s: 0, insight: 0, pastBest: 0, legacy: { id: "lg1", name: "Tiền Bối", realm: 5, res: 300, world: "peaceful", ascended: false } }, seed);
      if (s.flags.includes("legacy_claimed")) found++;
    }
    expect(found).toBe(1);
  });
  it("tiền duyên: gặp lại và kết đạo lữ", () => {
    let ok = false;
    for (let seed = 1; seed < 40 && !ok; seed++) ok = live({ v: 0, s: 0, insight: 0, pastBest: 0, bond: { name: "Liễu Như Yên" } }, seed).flags.includes("bond_renewed");
    expect(ok).toBe(true);
  });
});

describe("môn phái bản 4", () => {
  const playAll = (sv: number, karma: any, prefer: string[], seeds = 80) => {
    const flags = new Set<string>();
    const events = new Set<string>();
    for (let seed = 1; seed <= seeds; seed++) {
      const p = createProfile(seed, 0);
      p.sv = sv;
      p.karma = karma;
      const ch: ChoiceInput[] = [];
      let s = replay(seed, p, ch);
      for (let i = 0; i < 3000 && s.pending; i++) {
        events.add(s.pending.eventId);
        const o = prefer.map((id) => s.pending!.options.find((x) => x.id === id)).find(Boolean) ?? s.pending.options.find((x) => x.id !== "skip")!;
        ch.push({ eventId: s.pending.eventId, choiceId: o.id });
        s = replay(seed, p, ch);
      }
      s.flags.forEach((f) => flags.add(f));
    }
    return { flags, events };
  };
  const K0 = { v: 0, s: 0, insight: 0, pastBest: 0 };
  it("tự chọn phái khi nhập môn, có chiêu mộ / truy sát / thu nhận phản đồ", () => {
    const { flags, events } = playAll(4, K0, ["join", "defect", "fight", "expose"]);
    expect(events.has("__sect_pick")).toBe(true);
    expect(events.has("__recruit")).toBe(true);
    expect(flags.has("defected")).toBe(true);
    expect(events.has("__hunted")).toBe(true);
  });
  it("tiền duyên sư môn: kiếp trước là trưởng lão → phái cũ tìm đến", () => {
    const { flags } = playAll(4, { ...K0, sectBond: { sectId: "thanhvan", world: "peaceful", rank: "elder" } }, ["return"], 60);
    expect(flags.has("sect_rebond")).toBe(true);
  });
  it("kiếp bản 3 không có các sự kiện mới", () => {
    const { events } = playAll(3, K0, ["join", "defect"], 40);
    expect([...events].some((e) => ["__sect_pick", "__recruit", "__hunted", "__adopt", "__sect_bond"].includes(e))).toBe(false);
  });
});
