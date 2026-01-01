/**
 * Save Manager
 *
 * Manages multiple save slots for game state persistence.
 * Uses localStorage for storage.
 */

import {
  WorldSnapshot,
  GameMessage,
  Directive,
  GameState,
} from "@/lib/engine/types";

const MAX_SLOTS = 5;
const SLOTS_KEY = "f2f-save-slots";
const SAVE_PREFIX = "f2f-save-";

export interface SaveSlot {
  slotId: number;
  sessionId: string;
  savedAt: string;
  location: string;
  hp: number;
  maxHp: number;
  gold: number;
}

export interface SaveData {
  sessionId: string;
  worldSnapshot: WorldSnapshot;
  messages: GameMessage[];
  currentDirective: Directive | null;
  directiveHistory: Directive[];
}

function getStorageKey(slotId: number): string {
  return `${SAVE_PREFIX}${slotId}`;
}

export const saveManager = {
  /**
   * Get all save slot metadata
   */
  getSlots(): (SaveSlot | null)[] {
    if (typeof window === "undefined") return Array(MAX_SLOTS).fill(null);

    try {
      const data = localStorage.getItem(SLOTS_KEY);
      if (!data) return Array(MAX_SLOTS).fill(null);

      const slots: (SaveSlot | null)[] = JSON.parse(data);
      // Ensure we always return MAX_SLOTS
      while (slots.length < MAX_SLOTS) {
        slots.push(null);
      }
      return slots.slice(0, MAX_SLOTS);
    } catch {
      return Array(MAX_SLOTS).fill(null);
    }
  },

  /**
   * Save game to a specific slot
   */
  saveGame(slotId: number, data: SaveData, gameState: GameState): void {
    if (typeof window === "undefined") return;
    if (slotId < 1 || slotId > MAX_SLOTS) return;

    // Save the full game data
    localStorage.setItem(getStorageKey(slotId), JSON.stringify(data));

    // Update slot metadata
    const slots = this.getSlots();
    const slotMeta: SaveSlot = {
      slotId,
      sessionId: data.sessionId,
      savedAt: new Date().toISOString(),
      location: gameState.location,
      hp: gameState.hp,
      maxHp: gameState.maxHp,
      gold: gameState.gold,
    };
    slots[slotId - 1] = slotMeta;
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
  },

  /**
   * Load game from a specific slot
   */
  loadGame(slotId: number): SaveData | null {
    if (typeof window === "undefined") return null;
    if (slotId < 1 || slotId > MAX_SLOTS) return null;

    try {
      const data = localStorage.getItem(getStorageKey(slotId));
      if (!data) return null;
      return JSON.parse(data) as SaveData;
    } catch {
      return null;
    }
  },

  /**
   * Delete a save slot
   */
  deleteSlot(slotId: number): void {
    if (typeof window === "undefined") return;
    if (slotId < 1 || slotId > MAX_SLOTS) return;

    // Remove save data
    localStorage.removeItem(getStorageKey(slotId));

    // Update slot metadata
    const slots = this.getSlots();
    slots[slotId - 1] = null;
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
  },

  /**
   * Check if any saves exist
   */
  hasSaves(): boolean {
    const slots = this.getSlots();
    return slots.some((slot) => slot !== null);
  },

  /**
   * Get a specific slot's metadata
   */
  getSlot(slotId: number): SaveSlot | null {
    if (slotId < 1 || slotId > MAX_SLOTS) return null;
    const slots = this.getSlots();
    return slots[slotId - 1];
  },

  /**
   * Get the number of max slots
   */
  getMaxSlots(): number {
    return MAX_SLOTS;
  },
};
