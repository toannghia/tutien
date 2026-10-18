// Cân bằng nhân quả: mô phỏng chuỗi kiếp liên tiếp, so cảnh giới trung bình kiếp 1 với các kiếp sau.
// npx tsx scripts/karma-balance.ts [số chuỗi] [số kiếp mỗi chuỗi]
import { createProfile, replay, type ChoiceInput } from "../src/game/engine";
import { computeKarma } from "../src/karma";

const CHAINS = Number(process.argv[2] ?? 150), LIVES = Number(process.argv[3] ?? 6);
const policies: Record<string, string[]> = {
  "thiện": ["claim", "bond", "atone", "release", "save", "slay", "give", "destroy", "fair", "suppress", "aid", "attempt"],
  "ác": ["claim", "bond", "fight", "rob", "practice", "frame", "embrace", "ignore", "pass", "aid", "attempt"],
};
for (const [name, prefer] of Object.entries(policies)) {
  const sum = new Array(LIVES).fill(0), sumAge = new Array(LIVES).fill(0);
  let rr = 99;
  const rnd = () => ((rr = (rr * 16807) % 2147483647) / 2147483647);
  for (let ch = 0; ch < CHAINS; ch++) {
    const past: any[] = [];
    let legacy: any = null;
    for (let i = 0; i < LIVES; i++) {
      const seed = (ch * 7919 + i * 104729 + 1) >>> 0;
      const p = createProfile(seed, 0);
      p.karma = computeKarma(past, legacy);
      const choices: ChoiceInput[] = [];
      let s = replay(seed, p, choices);
      for (let k = 0; k < 4000 && s.pending; k++) {
        const opts = s.pending.options.filter((o) => o.id !== "skip");
        const pick = s.pending.kind === "quiz" ? opts[Math.floor(rnd() * opts.length)] : prefer.map((id) => opts.find((o) => o.id === id)).find(Boolean) ?? opts[Math.floor(rnd() * opts.length)];
        choices.push({ eventId: s.pending.eventId, choiceId: pick.id });
        s = replay(seed, p, choices);
      }
      sum[i] += s.realm; sumAge[i] += s.age;
      if (s.flags.includes("legacy_claimed")) legacy = null;
      if (s.realm >= 3) legacy = { id: `l${i}`, name: p.name, realm: s.realm, res: Math.max(40 * s.realm, Math.round(s.resources * 0.5)), world: p.world, ascended: s.ascended };
      past.unshift({ id: `r${i}`, number: i + 1, seed, status: "finished", best_realm: s.realm, ending_reason: s.endingReason, profile_json: JSON.stringify(p), karma_json: JSON.stringify({ v: s.karma.virtue, s: s.karma.sin, partner: s.partner, res: s.resources, realm: s.realm }) });
    }
  }
  console.log(`${name}: cảnh giới TB theo kiếp`, sum.map((x) => (x / CHAINS).toFixed(2)).join(" → "), "| tuổi TB", sumAge.map((x) => Math.round(x / CHAINS)).join(" → "));
}
