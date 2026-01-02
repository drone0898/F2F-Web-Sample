/**
 * Outcome to Ops Converter
 *
 * Converts OutcomeChange[] to WorldStateOp[] for patching WorldSnapshot.
 */

import type { OutcomeChange, WorldStateOp } from "@/lib/engine/types";

/**
 * Convert OutcomeChange array to WorldStateOp array
 * Uses INC operation for numeric deltas
 */
export function outcomeChangesToOps(changes: OutcomeChange[]): WorldStateOp[] {
  return changes.map((change) => ({
    op: "INC" as const,
    path: `/${change.metric}`,
    value: change.delta,
  }));
}

/**
 * Create a SET operation for a specific path
 */
export function createSetOp(path: string, value: unknown): WorldStateOp {
  return { op: "SET", path, value };
}

/**
 * Create an INC operation for a numeric value
 */
export function createIncOp(path: string, delta: number): WorldStateOp {
  return { op: "INC", path, value: delta };
}

/**
 * Create an UNSET operation to remove a key
 */
export function createUnsetOp(path: string): WorldStateOp {
  return { op: "UNSET", path };
}

/**
 * Create an APPEND operation for arrays
 */
export function createAppendOp(path: string, value: unknown): WorldStateOp {
  return { op: "APPEND", path, value };
}

/**
 * Create a REMOVE operation for array elements
 */
export function createRemoveOp(path: string, index: number): WorldStateOp {
  return { op: "REMOVE", path: `${path}/${index}` };
}
