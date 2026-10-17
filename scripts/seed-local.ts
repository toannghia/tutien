// Tạo dữ liệu mẫu cho bản đồ — CHỈ dùng với server local: npx tsx scripts/seed-local.ts [số người]
// Mô phỏng người chơi khá: trả lời đúng ~70% câu khảo hạch, nhận lời vào tông môn, đột phá khi thể trạng tốt.
import { BANKS } from "../src/game/quiz";

const BASE = "http://localhost:8787";
const N = Number(process.argv[2] ?? 20);
const ALL = Object.values(BANKS).flat();

for (let i = 0; i < N; i++) {
  const jar = new Map<string, string>();
  const req = async (path: string, body?: unknown) => {
    const r = await fetch(BASE + path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", Origin: BASE, Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const c of r.headers.getSetCookie()) {
      const [kv] = c.split(";");
      const j = kv.indexOf("=");
      jar.set(kv.slice(0, j), kv.slice(j + 1));
    }
    return r.json();
  };
  await req("/api/auth/sign-in/anonymous", {});
  for (let k = 0; k < 2; k++) {
    let run = await req("/api/game/runs", {});
    while (run.pending) {
      const p = run.pending;
      let pick: string;
      if (p.kind === "breakthrough") pick = run.health < 60 ? "wait" : (p.options.find((o: { id: string }) => o.id === "aid")?.id ?? "attempt");
      else if (p.kind === "path") pick = p.options[Math.floor(Math.random() * p.options.length)].id;
      else if (p.kind === "quiz") {
        const q = ALL.find((x) => `quiz:${x.id}` === p.eventId)!;
        pick = Math.random() < 0.7 ? q.answer : p.options[Math.floor(Math.random() * (p.options.length - 1))].id;
      } else if (p.eventId === "sect_invite") pick = "join";
      else pick = p.options[Math.floor(Math.random() * p.options.length)].id;
      run = await req(`/api/game/runs/${run.id}/choices`, { step: run.step, eventId: p.eventId, choiceId: pick });
    }
  }
  process.stdout.write(".");
}
console.log(" xong");
