// Phòng ghép cặp toàn cục. Mỗi người chơi giữ một WebSocket trong lúc chờ.
// Ba chế độ:
//  - queue: ghép người gần điểm nhất; biên độ nới rộng dần; chờ quá lâu thì ghép với tu sĩ "ẩn danh" (bot)
//  - host:  tạo phòng mời bạn, nhận mã 5 ký tự; chờ đúng người có mã vào (không bao giờ ghép bot)
//  - join:  vào phòng của bạn bằng mã → trận giao hữu (không tính Đạo vị)
import { DurableObject } from "cloudflare:workers";
import type { Env } from "../auth";
import { botWaitMs, makeBot, newRoomCode, normalizeCode, ratingWindow, ROOM_CODE_TTL_MS, type Fighter } from "./logic";

type Mode = "queue" | "host";
type Ticket = Fighter & { mode: Mode; joinedAt: number; botAt: number; code?: string; expiresAt?: number; done?: boolean };

const OPEN = 1;

export class Matchmaker extends DurableObject<Env> {
  async fetch(req: Request): Promise<Response> {
    const me = JSON.parse(req.headers.get("X-Fighter") ?? "null") as Fighter | null;
    if (!me || req.headers.get("Upgrade") !== "websocket") return new Response("Bad request", { status: 400 });
    const mode = (req.headers.get("X-Mode") ?? "queue") as Mode | "join";

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const now = Date.now();
    this.ctx.acceptWebSocket(server);

    if (mode === "join") {
      // Vào phòng bạn mời: không giữ vé, ghép ngay hoặc báo lỗi
      const code = normalizeCode(req.headers.get("X-Code") ?? "");
      const host = this.tickets("host").find(({ t }) => t.code === code);
      server.serializeAttachment({ ...me, mode: "queue", joinedAt: now, botAt: Infinity, done: true } satisfies Ticket);
      // Tra mã TRƯỚC khi đóng vé cũ, để tự nhập mã phòng mình không làm mất phòng
      if (!host) this.fail(server, "Mã phòng không tồn tại hoặc đã hết hạn.");
      else if (host.t.id === me.id) this.fail(server, "Đây là phòng của chính ngươi — hãy gửi mã cho bạn.");
      else {
        this.retireOthers(me.id);
        await this.startRoom([host, { ws: server, t: { ...me, mode: "queue", joinedAt: now, botAt: Infinity } }], undefined, true);
      }
      return new Response(null, { status: 101, webSocket: client });
    }

    // Một người chỉ giữ một vé: vào lại thì đóng vé cũ
    this.retireOthers(me.id, server);

    if (mode === "host") {
      const taken = new Set(this.tickets("host").map(({ t }) => t.code));
      let code = newRoomCode();
      while (taken.has(code)) code = newRoomCode();
      const expiresAt = now + ROOM_CODE_TTL_MS;
      server.serializeAttachment({ ...me, mode: "host", code, expiresAt, joinedAt: now, botAt: Infinity } satisfies Ticket);
      server.send(JSON.stringify({ type: "hosting", code, expiresAt, now }));
    } else {
      server.serializeAttachment({ ...me, mode: "queue", joinedAt: now, botAt: now + botWaitMs() } satisfies Ticket);
      server.send(JSON.stringify({ type: "queued", waiting: this.tickets("queue").length }));
      await this.tryMatch();
    }
    await this.schedule();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, msg: string | ArrayBuffer) {
    if (typeof msg === "string" && JSON.parse(msg)?.type === "cancel") this.retire(ws, ws.deserializeAttachment() as Ticket, 1000, "Huỷ");
  }

  async webSocketClose(ws: WebSocket, code: number) {
    // Client đóng: vé tự bị bỏ qua vì socket không còn mở (phòng mời cũng mất mã theo)
    try {
      ws.close(code === 1005 ? 1000 : code, "bye");
    } catch {}
  }

  async alarm() {
    await this.tryMatch();
    const now = Date.now();
    for (const { ws, t } of this.tickets("queue")) if (t.botAt <= now) await this.startRoom([{ ws, t }], makeBot(t));
    for (const { ws, t } of this.tickets("host")) {
      if ((t.expiresAt ?? 0) > now) continue;
      try {
        ws.send(JSON.stringify({ type: "expired", reason: "Mã phòng đã hết hạn sau 10 phút." }));
      } catch {}
      this.retire(ws, t, 1000, "expired");
    }
    await this.schedule();
  }

  // ----------------------------------------------------------------

  private tickets(mode?: Mode) {
    return this.ctx
      .getWebSockets()
      .filter((ws) => ws.readyState === OPEN)
      .map((ws) => ({ ws, t: ws.deserializeAttachment() as Ticket }))
      .filter(({ t }) => t && !t.done && (!mode || t.mode === mode))
      .sort((a, b) => a.t.joinedAt - b.t.joinedAt);
  }

  private retireOthers(userId: string, keep?: WebSocket) {
    for (const { ws, t } of this.tickets()) if (t.id === userId && ws !== keep) this.retire(ws, t, 4001, "Vé cũ đã được thay");
  }

  private retire(ws: WebSocket, t: Ticket, code: number, reason: string) {
    ws.serializeAttachment({ ...t, done: true });
    try {
      ws.close(code, reason);
    } catch {}
  }

  private fail(ws: WebSocket, reason: string) {
    try {
      ws.send(JSON.stringify({ type: "error", reason }));
      ws.close(1000, "error");
    } catch {}
  }

  private async tryMatch() {
    const now = Date.now();
    const list = this.tickets("queue");
    const taken = new Set<number>();
    for (let i = 0; i < list.length; i++) {
      if (taken.has(i)) continue;
      for (let j = i + 1; j < list.length; j++) {
        if (taken.has(j)) continue;
        const a = list[i].t;
        const b = list[j].t;
        if (a.id === b.id) continue;
        const window = Math.max(ratingWindow(now - a.joinedAt), ratingWindow(now - b.joinedAt));
        if (Math.abs(a.rating - b.rating) > window) continue;
        taken.add(i).add(j);
        await this.startRoom([list[i], list[j]]);
        break;
      }
    }
  }

  private async startRoom(humans: { ws: WebSocket; t: Ticket }[], bot?: Fighter, friendly = false) {
    const fighters: Fighter[] = humans.map(({ t }) => ({ id: t.id, name: t.name, rating: t.rating, realm: t.realm, path: t.path, guest: t.guest, bot: false }));
    if (bot) fighters.push(bot); // bot luôn ở vị trí thứ hai
    for (const h of humans) h.ws.serializeAttachment({ ...h.t, done: true });

    const id = this.env.DUEL_ROOM.newUniqueId();
    await this.env.DUEL_ROOM.get(id).fetch("https://room/init", { method: "POST", body: JSON.stringify({ roomId: id.toString(), fighters, friendly }) });
    for (const h of humans) {
      try {
        h.ws.send(JSON.stringify({ type: "matched", roomId: id.toString(), friendly }));
        h.ws.close(1000, "matched");
      } catch {}
    }
  }

  private async schedule() {
    const queue = this.tickets("queue");
    const hosts = this.tickets("host");
    if (!queue.length && !hosts.length) return this.ctx.storage.deleteAlarm();
    const times = [...queue.map(({ t }) => t.botAt), ...hosts.map(({ t }) => t.expiresAt ?? Infinity)];
    // Hàng chờ thường: thử ghép lại mỗi 2s để biên độ điểm kịp nới rộng
    if (queue.length) times.push(Date.now() + 2000);
    await this.ctx.storage.setAlarm(Math.min(...times));
  }
}
