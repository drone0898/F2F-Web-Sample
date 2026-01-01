"use client";

/**
 * useGameSession Hook
 *
 * Manages game session lifecycle and player actions.
 * Handles initialization, action sending, and state updates.
 */

import { useCallback, useTransition, useRef } from "react";
import { useGameStore } from "@/stores/game-store";
import {
  startGameSession,
  sendFacts,
  checkEngineHealth,
} from "@/lib/engine/actions";
import { createFactBuilder } from "@/lib/game/fact-builder";
import { Choice } from "@/lib/engine/types";
import { getLocation } from "@/lib/game/capabilities";

export function useGameSession() {
  const [isPending, startTransition] = useTransition();
  const initializingRef = useRef(false);

  const {
    sessionId,
    isInitialized,
    isConnected,
    worldSnapshot,
    setSessionId,
    setInitialized,
    setConnected,
    setWorldSnapshot,
    setDirective,
    setDirectiveLite,
    setLoading,
    setError,
    addSystemMessage,
    addPlayerMessage,
    addDirectiveMessage,
    getGameState,
    reset,
  } = useGameStore();

  // Initialize game session
  const initializeGame = useCallback(async () => {
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
        // Check engine health first
        const isHealthy = await checkEngineHealth();
        setConnected(isHealthy);

        if (!isHealthy) {
          // Connection failed - show error
          setError("F2F-Engine에 연결할 수 없습니다. 엔진이 실행 중인지 확인해주세요.");
          setInitialized(false);
          initializingRef.current = false; // Allow retry
          return;
        }

        // Initialize with engine
        const result = await startGameSession(newSessionId);

        if (result.success) {
          setWorldSnapshot(result.worldSnapshot);
          setInitialized(true);
          addSystemMessage("F2F-Engine에 연결되었습니다.");
          addSystemMessage("게임을 시작합니다. 마을 광장에 서 있습니다.");

          const location = getLocation("village_square");
          if (location) {
            addSystemMessage(location.description);
          }
        } else {
          setError(result.error ?? "게임을 시작할 수 없습니다.");
          setInitialized(false);
          initializingRef.current = false; // Allow retry
        }
      } catch (error) {
        console.error("Failed to initialize game:", error);
        setError("F2F-Engine 연결 중 오류가 발생했습니다.");
        setConnected(false);
        setInitialized(false);
        initializingRef.current = false; // Allow retry
      } finally {
        setLoading(false);
      }
    });
  }, [
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

      // Build player message based on verb
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

      // Send to engine
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
            if (result.directive) {
              setDirective(result.directive);
              addDirectiveMessage(result.directive.objective_text);
            }
            if (result.directiveLite) {
              setDirectiveLite(result.directiveLite);
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
      setDirective,
      setDirectiveLite,
      addPlayerMessage,
      addDirectiveMessage,
      addSystemMessage,
    ]
  );

  // Select a choice from a directive
  const selectChoice = useCallback(
    async (choice: Choice) => {
      if (!sessionId || !worldSnapshot) {
        console.warn("Cannot select choice: session not initialized");
        return;
      }

      const factBuilder = createFactBuilder(sessionId);
      const directive = useGameStore.getState().currentDirective;
      const fact = factBuilder.selectChoice(
        choice.choice_id,
        choice.label,
        directive?.directive_id
      );

      addPlayerMessage(`[선택] ${choice.label}`);
      setLoading(true);

      startTransition(async () => {
        try {
          const result = await sendFacts(sessionId, [fact], worldSnapshot);

          if (result.success) {
            // Archive current directive before setting new one
            if (directive) {
              useGameStore.getState().archiveDirective(directive);
            }

            if (result.directive) {
              setDirective(result.directive);
              addDirectiveMessage(result.directive.objective_text);
            } else {
              setDirective(null);
            }

            if (result.directiveLite) {
              setDirectiveLite(result.directiveLite);
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
      setDirective,
      setDirectiveLite,
      addPlayerMessage,
      addDirectiveMessage,
      addSystemMessage,
    ]
  );

  // Reset and start new game
  const resetGame = useCallback(() => {
    initializingRef.current = false;
    reset();
    initializeGame();
  }, [reset, initializeGame]);

  return {
    sessionId,
    isInitialized,
    isLoading: isPending || useGameStore.getState().isLoading,
    error: useGameStore.getState().error,
    gameState: getGameState(),
    initializeGame,
    sendAction,
    selectChoice,
    resetGame,
  };
}
