/** Every body a bot can wear: the gradient catalog plus the festival bodies. */

import { z } from "zod";

import { BOT_ICON_SHAPES, DEFAULT_BOT_ICON_SHAPE, botIconShapeSchema, type BotIconShape } from "./bot-icons.ts";
import { MASCOT_BODY_IDS, mascotBodySchema, type MascotBodyId } from "./mascot-bodies.ts";
import { CARVED_BODY_IDS, DIWALI_BODY_IDS, HALLOWEEN_BODY_IDS, type CarvedBodyId } from "./carved-bodies.ts";
import type { MausColor } from "./wire.ts";

/** Every body a bot can wear: the icon silhouettes, the old gradient bodies and the festival bodies. */
export type BotBodyId = MascotBodyId | CarvedBodyId | BotIconShape;

export const BOT_BODY_IDS: readonly BotBodyId[] = [
  ...new Set<BotBodyId>([...MASCOT_BODY_IDS, ...CARVED_BODY_IDS, ...BOT_ICON_SHAPES]),
];

export const botBodySchema = z.union([mascotBodySchema, z.enum(CARVED_BODY_IDS), botIconShapeSchema]);

/** Runtime-safe read of an untrusted persisted or streamed body id. */
export function botBodyId(value: unknown): BotBodyId {
  return botBodySchema.safeParse(value).data ?? DEFAULT_BOT_ICON_SHAPE;
}

export function isCarvedBody(value: unknown): value is CarvedBodyId {
  return (CARVED_BODY_IDS as readonly unknown[]).includes(value);
}

export type CostumeColor = Exclude<MausColor, "silver" | "chrome">;

/** A festival skin's own bodies, and the costume each bot colour wears while "Dress my bots up" is on with it. */
const festival = <Id extends CarvedBodyId>(bodies: readonly Id[], costumes: Record<CostumeColor, NoInfer<Id>>) => ({ bodies, costumes });

/** Keyed by the skin id that turns each festival on. */
export const FESTIVALS = {
  halloween: festival(HALLOWEEN_BODY_IDS, {
    orange: "pumpkin",
    purple: "ghost",
    teal: "witch",
    red: "bat",
    blue: "cat",
    cyan: "skull",
    green: "monster",
    yellow: "mummy",
    coral: "vampire",
    pink: "spider",
  }),
  diwali: festival(DIWALI_BODY_IDS, {
    orange: "laddu",
    purple: "chakri",
    teal: "karanji",
    red: "rocket",
    blue: "bomb",
    cyan: "chakli",
    green: "anaar",
    yellow: "katli",
    coral: "jalebi",
    pink: "sparkler",
  }),
};

export type FestivalId = keyof typeof FESTIVALS;

export const FESTIVAL_IDS = Object.keys(FESTIVALS) as FestivalId[];

export function isFestival(value: unknown): value is FestivalId {
  return typeof value === "string" && Object.hasOwn(FESTIVALS, value);
}
