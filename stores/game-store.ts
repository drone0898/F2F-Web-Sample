/**
 * Game State Store (Zustand)
 *
 * Central state management for the game.
 * Handles session, world state, directives, and message history.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  Directive,
  DirectiveLite,
  Signal,
  WorldSnapshot,
  GameMessage,
  GameState,
  Outcome,
} from "@/lib/engine/types";
import { saveManager, SaveData } from "@/lib/saves/save-manager";

interface GameStore {
  // Session
  sessionId: string | null;
  isInitialized: boolean;
  isConnected: boolean;

  // World State
  worldSnapshot: WorldSnapshot | null;
  signals: Signal[];

  // Directives
  currentDirective: Directive | null;
  currentDirectiveLite: DirectiveLite | null;
  directiveHistory: Directive[];

  // Messages
  messages: GameMessage[];

  // Loading States
  isLoading: boolean;
  error: string | null;

  // Actions - Session
  setSessionId: (id: string) => void;
  setInitialized: (value: boolean) => void;
  setConnected: (value: boolean) => void;

  // Actions - World
  setWorldSnapshot: (snapshot: WorldSnapshot) => void;
  updateWorldState: (updates: Partial<GameState>) => void;
  setSignals: (signals: Signal[]) => void;

  // Actions - Directives
  setDirective: (directive: Directive | null) => void;
  setDirectiveLite: (lite: DirectiveLite | null) => void;
  archiveDirective: (directive: Directive) => void;

  // Actions - Messages
  addMessage: (message: Omit<GameMessage, "id" | "timestamp">) => void;
  addSystemMessage: (content: string) => void;
  addPlayerMessage: (content: string) => void;
  addNpcMessage: (content: string, metadata?: Record<string, unknown>) => void;
  addDirectiveMessage: (content: string) => void;
  addConsequenceMessage: (content: string, metadata?: Record<string, unknown>) => void;
  clearMessages: () => void;

  // Actions - Outcome
  applyOutcomeLocally: (outcome: Outcome) => void;

  // Actions - Loading
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Reset
  reset: () => void;

  // Actions - Save/Load
  saveToSlot: (slotId: number) => void;
  loadFromSlot: (slotId: number) => boolean;

  // Computed
  getGameState: () => GameState;
}

const initialState = {
  sessionId: null,
  isInitialized: false,
  isConnected: false,
  worldSnapshot: null,
  signals: [],
  currentDirective: null,
  currentDirectiveLite: null,
  directiveHistory: [],
  messages: [],
  isLoading: false,
  error: null,
};

const DEFAULT_GAME_STATE: GameState = {
  hp: 100,
  maxHp: 100,
  gold: 50,
  location: "village_square",
  reputation: 0,
  flags: {},
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Session Actions
      setSessionId: (id) => set({ sessionId: id }),
      setInitialized: (value) => set({ isInitialized: value }),
      setConnected: (value) => set({ isConnected: value }),

      // World Actions
      setWorldSnapshot: (snapshot) => set({ worldSnapshot: snapshot }),

      updateWorldState: (updates) => {
        const current = get().worldSnapshot;
        if (!current) return;

        set({
          worldSnapshot: {
            ...current,
            ts: new Date().toISOString(),
            state: {
              ...current.state,
              ...updates,
            },
          },
        });
      },

      setSignals: (signals) => set({ signals }),

      // Directive Actions
      setDirective: (directive) => set({ currentDirective: directive }),

      setDirectiveLite: (lite) => set({ currentDirectiveLite: lite }),

      archiveDirective: (directive) => {
        set((state) => ({
          directiveHistory: [...state.directiveHistory, directive].slice(-10),
        }));
      },

      // Message Actions
      addMessage: (message) => {
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
            },
          ].slice(-100), // Keep last 100 messages
        }));
      },

      addSystemMessage: (content) => {
        get().addMessage({ type: "system", content });
      },

      addPlayerMessage: (content) => {
        get().addMessage({ type: "player", content });
      },

      addNpcMessage: (content, metadata) => {
        get().addMessage({ type: "npc", content, metadata });
      },

      addDirectiveMessage: (content) => {
        get().addMessage({ type: "directive", content });
      },

      addConsequenceMessage: (content, metadata) => {
        get().addMessage({ type: "consequence", content, metadata });
      },

      clearMessages: () => set({ messages: [] }),

      // Outcome Actions
      applyOutcomeLocally: (outcome) => {
        const current = get().worldSnapshot;
        if (!current) return;

        const newState = { ...current.state };
        for (const change of outcome.changes) {
          const key = change.metric;
          if (typeof newState[key] === "number") {
            newState[key] = (newState[key] as number) + change.delta;
          }
        }

        set({
          worldSnapshot: {
            ...current,
            ts: new Date().toISOString(),
            state: newState,
          },
        });
      },

      // Loading Actions
      setLoading: (value) => set({ isLoading: value }),
      setError: (error) => set({ error }),

      // Reset
      reset: () => set(initialState),

      // Save/Load
      saveToSlot: (slotId: number) => {
        const state = get();
        if (!state.sessionId || !state.worldSnapshot) return;

        const saveData: SaveData = {
          sessionId: state.sessionId,
          worldSnapshot: state.worldSnapshot,
          messages: state.messages,
          currentDirective: state.currentDirective,
          directiveHistory: state.directiveHistory,
        };

        saveManager.saveGame(slotId, saveData, state.getGameState());
      },

      loadFromSlot: (slotId: number) => {
        const saveData = saveManager.loadGame(slotId);
        if (!saveData) return false;

        set({
          sessionId: saveData.sessionId,
          worldSnapshot: saveData.worldSnapshot,
          messages: saveData.messages,
          currentDirective: saveData.currentDirective,
          directiveHistory: saveData.directiveHistory,
          isInitialized: true,
          isConnected: true,
          isLoading: false,
          error: null,
        });

        return true;
      },

      // Computed
      getGameState: () => {
        const snapshot = get().worldSnapshot;
        if (!snapshot) return DEFAULT_GAME_STATE;

        return {
          hp: (snapshot.state.hp as number) ?? DEFAULT_GAME_STATE.hp,
          maxHp: (snapshot.state.max_hp as number) ?? DEFAULT_GAME_STATE.maxHp,
          gold: (snapshot.state.gold as number) ?? DEFAULT_GAME_STATE.gold,
          location:
            (snapshot.state.location as string) ?? DEFAULT_GAME_STATE.location,
          reputation:
            (snapshot.state.reputation as number) ??
            DEFAULT_GAME_STATE.reputation,
          flags:
            (snapshot.state.flags as Record<string, boolean>) ??
            DEFAULT_GAME_STATE.flags,
        };
      },
    }),
    {
      name: "f2f-game-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        worldSnapshot: state.worldSnapshot,
        messages: state.messages.slice(-20), // Only persist last 20 messages
      }),
    }
  )
);

/**
 * Selector hooks for common state slices
 */
export const useSessionId = () => useGameStore((s) => s.sessionId);
export const useIsLoading = () => useGameStore((s) => s.isLoading);
export const useError = () => useGameStore((s) => s.error);
export const useMessages = () => useGameStore((s) => s.messages);
export const useDirective = () => useGameStore((s) => s.currentDirective);
export const useDirectiveLite = () => useGameStore((s) => s.currentDirectiveLite);
export const useSignals = () => useGameStore((s) => s.signals);
export const useGameState = () => useGameStore((s) => s.getGameState());
