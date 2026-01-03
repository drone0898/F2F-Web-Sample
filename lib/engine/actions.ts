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
  WorldSnapshotPatch,
  Directive,
  DirectiveLite,
  TickResponse,
  TickMode,
  ChoiceResult,
  GameSchema,
  SessionRuntimeConfig,
} from "./types";
import { GameTemplate } from "@/lib/game/templates";

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
  choiceResult?: ChoiceResult;
  error?: string;
}

export interface GetDirectiveResult {
  success: boolean;
  directive?: Directive;
  directiveLite?: DirectiveLite;
  error?: string;
}

/**
 * Start a new game session with a template
 */
export async function startGameSession(
  sessionId: string,
  template: GameTemplate
): Promise<StartGameResult> {
  try {
    // 1. Start session with schema and runtime config
    await engineClient.startSession(
      sessionId,
      template.id,
      template.gameSchema,
      template.runtimeConfig
    );

    // 2. Set capabilities from template
    await engineClient.setCapabilities(sessionId, template.capabilities);

    // 3. Create and set initial world snapshot from template
    const worldSnapshot: WorldSnapshot = {
      session_id: sessionId,
      ts: new Date().toISOString(),
      state: { ...template.initialWorldState },
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
        state: { ...template.initialWorldState },
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
 * Update game schema for an existing session
 */
export async function updateGameSchema(
  sessionId: string,
  gameSchema: GameSchema
): Promise<{ success: boolean; error?: string }> {
  try {
    await engineClient.setGameSchema(sessionId, gameSchema);
    return { success: true };
  } catch (error) {
    console.error("Failed to update game schema:", error);
    return {
      success: false,
      error:
        error instanceof EngineError
          ? error.message
          : "Failed to update game schema",
    };
  }
}

/**
 * Update session runtime config
 */
export async function updateRuntimeConfig(
  sessionId: string,
  config: SessionRuntimeConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    await engineClient.setSessionRuntimeConfig(sessionId, config);
    return { success: true };
  } catch (error) {
    console.error("Failed to update runtime config:", error);
    return {
      success: false,
      error:
        error instanceof EngineError
          ? error.message
          : "Failed to update runtime config",
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
      choiceResult: tickResult.choice_result ?? undefined,
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
 * Patch world snapshot with incremental operations
 */
export async function patchWorldSnapshot(
  sessionId: string,
  patch: WorldSnapshotPatch
): Promise<{ success: boolean; error?: string }> {
  try {
    await engineClient.patchWorldSnapshot(sessionId, patch);
    return { success: true };
  } catch (error) {
    console.error("Failed to patch world snapshot:", error);
    return {
      success: false,
      error:
        error instanceof EngineError
          ? error.message
          : "Failed to patch world snapshot",
    };
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
