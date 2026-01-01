"use client";

/**
 * useDirective Hook
 *
 * Manages directive state and TTL countdown.
 * Provides real-time directive updates and expiration handling.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useGameStore, useDirective as useDirectiveState, useDirectiveLite } from "@/stores/game-store";
import { getDirective } from "@/lib/engine/actions";

interface UseDirectiveOptions {
  /** Enable polling for directive updates */
  enablePolling?: boolean;
  /** Polling interval in milliseconds (default: 5000) */
  pollInterval?: number;
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
  /** Manually refresh directive from server */
  refreshDirective: () => Promise<void>;
}

export function useDirectivePolling(options: UseDirectiveOptions = {}): UseDirectiveReturn {
  const {
    enablePolling = false,
    pollInterval = 5000,
    enableTTL = true,
  } = options;

  const directive = useDirectiveState();
  const directiveLite = useDirectiveLite();
  const sessionId = useGameStore((s) => s.sessionId);
  const setDirective = useGameStore((s) => s.setDirective);
  const setDirectiveLite = useGameStore((s) => s.setDirectiveLite);

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

  // Polling for directive updates
  useEffect(() => {
    if (!enablePolling || !sessionId) return;

    const poll = async () => {
      try {
        const result = await getDirective(sessionId);
        if (result.success) {
          if (result.directive) {
            setDirective(result.directive);
          }
          if (result.directiveLite) {
            setDirectiveLite(result.directiveLite);
          }
        }
      } catch (error) {
        console.error("Failed to poll directive:", error);
      }
    };

    const intervalId = setInterval(poll, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enablePolling, pollInterval, sessionId, setDirective, setDirectiveLite]);

  // Manual refresh
  const refreshDirective = useCallback(async () => {
    if (!sessionId) return;

    try {
      const result = await getDirective(sessionId);
      if (result.success) {
        if (result.directive) {
          setDirective(result.directive);
        }
        if (result.directiveLite) {
          setDirectiveLite(result.directiveLite);
        }
      }
    } catch (error) {
      console.error("Failed to refresh directive:", error);
    }
  }, [sessionId, setDirective, setDirectiveLite]);

  const isUrgent = remainingTTL !== null && remainingTTL > 0 && remainingTTL < 30;

  return {
    directive,
    directiveLite,
    remainingTTL,
    isUrgent,
    isExpired,
    refreshDirective,
  };
}

/**
 * Simple hook for accessing directive state without polling
 */
export function useCurrentDirective() {
  const directive = useDirectiveState();
  const directiveLite = useDirectiveLite();

  return {
    directive,
    directiveLite,
    hasDirective: directive !== null,
    hasDirectiveLite: directiveLite !== null,
  };
}

/**
 * Hook for formatting TTL display
 */
export function useTTLDisplay(ttlSeconds: number | null) {
  if (ttlSeconds === null) return null;

  const minutes = Math.floor(ttlSeconds / 60);
  const seconds = ttlSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${seconds}초`;
}
