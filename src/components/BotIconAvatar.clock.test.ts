// @vitest-environment happy-dom
import { act, createElement, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { MausAvatar, type MausAvatarHandle, type MausAvatarProps } from "./Avatar";
import { mascotClock } from "./mascot-clock";
import { UNREAD_NOTICE_MS, useUnreadNotice } from "./unread-notice";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const observed: { callback: ((entries: Array<{ target: Element; isIntersecting: boolean }>) => void) | null } = { callback: null };
class FakeIntersectionObserver {
  constructor(callback: (entries: Array<{ target: Element; isIntersecting: boolean }>) => void) {
    observed.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);

let reducedMotion = false;
const motionListeners = new Set<() => void>();
vi.stubGlobal("matchMedia", (query: string) => ({
  get matches() { return query.includes("reduce") && reducedMotion; },
  addEventListener: (_: string, listener: () => void) => motionListeners.add(listener),
  removeEventListener: (_: string, listener: () => void) => motionListeners.delete(listener),
}));

let frameRequests = 0;
let host: HTMLDivElement;
let root: Root;

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
  const raf = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
    frameRequests++;
    return raf(callback);
  };
});

afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  frameRequests = 0;
  reducedMotion = false;
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const render = (avatars: Array<Partial<MausAvatarProps> & { ref?: React.Ref<MausAvatarHandle> }>) =>
  act(() => root.render(avatars.map((props, key) => createElement(MausAvatar, { key, color: "green", ...props }))));
const run = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const frames = () => [...host.querySelectorAll("[data-bot-icon-frame]")].map((node) => node.getAttribute("data-bot-icon-frame"));
const shapes = () => [...host.querySelectorAll("[data-bot-icon-frame]")].map((node) => node.getAttribute("data-bot-icon-shape"));

describe("BotIconAvatar on the shared clock", () => {
  it("draws every animated bot from one animation frame", () => {
    render(Array.from({ length: 12 }, () => ({ state: "working" as const, size: 96 })));
    run(100);
    frameRequests = 0;
    run(1000);
    expect(frameRequests).toBeGreaterThan(15);
    expect(frameRequests).toBeLessThanOrEqual(60);
    expect(mascotClock().pending()).toBe(12);
  });

  it("keeps a sidebar of idle bots on the pack's calm frame rate", () => {
    render(Array.from({ length: 12 }, (_, i) => ({ state: "idle" as const, size: [24, 28, 42, 56][i % 4] })));
    run(100);
    frameRequests = 0;
    run(1000);
    expect(frameRequests).toBeGreaterThanOrEqual(8);
    expect(frameRequests).toBeLessThanOrEqual(20);
  });

  it("paints a still bot with its state's frame and then asks for nothing", () => {
    render([{ state: "sleeping", animated: false, size: 24 }]);
    run(100);
    expect(frames()).toEqual(["4"]);
    frameRequests = 0;
    run(2000);
    expect(frameRequests).toBe(0);
    expect(mascotClock().pending()).toBe(0);
  });

  it("redraws a still bot when its look changes", () => {
    render([{ state: "idle", animated: false, size: 24, bodyId: "star" }]);
    run(100);
    expect(shapes()).toEqual(["star"]);
    render([{ state: "idle", animated: false, size: 24, bodyId: "blob" }]);
    run(100);
    expect(shapes()).toEqual(["blob"]);
    expect(mascotClock().pending()).toBe(0);
  });

  it("advances an animated bot's frame over time, and a blink needs no second clock ticket", () => {
    const ref = createRef<MausAvatarHandle>();
    render([{ state: "working", size: 36, ref }]);
    run(100);
    const before = frames()[0];
    run(200);
    expect(frames()[0]).not.toBe(before);
    expect(mascotClock().pending()).toBe(1);
    act(() => ref.current!.blink());
    expect(host.innerHTML).toContain("bot-icon-blink");
    run(300);
    expect(mascotClock().pending()).toBe(1);
  });

  it("lets an unread bot play its notice, then draws nothing while the news waits", () => {
    function Row({ unread }: { unread: boolean }) {
      return createElement(MausAvatar, { color: "green", state: unread ? "notifying" : "idle", size: 42, animated: useUnreadNotice(unread) });
    }
    act(() => root.render(createElement(Row, { unread: false })));
    run(200);
    act(() => root.render(createElement(Row, { unread: true })));
    frameRequests = 0;
    run(2000);
    expect(frameRequests).toBeGreaterThan(20);
    run(UNREAD_NOTICE_MS);
    run(100);
    frameRequests = 0;
    run(30_000);
    expect(frameRequests).toBe(0);
    expect(mascotClock().pending()).toBe(0);
  });

  it("stops drawing a bot that leaves the screen", () => {
    render([{ state: "working", size: 36 }]);
    run(200);
    act(() => observed.callback!([{ target: host.querySelector("[data-bot-icon-shape]")!, isIntersecting: false }]));
    frameRequests = 0;
    run(1000);
    expect(frameRequests).toBe(0);
    act(() => observed.callback!([{ target: host.querySelector("[data-bot-icon-shape]")!, isIntersecting: true }]));
    run(500);
    expect(frameRequests).toBeGreaterThan(5);
  });

  it("holds still under reduced motion: no body motion, blinks or spins", () => {
    reducedMotion = true;
    const ref = createRef<MausAvatarHandle>();
    render([{ state: "celebrate", size: 220, ref }]);
    run(200);
    expect(frames()).toEqual(["7"]);
    expect(host.innerHTML).not.toContain("maus-celebrate-body");
    frameRequests = 0;
    act(() => { ref.current!.blink(); ref.current!.spin(); });
    run(2000);
    expect(frameRequests).toBe(0);
    expect(mascotClock().pending()).toBe(0);
  });

  it("calms an animating bot when reduced motion is switched on", () => {
    render([{ state: "working", size: 36 }]);
    run(200);
    expect(mascotClock().pending()).toBe(1);
    reducedMotion = true;
    act(() => { for (const listener of motionListeners) listener(); });
    run(200);
    expect(mascotClock().pending()).toBe(0);
  });
});
