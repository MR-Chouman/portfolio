// The lab table's data source (T-051): reads the list query from a request
// URL, asks the mock endpoint (D-044) and returns either the page of results
// or an error, so the table keeps its controls when a request fails. Used as
// the /lab route's clientLoader, which React Router re-runs on every URL
// change, including reload and back/forward.

import { createMockApi, type MockApiOptions } from "./api";
import { parseListQuery, type ListQuery, type ListResult } from "./query";
import type { Asset } from "./records";

export type LabTableData =
  | { query: ListQuery; result: ListResult<Asset>; error?: undefined }
  | { query: ListQuery; result?: undefined; error: string };

export interface LabClient {
  load(request: Request): Promise<LabTableData>;
  // Makes the next request fail once, to show the error state.
  failNext(): void;
}

export function createLabClient(
  options: Omit<MockApiOptions, "shouldFail"> = {},
): LabClient {
  let failNext = false;
  const api = createMockApi({
    ...options,
    shouldFail: () => {
      const fail = failNext;
      failNext = false;
      return fail;
    },
  });

  return {
    async load(request) {
      const query = parseListQuery(new URL(request.url).searchParams);
      try {
        const result = await api.listAssets(query, { signal: request.signal });
        return { query, result };
      } catch (error) {
        // A newer navigation replaced this one; React Router ignores it.
        if (request.signal.aborted) throw error;
        return {
          query,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    failNext() {
      failNext = true;
    },
  };
}
