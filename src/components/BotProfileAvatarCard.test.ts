import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { StoreProvider, type Bot } from "@/state/store";
import { BOT_ICON_NAMES, BOT_ICON_SHAPES, resolvedBotIconShape } from "../../shared/bot-icons";
import { CARVED_BODIES, DIWALI_BODY_IDS, HALLOWEEN_BODY_IDS } from "../../shared/carved-bodies";
import { BotProfileAvatarCard } from "./BotProfileAvatarCard";

function makeBot(overrides: Partial<Bot> = {}): Bot {
  return {
    id: "bot-1",
    threadId: "thread-1",
    name: "Maus",
    title: "Maus",
    description: "",
    notifications: false,
    color: "green",
    unread: false,
    modelSelection: { instanceId: "local", model: "test-model" },
    messages: [],
    ...overrides,
  };
}

function renderCard(bot: Bot) {
  return renderToStaticMarkup(
    createElement(
      StoreProvider,
      null,
      createElement(BotProfileAvatarCard, {
        bot,
        activeState: "idle",
        mascotMotion: null,
        onPatch: vi.fn(),
      }),
    ),
  );
}

describe("BotProfileAvatarCard body picker", () => {
  it("renders one option per bot icon shape, labeled by name", () => {
    const markup = renderCard(makeBot());

    expect(markup).toContain(">Body<");
    for (const id of BOT_ICON_SHAPES) {
      expect(markup).toContain(`aria-label="Use the ${BOT_ICON_NAMES[id]} body"`);
    }
  });

  it("offers each festival's bodies in their own row", () => {
    const markup = renderCard(makeBot({ mascotBody: "jalebi" }));

    expect(markup).toContain(">Halloween<");
    expect(markup).toContain(">Diwali<");
    for (const id of [...HALLOWEEN_BODY_IDS, ...DIWALI_BODY_IDS]) {
      expect(markup).toContain(`aria-label="Use the ${CARVED_BODIES[id].name} body"`);
    }
    expect(markup).toContain(`aria-pressed="true" aria-label="Use the ${CARVED_BODIES.jalebi.name} body"`);
    expect(markup).toContain(`aria-pressed="false" aria-label="Use the ${CARVED_BODIES.witch.name} body"`);
  });

  it("marks the bot's own stable shape pressed and the rest unpressed when it has not chosen one", () => {
    const bot = makeBot();
    const shape = resolvedBotIconShape(bot.mascotBody, bot.id);
    const other = BOT_ICON_SHAPES.find((id) => id !== shape)!;
    const markup = renderCard(bot);

    expect(markup).toContain(`aria-pressed="true" aria-label="Use the ${BOT_ICON_NAMES[shape]} body"`);
    expect(markup).toContain(`aria-pressed="false" aria-label="Use the ${BOT_ICON_NAMES[other]} body"`);
  });

  it("reflects an explicitly chosen body", () => {
    const markup = renderCard(makeBot({ mascotBody: "star" }));
    const other = BOT_ICON_SHAPES.find((id) => id !== "star")!;

    expect(markup).toContain(`aria-pressed="true" aria-label="Use the ${BOT_ICON_NAMES.star} body"`);
    expect(markup).toContain(`aria-pressed="false" aria-label="Use the ${BOT_ICON_NAMES[other]} body"`);
  });

  it("offers zoom and drag framing for a custom image", () => {
    const markup = renderCard(makeBot({
      avatarUrl: "/api/attachments/cat.webp",
      avatarCrop: "circle",
      avatarZoom: 1.5,
    }));
    expect(markup).toContain('aria-label="Zoom avatar"');
    expect(markup).toContain("Drag the picture to reposition it");
    expect(markup).toContain("150%");
    expect(markup).toContain("Reset framing");
  });

  it("hides zoom controls for the mascot", () => {
    const markup = renderCard(makeBot());
    expect(markup).not.toContain('aria-label="Zoom avatar"');
  });

  it("hides the body picker for flat crops that have no mascot to wear one", () => {
    const markup = renderCard(makeBot({ avatarCrop: "circle" }));

    expect(markup).not.toContain(">Body<");
    expect(markup).not.toContain(`aria-label="Use the ${BOT_ICON_NAMES.star} body"`);
  });

  it("hides the body picker for every flat crop, not just circle", () => {
    for (const crop of ["rounded", "square"] as const) {
      const markup = renderCard(makeBot({ avatarCrop: crop }));

      expect(markup).not.toContain(">Body<");
    }
  });
});
