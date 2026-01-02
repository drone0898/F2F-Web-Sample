/**
 * F2F-Engine TypeScript Type Definitions
 * Based on: /Users/taeheunkim/F2F-Engine/src/f2f_engine/models.py
 */

// ============== Core Types ==============

export type FactType = "ACTION" | "STATE_CHANGE" | "SYSTEM" | "WORLD";
export type SignalType = "TENSION" | "REPETITION" | "STAGNATION" | "DIFFICULTY" | "PROGRESS";
export type TickMode = "slow" | "lite" | "both";

// ============== Data Models ==============

export interface Fact {
  fact_id: string;
  session_id: string;
  ts: string; // ISO 8601
  type: FactType;
  subject_id: string;
  verb: string;
  object_id?: string;
  attributes: Record<string, unknown>;
  confidence?: number;
  tags: string[];
}

export interface Signal {
  type: SignalType;
  value: number; // 0.0 ~ 1.0
  delta: number;
  window_seconds: number;
}

export interface SignalBundle {
  session_id: string;
  ts: string;
  signals: Signal[];
}

export interface Clue {
  clue_id: string;
  type: string;
  content: string;
  target_id?: string;
}

export interface OutcomeChange {
  metric: string;
  delta: number;
  scope: string;
}

export interface Outcome {
  narrative: string;
  changes: OutcomeChange[];
}

export interface ChoiceResult {
  choice_id: string;
  directive_id: string;
  success: boolean;
  outcome: Outcome;
  applied_at: string;
}

export interface Choice {
  choice_id: string;
  label: string;
  description?: string;
  type?: string;
}

export interface Directive {
  directive_id: string;
  session_id: string;
  created_at: string;
  primary_verb: string;
  objective_text: string;
  choices: Choice[];
  clues: Clue[];
  consequence_template: string;
  ttl_seconds: number;
  content_tags: string[];
  payload: Record<string, unknown>;
  explain: Record<string, unknown>;
  source_candidate_id?: string;
}

export interface DirectiveLite {
  id: string;
  session_id: string;
  ts: string;
  action: string;
  hint: string;
  ttl_seconds: number;
  priority: number;
  content_tags: string[];
}

export interface EventCandidate {
  candidate_id: string;
  session_id: string;
  primary_verb: string;
  title: string;
  summary: string;
  clues: Clue[];
  success_outcome: Outcome;
  failure_outcome: Outcome;
  content_tags: string[];
  required_capabilities: string[];
  source_fact_ids: string[];
  urgency?: number;
  estimated_duration_seconds?: number;
}

// ============== Configuration ==============

export interface Capabilities {
  game_id: string;
  supports_channels: string[];
  supports_actions: string[];
  limits: {
    max_choices?: number;
    max_text_len?: number;
    [key: string]: unknown;
  };
}

export interface WorldSpec {
  game_id: string;
  version: string;
  title: string;
  allowed_tags: string[];
  forbidden_tags: string[];
  tag_taxonomy: Record<string, string>;
  tone_tags: string[];
  lore_summary?: string;
  style_guide: Record<string, unknown>;
  forbidden_keywords: string[];
}

export interface WorldSnapshot {
  session_id: string;
  ts: string;
  state: {
    hp?: number;
    max_hp?: number;
    gold?: number;
    location?: string;
    reputation?: number;
    flags?: Record<string, boolean>;
    [key: string]: unknown;
  };
  entities: Array<{
    id: string;
    type: string;
    name: string;
    location?: string;
    attributes?: Record<string, unknown>;
  }>;
}

export type OpType = "SET" | "INC" | "UNSET" | "APPEND" | "REMOVE";

export interface WorldStateOp {
  op: OpType;
  path: string;
  value?: unknown;
}

export interface WorldSnapshotPatch {
  session_id: string;
  ts: string;
  ops: WorldStateOp[];
}

// ============== Trace & Debug ==============

export interface ScoreBreakdown {
  name: string;
  value: number;
}

export interface GuardrailResult {
  rule: string;
  passed: boolean;
  detail: string;
}

export interface Trace {
  request_id: string;
  session_id: string;
  ts: string;
  inputs_digest: string;
  signals: SignalBundle;
  candidates_count: number;
  chosen_candidate_id: string;
  scores: ScoreBreakdown[];
  guardrail_results: GuardrailResult[];
  fallback_level: number;
  latency_ms_by_stage: Record<string, number>;
}

// ============== API Request/Response ==============

export interface StartSessionRequest {
  session_id: string;
  game_id: string;
}

export interface StartSessionResponse {
  session_id: string;
  status: string;
}

export interface IngestFactsRequest {
  session_id: string;
  facts: Fact[];
  world_snapshot?: WorldSnapshot;
}

export interface IngestFactsResponse {
  session_id: string;
  ingested: number;
}

export interface SetWorldSnapshotRequest {
  session_id: string;
  world_snapshot: WorldSnapshot;
}

export interface SetWorldSnapshotResponse {
  session_id: string;
  status: string;
}

export interface PatchWorldSnapshotRequest {
  session_id: string;
  patch: WorldSnapshotPatch;
}

export interface PatchWorldSnapshotResponse {
  session_id: string;
  status: string;
}

export interface SetCapabilitiesRequest {
  session_id: string;
  capabilities: Capabilities;
}

export interface SetCapabilitiesResponse {
  session_id: string;
  status: string;
}

export interface TickRequest {
  session_id: string;
  mode: TickMode;
}

export interface TickResponse {
  request_id: string;
  session_id: string;
  directive?: Directive;
  directive_lite?: DirectiveLite;
  trace?: Trace;
  choice_result?: ChoiceResult;
}

// ============== Session Context ==============

export interface DirectiveSummary {
  directive_id: string;
  primary_verb: string;
  created_at: string;
}

export interface SessionContext {
  session_id: string;
  world_spec: WorldSpec;
  capabilities?: Capabilities;
  signals?: SignalBundle;
  world_snapshot?: WorldSnapshot;
  recent_directives: DirectiveSummary[];
  player_model: Record<string, unknown>;
}

// ============== Client Types ==============

export interface GameMessage {
  id: string;
  type: "system" | "player" | "npc" | "directive" | "consequence";
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
