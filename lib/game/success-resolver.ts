/**
 * Success Resolver
 *
 * Determines success/failure for player choices based on choice type.
 */

import type { Choice } from "@/lib/engine/sdk-bridge";

const SUCCESS_RATES: Record<string, number> = {
  investigation: 0.8,
  analysis: 0.7,
  observation: 0.85,
  social: 0.6,
  search: 0.75,
  action: 0.5,
};

const DEFAULT_SUCCESS_RATE = 0.7;

export function determineSuccess(choice: Choice): boolean {
  const rate = SUCCESS_RATES[choice.type ?? ""] ?? DEFAULT_SUCCESS_RATE;
  return Math.random() < rate;
}

export function getSuccessRate(choiceType?: string): number {
  return SUCCESS_RATES[choiceType ?? ""] ?? DEFAULT_SUCCESS_RATE;
}
