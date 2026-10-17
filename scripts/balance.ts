// Mô phỏng hàng loạt để cân bằng độ khó: npx tsx scripts/balance.ts [số kiếp]
import { REALMS } from "../src/game/data";
import { createProfile, replay, type ChoiceInput, type RunState } from "../src/game/engine";
import { BANKS } from "../src/game/quiz";

const ALL = Object.values(BANKS).flat();
const answer = (eventId: string) => ALL.find((q) => `quiz:${q.id}` === eventId)!.answer;
// Người chơi đoán bừa: chọn ngẫu nhiên trong các đáp án (không bỏ qua)
const guess = (s: RunState, r: () => number) => {
  const opts = s.pending!.options.filter((o) => o.id !== "skip");
  return opts[Math.floor(r() * opts.length)].id;
};

type Policy = (s: RunState, rnd: () => number) => string;
const policies: Record<string, Policy> = {
  random: (s, r) => {
    const p = s.pending!;
    if (p.kind === "quiz") return guess(s, r);
    if (p.kind === "breakthrough") return p.options.find((o) => o.id === "aid")?.id ?? "attempt";
    return p.options[Math.floor(r() * p.options.length)].id;
  },
  careful: (s, r) => {
    const p = s.pending!;
    if (p.kind === "quiz") return guess(s, r);
    if (p.kind === "breakthrough") {
      if (s.health < 70) return "wait";
      return p.options.find((o) => o.id === "aid")?.id ?? "attempt";
    }
    return p.options[p.options.length - 1].id;
  },
};

// Như careful nhưng luôn trả lời đúng — giới hạn trên của lợi ích từ khảo hạch
policies.scholar = (s, r) => (s.pending!.kind === "quiz" ? answer(s.pending!.eventId) : policies.careful(s, r));

const N = Number(process.argv[2] ?? 2000);
for (const [name, policy] of Object.entries(policies)) {
  const realms = new Array(REALMS.length).fill(0);
  const endings: Record<string, number> = {};
  let quizTotal = 0, quizCorrect = 0;
  let choicesTotal = 0, factsTotal = 0, ascended = 0, ageSum = 0, t0 = Date.now(), maxChoices = 0;
  let r = 1;
  const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  for (let seed = 1; seed <= N; seed++) {
    const profile = createProfile(seed * 7919, 0);
    const choices: ChoiceInput[] = [];
    let s = replay(seed * 7919, profile, choices);
    while (s.pending) {
      choices.push({ eventId: s.pending.eventId, choiceId: policy(s, rnd) });
      s = replay(seed * 7919, profile, choices);
    }
    realms[s.realm]++;
    endings[s.endingReason!] = (endings[s.endingReason!] ?? 0) + 1;
    choicesTotal += choices.length; factsTotal += s.facts.length; ageSum += s.age;
    maxChoices = Math.max(maxChoices, choices.length);
    if (s.ascended) ascended++;
    quizTotal += s.quiz.total; quizCorrect += s.quiz.correct;
  }
  console.log(`\n=== ${name} (${N} kiếp, ${Date.now() - t0}ms) ===`);
  console.log(`lựa chọn TB ${(choicesTotal / N).toFixed(1)} (max ${maxChoices}) · mốc TB ${(factsTotal / N).toFixed(1)} · tuổi TB ${Math.round(ageSum / N)} · chứng đạo ${ascended} · câu hỏi TB ${(quizTotal / N).toFixed(1)} (đúng ${((quizCorrect / Math.max(1, quizTotal)) * 100).toFixed(0)}%)`);
  console.log(REALMS.map((x, i) => `${x.name}: ${((realms[i] / N) * 100).toFixed(1)}%`).join(" | "));
  console.log(Object.entries(endings).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k} ${((v / N) * 100).toFixed(1)}%`).join("\n"));
}
