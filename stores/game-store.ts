/**
 * Game State Store (Zustand)
 *
 * Central state management for the game.
 * Handles session, world state, experiences, SSE state, and message history.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  type Experience,
  type ExperienceLite,
  type Signal,
  type WorldSnapshot,
  type StreamEvent,
  type SSEConnectionStatus,
  type LoopStatus,
  type GameMessage,
  type GameState,
} from "@/lib/engine/sdk-bridge";
import { saveManager, SaveData } from "@/lib/saves/save-manager";
import { GameTemplate } from "@/lib/game/templates";

interface GameStore {
  // Session
  sessionId: string | null;
  isInitialized: boolean;
  isConnected: boolean;

  // Template
  selectedTemplate: GameTemplate | null;

  // SSE State
  sseConnectionStatus: SSEConnectionStatus;
  loopState: LoopStatus | null;
  shortMessage: string | null;

  // World State
  worldSnapshot: WorldSnapshot | null;
  signals: Signal[];

  // Experiences
  currentExperience: Experience | null;
  currentExperienceLite: ExperienceLite | null;
  experienceHistory: Experience[];

  // Messages
  messages: GameMessage[];

  // Loading States
  isLoading: boolean;
  error: string | null;

  // Actions - Session
  setSessionId: (id: string) => void;
  setInitialized: (value: boolean) => void;
  setConnected: (value: boolean) => void;

  // Actions - Template
  setSelectedTemplate: (template: GameTemplate | null) => void;

  // Actions - SSE
  setSSEConnectionStatus: (status: SSEConnectionStatus) => void;
  setLoopState: (state: LoopStatus | null) => void;
  setShortMessage: (message: string | null) => void;
  handleStreamEvent: (event: StreamEvent) => void;

  // Actions - World
  setWorldSnapshot: (snapshot: WorldSnapshot) => void;
  updateWorldState: (updates: Partial<GameState>) => void;
  setSignals: (signals: Signal[]) => void;

  // Actions - Experiences
  setExperience: (experience: Experience | null) => void;
  setExperienceLite: (lite: ExperienceLite | null) => void;
  archiveExperience: (experience: Experience) => void;

  // Actions - Messages
  addMessage: (message: Omit<GameMessage, "id" | "timestamp">) => void;
  addSystemMessage: (content: string) => void;
  addPlayerMessage: (content: string) => void;
  addNpcMessage: (content: string, metadata?: Record<string, unknown>) => void;
  addExperienceMessage: (content: string) => void;
  addConsequenceMessage: (content: string, metadata?: Record<string, unknown>) => void;
  clearMessages: () => void;

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
  selectedTemplate: null,
  sseConnectionStatus: "disconnected" as SSEConnectionStatus,
  loopState: null,
  shortMessage: null,
  worldSnapshot: null,
  signals: [],
  currentExperience: null,
  currentExperienceLite: null,
  experienceHistory: [],
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

      // Template Actions
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),

      // SSE Actions
      setSSEConnectionStatus: (status) => set({ sseConnectionStatus: status }),
      setLoopState: (state) => set({ loopState: state }),
      setShortMessage: (message) => set({ shortMessage: message }),

      handleStreamEvent: (event) => {
        // Handle state change
        if (event.state) {
          set({ loopState: event.state.status as LoopStatus });
        }

        // Handle short message
        if (event.short_message) {
          set({ shortMessage: event.short_message.message });
        }

        // Handle experience
        if (event.experience) {
          const experience = event.experience;
          set((state) => ({
            currentExperience: experience,
            experienceHistory: [...state.experienceHistory, experience].slice(-10),
            shortMessage: null,
            loopState: null,
          }));
        }

        // Handle experience lite
        if (event.experience_lite) {
          set({ currentExperienceLite: event.experience_lite });
        }

        // Handle error
        if (event.error) {
          set({ error: event.error.message });
        }
      },

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

      // Experience Actions
      setExperience: (experience) => set({ currentExperience: experience }),

      setExperienceLite: (lite) => set({ currentExperienceLite: lite }),

      archiveExperience: (experience) => {
        set((state) => ({
          experienceHistory: [...state.experienceHistory, experience].slice(-10),
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
          ].slice(-100),
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

      addExperienceMessage: (content) => {
        get().addMessage({ type: "experience", content });
      },

      addConsequenceMessage: (content, metadata) => {
        get().addMessage({ type: "consequence", content, metadata });
      },

      clearMessages: () => set({ messages: [] }),

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
          currentExperience: state.currentExperience,
          experienceHistory: state.experienceHistory,
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
          currentExperience: saveData.currentExperience,
          experienceHistory: saveData.experienceHistory,
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
        if (!snapshot?.state) return DEFAULT_GAME_STATE;

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
        messages: state.messages.slice(-20),
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
export const useExperience = () => useGameStore((s) => s.currentExperience);
export const useExperienceLite = () => useGameStore((s) => s.currentExperienceLite);
export const useSignals = () => useGameStore((s) => s.signals);
export const useGameState = () => useGameStore((s) => s.getGameState());

// Template selectors
export const useSelectedTemplate = () => useGameStore((s) => s.selectedTemplate);

// SSE selectors
export const useSSEConnectionStatus = () => useGameStore((s) => s.sseConnectionStatus);
export const useLoopState = () => useGameStore((s) => s.loopState);
export const useShortMessage = () => useGameStore((s) => s.shortMessage);
