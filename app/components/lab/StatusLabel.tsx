import type { Asset } from "~/lib/lab/records";
import { cx } from "~/lib/cx";

import { lab } from "../../../content/lab";

// An asset's status (T-051): a small mark and the status name. Shape and
// text carry the status, never color alone: active is filled with the
// accent, maintenance filled grey, reserved dashed, retired square.
export function StatusLabel({ status }: { status: Asset["status"] }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        aria-hidden="true"
        className={cx(
          "size-2 rounded-full border border-fg-muted",
          status === "active" && "border-accent bg-accent",
          status === "maintenance" && "bg-fg-muted",
          status === "reserved" && "border-dashed",
          status === "retired" && "rounded-none",
        )}
      />
      {lab.table.values.status[status]}
    </span>
  );
}
