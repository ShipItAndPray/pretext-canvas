# @shipitandpray/pretext-canvas

Canvas and WebGL text rendering helpers powered by Pretext.

This package makes canvas text feel like a layout problem instead of a manual `fillText()` loop. It uses Pretext for wrapping and line measurement, then turns that result into Canvas drawing, padded text boxes, and reusable atlas textures for WebGL labels.

## Why this package exists

Canvas text is awkward once you need any real layout behavior:

- multiline wrapping
- predictable box sizing
- reusable label textures
- consistent measurement without DOM fallback

`@shipitandpray/pretext-canvas` handles the layout step first so the rendering step becomes deterministic.

## Features

- `renderText` for multiline text on a 2D canvas
- `renderTextBox` for padded and decorated text cards
- `renderRichText` for simple mixed-style segments
- `createTextAtlas` for reusable label atlases
- `renderTextWebGL` for atlas-backed WebGL drawing

## Install

```bash
npm install @shipitandpray/pretext-canvas @chenglou/pretext
```

## Demo

Live demo:

- `https://shipitandpray.github.io/pretext-canvas/`

The demo renders:

- a boxed hero panel
- wrapped explanatory text
- a generated atlas preview
- another boxed note using the text box helper

## Quick start

```ts
import { renderTextBox } from "@shipitandpray/pretext-canvas";

await renderTextBox(ctx, "Score: 128\nCombo: 04", {
  x: 16,
  y: 16,
  maxWidth: 240,
  font: "16px Inter",
  lineHeight: 22,
  color: "#ffffff",
  backgroundColor: "rgba(19, 34, 56, 0.92)",
  borderRadius: 12,
  padding: { top: 10, right: 12, bottom: 10, left: 12 }
});
```

## API

### `renderText(ctx, text, options)`

Renders wrapped multiline text onto a 2D canvas context.

```ts
await renderText(ctx, "Hello world", {
  x: 24,
  y: 24,
  maxWidth: 320,
  font: "18px Georgia",
  lineHeight: 28,
  color: "#132238",
  textAlign: "left"
});
```

Returns:

- `width`
- `height`
- `lineCount`
- `lines`

### `renderTextBox(ctx, text, options)`

Measures the text, draws the padded box, then draws the text inside it.

Useful for:

- HUD cards
- chart labels
- tooltip callouts
- editorial annotations

### `renderRichText(ctx, options)`

Renders a small mixed-style sequence from segments. The current implementation is intentionally lightweight and is best suited for labels, scores, and short annotations rather than editor-grade rich text.

### `createTextAtlas(texts, font, options)`

Builds a canvas atlas containing one entry per unique text value and returns:

- `canvas`
- `entries`
- `getUV(text)`

Use it when you want to upload labels once and reuse them in a WebGL scene.

### `renderTextWebGL(gl, text, atlas, position, scale)`

Draws an atlas-backed label in WebGL using a small helper pipeline. This is a convenience API for label rendering, not a full scene graph.

## Architectural notes

The package keeps the responsibilities separate:

- Pretext handles wrapping and line measurement
- the 2D helpers draw onto canvas
- the atlas helper packs reusable labels
- the WebGL helper draws atlas-backed quads

That separation keeps the package small and makes each piece easier to adapt.

## Development model

The main implementation choices are:

- use Pretext instead of manual `ctx.measureText()` wrapping logic
- expose async helpers where font readiness matters
- keep atlas packing deterministic and easy to inspect
- keep the WebGL path thin enough to reuse in a larger renderer

## Local development

```bash
npm install
npm run check
npm run build
npm test
```

## GitHub Pages deployment

The repo includes a Pages workflow that:

1. installs dependencies
2. builds the library
3. publishes a static demo built from the generated package output

## Limitations

- `renderRichText` is intentionally simple.
- `renderTextWebGL` is a convenience helper, not a full text engine.
- the atlas packer uses a shelf strategy rather than an optimal bin packer.

## Good fits

Use this package for:

- game HUDs
- data visualization labels
- creative coding overlays
- canvas-based editor chrome

## License

MIT
