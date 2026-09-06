# Gill

An AI lecture-narration canvas. Drop in a slide deck and Gill lays it out on an
infinite, pan/zoom chalk canvas — with a WebGL annotation layer on top for a
tutor to write, draw, and highlight as it talks through the material.

Live at **https://jaiteshgill.github.io/Gill/**

## Status

The viewer and the slide-extraction pipeline are complete. The narration layer
is scaffolded — the command schema and the Anthropic client exist, but nothing
generates a lesson yet, so importing a PDF currently logs its extracted slide
map to the console instead of narrating it.

| Area | State |
| --- | --- |
| PDF viewer — vertical page layout, zoom, page navigation, per-page skip | Done |
| Infinite dot-grid canvas + PixiJS annotation layer | Done |
| Slide extraction (text + page images) | Done |
| Dark mode, questions overlay, playback bar shell | Done |
| Tutor plan generation, TTS, timeline playback | Not built |

## Running it

```bash
npm install
npm run dev
```

Other scripts: `npm run build` (typecheck + bundle), `npm run lint`,
`npm run preview`, `npm run deploy` (builds and pushes `dist/` to GitHub Pages).

The Anthropic API key is read from `localStorage` under
`gill_anthropic_api_key`, falling back to `VITE_ANTHROPIC_API_KEY` in a local
`.env`. The Settings panel that would set it isn't wired up yet, so set it by
hand for now. Nothing in the app calls the API at the moment.

## How it works

**Slide extraction.** [`src/lib/extractSlideMap.ts`](src/lib/extractSlideMap.ts)
pulls two things from every PDF page: the machine-readable text, and a rendered
JPEG of the page (longest edge capped at 1600px, sized for a vision model). The
image is what makes diagram- and formula-heavy slides usable — those carry no
extractable text at all, so a text-only pass sees them as empty. Extraction
opens its own pdf.js document so it can't disturb what the viewer is rendering.

**pdf.js setup.** [`src/lib/pdf.ts`](src/lib/pdf.ts) configures the worker in
one place, so any module can import pdf.js without depending on some unrelated
component having been imported first.

**Page navigation.** The viewer measures real page offsets from the DOM rather
than assuming each page slot is exactly one viewport tall. That assumption
breaks at the extremes: the browser clamps `scrollTop` to
`scrollHeight - clientHeight`, so at any zoom below 100% the trailing pages sit
past the clamp and can never be scrolled to or reported as current.

**Command schema.** [`src/types/index.ts`](src/types/index.ts) defines the
vocabulary the tutor layer will speak: `BoardCommand` is a discriminated union
of write / formula / draw / highlight / erase / clear / pause operations, and a
`Timeline` schedules them in milliseconds against word-level TTS timestamps.

## Layout

```
src/
  api/anthropic.ts        Messages API client
  lib/extractSlideMap.ts  PDF → { text, page image } per slide
  lib/pdf.ts              shared pdf.js worker setup
  types/index.ts          slide, board-command, and timeline types
  components/layout/      top bar, center panel, annotation canvas, overlays
  components/ui/          button, slider (Radix + CVA)
```

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · PixiJS 8 · react-pdf /
pdf.js · Radix UI · lucide-react · deployed to GitHub Pages via `gh-pages`.
