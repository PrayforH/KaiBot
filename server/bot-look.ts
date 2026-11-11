import { BOT_ICON_SHAPES, resolvedBotIconShape, type BotIconShape } from "../shared/bot-icons.ts";
import { MAUS_COLOR_NAMES, type MausColor } from "../shared/wire.ts";

export const STARTER_COLORS: readonly MausColor[] = MAUS_COLOR_NAMES.filter((color) => color !== "silver" && color !== "chrome");
const ROTATION: readonly MausColor[] = ["green", "blue", "red", "orange", "purple", "cyan", "pink", "yellow", "teal", "coral"];

/** The colour of the bot made `index`-th when nothing else picks one. */
export const rotationColor = (index: number): MausColor => ROTATION[index % ROTATION.length]!;

/**
 * A new bot's first look: a shape no bot here wears yet when one is left, in a
 * random colour no bot here wears yet when one is left, so a team of bots is
 * distinguishable at a glance.
 */
export function freshLook(
  bots: ReadonlyArray<{ id?: string; color: MausColor; mascotBody?: string | null }>,
  random: () => number = Math.random,
): { color: MausColor; mascotBody: BotIconShape } {
  const unworn = STARTER_COLORS.filter((color) => !bots.some((bot) => bot.color === color));
  const pool = unworn.length ? unworn : STARTER_COLORS;
  const wornShapes = new Set(bots.map((bot) => resolvedBotIconShape(bot.mascotBody, bot.id ?? "")));
  const unwornShapes = BOT_ICON_SHAPES.filter((shape) => !wornShapes.has(shape));
  const shapes = unwornShapes.length ? unwornShapes : BOT_ICON_SHAPES;
  return {
    color: pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]!,
    mascotBody: shapes[Math.min(shapes.length - 1, Math.floor(random() * shapes.length))]!,
  };
}
