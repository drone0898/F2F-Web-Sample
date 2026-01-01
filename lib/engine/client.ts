/**
 * F2F-Engine API Client
 *
 * HTTP client for communicating with F2F-Engine server.
 * Handles session management, fact ingestion, and directive retrieval.
 */

import {
  StartSessionResponse,
  IngestFactsResponse,
  SetCapabilitiesResponse,
  SetWorldSnapshotResponse,
  TickResponse,
  Fact,
  WorldSnapshot,
  Capabilities,
  Directive,
  DirectiveLite,
  TickMode,
} from "./types";

const ENGINE_URL = process.env.F2F_ENGINE_URL || "http://localhost:5001";
const CONTRACT_VERSION = "v0";

export class EngineError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown
  ) {
    super(message);
    this.name = "EngineError";
  }
}

export class F2FEngineClient {
  private baseUrl: string;

  constructor(baseUrl: string = ENGINE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    sessionId?: string
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-f2f-contract-version": CONTRACT_VERSION,
    };

    if (sessionId) {
      headers["x-f2f-session-id"] = sessionId;
      headers["x-f2f-request-id"] = crypto.randomUUID();
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      let errorDetail: unknown;
      try {
        errorDetail = await response.json();
      } catch {
        errorDetail = { message: "Unknown error" };
      }

      throw new EngineError(
        response.status,
        typeof errorDetail === "object" &&
        errorDetail !== null &&
        "detail" in errorDetail
          ? String((errorDetail as { detail: unknown }).detail)
          : "Request failed",
        errorDetail
      );
    }

    return response.json();
  }

  /**
   * Start a new game session
   */
  async startSession(
    sessionId: string,
    gameId: string
  ): Promise<StartSessionResponse> {
    return this.request<StartSessionResponse>("POST", "/v1/sessions/start", {
      session_id: sessionId,
      game_id: gameId,
    });
  }

  /**
   * Set game capabilities (what the game can express/handle)
   */
  async setCapabilities(
    sessionId: string,
    capabilities: Capabilities
  ): Promise<SetCapabilitiesResponse> {
    return this.request<SetCapabilitiesResponse>(
      "POST",
      "/v1/capabilities/set",
      {
        session_id: sessionId,
        capabilities,
      },
      sessionId
    );
  }

  /**
   * Set or update the world snapshot (current game state)
   */
  async setWorldSnapshot(
    sessionId: string,
    worldSnapshot: WorldSnapshot
  ): Promise<SetWorldSnapshotResponse> {
    return this.request<SetWorldSnapshotResponse>(
      "POST",
      "/v1/world/snapshot",
      {
        session_id: sessionId,
        world_snapshot: worldSnapshot,
      },
      sessionId
    );
  }

  /**
   * Send facts (player actions, state changes) to the engine
   */
  async ingestFacts(
    sessionId: string,
    facts: Fact[],
    worldSnapshot?: WorldSnapshot
  ): Promise<IngestFactsResponse> {
    return this.request<IngestFactsResponse>(
      "POST",
      "/v1/facts/ingest",
      {
        session_id: sessionId,
        facts,
        world_snapshot: worldSnapshot,
      },
      sessionId
    );
  }

  /**
   * Trigger the engine processing loop to generate directives
   */
  async tick(sessionId: string, mode: TickMode = "slow"): Promise<TickResponse> {
    return this.request<TickResponse>(
      "POST",
      "/v1/session/tick",
      {
        session_id: sessionId,
        mode,
      },
      sessionId
    );
  }

  /**
   * Get the current active directive
   */
  async getCurrentDirective(sessionId: string): Promise<Directive | null> {
    try {
      return await this.request<Directive>(
        "GET",
        `/v1/directives/current?session_id=${encodeURIComponent(sessionId)}`,
        undefined,
        sessionId
      );
    } catch (error) {
      if (error instanceof EngineError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get the current directive lite (quick hints)
   */
  async getCurrentDirectiveLite(
    sessionId: string
  ): Promise<DirectiveLite | null> {
    try {
      return await this.request<DirectiveLite>(
        "GET",
        `/v1/directives/lite/current?session_id=${encodeURIComponent(sessionId)}`,
        undefined,
        sessionId
      );
    } catch (error) {
      if (error instanceof EngineError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string }> {
    return this.request<{ status: string }>("GET", "/health");
  }

  /**
   * Get engine version
   */
  async version(): Promise<{ version: string; contract_version: string }> {
    return this.request<{ version: string; contract_version: string }>(
      "GET",
      "/version"
    );
  }
}

// Singleton instance
export const engineClient = new F2FEngineClient();
