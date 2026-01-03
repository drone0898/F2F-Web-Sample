/**
 * SSE (Server-Sent Events) Client for F2F-Engine
 *
 * Handles real-time streaming of events from the engine.
 * Supports automatic reconnection on connection loss.
 */

import {
  StreamEvent,
  SSEConnectionStatus,
  Directive,
  DirectiveLite,
  LoopStateUpdate,
  ShortMessage,
  EngineErrorEvent,
} from "./types";

export interface SSEClientOptions {
  sessionId: string;
  baseUrl: string;
  onEvent?: (event: StreamEvent) => void;
  onStateChange?: (state: LoopStateUpdate) => void;
  onShortMessage?: (message: ShortMessage) => void;
  onDirective?: (directive: Directive) => void;
  onDirectiveLite?: (directiveLite: DirectiveLite) => void;
  onError?: (error: EngineErrorEvent) => void;
  onConnectionStatusChange?: (status: SSEConnectionStatus) => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export class SSEClient {
  private eventSource: EventSource | null = null;
  private options: SSEClientOptions;
  private reconnectCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManualDisconnect = false;

  constructor(options: SSEClientOptions) {
    this.options = {
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      ...options,
    };
  }

  /**
   * Connect to the SSE stream
   */
  connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.isManualDisconnect = false;
    this.setConnectionStatus("connecting");

    const url = `${this.options.baseUrl}/v1/directives/stream?session_id=${this.options.sessionId}`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.reconnectCount = 0;
        this.setConnectionStatus("connected");
      };

      this.eventSource.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.eventSource.onerror = (error) => {
        this.handleError(error);
      };

      // Handle named events if the server sends them
      this.eventSource.addEventListener("stream", (event) => {
        this.handleMessage(event as MessageEvent);
      });
    } catch (error) {
      console.error("Failed to create EventSource:", error);
      this.setConnectionStatus("error");
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the SSE stream
   */
  disconnect(): void {
    this.isManualDisconnect = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.setConnectionStatus("disconnected");
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Handle incoming SSE message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as StreamEvent;

      // Call generic event handler
      this.options.onEvent?.(data);

      // Call specific handlers based on event type
      if (data.state) {
        this.options.onStateChange?.(data.state);
      }

      if (data.short_message) {
        this.options.onShortMessage?.(data.short_message);
      }

      if (data.directive) {
        this.options.onDirective?.(data.directive);
      }

      if (data.directive_lite) {
        this.options.onDirectiveLite?.(data.directive_lite);
      }

      if (data.error) {
        this.options.onError?.(data.error);
      }
    } catch (error) {
      console.error("Failed to parse SSE message:", error, event.data);
    }
  }

  /**
   * Handle SSE error
   */
  private handleError(error: Event): void {
    console.error("SSE connection error:", error);

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (!this.isManualDisconnect) {
      this.setConnectionStatus("error");
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.isManualDisconnect) {
      return;
    }

    const maxAttempts = this.options.reconnectAttempts ?? 5;

    if (this.reconnectCount >= maxAttempts) {
      console.error(`SSE reconnection failed after ${maxAttempts} attempts`);
      this.setConnectionStatus("error");
      return;
    }

    this.reconnectCount++;
    const delay = (this.options.reconnectDelay ?? 1000) * Math.pow(2, this.reconnectCount - 1);

    console.log(`Scheduling SSE reconnection attempt ${this.reconnectCount}/${maxAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Update connection status and notify callback
   */
  private setConnectionStatus(status: SSEConnectionStatus): void {
    this.options.onConnectionStatusChange?.(status);
  }

  /**
   * Update session ID (requires reconnect)
   */
  updateSessionId(sessionId: string): void {
    this.options.sessionId = sessionId;
    if (this.isConnected()) {
      this.disconnect();
      this.connect();
    }
  }
}

/**
 * Create a new SSE client instance
 */
export function createSSEClient(options: SSEClientOptions): SSEClient {
  return new SSEClient(options);
}

/**
 * Get the SSE stream URL for a session
 */
export function getSSEStreamUrl(baseUrl: string, sessionId: string): string {
  return `${baseUrl}/v1/directives/stream?session_id=${sessionId}`;
}
