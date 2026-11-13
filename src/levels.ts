import sceneData from "./scenes.json";
import type { Placement } from "./sprites";
export type TargetId = "santa" | "reindeer" | "tag" | "dkv";
export type Box = { x: number; y: number; w: number; h: number };
export const targets: {
  id: TargetId;
  name: string;
  short: string;
  clue: string;
}[] = [
  {
    id: "santa",
    name: "Santa",
    short: "Santa",
    clue: "Look for the red coat, snowy beard and familiar hat.",
  },
  {
    id: "reindeer",
    name: "Reindeer",
    short: "Reindeer",
    clue: "A four-legged friend with a very distinctive pair of antlers.",
  },
  {
    id: "tag",
    name: "Easytrip toll tag",
    short: "Toll tag",
    clue: "A little cream rectangle with an Easytrip blue centre.",
  },
  {
    id: "dkv",
    name: "DKV fuel card",
    short: "DKV card",
    clue: "A dark blue card with a bright orange DKV mark.",
  },
];
export const FINAL_CODE = "SANTA2026";
export const FORMS_URL = import.meta.env.VITE_FORMS_URL as string | undefined;
export const levels: {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  boxes: Record<TargetId, Placement>;
}[] = sceneData;
export function contains(box: Box, x: number, y: number) {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}
