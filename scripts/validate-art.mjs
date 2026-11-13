import fs from "node:fs";
const scenes = ["market", "resort", "workshop", "toll-plaza"];
if (!fs.existsSync("public/home/christmas-search.png"))
  throw Error("Missing illustrated homepage: public/home/christmas-search.png");
for (const filename of [
  "santa-master",
  "reindeer-master",
  "easytrip-tag-master",
  "dkv-card-master",
]) {
  const path = `public/objects/${filename}.png`;
  if (!fs.existsSync(path))
    throw Error(`Missing canonical target artwork: ${path}`);
  const bytes = fs.readFileSync(path);
  if (bytes.subarray(1, 4).toString() !== "PNG" || bytes[25] !== 6)
    throw Error(`Target must be a transparent RGBA PNG: ${path}`);
  console.log(`${filename}: canonical RGBA sprite present`);
}
for (const id of scenes) {
  const path = `public/scenes/${id}.png`;
  if (!fs.existsSync(path))
    throw new Error(
      `Missing FINAL scene artwork: ${path}. Concept previews must not be substituted.`,
    );
  const bytes = fs.readFileSync(path);
  if (bytes.subarray(1, 4).toString() !== "PNG")
    throw new Error(`Invalid PNG: ${path}`);
  const width = bytes.readUInt32BE(16),
    height = bytes.readUInt32BE(20);
  if (width < 1500 || height < 1000)
    throw new Error(`Scene resolution too low: ${id} ${width}×${height}`);
  if (Math.abs(width / height - 1.5) > 0.01)
    throw Error(`Scene must use the 3:2 artwork coordinate system: ${id}`);
  console.log(
    `${id}: ${width}×${height}, ${(bytes.length / 1024 / 1024).toFixed(1)} MB`,
  );
}
