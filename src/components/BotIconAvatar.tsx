import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { CHROME_EYES, type MausColor, type MausMotion, type MausState } from "@/lib/mascot";
import { mascotFaceInk, type MascotFaceColor } from "../../shared/bot-avatar";
import { isCarvedBody, type BotBodyId } from "../../shared/bot-body";
import {
  BOT_ICON_FRAMES,
  BOT_ICON_NAMES,
  botIconFaceUrl,
  botIconHolesUrl,
  botIconShape,
  type BotIconShape,
} from "../../shared/bot-icons";
import { mascotClock, usePrefersReducedMotion } from "./mascot-clock";

const CARVED_INK = "#0d0a10";
const DEFAULT_FRAME_MS = 70;
const TILE_MIN_SIZE = 120;
const TILE_GLYPH_RATIO = 0.66;
const TILE_MAX_GLYPH = 144;
const GAZE_SHIFT = 0.035;

/** The pack's strips blink in their opening frames; the rest is a calm idle loop. */
const EXPRESSION_FRAME: Partial<Record<MausState, number>> = {
  sleeping: 4,
  drowsy: 4,
  "powering-down": 4,
  sad: 3,
  suspicious: 5,
  happy: 7,
  proud: 7,
  celebrate: 7,
  alerting: 7,
  surprised: 7,
  thinking: 8,
  curious: 8,
  confused: 8,
  listening: 9,
  working: 10,
  loading: 10,
};

const FRAME_MS: Partial<Record<MausState, number>> = {
  working: 42,
  loading: 42,
  thinking: 50,
  alerting: 42,
  surprised: 42,
  celebrate: 50,
  happy: 55,
  proud: 55,
  listening: 60,
};

/** Reuses the pack's existing mascot gestures, so the icon bodies keep the app's familiar motion. */
const MOTION_ANIMATION: Record<Exclude<MausMotion, "none">, string> = {
  arrive: "maus-arrive 620ms cubic-bezier(.2,.9,.25,1.12) both",
  switch: "maus-switch 420ms ease-out both",
  customize: "maus-customize 520ms ease-out both",
  alert: "maus-alert-body 480ms ease-in-out both",
  thinking: "maus-thinking-body 1200ms ease-in-out both",
  working: "maus-working-body 900ms ease-in-out both",
  launch: "maus-launch-body 620ms cubic-bezier(.2,.9,.25,1.12) both",
  success: "maus-success-body 620ms ease-out both",
  celebrate: "maus-celebrate-body 700ms ease-out both",
  blink: "bot-icon-blink 260ms ease-out both",
  surprise: "maus-surprise-body 520ms ease-out both",
  failure: "maus-failure-body 600ms ease-out both",
};

interface Gesture {
  kind: "blink" | "spin";
  nonce: number;
  ms: number;
}

export interface BotIconAvatarHandle {
  blink(): void;
  spin(durationMs?: number): void;
  setExpression(index: number): void;
}

export type BotIconAvatarProps = {
  color: MausColor;
  state?: MausState;
  size?: number;
  label?: string;
  motion?: MausMotion;
  motionKey?: number;
  gaze?: { x?: number; y?: number };
  trackPointer?: boolean;
  animated?: boolean;
  bodyId?: BotBodyId;
  gradient?: [string, string, string];
  faceColor?: MascotFaceColor | null;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function faceFrame(state: MausState): number {
  return EXPRESSION_FRAME[state] ?? 0;
}

function frameRate(state: MausState): number {
  return FRAME_MS[state] ?? DEFAULT_FRAME_MS;
}

function isSleeping(state: MausState): boolean {
  return state === "sleeping" || state === "drowsy" || state === "powering-down";
}

/** The strip is one row; the mask scales it so a frame is exactly `size` wide. */
function layerStyle(url: string, paint: Pick<CSSProperties, "backgroundColor" | "backgroundImage">, size: number, frame: number): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    ...paint,
    WebkitMaskImage: `url("${url}")`,
    maskImage: `url("${url}")`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: `${BOT_ICON_FRAMES * size}px ${size}px`,
    maskSize: `${BOT_ICON_FRAMES * size}px ${size}px`,
    WebkitMaskPosition: `${-frame * size}px 0`,
    maskPosition: `${-frame * size}px 0`,
  };
}

function BotIconAvatarComponent(props: BotIconAvatarProps, ref: React.Ref<BotIconAvatarHandle>) {
  const {
    color,
    state = "idle",
    size = 44,
    label,
    motion = "none",
    motionKey = 0,
    gaze,
    trackPointer = true,
    animated = true,
    bodyId,
    gradient,
    faceColor,
  } = props;

  const shape: BotIconShape = botIconShape(bodyId);
  const reduced = usePrefersReducedMotion();
  const live = animated && !reduced;
  const sleeping = isSleeping(state);
  const baseFrame = faceFrame(state);
  const [frame, setFrame] = useState(baseFrame);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const gestureNonce = useRef(0);
  const gestureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLSpanElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const tile = size > TILE_MIN_SIZE;
  const glyphSize = tile ? Math.round(Math.min(TILE_MAX_GLYPH, size * TILE_GLYPH_RATIO)) : size;
  const faceUrl = botIconFaceUrl(shape);
  const holesUrl = botIconHolesUrl(shape);
  const ink = mascotFaceInk(faceColor) ?? (isCarvedBody(bodyId) ? CARVED_INK : color === "chrome" ? CHROME_EYES : "#ffffff");
  const stops = gradient ?? ["#ffffff", "#9aa4b2", "#39414d"];
  const bodyPaint = `linear-gradient(145deg, ${stops[0]} 0%, ${stops[1]} 46%, ${stops[2]} 100%)`;

  useEffect(() => {
    if (!live || sleeping) {
      setFrame(baseFrame);
      return;
    }
    const rate = frameRate(state);
    const started = performance.now();
    const ticket = mascotClock().add((now) => {
      const next = (baseFrame + Math.floor((now - started) / rate)) % BOT_ICON_FRAMES;
      setFrame((current) => (current === next ? current : next));
      return now + rate;
    }, root.current);
    return () => ticket.remove();
  }, [live, sleeping, state, baseFrame, shape]);

  useEffect(() => () => {
    if (gestureTimer.current) clearTimeout(gestureTimer.current);
  }, []);

  const playGesture = (kind: Gesture["kind"], ms: number) => {
    if (!live) return;
    if (gestureTimer.current) clearTimeout(gestureTimer.current);
    const next = { kind, nonce: ++gestureNonce.current, ms };
    setGesture(next);
    gestureTimer.current = setTimeout(() => {
      setGesture((current) => (current?.nonce === next.nonce ? null : current));
      gestureTimer.current = null;
    }, ms);
  };

  useImperativeHandle(ref, () => ({
    blink: () => playGesture("blink", 220),
    spin: (durationMs?: number) => playGesture("spin", durationMs ?? 700),
    setExpression: () => undefined,
  }));

  const onPointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!trackPointer || !live) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
      y: clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1),
    });
  };
  const onPointerLeave = () => setPointer({ x: 0, y: 0 });

  const gazeX = clamp((gaze?.x ?? 0) + pointer.x, -2, 2);
  const gazeY = clamp((gaze?.y ?? 0) + pointer.y, -2, 2);
  const gazeTransform = `translate(${(gazeX * GAZE_SHIFT * glyphSize).toFixed(2)}px, ${(gazeY * GAZE_SHIFT * glyphSize).toFixed(2)}px)`;

  const animation = !live
    ? undefined
    : gesture
      ? gesture.kind === "blink"
        ? "bot-icon-blink 220ms ease-out both"
        : `bot-icon-spin ${gesture.ms}ms cubic-bezier(.35,0,.2,1) both`
      : motion !== "none"
        ? MOTION_ANIMATION[motion]
        : undefined;

  const accessibleName = label?.trim() ? label : BOT_ICON_NAMES[shape];

  return (
    <span
      ref={root}
      role="img"
      aria-label={accessibleName}
      title={label}
      data-bot-icon-shape={shape}
      data-bot-icon-frame={frame}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      onPointerMove={trackPointer && live ? onPointerMove : undefined}
      onPointerLeave={trackPointer && live ? onPointerLeave : undefined}
    >
      {tile && (
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            borderRadius: Math.round(size * 0.28),
            background: `linear-gradient(145deg, color-mix(in srgb, ${stops[1]} 20%, transparent), color-mix(in srgb, ${stops[2]} 8%, transparent))`,
            border: `1px solid color-mix(in srgb, ${stops[1]} 28%, transparent)`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.12), 0 12px 32px rgba(0,0,0,.18)",
          }}
        />
      )}
      <span
        key={`${motion}:${motionKey}:${gesture?.nonce ?? 0}`}
        aria-hidden="true"
        className="relative"
        style={{ width: glyphSize, height: glyphSize, animation }}
      >
        <span
          className="absolute inset-0"
          style={{ transform: gazeTransform, transition: live ? "transform 120ms ease-out" : undefined }}
        >
          <span style={layerStyle(holesUrl, { backgroundColor: ink }, glyphSize, frame)} />
          <span style={layerStyle(faceUrl, { backgroundImage: bodyPaint }, glyphSize, frame)} />
        </span>
      </span>
    </span>
  );
}

export const BotIconAvatar = memo(forwardRef(BotIconAvatarComponent));
