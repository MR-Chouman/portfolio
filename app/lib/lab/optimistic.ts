// Optimistic rows for the lab's create and edit drawer (T-052, D-047). A save
// shows its result in the table at once, as a pending change laid over the
// loaded rows. After a failure the change is dropped at once: the rows were
// never changed, so dropping it is the rollback. After a success the change
// is "settled" over the rows shown before the reload, and stays until other
// rows (the reloaded ones, which hold it) replace them, so it never flickers
// back to the old values in between.

import type { AssetInput } from "./asset-form";
import type { Asset } from "./records";

// A new asset, shown above the rows until the server gives it an id, or an
// edit, shown in place of the row with the same id.
export type PendingChange = {
  key: string;
  kind: "create" | "update";
  asset: Asset;
  // Saved: the loaded data it is shown over until that data is replaced.
  settledOver?: object;
};

export interface DisplayRow {
  asset: Asset;
  // Waiting for the endpoint: shown, but not editable yet.
  saving: boolean;
  // Created here and not stored yet, so its id is still a placeholder.
  isNew: boolean;
}

// The asset a change will most likely produce. A create gets the change key
// as a placeholder id, which the table never shows.
export function optimisticAsset(
  key: string,
  input: AssetInput,
  now: Date,
  id?: string,
): Asset {
  return { id: id ?? key, ...input, updatedAt: now.toISOString() };
}

export function pendingChange(
  key: string,
  input: AssetInput,
  now: Date,
  id?: string,
): PendingChange {
  const asset = optimisticAsset(key, input, now, id);
  return id === undefined
    ? { key, kind: "create", asset }
    : { key, kind: "update", asset };
}

// The rows to show: new assets first (latest on top), then the loaded rows
// with pending edits applied. The latest edit of a row wins.
export function applyPending(
  rows: readonly Asset[],
  pending: readonly PendingChange[],
): DisplayRow[] {
  const updates = new Map<string, Asset>();
  const created: DisplayRow[] = [];
  for (const change of pending) {
    if (change.kind === "update") updates.set(change.asset.id, change.asset);
    else created.unshift({ asset: change.asset, saving: true, isNew: true });
  }
  return [
    ...created,
    ...rows.map((row) => {
      const edited = updates.get(row.id);
      return edited
        ? { asset: edited, saving: true, isNew: false }
        : { asset: row, saving: false, isNew: false };
    }),
  ];
}

export function dropChange(
  pending: readonly PendingChange[],
  key: string,
): PendingChange[] {
  return pending.filter((change) => change.key !== key);
}

// Marks a saved change: it stays over `data` and goes once `data` is gone.
export function settleChange(
  pending: readonly PendingChange[],
  key: string,
  data: object | undefined,
): PendingChange[] {
  if (data === undefined) return dropChange(pending, key);
  return pending.map((change) =>
    change.key === key ? { ...change, settledOver: data } : change,
  );
}

// The changes still worth showing over `data`: unsaved ones, and saved ones
// whose reload has not arrived yet.
export function liveChanges(
  pending: readonly PendingChange[],
  data: object | undefined,
): PendingChange[] {
  return pending.filter(
    (change) => change.settledOver === undefined || change.settledOver === data,
  );
}
