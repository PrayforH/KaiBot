import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  BotAvatar,
  MausAvatar,
  resolveBotAvatarOutcome,
  type BotAvatarProps,
  type MausAvatarProps,
} from "./Avatar";

const render = (props: Partial<MausAvatarProps>) =>
  renderToStaticMarkup(createElement(MausAvatar, { color: "green", animated: false, ...props }));

const renderBot = (bot: Partial<BotAvatarProps["bot"]>) =>
  renderToStaticMarkup(
    createElement(BotAvatar, { bot: { color: "green", ...bot }, animated: false }),
  );

const faceUrl = (shape: string) => `/bot-icons/${shape}-face.svg`;
const holesUrl = (shape: string) => `/bot-icons/${shape}-holes.svg`;

describe("MausAvatar body", () => {
  it("wears the fox when no body is given", () => {
    const markup = render({});
    expect(markup).toContain('data-bot-icon-shape="fox"');
    expect(markup).toContain(faceUrl("fox"));
    expect(markup).toContain(holesUrl("fox"));
  });

  it("wears the body it is given", () => {
    const markup = render({ bodyId: "bear" });
    expect(markup).toContain('data-bot-icon-shape="bear"');
    expect(markup).toContain(faceUrl("bear"));
  });

  it("maps a legacy body to the animal that replaced it", () => {
    expect(render({ bodyId: "blob" })).toContain(faceUrl("bear"));
  });

  it("falls back to the fox for an unknown body", () => {
    // SAFETY: "hexagram" is deliberately not a BotBodyId, to exercise the runtime fallback for persisted or streamed
    // data.
    expect(render({ bodyId: "hexagram" as MausAvatarProps["bodyId"] })).toContain(faceUrl("fox"));
  });

  it("paints the body with the per-bot gradient, never a flat black fill", () => {
    const markup = render({ bodyId: "fox", gradient: ["#a0ffb0", "#009957", "#005c34"] });
    expect(markup).not.toContain('fill="#000000"');
    expect(markup).not.toContain("{{GRADIENT}}");
    expect(markup).toContain("linear-gradient(145deg");
    expect(markup).toContain("#009957");
    // The body strip is a mask, and the eye/mouth cutouts show the face ink beneath it.
    expect(markup).toContain(faceUrl("fox"));
    expect(markup).toContain(holesUrl("fox"));
  });
});

describe("mascot facial feature colors", () => {
  it.each(["white", "black"] as const)("uses %s for both eyes and mouth on every body type", (mascotFaceColor) => {
    const ink = mascotFaceColor === "white" ? "#ffffff" : "#000000";
    for (const mascotBody of ["cursor", "fox", "pumpkin", "vampire"] as const) {
      for (const color of ["green", "chrome"] as const) {
        const markup = renderBot({ color, mascotBody, mascotFaceColor });
        expect(markup).toContain(`background-color:${ink}`);
        expect(markup).not.toContain('visibility="hidden"');
      }
    }
  });

  it("keeps default inks when an override is reset or comes from an older profile", () => {
    expect(renderBot({ color: "chrome", mascotFaceColor: null })).toContain("background-color:#1E2833");
    expect(renderBot({ mascotBody: "pumpkin" })).toContain("background-color:#0d0a10");
    expect(renderBot({})).toContain("background-color:#ffffff");
  });

  it("does not paint features over an uploaded image", () => {
    const markup = renderBot({ mascotFaceColor: "black", avatarUrl: "/api/attachments/photo.png", avatarCrop: "circle" });
    expect(markup).toContain("<img");
    expect(markup).not.toContain("/bot-icons/");
  });
});

describe("BotAvatar's two avatar outcomes", () => {
  it("zooms and positions a custom image inside its crop", () => {
    const markup = renderBot({
      avatarUrl: "/api/attachments/cat.webp",
      avatarCrop: "circle",
      avatarZoom: 2,
      avatarFocusX: 0.25,
      avatarFocusY: 0.75,
    });
    expect(markup).toContain("scale(2)");
    expect(markup).toContain("25% 75%");
    expect(markup).toContain("border-radius:50%");
  });

  it("renders a flat cropped image for circle/rounded/square, with no mascot at all", () => {
    const markup = renderBot({ avatarUrl: "/api/attachments/cat.webp", avatarCrop: "circle" });
    expect(markup).toContain("<img");
    expect(markup).not.toContain("data-bot-icon-shape");
  });

  it("shows the image as it is, with no mascot face painted on it", () => {
    const markup = renderBot({ avatarUrl: "/api/attachments/cat.webp", avatarCrop: "square" });
    expect(markup).toContain("border-radius:0");
    expect(markup).toContain("<img");
    expect(markup).not.toContain("<image");
    expect(markup).not.toContain("/bot-icons/");
  });

  it("renders the gradient mascot when the crop is mascot, image or not", () => {
    const markup = renderBot({ avatarUrl: "/api/attachments/cat.webp", avatarCrop: "mascot" });
    expect(markup).not.toContain("<img");
    expect(markup).toContain("data-bot-icon-shape");
  });

  it("falls back to the gradient mascot when a flat crop has no valid image", () => {
    const markup = renderBot({ avatarUrl: undefined, avatarCrop: "circle" });
    expect(markup).not.toContain("<img");
    expect(markup).toContain("data-bot-icon-shape");
  });

  it("gives bots still on the old one-shape default their own stable shape", () => {
    const first = renderBot({ id: "first", mascotBody: "cursor" });
    const second = renderBot({ id: "second", mascotBody: "cursor" });
    expect(first).toMatch(/data-bot-icon-shape="[a-z]+"/);
    expect(second).toMatch(/data-bot-icon-shape="[a-z]+"/);
    expect(first).not.toBe(second);
  });
});

describe("resolveBotAvatarOutcome", () => {
  // imageFailed is set by the <img>'s onError, which renderToStaticMarkup never fires, so the decision is a pure
  // function.
  it("falls back to the gradient mascot for an image that failed to load", () => {
    expect(
      resolveBotAvatarOutcome({ avatarCrop: "circle", hasUrl: true, imageFailed: true }),
    ).toBe("gradientMascot");
  });

  it("renders a good flat image flat", () => {
    expect(
      resolveBotAvatarOutcome({ avatarCrop: "rounded", hasUrl: true, imageFailed: false }),
    ).toBe("flatImage");
  });

  it("keeps the mascot crop on the gradient mascot even with a loaded image", () => {
    expect(
      resolveBotAvatarOutcome({ avatarCrop: "mascot", hasUrl: true, imageFailed: false }),
    ).toBe("gradientMascot");
  });

  it("falls back to the gradient mascot when there is no image at all", () => {
    expect(
      resolveBotAvatarOutcome({ avatarCrop: "square", hasUrl: false, imageFailed: false }),
    ).toBe("gradientMascot");
  });
});
