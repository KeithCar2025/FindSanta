# Operation: Find Santa

A static React + TypeScript Christmas hidden-object game. Four original cartoon search scenes, sixteen discoveries, saved progress and completion code `SANTA2026`. No accounts, backend, tracking, remote fonts or runtime API calls.

## Run and build

Requires Node 22.12+.

```sh
npm install
npm run dev
npm run build
npm run preview
```

Development: http://localhost:5173. Production output: `dist/`. Build validates all four background PNGs and all four transparent canonical sprites, and fails explicitly if artwork is missing. Starter concepts and mood boards are never loaded by the game.

## Deploy to Vercel

Import this directory as a Vite project, or run `npx vercel` in an authenticated terminal. Build command: `npm run build`. Output: `dist`. `vercel.json` is included. The project has been built locally; it has not been published to a hosting account.

Set `VITE_FORMS_URL` to the actual HTTPS Microsoft Forms URL in `.env.local` or Vercel environment settings, then rebuild. Without a URL the button stays hidden. Change `FINAL_CODE` in `src/levels.ts` to change the code. As a client-side competition game, the code is visible in the bundle; it is not an authentication secret.

## Play

- Click/tap targets; incorrect clicks have no penalty. Targets can be awarded once.
- Wheel/pinch to zoom up to 8×; drag to explore even at the starting zoom. The scene initially covers the viewport without stretching, so its edges may be beyond the frame: pan to inspect the whole illustration. Wheel zoom follows the pointer. The frame button and resize reset the view. Camera limits prevent blank areas appearing at the edges.
- Hints unlock after 30 active seconds per scene, show one remaining target's approximate region for two seconds, then cool down for ten seconds.
- Keyboard discovery and sound toggles have been removed. Standard game controls retain visible keyboard focus. Discovery chimes are synthesized locally after interaction; no audio plays on initial page load. Reduced motion removes particles and animations.
- Progress saves under `find-santa-v1` in localStorage, preserving existing saves. Pause stops hint timing, and Save & return to opening keeps your finds. Resume returns to the current location. Play Again / Start Over resets progress.

## Artwork and hitboxes

Background-only plates: `public/scenes/{market,resort,workshop,toll-plaza}.png`, **1536×1024 native**. Baked-in targets were removed. The preferred 3000px+ background master size was not produced by the generator. No upscaled concept is represented as a higher-resolution original. See `docs/ART.md` for the revised pipeline and review.

Canonical targets, reused unchanged in all four scenes AND the checklist, are `public/objects/santa-master.png`, `reindeer-master.png`, `easytrip-tag-master.png`, and `dkv-card-master.png`. They are high-resolution transparent PNGs, so their branding remains legible when zoomed in. The tag and card were generated from the supplied product-photo references, without card numbers or dates.

`WorldTargets.tsx` places them in one SVG coordinate system matching the 1536×1024 artwork. Only scale, rotation, perspective skew and scene brightness vary. Native background patches restore the foreground over characters (counters, railings, crates, crowds), embedding them behind the scenery. Targets do not glow before discovery.

`src/scenes.json` stores normalized `{x,y,w,h,rotate,skew,brightness,occluders}`. `sprites.ts` decodes the master PNG alpha masks. Pointer coordinates are transformed back from rendered image bounds, then inverse-rotated and inverse-skewed into the source sprite. Transparent pixels and occluded foreground regions never count. Movement over six pixels is a drag, not a find; multi-touch gestures suppress clicks. This same transform is used for rendering and testing, rather than coordinates copied from a previous image version.

To replace art:

1. Supply a finished, target-free background at the scene path. Never independently regenerate targets inside it.
2. Update placements and foreground patch rectangles in `scripts/map-targets.mjs`, then run `node scripts/map-targets.mjs`, or edit normalized `src/scenes.json` directly. Preserve the master PNGs' aspect ratios. Replacing a master intentionally updates it in all four levels and the HUD.
3. With the dev server running on port 5173, run `node scripts/capture-review.mjs` to record the actual layered composites, fullscreen desktop/mobile views and maximum-zoom target crops. Then run `python scripts/inspect-targets.py` (Pillow required) for spoiler contact sheets. Visually inspect every target, its scale and occlusion.
4. Open `http://localhost:5173/?debug` to check rectangles. Debug is available **only in development**.
5. Run tests and inspect screenshots. Passing coordinate tests alone does not prove an object is visibly present.

## QA

```sh
npx playwright install chromium
npm test
```

Seven tests cover all sixteen targets individually at 1440×900 and 390×844 using real zoom/pan, canonical asset consistency, transparent/occluded/outside misses, duplicate prevention, progression, refresh/resume, clipboard/code, hints, pause timing, removed-control checks, reduced motion, resize, missing-art errors and touch pinch/drag/tap. Fullscreen/no-scroll/camera coverage checks also cover 1920×1080, 1366×768, 1024×768 and 768×1024. Screenshots go to `test-results/`. Spoiler sheets in `docs/qa/` are excluded from the published build.

6–10 minute completion is a design target, not a measured user-study result. Check difficulty with real players before launch. Clipboard writing requires localhost or HTTPS; on denial the code remains selectable with a manual-copy instruction. All runtime files are local; an installed local checkout can run without internet after dependencies are installed.
