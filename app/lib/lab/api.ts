// A fake list endpoint for the /lab demo (T-050, D-044). There is no server:
// requests resolve in the browser over the seeded records after a simulated
// latency, can be aborted like `fetch`, and can be made to fail so the table
// can show its loading, empty and error states (T-051). Creates and updates
// (T-052) change an in-memory copy of the records, so they last until the page
// reloads, and validate their input like a real endpoint would.

import { assetInputSchema, type AssetInput } from "./asset-form";
import { queryRecords, type ListQuery, type ListResult } from "./query";
import { formatAssetId, generateAssets, type Asset } from "./records";

export interface MockApiOptions {
  records?: readonly Asset[]; // default: the seeded records
  latencyMs?: number; // default 400; 0 resolves on the next task
  // Return true to fail a request, e.g. `() => true` for an error state.
  shouldFail?: (request: { query: Partial<ListQuery> }) => boolean;
  // The clock for `updatedAt` on creates and updates.
  now?: () => Date;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface MutationOptions extends RequestOptions {
  // Answer this create or update with an error, to show the rollback.
  fail?: boolean;
}

export class MockApiError extends Error {
  constructor(message = "The mock server could not answer. Try again.") {
    super(message);
    this.name = "MockApiError";
  }
}

export interface MockApi {
  listAssets(
    query?: Partial<ListQuery>,
    options?: RequestOptions,
  ): Promise<ListResult<Asset>>;
  getAsset(id: string, options?: RequestOptions): Promise<Asset | undefined>;
  // Resolves with the stored asset, with its new id on a create.
  createAsset(input: AssetInput, options?: MutationOptions): Promise<Asset>;
  updateAsset(
    id: string,
    input: AssetInput,
    options?: MutationOptions,
  ): Promise<Asset>;
}

function abortError(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException("Aborted", "AbortError");
}

// Resolves after `ms`, or rejects as soon as `signal` aborts.
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError(signal));
      return;
    }
    const onAbort = (event: Event) => {
      clearTimeout(timer);
      reject(abortError(event.target as AbortSignal));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function createMockApi(options: MockApiOptions = {}): MockApi {
  // A private copy: mutations never touch the records passed in.
  const records = structuredClone([...(options.records ?? generateAssets())]);
  const latencyMs = options.latencyMs ?? 400;
  const shouldFail = options.shouldFail ?? (() => false);
  const now = options.now ?? (() => new Date());

  // The checks a real endpoint runs before it stores anything.
  function accept(input: AssetInput, fail: boolean | undefined): AssetInput {
    if (fail) throw new MockApiError();
    const parsed = assetInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new MockApiError("The mock server rejected invalid input.");
    }
    return parsed.data;
  }

  function nextId(): string {
    const highest = records.reduce(
      (max, record) => Math.max(max, Number(record.id.slice(4)) || 0),
      0,
    );
    return formatAssetId(highest + 1);
  }

  return {
    async listAssets(query = {}, { signal } = {}) {
      await delay(latencyMs, signal);
      if (shouldFail({ query })) throw new MockApiError();
      return structuredClone(queryRecords(records, query));
    },
    async getAsset(id, { signal } = {}) {
      await delay(latencyMs, signal);
      const asset = records.find((record) => record.id === id);
      return asset && structuredClone(asset);
    },
    async createAsset(input, { signal, fail } = {}) {
      await delay(latencyMs, signal);
      const valid = accept(input, fail);
      const asset: Asset = {
        id: nextId(),
        ...valid,
        updatedAt: now().toISOString(),
      };
      records.push(asset);
      return structuredClone(asset);
    },
    async updateAsset(id, input, { signal, fail } = {}) {
      await delay(latencyMs, signal);
      const valid = accept(input, fail);
      const index = records.findIndex((record) => record.id === id);
      if (index === -1) throw new MockApiError(`No asset with the id ${id}.`);
      const asset: Asset = { id, ...valid, updatedAt: now().toISOString() };
      records[index] = asset;
      return structuredClone(asset);
    },
  };
}
