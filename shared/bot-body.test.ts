import { describe, expect, it } from "vitest";

import { BOT_BODY_IDS, FESTIVAL_IDS, FESTIVALS, botBodyId, botBodySchema, isCarvedBody, isFestival } from "./bot-body.ts";
import { BOT_ICON_SHAPES } from "./bot-icons.ts";
import { CARVED_BODY_IDS } from "./carved-bodies.ts";
import { MASCOT_BODY_IDS } from "./mascot-bodies.ts";
import { MAUS_COLOR_NAMES } from "./wire.ts";

describe("bot bodies", () => {
  it("accepts every icon silhouette, gradient body and festival body exactly once", () => {
    expect(new Set(BOT_BODY_IDS)).toEqual(new Set([...MASCOT_BODY_IDS, ...CARVED_BODY_IDS, ...BOT_ICON_SHAPES]));
    expect(new Set(BOT_BODY_IDS).size).toBe(BOT_BODY_IDS.length);
    for (const id of BOT_BODY_IDS) expect(botBodySchema.safeParse(id).success).toBe(true);
  });

  it("falls back to the star for anything it does not know", () => {
    expect(botBodyId("pumpkin")).toBe("pumpkin");
    expect(botBodyId("laddu")).toBe("laddu");
    expect(botBodyId("star")).toBe("star");
    expect(botBodyId("arch")).toBe("arch");
    expect(botBodyId("wedge")).toBe("wedge");
    expect(botBodyId("hexagram")).toBe("star");
    expect(botBodyId(undefined)).toBe("star");
  });

  it("tells the festival bodies apart", () => {
    expect(isCarvedBody("ghost")).toBe(true);
    expect(isCarvedBody("jalebi")).toBe(true);
    expect(isCarvedBody("cursor")).toBe(false);
    expect(isCarvedBody(null)).toBe(false);
  });

  it("splits the festival bodies between the festivals, one pack each", () => {
    expect(FESTIVAL_IDS).toEqual(["halloween", "diwali"]);
    expect(FESTIVAL_IDS.flatMap((festival) => FESTIVALS[festival].bodies)).toEqual([...CARVED_BODY_IDS]);
    expect(isFestival("diwali")).toBe(true);
    expect(isFestival("midnight")).toBe(false);
    expect(isFestival("toString")).toBe(false);
  });

  it.each(FESTIVAL_IDS)("gives every bot colour but silver and chrome its own %s costume from that festival", (festival) => {
    const { bodies, costumes } = FESTIVALS[festival];
    const dressed = MAUS_COLOR_NAMES.filter((color) => color !== "silver" && color !== "chrome");
    expect(Object.keys(costumes).sort()).toEqual([...dressed].sort());
    expect(new Set(Object.values(costumes)).size).toBe(dressed.length);
    for (const body of Object.values(costumes)) expect(bodies).toContain(body);
  });
});
