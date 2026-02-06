/**
 * Outcome to Ops Converter
 *
 * Converts outcome changes to WorldStateOp[] for patching WorldSnapshot.
 */

import type { WorldStateOp } from "@/lib/engine/sdk-bridge";

export interface OutcomeChange {
  metric: string;
  delta: number;
  scope: string;
}

export function outcomeChangesToOps(changes: OutcomeChange[]): WorldStateOp[] {
  return changes.map((change) => ({
    op: "INC",
    path: `/${change.metric}`,
    value: change.delta,
  }));
}

export function createSetOp(path: string, value: unknown): WorldStateOp {
  return { op: "SET", path, value: value as WorldStateOp["value"] };
}

export function createIncOp(path: string, delta: number): WorldStateOp {
  return { op: "INC", path, value: delta };
}

export function createUnsetOp(path: string): WorldStateOp {
  return { op: "UNSET", path };
}

export function createAppendOp(path: string, value: unknown): WorldStateOp {
  return { op: "APPEND", path, value: value as WorldStateOp["value"] };
}

export function createRemoveOp(path: string, index: number): WorldStateOp {
  return { op: "REMOVE", path: `${path}/${index}` };
}
