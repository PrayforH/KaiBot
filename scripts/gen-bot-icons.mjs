// Draws KaiBot's bot-icon strips: 17 animal heads, each a 29-frame row.
//
// Every shape here is KaiBot's own vector art, generated from this file. The
// strips are vector masks, not pictures: `-face-` is the body with eye/mouth
// cutouts, `-holes-` is just the cutouts, so the app paints the body gradient
// and the face ink through two aligned layers (src/components/BotIconAvatar.tsx).
// SVG keeps them sharp at any avatar size and display scale.
//
// Run from the repo root: node scripts/gen-bot-icons.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "bot-icons");
const FRAMES = 29;
const VIEW = 100;

const DEFAULT_FACE = { cx: 50, cy: 50, gap: 20, eyeW: 10, eyeH: 12, mouthW: 14, mouthH: 4.5 };

const circle = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
const ellipse = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;

// The lion's mane is a ring of overlapping discs; drawn here so every shape
// stays a short, readable definition.
const LION_MANE = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2;
  return circle(50 + Math.cos(angle) * 40, 54 + Math.sin(angle) * 40, 12);
}).join("");

/** Each silhouette is drawn inside 0 0 100 100, and its face tells the features where to sit. */
const SHAPES = {
  fox: {
    art: '<path d="M20 30L11 6L35 19Z"/><path d="M80 30L89 6L65 19Z"/><path d="M50 15C75 15 93 33 93 56C93 79 74 95 50 95C26 95 7 79 7 56C7 33 25 15 50 15Z"/>',
    face: { cy: 56, gap: 19 },
  },
  rabbit: {
    art: `${ellipse(35, 26, 10, 24)}${ellipse(65, 26, 10, 24)}${circle(50, 68, 30)}`,
    face: { cy: 68, gap: 17, eyeW: 9, eyeH: 11, mouthW: 12, mouthH: 4 },
  },
  sheep: {
    art: `${circle(30, 44, 20)}${circle(50, 32, 22)}${circle(70, 44, 20)}${circle(38, 64, 22)}${circle(62, 64, 22)}${circle(50, 60, 24)}`,
    face: { cy: 56, gap: 18, mouthW: 12 },
  },
  sloth: {
    art: `${circle(50, 56, 34)}${circle(30, 28, 11)}${circle(70, 28, 11)}`,
    face: { cy: 56, gap: 18 },
  },
  otter: {
    art: `${circle(50, 55, 36)}${circle(26, 30, 11)}${circle(74, 30, 11)}`,
    face: { cy: 55, gap: 18 },
  },
  owl: {
    art: '<path d="M22 22L13 5L34 13Z"/><path d="M78 22L87 5L66 13Z"/><ellipse cx="50" cy="56" rx="37" ry="39"/>',
    face: { cy: 52, gap: 26, eyeW: 15, eyeH: 15, mouthW: 10, mouthH: 6 },
  },
  bear: {
    art: `${circle(50, 55, 38)}${circle(21, 26, 13)}${circle(79, 26, 13)}`,
    face: { cy: 55, gap: 19, mouthW: 13 },
  },
  deer: {
    art: '<path d="M37 30L27 8M31 20L20 15M31 20L38 11" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M63 30L73 8M69 20L80 15M69 20L62 11" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><ellipse cx="50" cy="62" rx="27" ry="31"/>',
    face: { cy: 60, gap: 16, eyeW: 8.5, eyeH: 10, mouthW: 11, mouthH: 4 },
  },
  panda: {
    art: `${circle(50, 56, 36)}${circle(19, 27, 14)}${circle(81, 27, 14)}`,
    face: { cy: 56, gap: 19, mouthW: 12 },
  },
  lion: {
    art: `${LION_MANE}${circle(50, 54, 34)}`,
    face: { cy: 54, gap: 18, eyeW: 9, eyeH: 11 },
  },
  mouse: {
    art: `${circle(50, 62, 30)}${circle(19, 30, 18)}${circle(81, 30, 18)}`,
    face: { cy: 62, gap: 16, eyeW: 8, eyeH: 9, mouthW: 10, mouthH: 3.6 },
  },
  penguin: {
    art: '<ellipse cx="50" cy="55" rx="29" ry="36"/>',
    face: { cy: 50, gap: 15, eyeW: 8, eyeH: 9, mouthW: 14, mouthH: 7 },
  },
  wolf: {
    art: '<path d="M20 30L15 8L38 20Z"/><path d="M80 30L85 8L62 20Z"/><ellipse cx="50" cy="57" rx="40" ry="37"/>',
    face: { cy: 57, gap: 18 },
  },
  hamster: {
    art: `${circle(50, 58, 34)}${circle(26, 29, 10)}${circle(74, 29, 10)}`,
    face: { cy: 58, gap: 18, mouthW: 12 },
  },
  koala: {
    art: `${circle(50, 58, 34)}${circle(21, 35, 18)}${circle(79, 35, 18)}`,
    face: { cy: 58, gap: 18, mouthW: 12 },
  },
  hedgehog: {
    art: '<path d="M50 10L58 20L68 13L73 26L85 24L85 38L95 45L87 55C87 77 71 92 50 92C29 92 13 77 13 55L5 45L15 38L15 24L27 26L32 13L42 20Z"/>',
    face: { cy: 58, gap: 18 },
  },
  kitten: {
    art: '<path d="M19 32L13 7L37 20Z"/><path d="M81 32L87 7L63 20Z"/><circle cx="50" cy="58" r="35"/>',
    face: { cy: 58, gap: 18 },
  },
};

// Frames 3/4/5/7/8/9/10 line up with EXPRESSION_FRAME in BotIconAvatar.tsx,
// so a sleeping bot starts on closed eyes and a happy one on the smile.
const FRAME_STATES = [
  { lookX: 0, lookY: 0, open: 1 },
  { lookX: 0.7, lookY: 0, open: 1 },
  { lookX: 1, lookY: 0, open: 0.15 },
  { lookX: 0.2, lookY: 0.7, open: 0.6 },
  { lookX: 0, lookY: 0.5, open: 0.06 },
  { lookX: -1, lookY: -0.2, open: 0.5, focus: true },
  { lookX: -1, lookY: 0, open: 1 },
  { lookX: 0, lookY: 0, open: 1, smile: true, happyEyes: true },
  { lookX: 0.2, lookY: -1.1, open: 1 },
  { lookX: 0, lookY: 0, open: 1.15, wide: true },
  { lookX: 0.5, lookY: 0.3, open: 0.85, focus: true },
  { lookX: 0.8, lookY: 0.2, open: 1 },
  { lookX: 1, lookY: -0.4, open: 1 },
  { lookX: 0.6, lookY: -0.8, open: 1 },
  { lookX: -0.4, lookY: -0.6, open: 1 },
  { lookX: -1, lookY: -0.2, open: 1 },
  { lookX: -1, lookY: 0.4, open: 1 },
  { lookX: -0.6, lookY: 0.8, open: 1 },
  { lookX: 0, lookY: 0.6, open: 0.1 },
  { lookX: 0.4, lookY: 0.2, open: 1 },
  { lookX: 0.9, lookY: 0, open: 1 },
  { lookX: 0.5, lookY: -0.5, open: 1 },
  { lookX: 0, lookY: -0.9, open: 1 },
  { lookX: -0.5, lookY: -0.5, open: 1 },
  { lookX: -0.9, lookY: 0, open: 1 },
  { lookX: -0.5, lookY: 0.5, open: 1 },
  { lookX: 0, lookY: 0.2, open: 0.1 },
  { lookX: 0.2, lookY: 0, open: 1 },
  { lookX: 0.6, lookY: 0, open: 1 },
];

const GAZE_X = 2.2;
const GAZE_Y = 2;

function features(shape, frame) {
  const face = { ...DEFAULT_FACE, ...shape.face };
  const state = FRAME_STATES[frame];
  const openWidth = face.eyeW * (state.wide ? 1.18 : state.focus ? 0.88 : 1);
  const openHeight = Math.max(1.8, face.eyeH * state.open);
  const lookX = state.lookX * GAZE_X;
  const lookY = state.lookY * GAZE_Y;
  const parts = [];

  for (const side of [-1, 1]) {
    const cx = face.cx + (side * face.gap) / 2 + lookX;
    const cy = face.cy + lookY;
    if (state.happyEyes) {
      const r = openWidth / 2;
      parts.push(`<path d="M${cx - r} ${cy + r * 0.5}Q${cx} ${cy - r} ${cx + r} ${cy + r * 0.5}" fill="none" stroke-width="${Math.max(2, openHeight * 0.42)}" stroke-linecap="round"/>`);
    } else if (state.open < 0.2) {
      parts.push(`<rect x="${cx - openWidth / 2}" y="${cy - 1}" width="${openWidth}" height="2" rx="1"/>`);
    } else {
      parts.push(`<rect x="${cx - openWidth / 2}" y="${cy - openHeight / 2}" width="${openWidth}" height="${openHeight}" rx="${Math.min(openWidth, openHeight) / 2}"/>`);
    }
  }

  const mouthY = face.cy + face.eyeH + 4;
  if (state.smile) {
    const half = (face.mouthW * 1.15) / 2;
    const lift = Math.max(2, face.mouthH * 0.55);
    parts.push(`<path d="M${face.cx - half} ${mouthY}Q${face.cx} ${mouthY + face.mouthH * 2} ${face.cx + half} ${mouthY}" fill="none" stroke-width="${lift}" stroke-linecap="round"/>`);
  } else {
    const width = face.mouthW * (state.wide ? 1.2 : 1);
    parts.push(`<rect x="${face.cx - width / 2}" y="${mouthY}" width="${width}" height="${face.mouthH}" rx="${face.mouthH / 2}"/>`);
  }
  return parts.join("");
}

/** One vector strip: 29 frames laid left to right, each frame one VIEW square. */
function stripSvg(name, shape, variant) {
  const frames = Array.from({ length: FRAMES }, (_, frame) => {
    const art = `<g fill="#fff">${shape.art}</g>`;
    // The cutouts inherit `stroke` too, so the smile and happy-eye arcs use the
    // same ink as the filled features.
    const cutouts = `<g fill="#000" stroke="#000">${features(shape, frame)}</g>`;
    // Each frame needs its own mask id: `url(#cut)` is document-global, so a
    // repeated id would make every frame show frame 0's eyes.
    const maskId = `cut-${name}-${frame}`;
    const body = variant === "face"
      ? `<defs><mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="${VIEW}" height="${VIEW}"><rect width="${VIEW}" height="${VIEW}" fill="#fff"/>${cutouts}</mask></defs><g mask="url(#${maskId})">${art}</g>`
      : `<g fill="#fff" stroke="#fff">${features(shape, frame)}</g>`;
    return `<g transform="translate(${frame * VIEW} 0)">${body}</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAMES * VIEW}" height="${VIEW}" viewBox="0 0 ${FRAMES * VIEW} ${VIEW}">${frames.join("")}</svg>`;
}

mkdirSync(outDir, { recursive: true });
let written = 0;
for (const [name, shape] of Object.entries(SHAPES)) {
  for (const variant of ["face", "holes"]) {
    const file = path.join(outDir, `${name}-${variant}.svg`);
    writeFileSync(file, stripSvg(name, shape, variant));
    written += 1;
  }
}

writeFileSync(path.join(outDir, "README.md"), `# KaiBot bot icons

KaiBot's own animal heads. Each shape is drawn in \`scripts/gen-bot-icons.mjs\`
(original vector paths, no third-party art) and rendered as a 29-frame SVG
strip:

- \`<shape>-face.svg\` is the body mask with the eye/mouth cutouts.
- \`<shape>-holes.svg\` is the cutouts alone, so the face ink paints through
  the mask and the body gradient shows around it.

The strips are vector, so the app can scale one frame to any avatar size
without losing sharpness. Frame 0 is idle; frames 3, 4, 5, 7, 8, 9 and 10 carry
the sad, sleeping, suspicious, happy, thinking, listening and working
expressions the avatar component asks for.

Regenerate with:

\`\`\`sh
node scripts/gen-bot-icons.mjs
\`\`\`
`);

console.log(`wrote ${written} SVG strips and README.md to ${path.relative(root, outDir)}`);
