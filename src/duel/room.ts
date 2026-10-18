// Một trận luận đạo: 5 câu, mỗi câu 15 giây, hai người cùng trả lời một đề.
// Máy chủ giữ đáp án, đồng hồ và điểm; client chỉ gửi lựa chọn. Bot (nếu có) trả lời theo lịch do máy chủ lập.
import { DurableObject } from "cloudflare:workers";
import type { Env } from "../auth";
import { BANKS, type Question } from "../game/quiz";
import { currentBanks } from "../quiz-store";
import { botAnswer, DUEL, DUEL_DEFAULTS, eloDelta, pickDuelQuestions, points, shuffled, winnerOf, type DuelConfig, type Fighter } from "./logic";

type Answer = { choiceId: string | null; ok: boolean; ms: number; points: number };
type Player = Fighter & { connected: boolean; answers: (Answer | null)[]; score: number; correct: number; delta: number; newRating: number | null };
type Phase = "waiting" | "countdown" | "question" | "reveal" | "done" | "cancelled";
type Room = {
  roomId: string;
  players: Player[];
  qids: string[];
  orders: string[][]; // thứ tự phương án hiển thị của từng câu
  phase: Phase;
  index: number;
  startedAt: number; // lúc câu hiện tại bắt đầu
  endsAt: number; // hết phase hiện tại
  botPlan: { at: number; choiceId: string | null; ms: number } | null;
  createdAt: number;
  friendly?: boolean; // trận mời bạn: giao hữu, không tính Đạo vị
  cfg?: DuelConfig;
  questions?: Question[]; // lưu nguyên câu hỏi: admin sửa ngân hàng giữa trận không ảnh hưởng
};

const ALL = new Map(Object.values(BANKS).flat().map((q) => [q.id, q] as const));
const GRACE_MS = 800; // bù trễ mạng khi nhận câu trả lời sát giờ

export class DuelRoom extends DurableObject<Env> {
  private room: Room | null = null;
  private get cfg(): DuelConfig {
    return { ...DUEL_DEFAULTS, ...(this.room?.cfg ?? {}) };
  }

  private async load() {
    this.room ??= (await this.ctx.storage.get<Room>("room")) ?? null;
    return this.room;
  }

  private async save() {
    await this.ctx.storage.put("room", this.room!);
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/init" && req.method === "POST") return this.init(await req.json());

    const room = await this.load();
    const userId = req.headers.get("X-User-Id");
    const idx = room?.players.findIndex((p) => p.id === userId && !p.bot) ?? -1;
    if (!room || idx < 0) return new Response("Không thuộc trận này", { status: 403 });
    if (req.headers.get("Upgrade") !== "websocket") return new Response("Cần WebSocket", { status: 426 });

    // Vào lại (rớt mạng): đóng kết nối cũ của chính người đó
    for (const ws of this.ctx.getWebSockets(String(idx))) {
      try {
        ws.close(4001, "replaced");
      } catch {}
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [String(idx)]);
    room.players[idx].connected = true;
    server.send(JSON.stringify(this.snapshot(idx)));
    this.sendTo(1 - idx, { type: "opp_status", connected: true });

    if (room.phase === "waiting" && room.players.every((p) => p.bot || p.connected)) await this.startCountdown();
    else if (room.phase === "question") server.send(JSON.stringify(this.questionMsg()));
    await this.save();
    return new Response(null, { status: 101, webSocket: client });
  }

  private async init({ roomId, fighters, friendly = false, cfg = DUEL_DEFAULTS }: { roomId: string; fighters: Fighter[]; friendly?: boolean; cfg?: DuelConfig }) {
    const { banks } = await currentBanks(this.env.DB);
    const qs = pickDuelQuestions(Math.random, cfg.questions, Object.values(banks).flat());
    const now = Date.now();
    this.room = {
      roomId,
      players: fighters.map((f) => ({ ...f, connected: false, answers: qs.map(() => null), score: 0, correct: 0, delta: 0, newRating: null })),
      qids: qs.map((q) => q.id),
      orders: qs.map((q) => shuffled(q.options.map((o) => o.id))),
      phase: "waiting",
      index: -1,
      startedAt: 0,
      endsAt: now + DUEL.connectGraceMs,
      botPlan: null,
      createdAt: now,
      friendly,
      cfg,
      questions: qs,
    };
    await this.save();
    await this.ctx.storage.setAlarm(this.room.endsAt);
    return new Response("ok");
  }

  // ---------------------------------------------------------------- tin nhắn từ client

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const room = await this.load();
    if (!room || typeof raw !== "string") return;
    const idx = Number(this.ctx.getTags(ws)[0]);
    let msg: { type?: string; index?: number; choiceId?: string };
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.type === "ping") return ws.send(JSON.stringify({ type: "pong", now: Date.now() }));
    if (msg.type !== "answer" || room.phase !== "question" || msg.index !== room.index) return;
    const me = room.players[idx];
    if (me.answers[room.index]) return; // mỗi câu chỉ trả lời một lần
    const ms = Date.now() - room.startedAt;
    if (ms > this.cfg.answerMs + GRACE_MS) return;
    this.record(idx, msg.choiceId ?? null, Math.min(ms, this.cfg.answerMs));
    await this.afterAnswer();
  }

  async webSocketClose(ws: WebSocket) {
    const room = await this.load();
    if (!room) return;
    const idx = Number(this.ctx.getTags(ws)[0]);
    // Chỉ coi là rời trận nếu không còn kết nối nào khác của người đó
    const stillHere = this.ctx.getWebSockets(String(idx)).some((w) => w !== ws && w.readyState === 1);
    if (stillHere) return;
    room.players[idx].connected = false;
    this.sendTo(1 - idx, { type: "opp_status", connected: false });
    // Không còn người thật nào trong phòng → kết thúc ngay (các câu còn lại tính hết giờ)
    if (!["done", "cancelled"].includes(room.phase) && room.players.every((p) => p.bot || !p.connected)) {
      if (room.phase === "waiting") room.phase = "cancelled";
      else await this.finish();
    }
    await this.save();
  }

  // ---------------------------------------------------------------- đồng hồ

  async alarm() {
    const room = await this.load();
    if (!room) return;
    const now = Date.now();
    switch (room.phase) {
      case "waiting":
        // Có người không vào phòng: huỷ trận, không tính điểm
        room.phase = "cancelled";
        this.broadcast({ type: "cancelled", reason: "Đối thủ không vào trận." });
        break;
      case "countdown":
        this.startQuestion(0);
        break;
      case "question": {
        const bot = room.players.findIndex((p) => p.bot);
        if (bot >= 0 && room.botPlan && room.botPlan.at <= now && !room.players[bot].answers[room.index]) {
          this.record(bot, room.botPlan.choiceId, room.botPlan.ms);
          room.botPlan = null;
          await this.afterAnswer();
          return;
        }
        if (now >= room.endsAt + GRACE_MS) this.reveal();
        break;
      }
      case "reveal":
        if (room.index + 1 < room.qids.length) this.startQuestion(room.index + 1);
        else await this.finish();
        break;
    }
    await this.save();
    await this.reschedule();
  }

  private async reschedule() {
    const room = this.room!;
    if (["done", "cancelled"].includes(room.phase)) return this.ctx.storage.deleteAlarm();
    let at = room.phase === "question" ? room.endsAt + GRACE_MS : room.endsAt;
    if (room.phase === "question" && room.botPlan) at = Math.min(at, room.botPlan.at);
    await this.ctx.storage.setAlarm(at);
  }

  // ---------------------------------------------------------------- tiến trình trận

  private async startCountdown() {
    const room = this.room!;
    room.phase = "countdown";
    room.endsAt = Date.now() + DUEL.countdownMs;
    this.broadcast({ type: "countdown", endsAt: room.endsAt, now: Date.now() });
    await this.reschedule();
  }

  private startQuestion(i: number) {
    const room = this.room!;
    const now = Date.now();
    room.phase = "question";
    room.index = i;
    room.startedAt = now;
    room.endsAt = now + this.cfg.answerMs;
    const bot = room.players.find((p) => p.bot);
    if (bot) {
      const a = botAnswer(question(room, i), bot.rating, Math.random, this.cfg.answerMs);
      room.botPlan = { at: now + a.ms, choiceId: a.choiceId, ms: a.ms };
    }
    this.broadcast(this.questionMsg());
  }

  private questionMsg() {
    const room = this.room!;
    const q = question(room, room.index);
    return {
      type: "question",
      index: room.index,
      total: room.qids.length,
      prompt: q.prompt,
      level: q.level,
      options: room.orders[room.index].map((id) => ({ id, text: q.options.find((o) => o.id === id)!.text })),
      endsAt: room.endsAt,
      now: Date.now(),
      answered: room.players.map((p) => !!p.answers[room.index]),
    };
  }

  private record(idx: number, choiceId: string | null, ms: number) {
    const room = this.room!;
    const q = question(room, room.index);
    const valid = choiceId !== null && q.options.some((o) => o.id === choiceId);
    const ok = valid && choiceId === q.answer;
    const pts = points(ok, ms, this.cfg.answerMs);
    room.players[idx].answers[room.index] = { choiceId: valid ? choiceId : null, ok, ms, points: pts };
    room.players[idx].score += pts;
    if (ok) room.players[idx].correct++;
    // Người kia chỉ biết là đã trả lời, không biết đúng sai
    this.sendTo(1 - idx, { type: "opp_answered", index: room.index });
    this.sendTo(idx, { type: "you_answered", index: room.index });
  }

  private async afterAnswer() {
    const room = this.room!;
    if (room.players.every((p) => p.answers[room.index])) this.reveal();
    await this.save();
    await this.reschedule();
  }

  private reveal() {
    const room = this.room!;
    const q = question(room, room.index);
    for (const p of room.players) if (!p.answers[room.index]) p.answers[room.index] = { choiceId: null, ok: false, ms: this.cfg.answerMs, points: 0 };
    room.phase = "reveal";
    room.botPlan = null;
    room.endsAt = Date.now() + DUEL.revealMs;
    room.players.forEach((_, idx) => {
      const me = room.players[idx];
      const opp = room.players[1 - idx];
      this.sendTo(idx, {
        type: "reveal",
        index: room.index,
        answer: q.answer,
        explain: q.explain,
        you: me.answers[room.index],
        opp: { ok: opp.answers[room.index]!.ok, points: opp.answers[room.index]!.points, choiceId: opp.answers[room.index]!.choiceId },
        scores: [me.score, opp.score],
        endsAt: room.endsAt,
        last: room.index + 1 >= room.qids.length,
      });
    });
  }

  private async finish() {
    const room = this.room!;
    // Câu chưa tới lượt (người chơi bỏ đi giữa chừng) tính là hết giờ
    for (const p of room.players) p.answers = p.answers.map((a) => a ?? { choiceId: null, ok: false, ms: this.cfg.answerMs, points: 0 });
    room.phase = "done";
    const [a, b] = room.players;
    const winner = winnerOf(a.score, b.score);
    const scoreA = winner === "a" ? 1 : winner === "draw" ? 0.5 : 0;
    // Chỉ tài khoản đã đăng ký mới có Đạo vị. Khách và bot không bị lưu điểm.
    const ranked = (p: Player) => !room.friendly && !p.bot && !p.guest;
    a.delta = ranked(a) ? eloDelta(a.rating, b.rating, scoreA, this.cfg.k) : 0;
    b.delta = ranked(b) ? eloDelta(b.rating, a.rating, 1 - scoreA, this.cfg.k) : 0;

    const db = this.env.DB;
    const now = Date.now();
    const stmts: D1PreparedStatement[] = [
      db
        .prepare(
          `INSERT INTO duels (id, player_a, player_b, a_name, b_name, b_bot, a_score, b_score, winner, a_delta, b_delta, a_correct, b_correct, questions_json, created_at, kind)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`,
        )
        .bind(room.roomId, a.id, b.bot ? null : b.id, a.name, b.name, b.bot ? 1 : 0, a.score, b.score, winner, a.delta, b.delta, a.correct, b.correct, JSON.stringify(room.qids), now, room.friendly ? "friendly" : b.bot ? "bot" : "ranked"),
    ];
    for (const [p, res] of [
      [a, scoreA],
      [b, 1 - scoreA],
    ] as const) {
      if (!ranked(p)) continue;
      stmts.push(
        db
          .prepare(
            `INSERT INTO ratings (user_id, rating, best_rating, wins, losses, draws, updated_at)
             VALUES (?1, ${DUEL.baseRating} + ?2, MAX(${DUEL.baseRating}, ${DUEL.baseRating} + ?2), ?3, ?4, ?5, ?6)
             ON CONFLICT(user_id) DO UPDATE SET
               rating = ratings.rating + ?2,
               best_rating = MAX(ratings.best_rating, ratings.rating + ?2),
               wins = ratings.wins + ?3, losses = ratings.losses + ?4, draws = ratings.draws + ?5, updated_at = ?6`,
          )
          .bind(p.id, p.delta, res === 1 ? 1 : 0, res === 0 ? 1 : 0, res === 0.5 ? 1 : 0, now),
      );
    }
    await db.batch(stmts);
    for (const p of room.players) if (ranked(p)) p.newRating = p.rating + p.delta;

    room.players.forEach((me, idx) => {
      const opp = room.players[1 - idx];
      const mine = idx === 0 ? "a" : "b";
      this.sendTo(idx, {
        type: "end",
        result: winner === "draw" ? "draw" : winner === mine ? "win" : "lose",
        scores: [me.score, opp.score],
        correct: [me.correct, opp.correct],
        delta: me.delta,
        rating: me.newRating,
        ranked: ranked(me),
        friendly: !!room.friendly,
      });
    });
    await this.save();
  }

  // ---------------------------------------------------------------- gửi tin

  private snapshot(idx: number) {
    const room = this.room!;
    const label = this.cfg.botLabel || this.env.DUEL_BOT_LABEL === "1";
    const pub = (p: Player) => ({ name: p.name, rating: p.rating, realm: p.realm, path: p.path, guest: p.guest, bot: label ? p.bot : false, connected: p.bot || p.connected });
    return {
      type: "state",
      friendly: !!room.friendly,
      phase: room.phase,
      index: room.index,
      total: room.qids.length,
      you: pub(room.players[idx]),
      opp: pub(room.players[1 - idx]),
      scores: [room.players[idx].score, room.players[1 - idx].score],
      endsAt: room.endsAt,
      now: Date.now(),
    };
  }

  private sendTo(idx: number, msg: unknown) {
    const text = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets(String(idx))) {
      try {
        ws.send(text);
      } catch {}
    }
  }

  private broadcast(msg: unknown) {
    const text = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(text);
      } catch {}
    }
  }
}

function question(room: Room, i: number): Question {
  return room.questions?.[i] ?? ALL.get(room.qids[i])!;
}

