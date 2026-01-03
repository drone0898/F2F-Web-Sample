"use client";

/**
 * SSE Stream Hook
 *
 * React hook for managing SSE connection to F2F-Engine.
 * Handles connection lifecycle and integrates with Zustand store.
 */

import { useEffect, useRef, useCallback } from "react";
import { SSEClient, SSEClientOptions } from "@/lib/engine/sse-client";
import { SSEConnectionStatus, LoopStatus } from "@/lib/engine/types";
import { useGameStore } from "@/stores/game-store";

// Engine URL for client-side SSE connection
// Note: SSE must connect directly from browser, not through server actions
const SSE_ENGINE_URL = process.env.NEXT_PUBLIC_F2F_ENGINE_URL || "http://localhost:5001";

export interface UseSSEStreamOptions {
  sessionId: string | null;
  enabled?: boolean;
}

export interface UseSSEStreamReturn {
  connectionStatus: SSEConnectionStatus;
  loopState: LoopStatus | null;
  shortMessage: string | null;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
  isProcessing: boolean;
}

export function useSSEStream(options: UseSSEStreamOptions): UseSSEStreamReturn {
  const { sessionId, enabled = true } = options;
  const clientRef = useRef<SSEClient | null>(null);

  // Store actions and state
  const {
    sseConnectionStatus,
    loopState,
    shortMessage,
    setSSEConnectionStatus,
    handleStreamEvent,
  } = useGameStore();

  // Create SSE client
  const createClient = useCallback(() => {
    if (!sessionId) return null;

    const clientOptions: SSEClientOptions = {
      sessionId,
      baseUrl: SSE_ENGINE_URL,
      onEvent: handleStreamEvent,
      onConnectionStatusChange: setSSEConnectionStatus,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
    };

    return new SSEClient(clientOptions);
  }, [sessionId, handleStreamEvent, setSSEConnectionStatus]);

  // Connect to SSE stream
  const connect = useCallback(() => {
    if (!sessionId || !enabled) return;

    // Disconnect existing client
    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    // Create and connect new client
    const client = createClient();
    if (client) {
      clientRef.current = client;
      client.connect();
    }
  }, [sessionId, enabled, createClient]);

  // Disconnect from SSE stream
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
  }, []);

  // Auto-connect when session ID changes and enabled
  useEffect(() => {
    if (sessionId && enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [sessionId, enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []);

  const isConnected = sseConnectionStatus === "connected";
  const isProcessing = loopState === "DECIDE" || loopState === "GENERATE";

  return {
    connectionStatus: sseConnectionStatus,
    loopState,
    shortMessage,
    connect,
    disconnect,
    isConnected,
    isProcessing,
  };
}
