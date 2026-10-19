// Đo thời gian CPU của engine: replay toàn bộ một kiếp ở bước cuối (đúng việc máy chủ làm mỗi lần người chơi chọn).
import { createProfile, GAME_DEFAULTS, replay, type ChoiceInput } from "../src/game/engine";
const N = Number(process.argv[2] ?? 300);
const times: number[] = [], steps: number[] = [], facts: number[] = [];
let r = 7;
const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
for (let i = 1; i <= N; i++) {
  const seed = i * 104729;
  const p = createProfile(seed, 0, { ...GAME_DEFAULTS, realmCurve: 0.7 });
  p.karma = { v: 0, s: 0, insight: 0, pastBest: 0 };
  const ch: ChoiceInput[] = [];
  let s = replay(seed, p, ch);
  while (s.pending) {
    const o = s.pending.options.filter((x) => x.id !== "skip");
    ch.push({ eventId: s.pending.eventId, choiceId: (s.pending.kind === "breakthrough" ? o.find((x) => x.id === "aid") ?? o[0] : o[Math.floor(rnd() * o.length)]).id });
    s = replay(seed, p, ch);
  }
  // đo lần replay cuối (dài nhất)
  const t0 = performance.now();
  for (let k = 0; k < 5; k++) replay(seed, p, ch);
  times.push((performance.now() - t0) / 5);
  steps.push(ch.length); facts.push(s.facts.length);
}
const q = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.floor(p * (a.length - 1))];
console.log(`replay cả kiếp: trung vị ${q(times, 0.5).toFixed(2)}ms · p95 ${q(times, 0.95).toFixed(2)}ms · max ${Math.max(...times).toFixed(2)}ms`);
console.log(`số lựa chọn: trung vị ${q(steps, 0.5)} · p95 ${q(steps, 0.95)} · max ${Math.max(...steps)} | số mốc: trung vị ${q(facts, 0.5)} · max ${Math.max(...facts)}`);
const json = JSON.stringify(replay(1 * 104729, createProfile(104729, 0), []));
console.log(`kích thước JSON trạng thái (đầu kiếp): ${json.length} byte`);
