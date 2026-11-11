# KaiBot bot icons

KaiBot's own animal heads. Each shape is drawn in `scripts/gen-bot-icons.mjs`
(original vector paths, no third-party art) and rendered as a 29-frame SVG
strip:

- `<shape>-face.svg` is the body mask with the eye/mouth cutouts.
- `<shape>-holes.svg` is the cutouts alone, so the face ink paints through
  the mask and the body gradient shows around it.

The strips are vector, so the app can scale one frame to any avatar size
without losing sharpness. Frame 0 is idle; frames 3, 4, 5, 7, 8, 9 and 10 carry
the sad, sleeping, suspicious, happy, thinking, listening and working
expressions the avatar component asks for.

Regenerate with:

```sh
node scripts/gen-bot-icons.mjs
```
