// Engine mô phỏng tất định: cùng seed + profile + danh sách lựa chọn → luôn ra cùng một kiếp.
// Máy chủ không tin client: nó chỉ nhận lựa chọn rồi tự dựng lại trạng thái bằng replay().

import { ACHIEVEMENTS, GIVEN_NAMES, ORIGINS, PATHS, PHYSIQUES, REALMS, ROOTS, SECTS, SURNAMES, WORLDS } from "./data";
import { BANKS, type Question } from "./quiz";
import { EVENTS } from "./events";
import type { Choice, Condition, Effects, GameEvent, Outcome, PartnerStatus, SectStatus, Trial } from "./types";

const PITY_LIMIT = 5;
const MAX_TICKS = 20000;
const REALM_COST = 300; // tổng điểm tu vi của một đại cảnh giới
const BREAKTHROUGH_ID = "__breakthrough";
const PATH_ID = "__path";
const SKIP = "skip";
const FINAL = REALMS.length - 1;

export type Rng = { next(): number; int(min: number, max: number): number; pick<T extends { weight: number }>(items: T[]): T };

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    // mulberry32
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick(items) {
      const total = items.reduce((s, i) => s + i.weight, 0);
      let r = next() * total;
      for (const item of items) if ((r -= item.weight) < 0) return item;
      return items[items.length - 1];
    },
  };
}

// ---------------------------------------------------------------- Profile

// Chỉ số cân bằng chụp vào mỗi kiếp lúc tạo (admin chỉnh được). Thiếu thì dùng mặc định = hành vi gốc.
export type GameConfig = { growth: number; eventRate: number; breakthroughBonus: number; tribulationDeath: number; quizReward: number };
export const GAME_DEFAULTS: GameConfig = { growth: 1, eventRate: 0.4, breakthroughBonus: 0, tribulationDeath: 0.4, quizReward: 1 };

export type Profile = {
  name: string;
  gender: "male" | "female";
  world: string;
  origin: string;
  root: string;
  rootScore: number;
  physique: string;
  aptitude: number;
  comprehension: number;
  luck: number;
  awakeningAge: number;
  baseLifespan: number;
  isGood: boolean;
  cfg?: GameConfig;
  qv?: number; // phiên bản ngân hàng câu hỏi lúc tạo kiếp (không có = ngân hàng trong code)
};

export function createProfile(seed: number, pityCount: number, cfg?: GameConfig, pityLimit = PITY_LIMIT): Profile {
  const rng = createRng(seed);
  const world = WORLDS[rng.int(0, WORLDS.length - 1)];
  const origin = rng.pick(ORIGINS);
  let root = rng.pick(ROOTS);
  // Bảo hiểm số mệnh: xui liên tiếp đủ lâu thì kiếp này chắc chắn có linh căn tốt
  if (pityCount >= pityLimit && root.score < 48) root = rng.pick(ROOTS.filter((r) => r.score >= 48));
  const physique = rng.pick(PHYSIQUES);
  const aptitude = rng.int(20, 90);
  const comprehension = rng.int(20, 90);
  const luck = rng.int(20, 90);
  const awakeningAge = rng.int(8, 14);
  const baseLifespan = rng.int(68, 90);
  // Sinh sau cùng để không làm xê dịch các giá trị phía trên
  const gender = rng.next() < 0.5 ? "male" : "female";
  const names = GIVEN_NAMES[gender];
  return {
    name: `${SURNAMES[rng.int(0, SURNAMES.length - 1)]} ${names[rng.int(0, names.length - 1)]}`,
    gender,
    world: world.id,
    origin: origin.id,
    root: root.name,
    rootScore: root.score,
    physique: physique.id,
    aptitude,
    comprehension,
    luck,
    awakeningAge,
    baseLifespan,
    isGood: root.score >= 48 || aptitude >= 80 || physique.id === "dao",
    ...(cfg ? { cfg } : {}),
  };
}

// ---------------------------------------------------------------- Kiểu kết quả

export type ChoiceInput = { eventId: string; choiceId: string };
export type FactKind = "birth" | "life" | "cultivation" | "opportunity" | "disaster" | "choice" | "breakthrough" | "ending" | "quiz";
export type Fact = {
  age: number;
  realm: string;
  title: string;
  text: string;
  kind: FactKind;
  choice?: string;
  delta?: Partial<Record<"cultivation" | "health" | "resources" | "luck" | "comprehension" | "lifespan", number>>;
  // Chỉ số ngay sau mốc này — để bảng nhân vật hiện đúng trong lúc kể lại
  stat?: FactStat;
  // Chi tiết một lần đột phá, để giao diện dựng hiệu ứng kết quả
  breakthrough?: BreakInfo;
  // Kết quả một câu khảo hạch (chỉ có SAU khi đã trả lời)
  quiz?: { question: string; picked: string | null; answer: string; ok: boolean; explain: string };
};
export type FactStat = {
  h: number; // thể trạng
  l: number; // thọ nguyên
  p: number; // % tu vi trong đại cảnh giới
  r: number; // linh tài
  lk: number; // khí vận
  c: number; // ngộ tính
  sc: SectStatus;
  pt: PartnerStatus;
  pa: string | null; // đạo đồ
  si: string | null; // môn phái
};

export type BreakFactor = { label: string; value: number }; // value: điểm phần trăm (+/−)
export type BreakInfo = {
  result: "success" | "fail" | "death" | "ascend";
  from: string;
  to: string;
  tribulation: boolean;
  chance: number; // % thực tế của lần thử
  aided: boolean;
  insight: boolean;
  lifespan?: [number, number]; // thọ nguyên trước → sau (khi thành công)
  strikes?: number; // số đạo thiên lôi đã chịu (trên 9)
  reason?: string; // vì sao thất bại
  tips?: string[]; // gợi ý cho lần sau
};

export type PendingChoice = {
  eventId: string;
  kind: "event" | "breakthrough" | "path" | "quiz";
  title: string;
  prompt: string;
  chance?: number;
  intro?: string; // bối cảnh khảo hạch
  progress?: string; // "2/3"
  school?: string; // tên đạo đồ
  // Chỉ có ở bình cảnh
  aidChance?: number;
  factors?: BreakFactor[];
  tribulation?: boolean;
  from?: string;
  to?: string;
  options: { id: string; text: string; hint?: string }[];
};

export type RunState = {
  phase: "awaiting_choice" | "finished";
  facts: Fact[];
  pending: PendingChoice | null;
  age: number;
  lifespan: number;
  realm: number;
  stage: number;
  realmLabel: string;
  progress: number; // % trong đại cảnh giới hiện tại
  health: number;
  resources: number;
  luck: number;
  comprehension: number;
  sect: SectStatus;
  sectId: string | null; // môn phái cụ thể (giữ cả khi bị trục xuất)
  partner: PartnerStatus;
  path: string | null;
  quiz: { correct: number; total: number; bestStreak: number };
  flags: string[];
  ascended: boolean;
  endingReason: string | null;
  achievements: string[];
  step: number; // số lựa chọn đã dùng
};

export class InvalidChoiceError extends Error {}

// Ném ra khi engine cần lựa chọn mà người chơi chưa gửi → dừng mô phỏng, trả trạng thái chờ
class Awaiting {
  constructor(public pending: PendingChoice) {}
}

export function realmLabel(realm: number, stage: number) {
  const r = REALMS[realm];
  return realm === 0 ? r.name : `${r.name} · ${r.stages[stage]}`;
}

const tickYears = (realm: number) => (realm === 0 ? 1 : Math.max(1, Math.round(REALMS[realm].lifespan / 160)));
const resourceScale = (realm: number) => 1 + realm * 0.6;

// ---------------------------------------------------------------- Replay

export function replay(seed: number, profile: Profile, choices: ChoiceInput[], banks: Record<string, Question[]> = BANKS): RunState {
  // seed riêng cho phần mô phỏng, tách khỏi phần tạo profile
  const rng = createRng(seed ^ 0x9e3779b9);
  const world = WORLDS.find((w) => w.id === profile.world) ?? WORLDS[0];
  const origin = ORIGINS.find((o) => o.id === profile.origin) ?? ORIGINS[0];
  const body = PHYSIQUES.find((p) => p.id === profile.physique) ?? PHYSIQUES[0];
  const cfg: GameConfig = { ...GAME_DEFAULTS, ...(profile.cfg ?? {}) };

  const s = {
    tick: 0,
    age: 0,
    realm: 0,
    stage: 0,
    progress: 0, // điểm trong đại cảnh giới (0..REALM_COST)
    health: 100,
    resources: origin.resources,
    luck: profile.luck,
    comprehension: profile.comprehension,
    rootScore: profile.rootScore,
    lifespan: profile.baseLifespan,
    sect: origin.sect as SectStatus,
    partner: "none" as PartnerStatus,
    flags: new Set<string>(),
    counts: {} as Record<string, number>,
    lastSeen: {} as Record<string, number>,
    facts: [] as Fact[],
    endingReason: null as string | null,
    ascended: false,
    path: null as string | null,
    sectId: null as string | null,
    asked: new Set<string>(), // câu hỏi đã gặp trong kiếp này
    quizCorrect: 0,
    quizTotal: 0,
    streak: 0,
    bestStreak: 0,
    heartPassed: 0,
    insight: false, // vấn tâm đạt → cộng tỉ lệ cho lần đột phá kế
    heartAskedAt: -1, // cảnh giới đã vấn tâm (mỗi bình cảnh hỏi một lần)
  };
  let step = 0;
  const pathDef = () => PATHS.find((p) => p.id === s.path);

  const label = () => realmLabel(s.realm, s.stage);
  // Đóng dấu chỉ số cho mốc vừa rồi (hiệu ứng của nó đã áp xong) trước khi ghi mốc mới
  const stampLast = () => {
    const last = s.facts[s.facts.length - 1];
    if (!last) return;
    last.stat = {
      h: Math.round(s.health),
      l: s.lifespan,
      p: s.realm === 0 ? 0 : Math.min(100, Math.round((s.progress / REALM_COST) * 100)),
      r: s.resources,
      lk: s.luck,
      c: s.comprehension,
      sc: s.sect,
      pt: s.partner,
      pa: s.path,
      si: s.sectId,
    };
  };
  const log = (title: string, text: string, kind: FactKind, extra: Partial<Fact> = {}) => {
    stampLast();
    s.facts.push({ age: s.age, realm: label(), title, text, kind, ...extra });
  };
  const finish = (reason: string, text: string) => {
    s.endingReason = reason;
    log("Kết cục", text, "ending");
  };
  const stageCost = () => REALM_COST / REALMS[s.realm].stages.length;

  const meets = (cond?: Condition) => {
    if (!cond) return true;
    if (cond.sect && !cond.sect.includes(s.sect)) return false;
    if (cond.partner && !cond.partner.includes(s.partner)) return false;
    if (cond.minResources && s.resources < cond.minResources * resourceScale(s.realm)) return false;
    if (cond.flag && !s.flags.has(cond.flag)) return false;
    if (cond.notFlag && s.flags.has(cond.notFlag)) return false;
    if (cond.rootless !== undefined && cond.rootless !== (s.rootScore === 0)) return false;
    if (cond.hasPath !== undefined && cond.hasPath !== !!s.path) return false;
    return true;
  };

  // Áp hiệu ứng, trả về delta thực tế để hiển thị
  const apply = (e: Effects, reason?: string): Fact["delta"] => {
    const d: NonNullable<Fact["delta"]> = {};
    if (e.cultivation && s.realm > 0) {
      s.progress = Math.max(s.stage * stageCost(), s.progress + e.cultivation);
      d.cultivation = e.cultivation;
    }
    if (e.health) {
      const v = e.health < 0 ? Math.round(e.health * body.guard * (s.path === "phat" ? 0.9 : 1)) : e.health;
      const before = s.health;
      s.health = Math.max(0, Math.min(100, s.health + v));
      d.health = Math.round(s.health - before);
    }
    if (e.resources) {
      const v = Math.round(e.resources * resourceScale(s.realm));
      const before = s.resources;
      s.resources = Math.max(0, s.resources + v);
      d.resources = s.resources - before;
    }
    if (e.luck) {
      s.luck = Math.max(0, Math.min(100, s.luck + e.luck));
      d.luck = e.luck;
    }
    if (e.comprehension) {
      s.comprehension = Math.max(0, Math.min(100, s.comprehension + e.comprehension));
      d.comprehension = e.comprehension;
    }
    if (e.lifespan) {
      s.lifespan += e.lifespan;
      d.lifespan = e.lifespan;
    }
    if (e.sect) {
      s.sect = e.sect;
      if (e.sect === "member" && !s.sectId) {
        s.sectId = pickSect();
        const last = s.facts[s.facts.length - 1];
        if (last) last.text += ` Tông môn của ngươi: ${sectName(s.sectId)}.`;
      }
    }
    if (e.partner) s.partner = e.partner;
    if (e.flag) s.flags.add(e.flag);
    if (e.flag === "root_awakened" && s.rootScore === 0) s.rootScore = ROOTS[1].score;
    if (e.death) finish(reason ?? "Tử vong", "Một đời tu hành khép lại tại đây.");
    else if (s.health <= 0) finish("Thương thế quá nặng", "Thương tích chồng chất sau biến cố vừa rồi, ngươi không gượng dậy được nữa.");
    return Object.keys(d).length ? d : undefined;
  };

  const snapshot = (pending: PendingChoice | null): RunState => {
    stampLast();
    const flags = [...s.flags];
    const finished = !pending;
    return {
      phase: finished ? "finished" : "awaiting_choice",
      facts: s.facts,
      pending,
      age: s.age,
      lifespan: s.lifespan,
      realm: s.realm,
      stage: s.stage,
      realmLabel: label(),
      progress: s.realm === 0 ? 0 : Math.min(100, Math.round((s.progress / REALM_COST) * 100)),
      health: Math.round(s.health),
      resources: s.resources,
      luck: s.luck,
      comprehension: s.comprehension,
      sect: s.sect,
      sectId: s.sectId,
      partner: s.partner,
      path: s.path,
      quiz: { correct: s.quizCorrect, total: s.quizTotal, bestStreak: s.bestStreak },
      flags,
      ascended: s.ascended,
      endingReason: s.endingReason,
      achievements: finished
        ? ACHIEVEMENTS.filter((a) =>
            a.test({ realm: s.realm, age: s.age, flags, endingReason: s.endingReason ?? "", ascended: s.ascended, died: !s.ascended && s.age < s.lifespan, rootless: profile.rootScore === 0 && s.realm === 0 }),
          ).map((a) => a.id)
        : [],
      step,
    };
  };

  // Lấy lựa chọn kế tiếp; hết lựa chọn thì dừng lại chờ người chơi
  const take = (pending: PendingChoice): string => {
    const c = choices[step];
    if (!c) throw new Awaiting(pending);
    if (c.eventId !== pending.eventId || !pending.options.some((o) => o.id === c.choiceId)) {
      throw new InvalidChoiceError(`Lựa chọn #${step} không hợp lệ cho sự kiện ${pending.eventId}`);
    }
    step++;
    return c.choiceId;
  };

  if (s.sect === "member") s.sectId = pickSect();
  log(
    "Một sinh mệnh mới",
    origin.text + ` Nơi ngươi chào đời thuộc ${world.name}.` + (s.sectId ? ` Sơn môn ấy là ${sectName(s.sectId)}.` : ""),
    "birth",
  );

  try {
    simulate();
  } catch (e) {
    if (e instanceof Awaiting) return snapshot(e.pending);
    throw e;
  }
  return snapshot(null);

  // ---------------------------------------------------------------- vòng mô phỏng chính

  function simulate() {
  for (; s.tick < MAX_TICKS; s.tick++) {
    if (s.endingReason) return;

    s.age += tickYears(s.realm) * rng.int(1, 3);
    s.health = Math.min(100, s.health + 4 * body.regen * (s.path === "tieudao" ? 1.2 : 1));

    if (s.age >= s.lifespan) {
      s.age = s.lifespan;
      finish(
        "Thọ nguyên cạn kiệt",
        s.realm === 0
          ? "Tuổi già sức yếu, ngươi nhắm mắt trong căn nhà quen thuộc. Một đời phàm nhân bình lặng khép lại."
          : `Thọ nguyên đã cạn, ngươi ngồi lặng nhìn buổi hoàng hôn cuối cùng. Dừng bước ở ${label()}.`,
      );
      return;
    }

    // ---- Thức tỉnh linh căn
    if (s.realm === 0 && s.rootScore > 0 && (s.age >= profile.awakeningAge || s.flags.has("root_awakened"))) {
      s.realm = 1;
      s.stage = 0;
      s.lifespan = Math.max(s.lifespan, REALMS[1].lifespan);
      const late = s.flags.has("root_awakened");
      log(
        "Bước vào tiên lộ",
        late
          ? "Linh khí lần đầu chảy qua kinh mạch đã khô cằn bao năm. Ở cái tuổi người khác đã an phận, ngươi mới bắt đầu tu tiên."
          : `Lễ trắc linh xác nhận ngươi mang ${profile.root}. Ngươi bắt đầu dẫn khí nhập thể, bước qua ranh giới giữa phàm tục và tiên lộ.`,
        "breakthrough",
      );
      choosePath();
      continue;
    }

    // ---- Tu luyện
    if (s.realm > 0) {
      const talent = 0.35 + s.rootScore / 100 + profile.aptitude / 400;
      const sectBonus = s.sect === "elder" ? 1.15 : s.sect === "member" ? 1.05 : 1;
      // Cảnh giới càng cao, tu luyện càng chậm
      const pathBonus = s.path === "nguhanh" ? 1.06 : 1;
      s.progress += rng.int(6, 12) * talent * world.fortune * body.speed * sectBonus * pathBonus * cfg.growth * Math.pow(0.86, s.realm - 1);
      const stages = REALMS[s.realm].stages.length;
      while (s.stage < stages - 1 && s.progress >= (s.stage + 1) * stageCost()) {
        s.stage++;
        log("Tiểu cảnh giới tinh tiến", `Linh lực tích lũy đủ, ngươi tiến lên ${label()}.`, "cultivation");
      }

      // ---- Bình cảnh đại cảnh giới
      if (s.progress >= REALM_COST) {
        s.progress = REALM_COST;
        heartTrial();
        breakthrough();
        continue;
      }
    }

    // ---- Sự kiện ngẫu nhiên
    if (rng.next() < (s.realm === 0 ? cfg.eventRate * 0.75 : cfg.eventRate)) {
      const pool = EVENTS.filter(eligible).map((e) => ({
        ...e,
        weight: e.weight * ((e.effects?.health ?? 0) < 0 ? world.danger : 1),
      }));
      if (!pool.length) continue;
      const ev = rng.pick(pool);
      s.counts[ev.id] = (s.counts[ev.id] ?? 0) + 1;
      s.lastSeen[ev.id] = s.tick;
      if (ev.trial) {
        runTrial(ev.trial, ev.text);
        continue;
      }
      if (!ev.choices) {
        const kind: FactKind = (ev.effects?.health ?? 0) < 0 ? "disaster" : (ev.effects?.cultivation ?? 0) > 0 ? "cultivation" : "life";
        const at = s.facts.length;
        log(ev.title, ev.text, kind);
        s.facts[at].delta = apply(ev.effects ?? {});
        continue;
      }
      const options = ev.choices.filter((c) => meets(c.cond));
      const pending: PendingChoice = {
        eventId: ev.id,
        kind: "event",
        title: ev.title,
        prompt: ev.text,
        options: options.map(({ id, text, hint }) => ({ id, text, hint })),
      };
      const pick = take(pending);
      resolveChoice(ev, options.find((c) => c.id === pick)!);
    }
  }
  throw new Error("Mô phỏng vượt giới hạn an toàn");
  }

  // ---------------------------------------------------------------- helpers (closure)

  function eligible(e: GameEvent) {
    if (s.realm < e.realms[0] || s.realm > e.realms[1]) return false;
    if (e.minAge !== undefined && s.age < e.minAge) return false;
    if (e.maxAge !== undefined && s.age > e.maxAge) return false;
    if ((s.counts[e.id] ?? 0) >= e.maxPerLife) return false;
    if (e.cooldown && s.lastSeen[e.id] !== undefined && s.tick - s.lastSeen[e.id] < e.cooldown) return false;
    // Trẻ nhỏ chưa thức tỉnh chỉ gặp sự kiện tuổi thơ; người phàm căn trưởng thành gặp sự kiện phàm nhân
    return meets(e.cond);
  }

  function resolveChoice(ev: GameEvent, choice: Choice) {
    if (choice.trial && s.path) {
      runTrial(choice.trial, ev.text, choice.text);
      return;
    }
    // Khí vận nghiêng cán cân về kết quả tốt, độ nguy hiểm của giới đẩy về kết quả xấu
    const outcome = rng.pick(
      choice.outcomes.map((o) => ({
        ...o,
        weight: o.weight * (o.effects.death || (o.effects.health ?? 0) < 0 ? world.danger * (1.4 - s.luck / 125) * (s.path === "dich" ? 0.9 : 1) : 1),
      })),
    );
    const at = s.facts.length;
    log(ev.title, outcome.text, outcome.effects.death ? "ending" : "choice", { choice: choice.text });
    if (outcome.effects.death) s.flags.add("died_risky");
    s.facts[at].delta = apply(outcome.effects, outcome.reason);
  }

  function breakthrough(): string {
    const final = s.realm === FINAL;
    const target = final ? null : REALMS[s.realm + 1];
    const targetNo = final ? 14 : s.realm + 1;
    const tribulation = final || !!target?.tribulation;
    const cost = Math.round(30 * resourceScale(s.realm));
    const from = label();
    const to = final ? "Chứng đạo" : target!.name;
    const base = breakthroughChance(targetNo, false);
    const options: PendingChoice["options"] = [
      { id: "attempt", text: tribulation ? "Nghênh đón thiên kiếp" : "Thử đột phá", hint: tribulation ? "Thất bại có thể hồn phi phách tán" : "Thất bại thì trọng thương, tu vi lùi lại" },
    ];
    const canAid = s.resources >= cost;
    if (canAid) options.push({ id: "aid", text: `Dùng linh tài hộ pháp (−${cost})`, hint: `Tỉ lệ thành công +10%` });
    options.push({ id: "wait", text: "Chưa vội, tích lũy thêm", hint: "Hồi phục thể trạng; thọ nguyên vẫn trôi" });

    const pending: PendingChoice = {
      eventId: BREAKTHROUGH_ID,
      kind: "breakthrough",
      title: final ? "Chứng đạo" : `${from} » ${to}`,
      prompt: final
        ? "Ở đỉnh Tiên Đế, trước mắt chỉ còn bình cảnh cuối cùng của đại đạo. Vượt qua là bất hủ, thất bại là tan biến."
        : tribulation
          ? `Tu vi viên mãn. Bước vào ${to} phải vượt thiên kiếp — kiếp vân đã bắt đầu tụ trên đỉnh đầu.`
          : "Tu vi đã viên mãn, chỉ còn một bước vượt qua bình cảnh. Hãy cân nhắc thể trạng và tài nguyên trước khi thử.",
      chance: Math.round(base.p * 100),
      aidChance: canAid ? Math.round(breakthroughChance(targetNo, true).p * 100) : undefined,
      factors: base.factors,
      tribulation,
      from,
      to,
      options,
    };
    const pick = take(pending);

    if (pick === "wait") {
      s.age += tickYears(s.realm) * 3;
      s.health = Math.min(100, s.health + 25);
      log("Tích lũy chờ thời", "Ngươi gác lại đột phá, ổn định căn cơ thêm một thời gian.", "life", { choice: "Chưa vội đột phá" });
      return pick;
    }

    const aided = pick === "aid";
    const { p } = breakthroughChance(targetNo, aided);
    const insight = s.insight;
    if (aided) s.resources -= cost;
    s.insight = false; // lợi thế vấn tâm chỉ dùng cho một lần thử
    const info = (result: BreakInfo["result"], extra: Partial<BreakInfo> = {}): BreakInfo => ({
      result, from, to, tribulation, chance: Math.round(p * 100), aided, insight, ...extra,
    });
    // Số đạo lôi chịu được khi thất bại: cơ hội càng cao càng trụ được lâu (không dùng rng để giữ nhịp kiếp cũ)
    const strikesHeld = Math.max(3, Math.min(8, Math.round(p * 9) + 1));
    const choice = aided ? "Dùng linh tài hộ pháp" : tribulation ? "Nghênh đón thiên kiếp" : "Thử đột phá";

    if (rng.next() < p) {
      if (final) {
        s.ascended = true;
        s.flags.add("ascended");
        log("Chứng đạo", "Đại đạo pháp tắc hòa vào thân. Ngươi vượt qua bình cảnh cuối cùng, thân hợp thiên địa, tên lưu vạn giới.", "breakthrough", {
          choice,
          breakthrough: info("ascend", { strikes: 9 }),
        });
        finish("Chứng đạo bất hủ", "Một đời cầu đạo viên mãn. Từ nay, ngươi chính là một phần của đại đạo.");
        return pick;
      }
      const before = s.lifespan;
      s.realm++;
      s.stage = 0;
      s.progress = 0;
      s.lifespan = Math.max(s.lifespan, REALMS[s.realm].lifespan);
      log(
        tribulation ? `Độ kiếp thành công · ${to}` : `Đột phá ${to}`,
        tribulation
          ? `Chín đạo thiên lôi giáng xuống, ngươi đứng vững đến đạo cuối cùng. Kiếp vân tan đi, ngươi bước vào ${to}.`
          : `Sau nhiều năm tích lũy, ngươi vượt qua bình cảnh và tiến vào ${to}. Thọ nguyên kéo dài, tiên lộ mở thêm một đoạn.`,
        "breakthrough",
        { choice, breakthrough: info("success", { lifespan: [before, s.lifespan], strikes: tribulation ? 9 : undefined }) },
      );
      return pick;
    }

    // ---- Thất bại
    const reason = failReason(p, tribulation, strikesHeld);
    const tips = failTips(aided, canAid, insight);
    if (tribulation) {
      const deathChance = cfg.tribulationDeath * (s.health < 60 ? 1.5 : 1) * (body.id === "thunder" ? 0.6 : 1);
      if (rng.next() < deathChance) {
        log("Thiên kiếp", `Đạo thiên lôi thứ ${strikesHeld + 1} giáng xuống. Ngươi không đỡ nổi.`, "ending", {
          choice,
          breakthrough: info("death", { strikes: strikesHeld, reason }),
        });
        finish(final ? "Tan biến trước bình cảnh đại đạo" : "Hồn phi phách tán dưới thiên kiếp", "Kiếp vân tan đi, nơi ngươi đứng chỉ còn lại tro bụi.");
        return pick;
      }
      s.flags.add("survived_tribulation");
      s.progress = REALM_COST * 0.7;
      const at = s.facts.length;
      log("Độ kiếp thất bại", `Đạo thiên lôi thứ ${strikesHeld + 1} đánh nát nửa thân thể. Ngươi giữ được mạng, nhưng tu vi tổn hao nặng nề.`, "disaster", {
        choice,
        breakthrough: info("fail", { strikes: strikesHeld, reason, tips }),
      });
      s.facts[at].delta = apply({ health: -55 });
      return pick;
    }
    s.progress = REALM_COST - stageCost() * 0.6;
    const at = s.facts.length;
    log("Đột phá thất bại", "Linh lực phản phệ, kinh mạch tổn thương. Tu vi lùi lại một đoạn.", "disaster", {
      choice,
      breakthrough: info("fail", { reason, tips }),
    });
    s.facts[at].delta = apply({ health: -35 });
    if (s.endingReason) s.endingReason = "Đột phá thất bại, kinh mạch đứt đoạn";
    return pick;
  }

  // Chọn phái trong giới diện theo seed + thời điểm, không dùng rng (để không làm lệch các kiếp đang dở)
  function pickSect() {
    const list = SECTS.filter((x) => x.world === world.id);
    const h = Math.imul((seed ^ (s.tick + 1) * 0x9e3779b1) >>> 0, 0x85ebca6b) >>> 0;
    return list[h % list.length].id;
  }

  function sectName(id: string | null) {
    return SECTS.find((x) => x.id === id)?.name ?? "";
  }

  function failReason(p: number, tribulation: boolean, strikes: number) {
    const pct = Math.round(p * 100);
    if (s.health < 60) return `Thể trạng suy yếu (${Math.round(s.health)}/100) — kinh mạch không chịu nổi linh lực cuồn cuộn.`;
    if (tribulation) return `Ngươi đỡ được ${strikes} đạo thiên lôi, nhưng đạo thứ ${strikes + 1} quá mạnh. Cơ hội lần này là ${pct}%.`;
    if (pct < 40) return `Bình cảnh quá dày so với căn cơ hiện tại — cơ hội chỉ có ${pct}%.`;
    return `Đã có ${pct}% cơ hội, nhưng thiên ý khó lường — chỉ thiếu một chút cơ duyên.`;
  }

  function failTips(aided: boolean, canAid: boolean, insight: boolean) {
    const tips: string[] = [];
    if (s.health < 80) tips.push("Chọn \"tích lũy thêm\" để thể trạng hồi phục trước khi thử lại.");
    if (!aided) tips.push(canAid ? "Dùng linh tài hộ pháp để có thêm 10% cơ hội." : "Tích lũy linh tài để có thể hộ pháp (+10%).");
    if (s.path && !insight) tips.push("Đáp đúng câu vấn tâm trước bình cảnh để có thêm 10%.");
    if (s.comprehension < 70) tips.push("Ngộ tính cao giúp đột phá dễ hơn — luận đạo và nghe giảng để tăng ngộ tính.");
    return tips.slice(0, 3);
  }

  function breakthroughChance(target: number, aid: boolean): { p: number; factors: BreakFactor[] } {
    const pt = (x: number) => Math.round(x * 100);
    const name = target >= REALMS.length ? "Chứng đạo" : REALMS[target].name;
    const parts: [string, number][] = [
      [`Bình cảnh ${name}`, 0.72 - 0.045 * target],
      ["Linh căn", s.rootScore / 700],
      ["Ngộ tính", s.comprehension / 600],
      ["Khí vận", s.luck / 900],
      ["Thể chất", body.breakthrough],
      ["Thể trạng", -(100 - s.health) / 250],
      ["Linh tài hộ pháp", aid ? 0.1 : 0],
      ["Vấn tâm", s.insight ? 0.1 : 0],
      ["Đạo Luận tu", s.path === "daoluan" ? 0.03 : 0],
      ["Trúc Cơ Đan", target === 2 && s.flags.has("pill") ? 0.2 : 0],
      ["Thiên ý", cfg.breakthroughBonus / 100],
    ];
    const raw = parts.reduce((sum, [, v]) => sum + v, 0);
    const p = Math.max(0.05, Math.min(0.95, raw));
    const factors = parts.filter(([, v], i) => i === 0 || pt(v) !== 0).map(([label, v]) => ({ label, value: pt(v) }));
    if (p !== raw) factors.push({ label: p > raw ? "Mức tối thiểu" : "Mức tối đa", value: pt(p - raw) });
    return { p, factors };
  }

  // ---------------------------------------------------------------- Đạo đồ & khảo hạch

  function choosePath() {
    const pending: PendingChoice = {
      eventId: PATH_ID,
      kind: "path",
      title: "Chọn đạo đồ",
      prompt: "Linh căn đã mở. Trước khi dẫn khí, ngươi phải chọn con đường để nghiền ngẫm suốt đời. Mỗi đạo đồ có kỳ khảo hạch và lợi thế riêng.",
      options: PATHS.map((p) => ({ id: p.id, text: `${p.glyph} ${p.name}`, hint: `${p.desc} ${p.perk}` })),
    };
    s.path = take(pending);
    log(`Đạo đồ · ${pathDef()!.name}`, `Ngươi chọn ${pathDef()!.name} làm con đường cầu đạo. ${pathDef()!.perk}`, "life", { choice: pathDef()!.name });
  }

  function pickQuestion(level?: number): Question {
    const bank = banks[s.path!] ?? [];
    const max = level ?? (s.realm <= 2 ? 1 : s.realm <= 5 ? 2 : 3);
    let pool = bank.filter((q) => q.level <= max && !s.asked.has(q.id));
    if (!pool.length) pool = bank.filter((q) => !s.asked.has(q.id));
    if (!pool.length) pool = bank; // đã hỏi hết: cho phép lặp lại
    // Ưu tiên câu đúng cấp độ hiện tại
    const q = rng.pick(pool.map((x) => ({ x, weight: x.level === max ? 3 : 1 }))).x;
    s.asked.add(q.id);
    return q;
  }

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Hỏi một câu; trả về true nếu đúng. Câu bỏ qua tính là không đúng nhưng không cắt chuỗi đúng liên tiếp.
  function ask(title: string, intro: string, progress: string, level?: number): boolean {
    const q = pickQuestion(level);
    const pending: PendingChoice = {
      eventId: `quiz:${q.id}`,
      kind: "quiz",
      title,
      prompt: q.prompt,
      intro,
      progress,
      school: pathDef()!.name,
      options: [...shuffle(q.options).map(({ id, text }) => ({ id, text })), { id: SKIP, text: "Bỏ qua câu này", hint: "Không có thưởng" }],
    };
    const pick = take(pending);
    const ok = pick === q.answer;
    const skipped = pick === SKIP;
    const answer = q.options.find((o) => o.id === q.answer)!.text;
    const picked = skipped ? null : q.options.find((o) => o.id === pick)!.text;
    s.quizTotal++;
    if (ok) {
      s.quizCorrect++;
      s.streak++;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      if (s.streak >= 8) s.flags.add("streak8");
    } else if (!skipped) s.streak = 0;
    const at = s.facts.length;
    log(
      `${title} · ${ok ? "Đáp đúng" : skipped ? "Bỏ qua" : "Đáp sai"}`,
      q.prompt,
      "quiz",
      { quiz: { question: q.prompt, picked, answer, ok, explain: q.explain } },
    );
    if (ok && cfg.quizReward > 0) {
      const reward = Object.fromEntries(Object.entries(pathDef()!.reward).map(([k, v]) => [k, Math.round(Number(v) * cfg.quizReward)])) as Effects;
      s.facts[at].delta = apply(reward);
    }
    return ok;
  }

  function runTrial(t: Trial, intro: string, choiceText?: string) {
    if (!banks[s.path!]?.length) return; // ngân hàng trống (không nên xảy ra): bỏ qua khảo hạch
    let correct = 0;
    for (let i = 0; i < t.count; i++) if (ask(t.title, intro, `${i + 1}/${t.count}`, t.level)) correct++;
    const passed = correct >= t.pass;
    if (passed && correct === t.count && t.count >= 3) s.flags.add("perfect_trial");
    const outcome: Outcome = passed ? t.onPass : t.onFail;
    const at = s.facts.length;
    log(`${t.title} · ${passed ? "Đạt" : "Không đạt"} (${correct}/${t.count})`, outcome.text, passed ? "opportunity" : "life", { choice: choiceText });
    s.facts[at].delta = apply(outcome.effects, outcome.reason);
  }

  // Vấn tâm: một câu trước mỗi bình cảnh lớn. Đúng → +10% cho lần đột phá kế tiếp.
  function heartTrial() {
    if (!s.path || s.heartAskedAt === s.realm || !banks[s.path]?.length) return;
    s.heartAskedAt = s.realm;
    const ok = ask("Vấn tâm", "Trước bình cảnh, đạo tâm phải vững. Một câu hỏi hiện lên trong thức hải — đáp đúng thì lần đột phá này thêm phần chắc chắn.", "1/1");
    if (ok) {
      s.insight = true;
      s.heartPassed++;
      if (s.heartPassed >= 5) s.flags.add("heart5");
    }
  }
}
