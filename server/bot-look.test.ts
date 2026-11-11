import { describe, expect, it } from "vitest";

import { BOT_ICON_SHAPES, resolvedBotIconShape } from "../shared/bot-icons.ts";
import { freshLook, STARTER_COLORS } from "./bot-look.ts";

describe("a new bot's first look", () => {
  it("wears one of the bot icon shapes, never a metal colour", () => {
    expect(STARTER_COLORS).not.toContain("silver");
    expect(STARTER_COLORS).not.toContain("chrome");
    for (const roll of [0, 0.5, 0.999]) expect(BOT_ICON_SHAPES).toContain(freshLook([], () => roll).mascotBody);
  });

  it("picks a shape no bot here wears yet, so a team's icons stay distinguishable", () => {
    const worn = BOT_ICON_SHAPES.slice(0, BOT_ICON_SHAPES.length - 1).map((mascotBody) => ({ color: "green" as const, mascotBody }));
    expect(freshLook(worn, () => 0.999).mascotBody).toBe(BOT_ICON_SHAPES[BOT_ICON_SHAPES.length - 1]);
  });

  it("treats the old one-shape default as already worn", () => {
    const first = { color: "green" as const, id: "first", mascotBody: "cursor" };
    expect(freshLook([first], () => 0).mascotBody).not.toBe(resolvedBotIconShape("cursor", "first"));
  });

  it("picks its colour at random, preferring one no bot here wears yet", () => {
    expect(freshLook([], () => 0).color).not.toBe(freshLook([], () => 0.999).color);
    const worn = [{ color: "red" as const }, { color: "blue" as const }];
    for (const roll of [0, 0.3, 0.6, 0.999]) expect(["red", "blue"]).not.toContain(freshLook(worn, () => roll).color);
  });
});
