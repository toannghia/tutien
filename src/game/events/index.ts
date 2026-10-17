import { CULTIVATION_EVENTS } from "./cultivation";
import { DISASTER_EVENTS } from "./disasters";
import { MORTAL_EVENTS } from "./mortal";
import { RELATION_EVENTS } from "./relations";
import type { GameEvent } from "../types";

export const EVENTS: GameEvent[] = [...MORTAL_EVENTS, ...CULTIVATION_EVENTS, ...RELATION_EVENTS, ...DISASTER_EVENTS];

// Phát hiện sớm id trùng khi thêm nội dung
const seen = new Set<string>();
for (const e of EVENTS) {
  if (seen.has(e.id)) throw new Error(`Trùng id sự kiện: ${e.id}`);
  seen.add(e.id);
}
