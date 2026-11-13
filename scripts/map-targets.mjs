import fs from "node:fs";
// Native 1536x1024 artwork coordinates. Source PNG proportions are preserved.
// x,y,width,height,rotation,perspective-skew,scene-lighting, foreground-patches.
const placements = {
  market: {
    santa: [612, 349, 61, 73, 0, 0, 0.94, [[612, 389, 61, 37]]],
    reindeer: [1080, 325, 68, 72, 0, 0, 0.91, [[1080, 365, 68, 40]]],
    tag: [357, 627, 16, (16 * 935) / 1682, -5, 0, 0.85],
    dkv: [981, 608, 17, (17 * 996) / 1579, -5, -14, 0.94],
  },
  resort: {
    santa: [755, 271, 38, (38 * 1370) / 1148, 0, 0, 0.88, [[755, 301, 38, 20]]],
    reindeer: [
      944,
      448,
      68,
      (68 * 1289) / 1220,
      0,
      0,
      0.94,
      [[944, 485, 68, 29]],
    ],
    tag: [818, 801, 17, (17 * 935) / 1682, 3, 0, 0.83],
    dkv: [1381, 625, 15, (15 * 996) / 1579, 8, -17, 0.95],
  },
  workshop: {
    santa: [514, 218, 45, (45 * 1370) / 1148, 0, 0, 0.9, [[514, 259, 45, 21]]],
    reindeer: [
      266,
      594,
      86,
      (86 * 1289) / 1220,
      0,
      0,
      0.85,
      [[266, 647, 86, 80]],
    ],
    tag: [1245, 611, 14, (14 * 935) / 1682, 5, 0, 0.82],
    dkv: [1170, 311, 14, (14 * 996) / 1579, -12, -18, 0.9],
  },
  "toll-plaza": {
    santa: [
      1357,
      383,
      47,
      (47 * 1370) / 1148,
      0,
      0,
      0.94,
      [[1357, 424, 47, 25]],
    ],
    reindeer: [
      530,
      548,
      59,
      (59 * 1289) / 1220,
      0,
      0,
      0.9,
      [[530, 602, 59, 30]],
    ],
    tag: [716, 405, 15, (15 * 935) / 1682, 0, 0, 0.82],
    dkv: [1350, 734, 14, (14 * 996) / 1579, 3, -20, 0.9],
  },
};
const scenes = JSON.parse(fs.readFileSync("src/scenes.json", "utf8"));
for (const scene of scenes)
  for (const [id, p] of Object.entries(placements[scene.id])) {
    const [x, y, w, h, rotate, skew, brightness, patches] = p;
    scene.boxes[id] = {
      x: x / 1536,
      y: y / 1024,
      w: w / 1536,
      h: h / 1024,
      rotate,
      skew,
      brightness,
      ...(patches
        ? {
            occluders: patches.map(([x, y, w, h]) => ({
              x: x / 1536,
              y: y / 1024,
              w: w / 1536,
              h: h / 1024,
            })),
          }
        : {}),
    };
  }
fs.writeFileSync("src/scenes.json", JSON.stringify(scenes, null, 2) + "\n");
