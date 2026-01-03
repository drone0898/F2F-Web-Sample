"use client";

/**
 * useDirective Hook
 *
 * Manages directive state and TTL countdown.
 * Directives are now received via SSE stream, not polling.
 */

import { useEffect, useState, useRef } from "react";
import {
  useDirective as useDirectiveState,
  useDirectiveLite,
  useLoopState,
  useShortMessage,
} from "@/stores/game-store";

interface UseDirectiveOptions {
  /** Enable TTL countdown */
  enableTTL?: boolean;
}

interface UseDirectiveReturn {
  /** Current directive */
  directive: ReturnType<typeof useDirectiveState>;
  /** Current directive lite */
  directiveLite: ReturnType<typeof useDirectiveLite>;
  /** Remaining TTL in seconds */
  remainingTTL: number | null;
  /** Whether the directive is about to expire (< 30s) */
  isUrgent: boolean;
  /** Whether the directive has expired */
  isExpired: boolean;
  /** Whether engine is processing (from SSE) */
  isProcessing: boolean;
  /** Short message from SSE */
  shortMessage: string | null;
  /** Loop state from SSE */
  loopState: ReturnType<typeof useLoopState>;
}

/**
 * Main directive hook - uses SSE state, no polling
 */
export function useDirectiveState2(options: UseDirectiveOptions = {}): UseDirectiveReturn {
  const { enableTTL = true } = options;

  const directive = useDirectiveState();
  const directiveLite = useDirectiveLite();
  const loopState = useLoopState();
  const shortMessage = useShortMessage();

  const [remainingTTL, setRemainingTTL] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const ttlIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate TTL based on directive creation time
  useEffect(() => {
    if (!directive || !enableTTL) {
      setRemainingTTL(null);
      setIsExpired(false);
      return;
    }

    const calculateRemainingTTL = () => {
      const createdAt = new Date(directive.created_at).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - createdAt) / 1000);
      const remaining = Math.max(0, directive.ttl_seconds - elapsed);

      setRemainingTTL(remaining);
      setIsExpired(remaining === 0);

      return remaining;
    };

    // Initial calculation
    calculateRemainingTTL();

    // Update every second
    ttlIntervalRef.current = setInterval(() => {
      const remaining = calculateRemainingTTL();
      if (remaining === 0) {
        // Directive expired
        if (ttlIntervalRef.current) {
          clearInterval(ttlIntervalRef.current);
        }
      }
    }, 1000);

    return () => {
      if (ttlIntervalRef.current) {
        clearInterval(ttlIntervalRef.current);
      }
    };
  }, [directive, enableTTL]);

  const isUrgent = remainingTTL !== null && remainingTTL > 0 && remainingTTL < 30;
  const isProcessing = loopState === "DECIDE" || loopState === "GENERATE";

  return {
    directive,
    directiveLite,
    remainingTTL,
    isUrgent,
    isExpired,
    isProcessing,
    shortMessage,
    loopState,
  };
}

/**
 * Simple hook for accessing directive state
 */
export function useCurrentDirective() {
  const directive = useDirectiveState();
  const directiveLite = useDirectiveLite();
  const loopState = useLoopState();
  const shortMessage = useShortMessage();

  const isProcessing = loopState === "DECIDE" || loopState === "GENERATE";

  return {
    directive,
    directiveLite,
    hasDirective: directive !== null,
    hasDirectiveLite: directiveLite !== null,
    isProcessing,
    shortMessage,
    loopState,
  };
}

/**
 * Hook for formatting TTL display
 */
export function useTTLDisplay(ttlSeconds: number | null): string | null {
  if (ttlSeconds === null) return null;

  const minutes = Math.floor(ttlSeconds / 60);
  const seconds = ttlSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${seconds}초`;
}

/**
 * Hook for directive with TTL management
 */
export function useDirectiveWithTTL() {
  return useDirectiveState2({ enableTTL: true });
}
