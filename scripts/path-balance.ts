// So sánh các đạo đồ: mỗi đạo đồ chơi cùng một bộ seed, đáp đúng hết khảo hạch.
// npx tsx scripts/path-balance.ts [số kiếp] [an toàn|liều]
import { createProfile, GAME_DEFAULTS, replay, type ChoiceInput } from "../src/game/engine";
import { BANKS } from "../src/game/quiz";
import { PATHS } from "../src/game/data";

const N = Number(process.argv[2] ?? 800);
const style = process.argv[3] ?? "an toàn";
const ALL = Object.values(BANKS).flat();
const answer = (eventId: string) => ALL.find((q) => `quiz:${q.id}` === eventId)?.answer;
const curve = Number(process.env.CURVE ?? 0.7);
for (const path of PATHS.map((p) => p.id)) {
  let realmSum = 0, high = 0, luckSum = 0, deaths = 0, ageSum = 0, top = 0;
  for (let i = 1; i <= N; i++) {
    const seed = i * 7919;
    const p = createProfile(seed, 0, { ...GAME_DEFAULTS, realmCurve: curve });
    p.karma = { v: 0, s: 0, insight: 0, pastBest: 0 };
    const ch: ChoiceInput[] = [];
    let s = replay(seed, p, ch);
    let r = i;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    while (s.pending) {
      const pd = s.pending;
      let id: string;
      if (pd.kind === "path") id = path;
      else if (pd.kind === "quiz") id = answer(pd.eventId) ?? pd.options[0].id;
      else if (pd.kind === "breakthrough") id = s.health < 70 ? "wait" : pd.options.find((o) => o.id === "aid")?.id ?? "attempt";
      else id = style === "liều" ? pd.options[0].id : pd.options[pd.options.length - 1].id;
      ch.push({ eventId: pd.eventId, choiceId: id });
      s = replay(seed, p, ch);
    }
    realmSum += s.realm; luckSum += s.luck; ageSum += s.age;
    if (s.realm >= 9) high++;
    if (s.realm >= 12) top++;
    if (s.endingReason !== "Thọ nguyên cạn kiệt") deaths++;
  }
  console.log(`${path.padEnd(8)} cảnh giới TB ${(realmSum / N).toFixed(2)} · ≥Chân Tiên ${((high / N) * 100).toFixed(1)}% · ≥Tiên Vương ${((top / N) * 100).toFixed(1)}% · khí vận cuối TB ${(luckSum / N).toFixed(0)} · chết bất đắc kỳ tử ${((deaths / N) * 100).toFixed(0)}% · tuổi TB ${Math.round(ageSum / N)}`);
}
