/**
 * Success Resolver
 *
 * Determines success/failure for player choices based on choice type.
 * This keeps game rules on the client side (SSOT principle).
 */

import type { Choice } from "@/lib/engine/types";

// Success rates by choice type
const SUCCESS_RATES: Record<string, number> = {
  investigation: 0.8, // High success for investigation
  analysis: 0.7, // Moderate-high for analysis
  observation: 0.85, // Very high for observation
  social: 0.6, // Moderate for social interactions
  search: 0.75, // Good for searching
  action: 0.5, // Lower for direct action
};

const DEFAULT_SUCCESS_RATE = 0.7;

/**
 * Determine if a choice succeeds based on its type
 */
export function determineSuccess(choice: Choice): boolean {
  const rate = SUCCESS_RATES[choice.type ?? ""] ?? DEFAULT_SUCCESS_RATE;
  return Math.random() < rate;
}

/**
 * Get the success rate for a choice type
 */
export function getSuccessRate(choiceType?: string): number {
  return SUCCESS_RATES[choiceType ?? ""] ?? DEFAULT_SUCCESS_RATE;
}
