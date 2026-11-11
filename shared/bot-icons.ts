/**
 * The animal heads the avatars wear.
 *
 * KaiBot draws every silhouette itself in scripts/gen-bot-icons.mjs: each one
 * ships as a 29-frame strip whose eye and mouth cutouts let the face ink show
 * through. Nothing here comes from a third-party icon pack. The picker order is
 * the order below.
 */

import { z } from "zod";

/** Every selectable silhouette, in the order the pickers show them. */
export const BOT_ICON_SHAPES = [
  "fox",
  "rabbit",
  "sheep",
  "sloth",
  "otter",
  "owl",
  "bear",
  "deer",
  "panda",
  "lion",
  "mouse",
  "penguin",
  "wolf",
  "hamster",
  "koala",
  "hedgehog",
  "kitten",
] as const;

export type BotIconShape = (typeof BOT_ICON_SHAPES)[number];

export const botIconShapeSchema = z.enum(BOT_ICON_SHAPES);

/** The fox, and the fallback for any unknown id. */
export const DEFAULT_BOT_ICON_SHAPE: BotIconShape = "fox";

/** Each strip is one row of 29 square frames. */
export const BOT_ICON_FRAMES = 29;

export const BOT_ICON_NAMES: Record<BotIconShape, string> = {
  fox: "Fox",
  rabbit: "Rabbit",
  sheep: "Sheep",
  sloth: "Sloth",
  otter: "Otter",
  owl: "Owl",
  bear: "Bear",
  deer: "Deer",
  panda: "Panda",
  lion: "Lion",
  mouse: "Mouse",
  penguin: "Penguin",
  wolf: "Wolf",
  hamster: "Hamster",
  koala: "Koala",
  hedgehog: "Hedgehog",
  kitten: "Kitten",
};

/**
 * The strips are SVG, so one file stays sharp at every avatar size and display
 * scale; the avatar component sizes the mask, not the asset.
 */
export function botIconFaceUrl(shape: BotIconShape): string {
  return `/bot-icons/${shape}-face.svg`;
}

/** The matching eye/mouth cutout mask, pixel-aligned with the face strip. */
export function botIconHolesUrl(shape: BotIconShape): string {
  return `/bot-icons/${shape}-holes.svg`;
}

/**
 * Every id a bot may still carry from the old catalog, mapped to the animal that
 * reads closest to what it used to be. That covers the old mascot and festival
 * bodies and the geometric silhouettes this set replaced.
 */
const LEGACY_SHAPES: Readonly<Record<string, BotIconShape>> = {
  star: "fox",
  blob: "bear",
  squircle: "panda",
  capsule: "penguin",
  drop: "mouse",
  shield: "wolf",
  hexagon: "hedgehog",
  diamond: "deer",
  arch: "rabbit",
  bean: "otter",
  cloud: "sheep",
  clover: "hamster",
  crystal: "owl",
  cylinder: "sloth",
  dome: "koala",
  egg: "penguin",
  flower: "lion",
  heart: "fox",
  house: "koala",
  leaf: "rabbit",
  pebble: "hamster",
  pumpkin: "lion",
  sparkle: "fox",
  square: "bear",
  tablet: "otter",
  wedge: "wolf",
  cursor: "fox",
  circle: "koala",
  gem: "deer",
  hex: "hedgehog",
  teardrop: "mouse",
  ghost: "owl",
  witch: "rabbit",
  bat: "wolf",
  cat: "kitten",
  skull: "panda",
  monster: "bear",
  mummy: "sloth",
  vampire: "wolf",
  spider: "hedgehog",
  rocket: "penguin",
  anaar: "lion",
  chakri: "hedgehog",
  sparkler: "fox",
  bomb: "panda",
  laddu: "hamster",
  chakli: "deer",
  jalebi: "otter",
  katli: "panda",
  karanji: "owl",
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
