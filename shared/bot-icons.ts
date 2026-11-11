/**
 * The bot silhouettes the avatars wear.
 *
 * The artwork comes from the local Grok Bot icon pack: each shape ships as a
 * 29-frame animated face strip (black body, eye and mouth cutouts). The picker
 * order is the order below; ids that already existed in the mascot catalog
 * (`star`, `blob`, `diamond`, …) keep their old names so persisted bots keep
 * wearing a shape that reads the same.
 */

import { z } from "zod";

/** Every selectable silhouette, in the order the pickers show them. */
export const BOT_ICON_SHAPES = [
  "star",
  "blob",
  "squircle",
  "capsule",
  "drop",
  "shield",
  "hexagon",
  "diamond",
  "arch",
  "bean",
  "cloud",
  "clover",
  "crystal",
  "cylinder",
  "dome",
  "egg",
  "flower",
  "heart",
  "house",
  "leaf",
  "pebble",
  "pumpkin",
  "sparkle",
  "square",
  "tablet",
  "wedge",
] as const;

export type BotIconShape = (typeof BOT_ICON_SHAPES)[number];

export const botIconShapeSchema = z.enum(BOT_ICON_SHAPES);

/** The pack's signature silhouette, and the fallback for any unknown id. */
export const DEFAULT_BOT_ICON_SHAPE: BotIconShape = "star";

/** Each strip is one row of 29 square frames. */
export const BOT_ICON_FRAMES = 29;

export const BOT_ICON_NAMES: Record<BotIconShape, string> = {
  star: "Star",
  blob: "Blob",
  squircle: "Squircle",
  capsule: "Capsule",
  drop: "Drop",
  shield: "Shield",
  hexagon: "Hexagon",
  diamond: "Diamond",
  arch: "Arch",
  bean: "Bean",
  cloud: "Cloud",
  clover: "Clover",
  crystal: "Crystal",
  cylinder: "Cylinder",
  dome: "Dome",
  egg: "Egg",
  flower: "Flower",
  heart: "Heart",
  house: "House",
  leaf: "Leaf",
  pebble: "Pebble",
  pumpkin: "Pumpkin",
  sparkle: "Sparkle",
  square: "Square",
  tablet: "Tablet",
  wedge: "Wedge",
};

/** The highest-resolution strip worth downloading: large avatars use 4x. */
export type BotIconResolution = 2 | 4;

export function botIconFaceUrl(shape: BotIconShape, resolution: BotIconResolution = 2): string {
  return `/bot-icons/${shape}-face-${resolution === 4 ? 144 : 72}.png`;
}

/** The matching eye/mouth cutout mask, pixel-aligned with the face strip. */
export function botIconHolesUrl(shape: BotIconShape, resolution: BotIconResolution = 2): string {
  return `/bot-icons/${shape}-holes-${resolution === 4 ? 144 : 72}.png`;
}

/** Old mascot and festival ids that should keep their own silhouette. */
const LEGACY_SHAPES: Readonly<Record<string, BotIconShape>> = {
  cursor: "star",
  circle: "pebble",
  gem: "diamond",
  hex: "hexagon",
  teardrop: "drop",
  ghost: "dome",
  witch: "arch",
  bat: "wedge",
  cat: "bean",
  skull: "egg",
  monster: "blob",
  mummy: "cylinder",
  vampire: "crystal",
  spider: "sparkle",
  rocket: "wedge",
  anaar: "pumpkin",
  chakri: "sparkle",
  sparkler: "sparkle",
  bomb: "egg",
  laddu: "pebble",
  chakli: "tablet",
  jalebi: "clover",
  katli: "diamond",
  karanji: "cloud",
};

export function isBotIconShape(value: unknown): value is BotIconShape {
  return typeof value === "string" && (BOT_ICON_SHAPES as readonly string[]).includes(value);
}

/** Runtime-safe read of an untrusted persisted or streamed shape id. */
export function botIconShape(value: unknown): BotIconShape {
  if (isBotIconShape(value)) return value;
  if (typeof value === "string" && Object.hasOwn(LEGACY_SHAPES, value)) return LEGACY_SHAPES[value]!;
  return DEFAULT_BOT_ICON_SHAPE;
}

/** A stable shape for a bot that has not chosen one, so a team is never a wall of identical icons. */
export function botIconShapeForSeed(seed: string): BotIconShape {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 0x01000193);
  }
  return BOT_ICON_SHAPES[(hash >>> 0) % BOT_ICON_SHAPES.length]!;
}

/**
 * The shape a bot actually shows. `cursor` was the old default, so a bot still
 * storing it counts as undecided and gets a stable shape of its own instead of
 * repeating the same silhouette as every other bot.
 */
export function resolvedBotIconShape(body: unknown, seed: string): BotIconShape {
  return body == null || body === "cursor" ? botIconShapeForSeed(seed) : botIconShape(body);
}
