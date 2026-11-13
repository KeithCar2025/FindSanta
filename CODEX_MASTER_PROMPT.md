# CODEX MASTER PROMPT — OPERATION: FIND SANTA

You are a senior creative director, game UI engineer, front-end developer, QA engineer and visual artist. Build a complete, polished, deployable Christmas hidden-object browser game in THIS folder. Do not stop at scaffolding or a design proposal. Implement, run, test and fix it.

## Concept
Title: OPERATION: FIND SANTA. This is a fictional internal Easytrip Ireland 12 Days of Christmas competition, inspired by classic busy hidden-object illustrations, but using ORIGINAL art and UI. Intended playtime 6–10 minutes maximum. Four consecutive scenes: (1) Christmas Market, (2) Snowy Ski Resort, (3) North Pole Workshop, (4) Christmas Motorway Mayhem, including a toll plaza. Every scene contains exactly FOUR hidden targets: Santa, a reindeer, an Easytrip toll tag and a DKV fuel card. Total 16 finds. All targets must be actually visible and reasonably recognizable, but integrated naturally into the same illustrative style as the background. Difficulty increases gently. This must feel like a premium professionally art-directed Christmas mini-game, not a generic dashboard or template.

## Art references and integrity
`assets/branding/easytrip-tag-reference.jpg` and `assets/branding/dkv-card-reference.webp` are provided real product photos. Use them to stylize the tag/card in the artwork. Do not reproduce actual-looking account numbers or expiry dates on the stylized card; preserve broad recognizable shape, colors, and DKV mark. `assets/references/` contains two AI-generated MOOD BOARDS only. `assets/scenes/previews/` contains LOW-RES CROPPED CONCEPTS only, not final level artwork. Do not pretend those are production scenes. Produce or integrate four original, coherent, high-resolution (ideally >=3000px wide) level backgrounds. If you cannot generate finished art using available tools, implement a clean asset pipeline with clear missing-asset errors and report honestly what art still needs to be supplied; do not silently ship blurred previews or randomly pasted mismatched PNGs. Build a consistent illustrated visual language, rich but legible.

## Non-negotiable scene quality
Santa, reindeer, tag, DKV card must be visually present in EACH scene. Do not merely add transparent overlay objects that hover above scenery. Compose each object into a plausible location: e.g., Santa behind a market stall, reindeer near a ski lodge, toll tag on a vehicle windscreen, fuel card on a counter or dashboard. Ensure all four are visible at reasonable zoom. Objects must NOT be hidden by the fixed HUD. The correct hitbox MUST match the rendered object on every screen size, zoom and pan setting. Store hitboxes as normalized coordinates in scene-image space, not viewport pixels; author them only after final art is approved. Add an optional developer debug overlay to show/test hitboxes, disabled in production.

## Experience
Cinematic, skippable 5–8 second intro: aurora over snowy mountains, gentle snow particles, subtle camera parallax, logo/title reveal, sparkling light sweep, tasteful festive music if available, and one large Start Mission CTA. Respect reduced motion and muted browsers; offer a sound toggle. Intro copy: “Santa has been spotted across four locations. Find Santa, a reindeer, an Easytrip toll tag and a DKV fuel card in each scene to complete your mission.”

Transition to level 1 with a premium illustrated location title card, then reveal the scene. On desktop, the image is the main focus; slim glassy HUD shows Level X/4, title, Found X/4, four visually distinctive target cards/icons, hint button, sound toggle, and progress. On mobile, keep image large and move targets to a compact dock. Zoom with +/−, wheel/pinch, pan by dragging when zoomed; clicking/tapping a target must never be confused with panning. Fit-to-screen control. Support touch and mouse, and accessible non-pointer alternative via target discovery list or keyboard navigation without exposing coordinates.

On correct find: immediately mark the corresponding target found, play restrained sparkle/halo burst centered on the actual object, gentle sound/chime and optional haptic if available; animate that object's HUD tile into a green/gold ticked-off state, show “SANTA FOUND!” etc. Do not re-award the same target. On incorrect click: subtle ripple only, no penalty. Hint button becomes available after 30 seconds per scene and gently pulses around the approximate area of ONE remaining target for 2 seconds; unlimited hints are acceptable to ensure completion under 10 minutes, with a short cooldown. No timer countdown, no lives, no lockout, no stressful scoring. Display elapsed time optionally but do not penalize pauses.

When 4/4 found: a short celebratory animation, all four checkmarks, then Next Location button. On the fourth scene, present a dramatic but tasteful mission-complete sequence: aurora, snow, golden sparkles, 16/16 recovered, and final fixed code **SANTA2026**. Large copy-code button with clipboard feedback, explanatory instruction to enter code into Microsoft Forms, and a configurable “Open Microsoft Forms” link (if URL not supplied, hide button instead of inventing URL). Include Play Again. Store local progress in localStorage and allow Resume or Start Over, but never require sign-in.

## Implementation
React + TypeScript + Vite; simple CSS/Canvas/SVG animations, minimal dependencies. Static hosting Vercel, no backend/database/authentication/API calls. Build clean reusable components, levels data config, hitbox geometry, sound module, reduced-motion support, loading states, responsive styling, error boundaries. Use requestAnimationFrame where needed and avoid heavyweight particle engines. Do not embed copyrighted music; use original lightweight synthesized SFX or locally authored audio. Avoid autoplay audio without interaction. Ensure text contrast, focus indicators, semantic controls, and mobile usability. All four levels and final code must work even if the page is refreshed.

## QA acceptance
- Four finished scenes, each with exactly four actually visible, clickable, integrated targets (16 total).
- All hitboxes aligned correctly at desktop 1440x900, mobile 390x844, after zoom/pan, and when resized.
- Click, drag, touch and pinch interactions behave correctly.
- Each target checks off once, found animation works, hints reveal correct region, levels advance only at 4/4.
- Full experience fits typical 6–10 minute casual play.
- Completion code SANTA2026 copied successfully.
- Vite production build passes, no console errors, no missing files, no placeholder stock imagery passed off as final art.
- README documents start/build/deploy and how to swap art, update hitboxes and change final code/forms URL.

## Working instructions
Start by inspecting all supplied assets. Build the game fully. Run it, inspect screenshots, and fix issues. If art generation is not available in your environment, implement and test the complete game engine with explicitly labeled temporary scenes, then list precisely the missing final art rather than falsely claiming the project is finished. Provide a concise completion report with actual tests run and any remaining blockers.
