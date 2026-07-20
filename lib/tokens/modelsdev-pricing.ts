import { readFileSync } from "fs";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function sortRecordByKeys<T>(obj: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const key of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
    out[key] = obj[key];
  }
  return out;
}

export type CostBuckets = {
  input?: number;
  output?: number;
  cache_read?: number;
  cache_write?: number;
  reasoning?: number;
};

export type PricingSnapshot = {
  _meta: {
    source: string;
    generatedAt: number;
    providers: string[];
    units: string;
  };
  providers: Record<string, Record<string, CostBuckets>>;
};

const EMPTY_SNAPSHOT: PricingSnapshot = {
  _meta: {
    source: "none",
    generatedAt: 0,
    providers: [],
    units: "USD per 1M tokens",
  },
  providers: {},
};

let SNAPSHOT: PricingSnapshot | null = null;
let MODEL_INDEX: Map<string, string[]> | null = null;

function normalizeSnapshot(raw: unknown): PricingSnapshot | null {
  const root = asRecord(raw);
  if (!root) return null;

  const metaRaw = asRecord(root._meta);
  const providersRaw = asRecord(root.providers);
  if (!metaRaw || !providersRaw) return null;

  const generatedAt = Number(metaRaw.generatedAt);
  if (!Number.isFinite(generatedAt) || generatedAt <= 0) return null;

  const providers: Record<string, Record<string, CostBuckets>> = {};

  for (const providerId of Object.keys(providersRaw)) {
    const modelsRaw = asRecord(providersRaw[providerId]);
    if (!modelsRaw) continue;

    const models: Record<string, CostBuckets> = {};
    for (const modelId of Object.keys(modelsRaw)) {
      const modelRaw = asRecord(modelsRaw[modelId]);
      if (!modelRaw) continue;

      const buckets: CostBuckets = {};
      const input = modelRaw.input;
      const output = modelRaw.output;
      const cacheRead = modelRaw.cache_read;
      const cacheWrite = modelRaw.cache_write;
      const reasoning = modelRaw.reasoning;

      if (typeof input === "number" && Number.isFinite(input)) buckets.input = input;
      if (typeof output === "number" && Number.isFinite(output)) buckets.output = output;
      if (typeof cacheRead === "number" && Number.isFinite(cacheRead)) buckets.cache_read = cacheRead;
      if (typeof cacheWrite === "number" && Number.isFinite(cacheWrite)) {
        buckets.cache_write = cacheWrite;
      }
      if (typeof reasoning === "number" && Number.isFinite(reasoning)) buckets.reasoning = reasoning;

      if (Object.keys(buckets).length > 0) {
        models[modelId] = buckets;
      }
    }

    if (Object.keys(models).length > 0) {
      providers[providerId] = sortRecordByKeys(models);
    }
  }

  const providerList = Object.keys(providers).sort((a, b) => a.localeCompare(b));

  return {
    _meta: {
      source: typeof metaRaw.source === "string" && metaRaw.source ? metaRaw.source : "https://models.dev/api.json",
      generatedAt: Math.trunc(generatedAt),
      providers: providerList,
      units:
        typeof metaRaw.units === "string" && metaRaw.units ? metaRaw.units : "USD per 1M tokens",
    },
    providers: sortRecordByKeys(providers),
  };
}

function loadBundledSnapshotSync(): PricingSnapshot {
  try {
    const url = new URL("./data/modelsdev-pricing.min.json", import.meta.url);
    const raw = readFileSync(url, "utf-8");
    return normalizeSnapshot(JSON.parse(raw)) ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function ensureLoaded(): PricingSnapshot {
  if (SNAPSHOT) return SNAPSHOT;
  SNAPSHOT = loadBundledSnapshotSync();
  return SNAPSHOT;
}

function ensureModelIndex(): Map<string, string[]> {
  if (MODEL_INDEX) return MODEL_INDEX;
  const snap = ensureLoaded();
  const idx = new Map<string, string[]>();

  for (const providerId of Object.keys(snap.providers)) {
    const models = snap.providers[providerId] ?? {};
    for (const modelId of Object.keys(models)) {
      const existing = idx.get(modelId);
      if (existing) existing.push(providerId);
      else idx.set(modelId, [providerId]);
    }
  }

  MODEL_INDEX = idx;
  return idx;
}

export function hasProvider(providerId: string): boolean {
  return !!ensureLoaded().providers[providerId];
}

export function isModelsDevProviderId(providerId: string): boolean {
  return hasProvider(providerId);
}

export function hasModel(providerId: string, modelId: string): boolean {
  const p = ensureLoaded().providers[providerId];
  if (!p) return false;
  return !!p[modelId];
}

export function listProvidersForModelId(modelId: string): string[] {
  const providers = ensureModelIndex().get(modelId) ?? [];
  return [...providers].sort((a, b) => a.localeCompare(b));
}

export function lookupCost(providerId: string, modelId: string): CostBuckets | null {
  const p = ensureLoaded().providers[providerId];
  if (!p) return null;
  const c = p[modelId];
  if (!c) return null;
  return c;
}

export function hasCost(providerId: string, modelId: string): boolean {
  return lookupCost(providerId, modelId) != null;
}
