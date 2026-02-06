"use client";

/**
 * useExperience Hook
 *
 * Manages experience state and TTL countdown.
 * Experiences are received via SSE stream.
 */

import { useEffect, useState, useRef } from "react";
import {
  useExperience as useExperienceState,
  useExperienceLite,
  useLoopState,
  useShortMessage,
} from "@/stores/game-store";

interface UseExperienceOptions {
  enableTTL?: boolean;
}

interface UseExperienceReturn {
  experience: ReturnType<typeof useExperienceState>;
  experienceLite: ReturnType<typeof useExperienceLite>;
  remainingTTL: number | null;
  isUrgent: boolean;
  isExpired: boolean;
  isProcessing: boolean;
  shortMessage: string | null;
  loopState: ReturnType<typeof useLoopState>;
}

/**
 * Main experience hook - uses SSE state, no polling
 */
export function useExperienceWithTTL(options: UseExperienceOptions = {}): UseExperienceReturn {
  const { enableTTL = true } = options;

  const experience = useExperienceState();
  const experienceLite = useExperienceLite();
  const loopState = useLoopState();
  const shortMessage = useShortMessage();

  const [remainingTTL, setRemainingTTL] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const ttlIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate TTL based on experience creation time
  useEffect(() => {
    if (!experience || !enableTTL) {
      setRemainingTTL(null);
      setIsExpired(false);
      return;
    }

    // Experience uses estimated_duration_seconds instead of ttl_seconds
    const ttlSeconds = experience.estimated_duration_seconds;
    if (!ttlSeconds) {
      setRemainingTTL(null);
      setIsExpired(false);
      return;
    }

    const calculateRemainingTTL = () => {
      const createdAt = new Date(experience.created_at).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - createdAt) / 1000);
      const remaining = Math.max(0, ttlSeconds - elapsed);

      setRemainingTTL(remaining);
      setIsExpired(remaining === 0);

      return remaining;
    };

    calculateRemainingTTL();

    ttlIntervalRef.current = setInterval(() => {
      const remaining = calculateRemainingTTL();
      if (remaining === 0) {
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
  }, [experience, enableTTL]);

  const isUrgent = remainingTTL !== null && remainingTTL > 0 && remainingTTL < 30;
  const isProcessing = loopState === "DECIDE" || loopState === "GENERATE";

  return {
    experience,
    experienceLite,
    remainingTTL,
    isUrgent,
    isExpired,
    isProcessing,
    shortMessage,
    loopState,
  };
}

/**
 * Simple hook for accessing experience state
 */
export function useCurrentExperience() {
  const experience = useExperienceState();
  const experienceLite = useExperienceLite();
  const loopState = useLoopState();
  const shortMessage = useShortMessage();

  const isProcessing = loopState === "DECIDE" || loopState === "GENERATE";

  return {
    experience,
    experienceLite,
    hasExperience: experience !== null,
    hasExperienceLite: experienceLite !== null,
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
