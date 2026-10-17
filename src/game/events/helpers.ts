import type { Choice, Condition, Effects, GameEvent, Outcome } from "../types";

export const MORTAL: [number, number] = [0, 0];
export const LOW: [number, number] = [1, 3];
export const MID: [number, number] = [4, 8];
export const IMMORTAL: [number, number] = [9, 13];
export const CULTIVATOR: [number, number] = [1, 13];
export const MORTAL_TIER: [number, number] = [1, 8];
export const ANY: [number, number] = [0, 13];

export const o = (id: string, weight: number, text: string, effects: Effects = {}, reason?: string): Outcome => ({
  id, weight, text, effects, reason, risky: !!effects.death,
});

export const c = (id: string, text: string, hint: string, outcomes: Outcome[], cond?: Condition): Choice => ({ id, text, hint, outcomes, cond });

type Opts = Partial<Omit<GameEvent, "id" | "title" | "text" | "realms">>;

export const ev = (id: string, title: string, text: string, realms: [number, number], opts: Opts = {}): GameEvent => ({
  id, title, text, realms, weight: 10, maxPerLife: 1, ...opts,
});
