"use client";

/**
 * ChoiceButtons Component
 *
 * Displays experience choices as interactive buttons.
 * Supports keyboard shortcuts (1-4).
 */

import { useEffect, useCallback } from "react";
import { type Choice } from "@/lib/engine/sdk-bridge";

interface ChoiceButtonsProps {
  choices: Choice[];
  onSelect: (choice: Choice) => void;
  disabled?: boolean;
  maxChoices?: number;
}

export function ChoiceButtons({
  choices,
  onSelect,
  disabled = false,
  maxChoices = 4,
}: ChoiceButtonsProps) {
  const displayChoices = choices.slice(0, maxChoices);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      const keyNumber = parseInt(event.key, 10);
      if (keyNumber >= 1 && keyNumber <= displayChoices.length) {
        event.preventDefault();
        onSelect(displayChoices[keyNumber - 1]);
      }
    },
    [disabled, displayChoices, onSelect]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  if (displayChoices.length === 0) {
    return null;
  }

  return (
    <div className="choice-buttons">
      {displayChoices.map((choice, index) => (
        <button
          key={choice.choice_id}
          onClick={() => onSelect(choice)}
          disabled={disabled}
          className="choice-button"
          title={`키보드 ${index + 1}번으로 선택`}
        >
          <span className="choice-key">[{index + 1}]</span>
          <span className="choice-label">{choice.label}</span>
          {choice.description && (
            <span className="choice-desc">{choice.description}</span>
          )}
        </button>
      ))}

      <div
        style={{
          marginTop: "8px",
          fontSize: "11px",
          color: "var(--terminal-fg-dim)",
          textAlign: "center",
        }}
      >
        숫자 키 1-{displayChoices.length}로 선택 가능
      </div>
    </div>
  );
}
