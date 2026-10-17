// Phòng ghép cặp toàn cục. Mỗi người chơi giữ một WebSocket trong lúc chờ.
// Ghép người gần điểm nhất; biên độ nới rộng dần; chờ quá lâu thì ghép với tu sĩ "ẩn danh" (bot).
import { DurableObject } from "cloudflare:workers";
import type { Env } from "../auth";
import { botWaitMs, makeBot, ratingWindow, type Fighter } from "./logic";

type Ticket = Fighter & { joinedAt: number; botAt: number; done?: boolean };

const OPEN = 1;

export class Matchmaker extends DurableObject<Env> {
  async fetch(req: Request): Promise<Response> {
    const me = JSON.parse(req.headers.get("X-Fighter") ?? "null") as Fighter | null;
    if (!me || req.headers.get("Upgrade") !== "websocket") return new Response("Bad request", { status: 400 });

    // Một người chỉ giữ một vé: vào lại thì đóng vé cũ
    for (const { ws, t } of this.tickets()) if (t.id === me.id) this.retire(ws, t, 4001, "Vé cũ đã được thay");

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const now = Date.now();
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ ...me, joinedAt: now, botAt: now + botWaitMs() } satisfies Ticket);
    server.send(JSON.stringify({ type: "queued", waiting: this.tickets().length }));

    await this.tryMatch();
    await this.schedule();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, msg: string | ArrayBuffer) {
    if (typeof msg === "string" && JSON.parse(msg)?.type === "cancel") this.retire(ws, ws.deserializeAttachment() as Ticket, 1000, "Huỷ tìm trận");
  }

  async webSocketClose(ws: WebSocket, code: number) {
    // Client đóng: không cần làm gì thêm, vé sẽ bị bỏ qua vì socket không còn mở
    try {
      ws.close(code === 1005 ? 1000 : code, "bye");
    } catch {}
  }

  async alarm() {
    await this.tryMatch();
    const now = Date.now();
    for (const { ws, t } of this.tickets()) if (t.botAt <= now) await this.startRoom([{ ws, t }], makeBot(t));
    await this.schedule();
  }

  // ----------------------------------------------------------------

  private tickets() {
    return this.ctx
      .getWebSockets()
      .filter((ws) => ws.readyState === OPEN)
      .map((ws) => ({ ws, t: ws.deserializeAttachment() as Ticket }))
      .filter(({ t }) => t && !t.done)
      .sort((a, b) => a.t.joinedAt - b.t.joinedAt);
  }

  private retire(ws: WebSocket, t: Ticket, code: number, reason: string) {
    ws.serializeAttachment({ ...t, done: true });
    try {
      ws.close(code, reason);
    } catch {}
  }

  private async tryMatch() {
    const now = Date.now();
    const list = this.tickets();
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

  private async startRoom(humans: { ws: WebSocket; t: Ticket }[], bot?: Fighter) {
    const fighters: Fighter[] = humans.map(({ t }) => ({ id: t.id, name: t.name, rating: t.rating, realm: t.realm, path: t.path, guest: t.guest, bot: false }));
    if (bot) fighters.push(bot); // bot luôn ở vị trí thứ hai
    for (const h of humans) h.ws.serializeAttachment({ ...h.t, done: true });

    const id = this.env.DUEL_ROOM.newUniqueId();
    await this.env.DUEL_ROOM.get(id).fetch("https://room/init", { method: "POST", body: JSON.stringify({ roomId: id.toString(), fighters }) });
    for (const h of humans) {
      try {
        h.ws.send(JSON.stringify({ type: "matched", roomId: id.toString() }));
        h.ws.close(1000, "matched");
      } catch {}
    }
  }

  private async schedule() {
    const list = this.tickets();
    if (!list.length) return this.ctx.storage.deleteAlarm();
    const nextBot = Math.min(...list.map(({ t }) => t.botAt));
    // Thử ghép lại mỗi 2s để biên độ điểm kịp nới rộng
    await this.ctx.storage.setAlarm(Math.min(nextBot, Date.now() + 2000));
  }
}
