/**
 * SDK Bridge
 *
 * Re-exports from @f2f-engine/sdk and defines app-specific types.
 * All engine types should be imported from this file, not directly from SDK.
 */

// SDK class & function re-exports
export { F2FClient } from "@f2f-engine/sdk";
export { F2FHttpError } from "@f2f-engine/sdk";
export { checkExperienceCapabilities } from "@f2f-engine/sdk";

// SDK type re-exports (only types actually exported from SDK index)
export type {
  Experience,
  ExperienceLite,
  Fact,
  GameSchema,
  WorldSnapshot,
  WorldSnapshotPatch,
  WorldStateOp,
  Capabilities,
  StreamEvent,
  SseEvent,
  StreamEventType,
  LoopStateUpdate,
  EngineError,
  TickMode,
  TickResponse,
  TickRequest,
  SchemaSpec,
  FactVerbSpec,
  PayloadSpec,
  ExperienceQuery,
  JsonObject,
  JsonValue,
  JsonPrimitive,
  IngestFactsRequest,
  IngestFactsResponse,
  StartSessionRequest,
  StartSessionResponse,
  SetWorldSnapshotRequest,
  SetWorldSnapshotResponse,
  PatchWorldSnapshotRequest,
  PatchWorldSnapshotResponse,
  SetCapabilitiesRequest,
  SetCapabilitiesResponse,
  SetGameSchemaRequest,
  SetGameSchemaResponse,
  SetSessionRuntimeConfigRequest,
  SetSessionRuntimeConfigResponse,
  Trace,
  CapabilityCheckResult,
} from "@f2f-engine/sdk";

// ============== Types not exported by SDK index (defined locally) ==============

export interface ShortMessage {
  message: string;
}

export interface Signal {
  type: string;
  value: number;
  delta: number;
  window_seconds: number;
}

export interface SignalBundle {
  session_id: string;
  ts: string;
  signals: Signal[];
}

export interface SessionRuntimeTiming {
  decision_period_seconds?: number;
  idle_threshold_seconds?: number;
  fact_timeout_seconds?: number;
  f2f_timeout_seconds?: number;
}

export interface SessionRuntimeTriggers {
  decision_verbs?: string[];
  passthrough_verbs?: string[];
}

export interface SessionRuntimeOutput {
  short_message?: boolean;
  include_state_events?: boolean;
}

export interface SessionRuntimeConfig {
  timing?: SessionRuntimeTiming;
  triggers?: SessionRuntimeTriggers;
  output?: SessionRuntimeOutput;
  system_prompt_override?: string;
}

// ============== App-Specific Types ==============

export type SSEConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export type LoopStatus = "WAIT" | "DECIDE" | "GENERATE" | "PAUSE" | "ERROR";

export interface Choice {
  choice_id: string;
  label: string;
  description?: string;
  type?: string;
}

export interface GameMessage {
  id: string;
  type: "system" | "player" | "npc" | "experience" | "consequence";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface GameState {
  hp: number;
  maxHp: number;
  gold: number;
  location: string;
  reputation: number;
  flags: Record<string, boolean>;
}

// ============== Payload Extraction Helpers ==============

import type { JsonObject } from "@f2f-engine/sdk";

/**
 * Extract choices array from Experience payload
 */
export function extractChoices(payload?: JsonObject): Choice[] {
  if (!payload || !Array.isArray(payload.choices)) return [];
  return (payload.choices as unknown[]).filter(
    (c): c is Choice =>
      typeof c === "object" &&
      c !== null &&
      "choice_id" in c &&
      "label" in c
  );
}

/**
 * Extract clues array from Experience payload
 */
export function extractClues(payload?: JsonObject): string[] {
  if (!payload || !Array.isArray(payload.clues)) return [];
  return (payload.clues as unknown[]).map((clue) => {
    if (typeof clue === "string") return clue;
    if (typeof clue === "object" && clue !== null && "content" in clue) {
      return String((clue as { content: unknown }).content);
    }
    return String(clue);
  });
}

/**
 * Extract a typed field from Experience payload
 */
export function extractPayloadField<T>(payload: JsonObject | undefined, field: string): T | undefined {
  if (!payload || !(field in payload)) return undefined;
  return payload[field] as T;
}
