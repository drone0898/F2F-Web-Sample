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
import { outcomeChangesToOps } from "@/lib/game/outcome-ops";
import { Choice } from "@/lib/engine/types";
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
    setDirective,
    setDirectiveLite,
    setLoading,
    setError,
    addSystemMessage,
    addPlayerMessage,
    addDirectiveMessage,
    addConsequenceMessage,
    applyOutcomeLocally,
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
    // Use provided template or selectedTemplate from store
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

        // Initialize with engine using template
        const result = await startGameSession(newSessionId, gameTemplate);

        if (result.success) {
          setWorldSnapshot(result.worldSnapshot);
          setInitialized(true);
          addSystemMessage("F2F-Engine에 연결되었습니다.");
          addSystemMessage(`게임을 시작합니다: ${gameTemplate.name}`);

          // Get initial location from template
          const initialLocation = gameTemplate.initialWorldState.location as string;
          const location = getTemplateLocation(gameTemplate, initialLocation);
          if (location) {
            addSystemMessage(`현재 위치: ${location.name}`);
            addSystemMessage(location.description);
          }

          // SSE will auto-connect via useSSEStream hook
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

      // 1. Determine success/failure based on choice type
      const success = determineSuccess(choice);

      const factBuilder = createFactBuilder(sessionId);
      const directive = useGameStore.getState().currentDirective;

      // 2. Create fact with success included
      const fact = factBuilder.selectChoice(
        choice.choice_id,
        choice.label,
        directive?.directive_id,
        success
      );

      addPlayerMessage(`[선택] ${choice.label}`);
      setLoading(true);

      startTransition(async () => {
        try {
          const result = await sendFacts(sessionId, [fact], worldSnapshot);

          if (result.success) {
            // 3. Process choice result if available
            if (result.choiceResult) {
              const { outcome } = result.choiceResult;

              // Display outcome narrative
              const prefix = success ? "[성공]" : "[실패]";
              addConsequenceMessage(`${prefix} ${outcome.narrative}`, { success });

              // Apply outcome to local state (UI update)
              applyOutcomeLocally(outcome);

              // Display changes
              for (const change of outcome.changes) {
                const sign = change.delta > 0 ? "+" : "";
                addSystemMessage(`${change.metric} ${sign}${change.delta}`);
              }

              // 4. Sync with Engine via patch
              if (outcome.changes.length > 0) {
                const ops = outcomeChangesToOps(outcome.changes);
                await patchWorldSnapshot(sessionId, {
                  session_id: sessionId,
                  ts: new Date().toISOString(),
                  ops,
                });
              }
            }

            // 5. Archive and set new directive
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
      addConsequenceMessage,
      addSystemMessage,
      applyOutcomeLocally,
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
