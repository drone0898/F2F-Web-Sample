"use server";

/**
 * F2F-Engine Server Actions
 *
 * Server-side functions for interacting with F2F-Engine.
 * These run on the server and can be called from client components.
 */

import { engineClient, EngineError } from "./client";
import {
  Fact,
  WorldSnapshot,
  Capabilities,
  Directive,
  DirectiveLite,
  TickResponse,
  TickMode,
} from "./types";

const GAME_ID = "text_adventure";

// Default capabilities for the web demo
const DEFAULT_CAPABILITIES: Capabilities = {
  game_id: GAME_ID,
  supports_channels: ["text", "choice_menu", "quest_log", "notification"],
  supports_actions: ["display_text", "show_choices", "update_status"],
  limits: {
    max_choices: 4,
    max_text_len: 300,
  },
};

// Initial world state
const INITIAL_WORLD_STATE = {
  hp: 100,
  max_hp: 100,
  gold: 50,
  location: "village_square",
  reputation: 0,
  flags: {},
};

export interface StartGameResult {
  success: boolean;
  sessionId: string;
  worldSnapshot: WorldSnapshot;
  error?: string;
}

export interface SendFactsResult {
  success: boolean;
  ingested: number;
  directive?: Directive;
  directiveLite?: DirectiveLite;
  error?: string;
}

export interface GetDirectiveResult {
  success: boolean;
  directive?: Directive;
  directiveLite?: DirectiveLite;
  error?: string;
}

/**
 * Start a new game session
 */
export async function startGameSession(
  sessionId: string
): Promise<StartGameResult> {
  try {
    // 1. Start session
    await engineClient.startSession(sessionId, GAME_ID);

    // 2. Set capabilities
    await engineClient.setCapabilities(sessionId, DEFAULT_CAPABILITIES);

    // 3. Create and set initial world snapshot
    const worldSnapshot: WorldSnapshot = {
      session_id: sessionId,
      ts: new Date().toISOString(),
      state: { ...INITIAL_WORLD_STATE },
      entities: [],
    };
    await engineClient.setWorldSnapshot(sessionId, worldSnapshot);

    return {
      success: true,
      sessionId,
      worldSnapshot,
    };
  } catch (error) {
    console.error("Failed to start game session:", error);
    return {
      success: false,
      sessionId,
      worldSnapshot: {
        session_id: sessionId,
        ts: new Date().toISOString(),
        state: { ...INITIAL_WORLD_STATE },
        entities: [],
      },
      error:
        error instanceof EngineError
          ? error.message
          : "Failed to connect to engine",
    };
  }
}

/**
 * Send facts (player actions) to the engine and trigger processing
 */
export async function sendFacts(
  sessionId: string,
  facts: Fact[],
  worldSnapshot?: WorldSnapshot,
  mode: TickMode = "slow"
): Promise<SendFactsResult> {
  try {
    // 1. Ingest facts
    const ingestResult = await engineClient.ingestFacts(
      sessionId,
      facts,
      worldSnapshot
    );

    // 2. Trigger tick to process and generate directive
    const tickResult = await engineClient.tick(sessionId, mode);

    return {
      success: true,
      ingested: ingestResult.ingested,
      directive: tickResult.directive ?? undefined,
      directiveLite: tickResult.directive_lite ?? undefined,
    };
  } catch (error) {
    console.error("Failed to send facts:", error);
    return {
      success: false,
      ingested: 0,
      error:
        error instanceof EngineError
          ? error.message
          : "Failed to process action",
    };
  }
}

/**
 * Get current directive without sending new facts
 */
export async function getDirective(
  sessionId: string
): Promise<GetDirectiveResult> {
  try {
    const [directive, directiveLite] = await Promise.all([
      engineClient.getCurrentDirective(sessionId),
      engineClient.getCurrentDirectiveLite(sessionId),
    ]);

    return {
      success: true,
      directive: directive ?? undefined,
      directiveLite: directiveLite ?? undefined,
    };
  } catch (error) {
    console.error("Failed to get directive:", error);
    return {
      success: false,
      error:
        error instanceof EngineError
          ? error.message
          : "Failed to get directive",
    };
  }
}

/**
 * Trigger engine tick without sending new facts
 */
export async function triggerTick(
  sessionId: string,
  mode: TickMode = "slow"
): Promise<TickResponse | null> {
  try {
    return await engineClient.tick(sessionId, mode);
  } catch (error) {
    console.error("Failed to trigger tick:", error);
    return null;
  }
}

/**
 * Update world snapshot
 */
export async function updateWorldSnapshot(
  sessionId: string,
  worldSnapshot: WorldSnapshot
): Promise<boolean> {
  try {
    await engineClient.setWorldSnapshot(sessionId, worldSnapshot);
    return true;
  } catch (error) {
    console.error("Failed to update world snapshot:", error);
    return false;
  }
}

/**
 * Check engine health
 */
export async function checkEngineHealth(): Promise<boolean> {
  try {
    const result = await engineClient.health();
    return result.status === "ok";
  } catch {
    return false;
  }
}
