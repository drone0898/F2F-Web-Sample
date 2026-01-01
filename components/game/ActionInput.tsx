"use client";

/**
 * ActionInput Component
 *
 * Command input field with parsing and suggestions.
 * Handles both free-form text and quick actions.
 */

import { useState, useCallback, KeyboardEvent } from "react";
import { getLocation, getConnectedLocations } from "@/lib/game/capabilities";

interface ActionInputProps {
  onAction: (verb: string, objectId?: string, attributes?: Record<string, unknown>) => void;
  disabled?: boolean;
  currentLocation?: string;
}

// Command patterns
const COMMANDS = {
  // Movement
  go: { verb: "move", help: "go [장소] - 이동" },
  move: { verb: "move", help: "move [장소] - 이동" },
  enter: { verb: "enter", help: "enter [장소] - 들어가기" },
  exit: { verb: "exit", help: "exit - 나가기" },

  // Interaction
  look: { verb: "examine", help: "look [대상] - 살펴보기" },
  examine: { verb: "examine", help: "examine [대상] - 조사하기" },
  talk: { verb: "talk", help: "talk [NPC] - 대화하기" },
  ask: { verb: "ask", help: "ask [NPC] [주제] - 질문하기" },

  // Items
  take: { verb: "take", help: "take [아이템] - 집기" },
  get: { verb: "take", help: "get [아이템] - 집기" },
  drop: { verb: "drop", help: "drop [아이템] - 버리기" },
  use: { verb: "use", help: "use [아이템] - 사용하기" },
  give: { verb: "give", help: "give [아이템] [대상] - 주기" },

  // Status
  rest: { verb: "rest", help: "rest - 휴식" },
  wait: { verb: "wait", help: "wait - 대기" },

  // Help
  help: { verb: "help", help: "help - 도움말" },
} as const;

type CommandKey = keyof typeof COMMANDS;

export function ActionInput({
  onAction,
  disabled = false,
  currentLocation,
}: ActionInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Parse and execute command
  const executeCommand = useCallback(
    (command: string) => {
      const trimmed = command.trim().toLowerCase();
      if (!trimmed) return;

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0] as CommandKey;
      const args = parts.slice(1);

      // Handle help command
      if (cmd === "help") {
        const helpText = Object.values(COMMANDS)
          .map((c) => c.help)
          .join("\n");
        console.log(helpText); // Could be displayed in UI
        return;
      }

      // Find matching command
      const commandDef = COMMANDS[cmd];
      if (commandDef) {
        const verb = commandDef.verb;
        const objectId = args[0];
        const attributes: Record<string, unknown> = {};

        // Handle special cases
        if (verb === "ask" && args.length > 1) {
          attributes.topic = args.slice(1).join(" ");
        }
        if (verb === "give" && args.length > 1) {
          attributes.target = args[1];
        }

        onAction(verb, objectId, attributes);
      } else {
        // Try as custom command
        onAction(cmd, args[0], { raw: trimmed });
      }

      setInput("");
    },
    [onAction]
  );

  // Handle key press
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled) {
      executeCommand(input);
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Could implement auto-complete here
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Get connected locations for suggestions
  const connectedLocations = currentLocation
    ? getConnectedLocations(currentLocation)
    : [];

  return (
    <div className="action-input-container">
      <div className="action-input">
        <span
          style={{
            color: "var(--terminal-accent)",
            marginRight: "8px",
            fontWeight: "bold",
          }}
        >
          &gt;
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(input.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          disabled={disabled}
          placeholder="명령을 입력하세요 (help 로 도움말)"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          onClick={() => executeCommand(input)}
          disabled={disabled || !input.trim()}
        >
          실행
        </button>
      </div>

      {/* Location suggestions */}
      {connectedLocations.length > 0 && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "11px",
            color: "var(--terminal-fg-dim)",
          }}
        >
          <span>이동 가능: </span>
          {connectedLocations.map((loc, i) => {
            const locInfo = getLocation(loc);
            return (
              <span key={loc}>
                <button
                  onClick={() => onAction("move", loc)}
                  disabled={disabled}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--terminal-accent)",
                    cursor: disabled ? "not-allowed" : "pointer",
                    padding: "0 4px",
                    fontFamily: "inherit",
                    fontSize: "inherit",
                    textDecoration: "underline",
                  }}
                >
                  {locInfo?.name ?? loc}
                </button>
                {i < connectedLocations.length - 1 && ", "}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
