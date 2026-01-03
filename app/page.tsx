"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/game-store";
import { saveManager, SaveSlot } from "@/lib/saves/save-manager";
import { TemplateSelector } from "@/components/game/TemplateSelector";
import { GameTemplate, listTemplates, getTemplateLocationName } from "@/lib/game/templates";

type ViewMode = "main" | "load" | "select-template";

export default function HomePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const [slots, setSlots] = useState<(SaveSlot | null)[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const reset = useGameStore((s) => s.reset);
  const loadFromSlot = useGameStore((s) => s.loadFromSlot);
  const setSelectedTemplate = useGameStore((s) => s.setSelectedTemplate);
  const selectedTemplate = useGameStore((s) => s.selectedTemplate);

  // Load save slots on mount
  useEffect(() => {
    setSlots(saveManager.getSlots());
  }, [viewMode]);

  // Clear localStorage on fresh start (development)
  useEffect(() => {
    // Reset persisted state on page load
    localStorage.removeItem("f2f-game-storage");
    reset();
  }, [reset]);

  const handleNewGame = () => {
    const templates = listTemplates();
    if (templates.length === 1) {
      // Only one template, select it directly
      setSelectedTemplate(templates[0]);
      router.push("/game");
    } else {
      // Multiple templates, show selector
      setViewMode("select-template");
    }
  };

  const handleTemplateSelect = (template: GameTemplate) => {
    setSelectedTemplate(template);
    router.push("/game");
  };

  const handleLoadGame = (slotId: number) => {
    const success = loadFromSlot(slotId);
    if (success) {
      router.push("/game");
    }
  };

  const handleDeleteSlot = (slotId: number) => {
    saveManager.deleteSlot(slotId);
    setSlots(saveManager.getSlots());
    setDeleteConfirm(null);
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

  const getLocationName = (locationId: string) => {
    // Try to get from selected template first
    if (selectedTemplate) {
      return getTemplateLocationName(selectedTemplate, locationId);
    }
    // Fallback to default mapping
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

  const hasSaves = slots.some((slot) => slot !== null);

  // Template Selection View
  if (viewMode === "select-template") {
    return (
      <div className="home-container">
        <div className="home-content template-select-view">
          <h2 className="save-title">[ 게임 선택 ]</h2>
          <p className="template-subtitle">플레이할 게임을 선택하세요</p>

          <TemplateSelector
            onSelect={handleTemplateSelect}
            selectedTemplateId={selectedTemplate?.id}
          />

          <button
            onClick={() => setViewMode("main")}
            className="back-button"
          >
            [ 뒤로 ]
          </button>
        </div>
      </div>
    );
  }

  // Load Game View
  if (viewMode === "load") {
    return (
      <div className="home-container">
        <div className="home-content">
          <h2 className="save-title">[ SAVED GAMES ]</h2>

          <div className="save-list">
            {slots.map((slot, index) => {
              const slotId = index + 1;

              if (!slot) {
                return (
                  <div key={slotId} className="save-slot empty">
                    <span className="slot-number">[{slotId}]</span>
                    <span className="slot-empty">--- 빈 슬롯 ---</span>
                  </div>
                );
              }

              return (
                <div key={slotId} className="save-slot filled">
                  <div
                    className="slot-content"
                    onClick={() => handleLoadGame(slotId)}
                  >
                    <div className="slot-header">
                      <span className="slot-number">[{slotId}]</span>
                      <span className="slot-location">
                        {getLocationName(slot.location)}
                      </span>
                    </div>
                    <div className="slot-stats">
                      <span className="slot-hp">
                        HP {slot.hp}/{slot.maxHp}
                      </span>
                      <span className="slot-gold">{slot.gold}G</span>
                    </div>
                    <div className="slot-date">{formatDate(slot.savedAt)}</div>
                  </div>
                  <button
                    className="slot-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(slotId);
                    }}
                  >
                    {deleteConfirm === slotId ? (
                      <span
                        className="delete-confirm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlot(slotId);
                        }}
                      >
                        확인
                      </span>
                    ) : (
                      "삭제"
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              setViewMode("main");
              setDeleteConfirm(null);
            }}
            className="back-button"
          >
            [ 뒤로 ]
          </button>
        </div>
      </div>
    );
  }

  // Main Menu View
  return (
    <div className="home-container">
      <div className="home-content">
        <pre className="ascii-art">
          {`
 ███████╗██████╗ ███████╗
 ██╔════╝╚════██╗██╔════╝
 █████╗   █████╔╝█████╗
 ██╔══╝  ██╔═══╝ ██╔══╝
 ██║     ███████╗██║
 ╚═╝     ╚══════╝╚═╝
   TEXT ADVENTURE
`}
        </pre>

        <h1 className="home-title">F2F Text Adventure</h1>
        <p className="home-subtitle">Facts to Fun Engine Demo</p>

        <div className="home-description">
          <p>F2F-Engine과 연동된 텍스트 어드벤처 게임입니다.</p>
          <p>당신의 선택이 이야기를 만들어갑니다.</p>
        </div>

        <div className="menu-buttons">
          <button onClick={handleNewGame} className="start-button">
            [ 새 게임 ]
          </button>
          <button
            onClick={() => setViewMode("load")}
            className="start-button secondary"
            disabled={!hasSaves}
          >
            [ 불러오기 ]
          </button>
        </div>

        <div className="home-footer">
          <p className="footer-example">F2F-Engine Example Game</p>
          <p className="footer-author">Author: <a href="https://github.com/drone0898" target="_blank" rel="noopener noreferrer">drone0898</a></p>
        </div>
      </div>
    </div>
  );
}
