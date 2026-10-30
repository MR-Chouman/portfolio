// A fake list endpoint for the /lab demo (T-050, D-044). There is no server:
// requests resolve in the browser over the seeded records after a simulated
// latency, can be aborted like `fetch`, and can be made to fail so the table
// can show its loading, empty and error states (T-051).

import { queryRecords, type ListQuery, type ListResult } from "./query";
import { generateAssets, type Asset } from "./records";

export interface MockApiOptions {
  records?: readonly Asset[]; // default: the seeded records
  latencyMs?: number; // default 400; 0 resolves on the next task
  // Return true to fail a request, e.g. `() => true` for an error state.
  shouldFail?: (request: { query: Partial<ListQuery> }) => boolean;
}

export interface RequestOptions {
  signal?: AbortSignal;
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
  const records = options.records ?? generateAssets();
  const latencyMs = options.latencyMs ?? 400;
  const shouldFail = options.shouldFail ?? (() => false);

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
  };
}
