"use client";

/**
 * GameTerminal Component
 *
 * Main terminal-style game interface.
 * Combines all game UI components into a cohesive terminal experience.
 * Integrates SSE streaming for real-time updates.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameSession } from "@/lib/hooks/useGameSession";
import { useCurrentExperience } from "@/lib/hooks/useExperience";
import { useMessages, useSignals, useGameStore, useSelectedTemplate } from "@/stores/game-store";
import { saveManager, SaveSlot } from "@/lib/saves/save-manager";
import { MessageLog } from "./MessageLog";
import { ExperiencePanel } from "./ExperiencePanel";
import { StatusBar } from "./StatusBar";
import { ActionInput } from "./ActionInput";
import { SignalIndicator } from "./SignalIndicator";
import { StreamStatusCompact } from "./StreamStatus";
import { getTemplateLocationName } from "@/lib/game/templates";

export function GameTerminal() {
  const router = useRouter();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSlots, setSaveSlots] = useState<(SaveSlot | null)[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const {
    isInitialized,
    isLoading,
    error,
    gameState,
    initializeGame,
    sendAction,
    selectChoice,
    resetGame,
    sseConnectionStatus,
    isSSEConnected,
    isProcessing,
    selectedTemplate,
  } = useGameSession();

  const { experience } = useCurrentExperience();
  const messages = useMessages();
  const signals = useSignals();
  const saveToSlot = useGameStore((s) => s.saveToSlot);

  // Initialize game on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeGame();
    }
  }, [isInitialized, initializeGame]);

  // Load save slots when dialog opens
  useEffect(() => {
    if (showSaveDialog) {
      setSaveSlots(saveManager.getSlots());
    }
  }, [showSaveDialog]);

  const handleSave = (slotId: number) => {
    saveToSlot(slotId);
    setSaveSlots(saveManager.getSlots());
    setSaveMessage(`슬롯 ${slotId}에 저장되었습니다.`);
    setTimeout(() => {
      setSaveMessage(null);
      setShowSaveDialog(false);
    }, 1500);
  };

  const getLocationName = (locationId: string) => {
    if (selectedTemplate) {
      return getTemplateLocationName(selectedTemplate, locationId);
    }
    const locations: Record<string, string> = {
      village_square: "마을 광장",
      tavern: "여관",
      market: "시장",
      blacksmith: "대장간",
      temple: "신전",
      forest_entrance: "숲 입구",
    };
    return locations[locationId] || locationId;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (!isInitialized && !error) {
    return (
      <div className="loading">
        <span className="loading-text">게임 로딩 중</span>
      </div>
    );
  }

  // Connection error state
  if (error && !isInitialized) {
    return (
      <div className="error-container">
        <h2 className="error-title">[ CONNECTION ERROR ]</h2>
        <p className="error-message">{error}</p>

        <div className="error-guide">
          <h3>문제 해결 방법:</h3>
          <ul>
            <li>F2F-Engine이 실행 중인지 확인하세요</li>
            <li>터미널에서 <code>docker-compose up</code> 또는 엔진 서버 실행</li>
            <li>엔진 상태 확인: <code>curl http://localhost:5001/health</code></li>
            <li>환경 변수 <code>F2F_ENGINE_URL</code> 확인</li>
          </ul>
        </div>

        <div className="error-actions">
          <button onClick={() => initializeGame()} className="error-button primary">
            다시 연결
          </button>
          <button onClick={resetGame} className="error-button secondary">
            게임 초기화
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-container">
      {/* Header */}
      <div className="terminal-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="terminal-title">
            {selectedTemplate?.name || "F2F Text Adventure"}
          </span>
          <StreamStatusCompact
            connectionStatus={sseConnectionStatus}
            isProcessing={isProcessing}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <SignalIndicator signals={signals} />
          {(isLoading || isProcessing) && (
            <span style={{ color: "var(--terminal-warning)" }}>
              {isProcessing ? "응답 대기 중..." : "처리 중..."}
            </span>
          )}
          <button
            className="header-button"
            onClick={() => setShowSaveDialog(true)}
            disabled={isLoading || isProcessing}
          >
            저장
          </button>
          <button
            className="header-button secondary"
            onClick={() => router.push("/")}
          >
            메뉴
          </button>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="save-dialog-title">[ SAVE GAME ]</h3>

            {saveMessage && (
              <div className="save-dialog-message">{saveMessage}</div>
            )}

            <div className="save-dialog-slots">
              {saveSlots.map((slot, index) => {
                const slotId = index + 1;
                return (
                  <button
                    key={slotId}
                    className={`save-dialog-slot ${slot ? "filled" : "empty"}`}
                    onClick={() => handleSave(slotId)}
                  >
                    <span className="slot-number">[{slotId}]</span>
                    {slot ? (
                      <div className="slot-info">
                        <span className="slot-location">{getLocationName(slot.location)}</span>
                        <span className="slot-stats">
                          HP {slot.hp}/{slot.maxHp} | {slot.gold}G
                        </span>
                        <span className="slot-date">{formatDate(slot.savedAt)}</span>
                      </div>
                    ) : (
                      <span className="slot-empty">빈 슬롯</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              className="save-dialog-close"
              onClick={() => setShowSaveDialog(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="terminal-body">
        {/* Main Content */}
        <div className="terminal-main">
          <MessageLog messages={messages} />

          {experience && (
            <ExperiencePanel
              experience={experience}
              onChoiceSelect={selectChoice}
              disabled={isLoading || isProcessing}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="terminal-sidebar">
          <StatusBar
            hp={gameState.hp}
            maxHp={gameState.maxHp}
            gold={gameState.gold}
            location={gameState.location}
            reputation={gameState.reputation}
          />
        </aside>
      </div>

      {/* Footer */}
      <div className="terminal-footer">
        <ActionInput
          onAction={sendAction}
          disabled={isLoading}
          currentLocation={gameState.location}
        />
      </div>
    </div>
  );
}
