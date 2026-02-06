"use client";

/**
 * useGameSession Hook
 *
 * Manages game session lifecycle and player actions.
 * Handles initialization, action sending, SSE streaming, and state updates.
 */

import { useCallback, useTransition, useRef } from "react";
import { useGameStore } from "@/stores/game-store";
import {
  startGameSession,
  sendFacts,
  checkEngineHealth,
  patchWorldSnapshot,
} from "@/lib/engine/actions";
import { createFactBuilder } from "@/lib/game/fact-builder";
import { determineSuccess } from "@/lib/game/success-resolver";
import { type Choice, extractChoices } from "@/lib/engine/sdk-bridge";
import { useSSEStream } from "./useSSEStream";
import { GameTemplate, getTemplateLocation } from "@/lib/game/templates";

export function useGameSession() {
  const [isPending, startTransition] = useTransition();
  const initializingRef = useRef(false);

  const {
    sessionId,
    isInitialized,
    isConnected,
    worldSnapshot,
    selectedTemplate,
    setSessionId,
    setInitialized,
    setConnected,
    setWorldSnapshot,
    setExperience,
    setExperienceLite,
    setLoading,
    setError,
    addSystemMessage,
    addPlayerMessage,
    addExperienceMessage,
    addConsequenceMessage,
    getGameState,
    reset,
  } = useGameStore();

  // SSE Stream connection
  const {
    connectionStatus: sseConnectionStatus,
    loopState,
    shortMessage,
    connect: connectSSE,
    disconnect: disconnectSSE,
    isConnected: isSSEConnected,
    isProcessing,
  } = useSSEStream({
    sessionId,
    enabled: isInitialized,
  });

  // Initialize game session with template
  const initializeGame = useCallback(async (template?: GameTemplate) => {
    const gameTemplate = template ?? selectedTemplate;

    if (!gameTemplate) {
      setError("게임 템플릿을 선택해주세요.");
      return;
    }

    // Prevent double initialization (React Strict Mode)
    if (initializingRef.current) {
      return;
    }
    initializingRef.current = true;

    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setLoading(true);
    setError(null);

    startTransition(async () => {
      try {
        const isHealthy = await checkEngineHealth();
        setConnected(isHealthy);

        if (!isHealthy) {
          setError("F2F-Engine에 연결할 수 없습니다. 엔진이 실행 중인지 확인해주세요.");
          setInitialized(false);
          initializingRef.current = false;
          return;
        }

        const result = await startGameSession(newSessionId, gameTemplate);

        if (result.success) {
          setWorldSnapshot(result.worldSnapshot);
          setInitialized(true);
          addSystemMessage("F2F-Engine에 연결되었습니다.");
          addSystemMessage(`게임을 시작합니다: ${gameTemplate.name}`);

          const initialLocation = gameTemplate.initialWorldState.location as string;
          const location = getTemplateLocation(gameTemplate, initialLocation);
          if (location) {
            addSystemMessage(`현재 위치: ${location.name}`);
            addSystemMessage(location.description);
          }
        } else {
          setError(result.error ?? "게임을 시작할 수 없습니다.");
          setInitialized(false);
          initializingRef.current = false;
        }
      } catch (error) {
        console.error("Failed to initialize game:", error);
        setError("F2F-Engine 연결 중 오류가 발생했습니다.");
        setConnected(false);
        setInitialized(false);
        initializingRef.current = false;
      } finally {
        setLoading(false);
      }
    });
  }, [
    selectedTemplate,
    setSessionId,
    setLoading,
    setError,
    setConnected,
    setWorldSnapshot,
    setInitialized,
    addSystemMessage,
  ]);

  // Send a player action to the engine
  const sendAction = useCallback(
    async (verb: string, objectId?: string, attributes?: Record<string, unknown>) => {
      if (!sessionId || !worldSnapshot) {
        console.warn("Cannot send action: session not initialized");
        return;
      }

      if (!isConnected) {
        addSystemMessage("F2F-Engine에 연결되어 있지 않습니다. 게임을 다시 시작해주세요.");
        return;
      }

      switch (verb) {
        case "move":
          addPlayerMessage(`${objectId}(으)로 이동합니다.`);
          break;
        case "examine":
          addPlayerMessage(`${objectId}을(를) 살펴봅니다.`);
          break;
        case "talk":
          addPlayerMessage(`${objectId}에게 말을 겁니다.`);
          break;
        case "take":
          addPlayerMessage(`${objectId}을(를) 집어듭니다.`);
          break;
        case "use":
          addPlayerMessage(`${objectId}을(를) 사용합니다.`);
          break;
        case "rest":
          addPlayerMessage("휴식을 취합니다.");
          break;
        case "wait":
          addPlayerMessage("잠시 기다립니다.");
          break;
        default:
          addPlayerMessage(`${verb} ${objectId ?? ""}`);
      }

      const factBuilder = createFactBuilder(sessionId);
      let fact;

      switch (verb) {
        case "move":
          fact = factBuilder.move(objectId!);
          break;
        case "examine":
          fact = factBuilder.examine(objectId!);
          break;
        case "talk":
          fact = factBuilder.talk(objectId!, attributes?.topic as string);
          break;
        case "take":
          fact = factBuilder.take(objectId!);
          break;
        case "use":
          fact = factBuilder.use(objectId!, attributes?.target as string);
          break;
        case "rest":
          fact = factBuilder.rest();
          break;
        case "wait":
          fact = factBuilder.wait();
          break;
        default:
          fact = factBuilder.custom(verb, objectId, attributes ?? {});
      }

      setLoading(true);

      startTransition(async () => {
        try {
          const result = await sendFacts(sessionId, [fact], worldSnapshot);

          if (result.success) {
            if (result.experience) {
              setExperience(result.experience);
              // Use title + summary from Experience
              const displayText = result.experience.summary || result.experience.title;
              addExperienceMessage(displayText);
            }
            if (result.experienceLite) {
              setExperienceLite(result.experienceLite);
            }
          } else {
            addSystemMessage(`오류: ${result.error ?? "행동을 처리할 수 없습니다."}`);
          }
        } catch (error) {
          console.error("Failed to send action:", error);
          addSystemMessage("행동을 처리하는 중 오류가 발생했습니다.");
        } finally {
          setLoading(false);
        }
      });
    },
    [
      sessionId,
      isConnected,
      worldSnapshot,
      setLoading,
      setExperience,
      setExperienceLite,
      addPlayerMessage,
      addExperienceMessage,
      addSystemMessage,
    ]
  );

  // Select a choice from an experience
  const selectChoice = useCallback(
    async (choice: Choice) => {
      if (!sessionId || !worldSnapshot) {
        console.warn("Cannot select choice: session not initialized");
        return;
      }

      const success = determineSuccess(choice);

      const factBuilder = createFactBuilder(sessionId);
      const experience = useGameStore.getState().currentExperience;

      const fact = factBuilder.selectChoice(
        choice.choice_id,
        choice.label,
        experience?.experience_id,
        success
      );

      addPlayerMessage(`[선택] ${choice.label}`);
      setLoading(true);

      startTransition(async () => {
        try {
          const result = await sendFacts(sessionId, [fact], worldSnapshot);

          if (result.success) {
            // Archive current experience
            if (experience) {
              useGameStore.getState().archiveExperience(experience);
            }

            if (result.experience) {
              setExperience(result.experience);
              const displayText = result.experience.summary || result.experience.title;
              addExperienceMessage(displayText);
            } else {
              setExperience(null);
            }

            if (result.experienceLite) {
              setExperienceLite(result.experienceLite);
            }
          } else {
            addSystemMessage(`오류: ${result.error ?? "선택을 처리할 수 없습니다."}`);
          }
        } catch (error) {
          console.error("Failed to select choice:", error);
          addSystemMessage("선택을 처리하는 중 오류가 발생했습니다.");
        } finally {
          setLoading(false);
        }
      });
    },
    [
      sessionId,
      worldSnapshot,
      setLoading,
      setExperience,
      setExperienceLite,
      addPlayerMessage,
      addExperienceMessage,
      addSystemMessage,
    ]
  );

  // Reset and start new game
  const resetGame = useCallback(() => {
    disconnectSSE();
    initializingRef.current = false;
    reset();
  }, [reset, disconnectSSE]);

  return {
    // Session state
    sessionId,
    isInitialized,
    isLoading: isPending || useGameStore.getState().isLoading,
    error: useGameStore.getState().error,
    gameState: getGameState(),

    // SSE state
    sseConnectionStatus,
    isSSEConnected,
    isProcessing,
    loopState,
    shortMessage,

    // Template
    selectedTemplate,

    // Actions
    initializeGame,
    sendAction,
    selectChoice,
    resetGame,
    connectSSE,
    disconnectSSE,
  };
}
