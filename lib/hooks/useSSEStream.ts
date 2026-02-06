"use client";

/**
 * SSE Stream Hook
 *
 * React hook for managing SSE connection to F2F-Engine using SDK streamExperiences().
 * Uses async generator pattern with AbortController for lifecycle management.
 */

import { useEffect, useRef, useCallback } from "react";
import { F2FClient, type SSEConnectionStatus, type LoopStatus } from "@/lib/engine/sdk-bridge";
import { useGameStore } from "@/stores/game-store";

// Engine URL for client-side SSE connection
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

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000;

export function useSSEStream(options: UseSSEStreamOptions): UseSSEStreamReturn {
  const { sessionId, enabled = true } = options;
  const abortRef = useRef<AbortController | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isManualDisconnectRef = useRef(false);

  const {
    sseConnectionStatus,
    loopState,
    shortMessage,
    setSSEConnectionStatus,
    handleStreamEvent,
  } = useGameStore();

  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    setSSEConnectionStatus("disconnected");
  }, [setSSEConnectionStatus]);

  const connect = useCallback(() => {
    if (!sessionId || !enabled) return;

    // Disconnect existing
    if (abortRef.current) {
      abortRef.current.abort();
    }

    isManualDisconnectRef.current = false;
    setSSEConnectionStatus("connecting");

    const abortController = new AbortController();
    abortRef.current = abortController;

    const client = new F2FClient({ baseUrl: SSE_ENGINE_URL });

    (async () => {
      try {
        const stream = client.streamExperiences(sessionId, {
          signal: abortController.signal,
        });

        setSSEConnectionStatus("connected");
        reconnectCountRef.current = 0;

        for await (const sseEvent of stream) {
          if (abortController.signal.aborted) break;
          handleStreamEvent(sseEvent.data);
        }

        // Stream ended naturally
        if (!isManualDisconnectRef.current) {
          setSSEConnectionStatus("disconnected");
          scheduleReconnect();
        }
      } catch (error) {
        if (abortController.signal.aborted) return;

        console.error("SSE stream error:", error);
        setSSEConnectionStatus("error");

        if (!isManualDisconnectRef.current) {
          scheduleReconnect();
        }
      }
    })();

    function scheduleReconnect() {
      if (isManualDisconnectRef.current) return;
      if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.error(`SSE reconnection failed after ${MAX_RECONNECT_ATTEMPTS} attempts`);
        setSSEConnectionStatus("error");
        return;
      }

      reconnectCountRef.current++;
      const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectCountRef.current - 1);

      reconnectTimerRef.current = setTimeout(() => {
        if (!isManualDisconnectRef.current) {
          connect();
        }
      }, delay);
    }
  }, [sessionId, enabled, setSSEConnectionStatus, handleStreamEvent]);

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
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
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
