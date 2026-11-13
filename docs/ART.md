# Final art pipeline — canonical targets and target-free plates

The latest redesign supersedes the earlier baked-in-object pipeline. The four canonical transparent assets are the single source of truth for BOTH gameplay and checklist icons. Backgrounds were edited separately to remove all baked-in targets; no target is regenerated independently per level.

## Files and provenance

All eight final raster assets were produced with the built-in `image_gen` tool and saved into this workspace:

| Asset                                    | Native pixels | Role                                 |
| ---------------------------------------- | ------------- | ------------------------------------ |
| `public/objects/santa-master.png`        | 1148×1370     | Canonical Santa, transparent RGBA    |
| `public/objects/reindeer-master.png`     | 1220×1289     | Canonical reindeer, transparent RGBA |
| `public/objects/easytrip-tag-master.png` | 1682×935      | Canonical tag, transparent RGBA      |
| `public/objects/dkv-card-master.png`     | 1579×996      | Canonical card, transparent RGBA     |
| `public/scenes/market.png`               | 1536×1024     | Target-free Christmas market         |
| `public/scenes/resort.png`               | 1536×1024     | Target-free ski resort               |
| `public/scenes/workshop.png`             | 1536×1024     | Target-free workshop                 |
| `public/scenes/toll-plaza.png`           | 1536×1024     | Target-free motorway                 |

The tag/card generation calls used the supplied product photographs as explicit design references. Their illustrated housing, blue label, navy waves and orange DKV mark are consistent in every scene. No account numbers or expiry dates appear on the card. Native background masters remain below the preferred 3000px size; no enlargement is represented as an original higher-resolution illustration. The separate high-resolution masters keep target branding readable at maximum zoom.

## Canonical generation prompt set

All prompts required transparent backgrounds, one isolated complete object, minimal padding, clean dark ink outlines, vivid flat 2D cartoon colours, simple cel shading, and no scenery, border, photographic rendering, 3D or painterly effects.

- **Santa:** full-body three-quarter standing view facing slightly right, friendly plump old man, white curly beard, red coat/trousers/hat with white fur, black belt, brass buckle, black boots; one hand holding a small brown sack, other relaxed. Miniature crowd-character proportions, entire figure visible. This exact sprite is reused in all four levels and their checklists. The redesigned homepage uses a separate decorative Santa detective illustration.
- **Reindeer:** complete side view facing right, head slightly turned to viewer; warm brown coat, cream chest/tan muzzle, four slender legs/hooves, branching antlers, red collar with a tiny golden bell, friendly eyes, no red nose. Consistent original cartoon design, whole silhouette visible.
- **Easytrip:** supplied photo is a product reference only; light-grey rounded rectangular housing, broad blue inset label, width/height about 1.8:1, front view, no rotation, slight bevel in flat cel shading. Correct white `easytrip.ie` wordmark and orbit mark inside the label. Omit phone number. No text outside object. Reuse this exact asset inside windscreens.
- **DKV:** supplied photo is a product reference only; standard payment-card ratio 1.586:1, navy rounded rectangle, broad bright/medium blue waves, orange square at top-right containing white oval and navy DKV letters. Straight front view. NO account numbers, expiry dates, personal fields or other text. Reuse this exact asset at credit-card scale.

## Background-only edit prompt set

Each call referenced the existing corresponding cartoon scene as the edit target. Preserve composition, busy crowds, red coats/hats, hundreds of small props, fine ink linework and colourful flat cartoon style. Remove all four baked-in targets and restore plausible scenery. Shared sprites are added later. No Santa, live reindeer, Easytrip tags or DKV cards may remain in the plate.

- **Market:** replace Santa at x40% y45% with ordinary dark-haired woman in red winter coat; replace live reindeer at x74% y33% with stacked brown sacks and a small rocking horse; remove tag at x24% y62% restoring blue car glass; remove card at x65% y60% restoring wood among papers.
- **Resort:** replace Santa at x20% y59% with ordinary red-coated dark-bearded skier; replace live reindeer at x63% y47% with crate of rolled blankets; remove shuttle tag at x55% y80% restoring glass; remove rental-counter card at x90% y62% restoring papers/counter.
- **Workshop:** replace white-bearded Santa at x42% y48% with ordinary red-uniform dark-haired elf; replace reindeer at x20% y64% with hay bales/crates in stable doorway; remove tag at x83% y59% from van glass; remove card at x76% y31% from office desk.
- **Motorway:** replace Santa at x70% y41% with ordinary grey-haired woman in red winter coat; replace reindeer at x36% y60% with toy train/gifts; remove tag at x47% y40% from blue car glass; remove held card at x86% y70% and redraw empty hand gesturing naturally toward the counter.

## Integration and visual review

Placements are authored in native 1536×1024 artwork coordinates in `scripts/map-targets.mjs` and normalized into `src/scenes.json`. Sprite PNG aspect ratios are preserved. Product widths are 14–17 native artwork pixels; Santa heights are approximately 45–73 pixels. These are intentionally hard to spot at the initial view. No target glows before discovery.

Santa appears behind a market stall, lodge balcony railing, workshop gallery and choir crowd. Reindeer blend behind sacks, blankets, hay bales and gifts. All tags are inside actual vehicle windscreens. Cards lie among papers, on counters, or at a payment reader. Per-scene brightness and product rotation/perspective connect them to their surroundings. Foreground patches come from the exact background plate, so they cover target pixels without adding mismatched scenery.

`spriteContains` inverses the same rotation/skew used by `WorldTargets`, samples the shared PNG's actual alpha and rejects foreground-occluded regions. An empty corner of a sprite rectangle cannot award a find. Targets render in the same scene transform as the background, so camera changes preserve alignment.

All four target-free plates, all four complete master sprites, all four final layered composites, sixteen close-up crops and maximum-zoom product views were visually inspected. The first placement pass put some characters on top of props; final placements lower them behind counters/crates/crowds. Alpha and foreground exclusion were then tested through real pointer interactions.

Evidence (contains spoilers): `docs/qa/redesign-*-desktop.png`, `redesign-*-mobile.png`, `*-composite.png`, `*-targets.png` and `*-*-zoom.png`. Regenerate with `node scripts/capture-review.mjs` followed by `python scripts/inspect-targets.py`. QA files and source reference boards are not copied to the production build.

The code and clipboard flow are verified. The intended 5–10 minute casual difficulty remains a design aim, rather than a measured participant-study result.

## Reference-inspired homepage

Responsive update: the homepage now uses a `<picture>` source selected by viewport orientation. Landscape screens use `public/home/christmas-search.png`; portrait screens use the newly generated `public/home/christmas-search-portrait.png`. Both preserve their complete artwork with `object-fit: contain`; a soft scenic continuation fills the remaining viewport. Portrait content moves upwards to leave the Santa/lantern foreground visible. The portrait prompt requested a 9:16 recomposition of the landscape art, Santa detective lower-left, lanterns/gifts lower-right, aurora/moon above, quiet central space and no embedded text or UI. Built-in image generation was used, and the selected output was copied into the project.

`public/home/christmas-search.png` is a new native **1672×941** landing background, generated with the built-in image tool. Prompt: premium illustrated Christmas browser-game landing screen; wide 16:9; richly coloured polished storybook cartoon; snowy alpine village at night; deep midnight sky, teal aurora, moon and distant sleigh; snowy evergreen branches framing the top; amber-lit timber chalets and market stalls around the edges; large friendly Santa detective holding a brass magnifying glass at lower left; glowing brass lanterns, gifts, holly and snow at lower right. Leave the centre/right quiet for HTML content. No text, logos, UI buttons or parchment panels in the image.

The wooden gold title, red ribbon, mission parchment, Top Secret stamp, canonical target cards and green start button are actual responsive HTML/CSS. Easytrip was removed from the logo, while the toll-tag object's actual branding remains intact. Keyboard discovery and sound toggles were removed by request. Homepage screenshots: `docs/qa/new-home-desktop.png`, `new-home-mobile.png`, `new-home-small-mobile.png`.
