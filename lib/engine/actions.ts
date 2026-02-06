"use server";

/**
 * F2F-Engine Server Actions
 *
 * Server-side functions using @f2f-engine/sdk F2FClient.
 * These run on the server and can be called from client components.
 */

import {
  F2FClient,
  F2FHttpError,
  type Experience,
  type ExperienceLite,
  type Fact,
  type WorldSnapshot,
  type WorldSnapshotPatch,
  type TickMode,
  type GameSchema,
  type SessionRuntimeConfig,
} from "./sdk-bridge";
import { GameTemplate } from "@/lib/game/templates";

const ENGINE_URL = process.env.F2F_ENGINE_URL || "http://localhost:5001";

const client = new F2FClient({ baseUrl: ENGINE_URL, timeoutMs: 30_000 });

export interface StartGameResult {
  success: boolean;
  sessionId: string;
  worldSnapshot: WorldSnapshot;
  error?: string;
}

export interface SendFactsResult {
  success: boolean;
  ingested: number;
  experience?: Experience;
  experienceLite?: ExperienceLite;
  error?: string;
}

export interface GetExperienceResult {
  success: boolean;
  experience?: Experience;
  experienceLite?: ExperienceLite;
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
    await client.startSession({
      session_id: sessionId,
      game_id: template.id,
      game_schema: template.gameSchema,
      session_runtime_config: template.runtimeConfig,
    });

    // 2. Set capabilities from template
    await client.setCapabilities({
      session_id: sessionId,
      capabilities: template.capabilities,
    });

    // 3. Create and set initial world snapshot from template
    const worldSnapshot: WorldSnapshot = {
      session_id: sessionId,
      ts: new Date().toISOString(),
      state: { ...template.initialWorldState } as WorldSnapshot["state"],
      entities: [],
    };
    await client.setWorldSnapshot({
      session_id: sessionId,
      world_snapshot: worldSnapshot,
    });

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
        state: { ...template.initialWorldState } as WorldSnapshot["state"],
        entities: [],
      },
      error:
        error instanceof F2FHttpError
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
    await client.setGameSchema({
      session_id: sessionId,
      game_schema: gameSchema,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update game schema:", error);
    return {
      success: false,
      error:
        error instanceof F2FHttpError
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
    await client.setSessionRuntimeConfig({
      session_id: sessionId,
      session_runtime_config: config,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update runtime config:", error);
    return {
      success: false,
      error:
        error instanceof F2FHttpError
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
    const ingestResult = await client.ingestFacts({
      session_id: sessionId,
      facts,
      world_snapshot: worldSnapshot,
    });

    // 2. Trigger tick to process and generate experience
    const tickResult = await client.tick({
      session_id: sessionId,
      mode,
    });

    return {
      success: true,
      ingested: ingestResult.ingested,
      experience: tickResult.experience ?? undefined,
      experienceLite: tickResult.experience_lite ?? undefined,
    };
  } catch (error) {
    console.error("Failed to send facts:", error);
    return {
      success: false,
      ingested: 0,
      error:
        error instanceof F2FHttpError
          ? error.message
          : "Failed to process action",
    };
  }
}

/**
 * Get current experience without sending new facts
 */
export async function getExperience(
  sessionId: string
): Promise<GetExperienceResult> {
  try {
    const [experience, experienceLite] = await Promise.allSettled([
      client.getCurrentExperience(sessionId),
      client.getCurrentExperienceLite(sessionId),
    ]);

    return {
      success: true,
      experience:
        experience.status === "fulfilled" ? experience.value : undefined,
      experienceLite:
        experienceLite.status === "fulfilled" ? experienceLite.value : undefined,
    };
  } catch (error) {
    console.error("Failed to get experience:", error);
    return {
      success: false,
      error:
        error instanceof F2FHttpError
          ? error.message
          : "Failed to get experience",
    };
  }
}

/**
 * Trigger engine tick without sending new facts
 */
export async function triggerTick(
  sessionId: string,
  mode: TickMode = "slow"
): Promise<{ experience?: Experience; experienceLite?: ExperienceLite } | null> {
  try {
    const result = await client.tick({
      session_id: sessionId,
      mode,
    });
    return {
      experience: result.experience ?? undefined,
      experienceLite: result.experience_lite ?? undefined,
    };
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
    await client.setWorldSnapshot({
      session_id: sessionId,
      world_snapshot: worldSnapshot,
    });
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
    await client.patchWorldSnapshot({
      session_id: sessionId,
      patch,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to patch world snapshot:", error);
    return {
      success: false,
      error:
        error instanceof F2FHttpError
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
    const result = await client.health();
    return result.status === "ok";
  } catch {
    return false;
  }
}
