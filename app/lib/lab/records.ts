// Seeded fake records for the /lab demo (T-050, D-044). Every value is
// invented: an equipment inventory of a made-up operations company, with no
// people, customers or orders in it. A seeded generator and a fixed base date
// make the list identical on every build, prerender and test run.

export const ASSET_STATUSES = [
  "active",
  "maintenance",
  "reserved",
  "retired",
] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const ASSET_CATEGORIES = [
  "vehicle",
  "machinery",
  "it",
  "tooling",
  "safety",
] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const ASSET_SITES = [
  "North depot",
  "Harbor yard",
  "Central warehouse",
  "East workshop",
  "Hill station",
] as const;
export type AssetSite = (typeof ASSET_SITES)[number];

export interface Asset {
  id: string; // "AST-0001"
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  site: AssetSite;
  value: number; // whole currency units
  updatedAt: string; // ISO 8601, UTC
}

export const DEFAULT_SEED = 50;
export const DEFAULT_RECORD_COUNT = 240;

// Records are dated within the year before this instant, never "now", so the
// prerendered HTML does not change between builds.
const BASE_DATE = Date.UTC(2026, 9, 1);

// mulberry32: a small, fast PRNG with a 32-bit state. Returns [0, 1).
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const MODELS: Record<AssetCategory, readonly string[]> = {
  vehicle: ["Forklift", "Pallet truck", "Utility van", "Tow tractor"],
  machinery: ["Compressor", "Generator", "Conveyor", "Pump unit"],
  it: ["Rugged tablet", "Label printer", "Barcode scanner", "Field laptop"],
  tooling: ["Torque wrench set", "Drill kit", "Welding set", "Lift jack"],
  safety: ["Harness kit", "Gas detector", "First aid station", "Fire cart"],
};

// Rough value range per category, in whole currency units.
const VALUE_RANGE: Record<AssetCategory, [number, number]> = {
  vehicle: [8_000, 60_000],
  machinery: [2_500, 40_000],
  it: [300, 3_000],
  tooling: [150, 4_000],
  safety: [100, 2_500],
};

// Status weights: most equipment is in use.
const STATUS_WEIGHTS: [AssetStatus, number][] = [
  ["active", 0.6],
  ["maintenance", 0.15],
  ["reserved", 0.15],
  ["retired", 0.1],
];

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)] as T;
}

// The weights sum to 1; a roll left over by rounding takes the last item.
function pickWeighted<T>(
  random: () => number,
  weighted: readonly [T, number][],
  fallback: T,
): T {
  let roll = random();
  for (const [item, weight] of weighted) {
    if (roll < weight) return item;
    roll -= weight;
  }
  return fallback;
}

export function formatAssetId(n: number): string {
  return `AST-${String(n).padStart(4, "0")}`;
}

// `count` invented assets, the same for the same seed.
export function generateAssets(
  count: number = DEFAULT_RECORD_COUNT,
  seed: number = DEFAULT_SEED,
): Asset[] {
  const random = createRandom(seed);
  const unitNumbers = new Map<string, number>();
  const assets: Asset[] = [];
  for (let i = 1; i <= count; i++) {
    const category = pick(random, ASSET_CATEGORIES);
    const model = pick(random, MODELS[category]);
    const unit = (unitNumbers.get(model) ?? 0) + 1;
    unitNumbers.set(model, unit);
    const [min, max] = VALUE_RANGE[category];
    // Rounded to tens so the table reads like an inventory, not noise.
    const value = Math.round((min + random() * (max - min)) / 10) * 10;
    const minutesAgo = Math.floor(random() * 365 * 24 * 60);
    assets.push({
      id: formatAssetId(i),
      name: `${model} ${String(unit).padStart(2, "0")}`,
      category,
      status: pickWeighted(random, STATUS_WEIGHTS, "retired"),
      site: pick(random, ASSET_SITES),
      value,
      updatedAt: new Date(BASE_DATE - minutesAgo * 60_000).toISOString(),
    });
  }
  return assets;
}
