import type { Box, TargetId } from "./levels";
export const masters: Record<TargetId, string> = {
  santa: "/objects/santa-master.png",
  reindeer: "/objects/reindeer-master.png",
  tag: "/objects/easytrip-tag-master.png",
  dkv: "/objects/dkv-card-master.png",
};
export type Placement = Box & {
  rotate?: number;
  skew?: number;
  brightness?: number;
  occluders?: Box[];
};
type Mask = { width: number; height: number; alpha: Uint8Array };
const masks = new Map<TargetId, Mask>();
export async function loadMasters() {
  await Promise.all(
    Object.entries(masters).map(async ([key, src]) => {
      if (masks.has(key as TargetId)) return;
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true })!;
      context.drawImage(img, 0, 0);
      const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
      masks.set(key as TargetId, {
        width: canvas.width,
        height: canvas.height,
        alpha: Uint8Array.from(
          { length: canvas.width * canvas.height },
          (_, i) => rgba[i * 4 + 3],
        ),
      });
    }),
  );
}
export function spriteContains(
  id: TargetId,
  b: Placement,
  x: number,
  y: number,
) {
  if (
    b.occluders?.some(
      (o) => x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h,
    )
  )
    return false;
  // Rotate in native artwork pixels, then invert the perspective skew.
  const dx = (x - b.x - b.w / 2) * 1536,
    dy = (y - b.y - b.h / 2) * 1024;
  const angle = ((b.rotate || 0) * Math.PI) / 180,
    cos = Math.cos(angle),
    sin = Math.sin(angle);
  const ry = -sin * dx + cos * dy,
    rx = cos * dx + sin * dy - Math.tan(((b.skew || 0) * Math.PI) / 180) * ry;
  const u = rx / (b.w * 1536) + 0.5,
    v = ry / (b.h * 1024) + 0.5;
  if (u < 0 || v < 0 || u >= 1 || v >= 1) return false;
  const mask = masks.get(id);
  return (
    !!mask &&
    mask.alpha[
      Math.floor(v * mask.height) * mask.width + Math.floor(u * mask.width)
    ] > 100
  );
}
