"use client";

/**
 * DirectivePanel Component
 *
 * Displays the current directive from F2F-Engine.
 * Shows objective, clues, and choice buttons.
 */

import { Directive, Choice } from "@/lib/engine/types";
import { useDirectivePolling, useTTLDisplay } from "@/lib/hooks/useDirective";
import { ChoiceButtons } from "./ChoiceButtons";

interface DirectivePanelProps {
  directive: Directive;
  onChoiceSelect: (choice: Choice) => void;
  disabled?: boolean;
}

export function DirectivePanel({
  directive,
  onChoiceSelect,
  disabled = false,
}: DirectivePanelProps) {
  const { remainingTTL, isUrgent } = useDirectivePolling({ enableTTL: true });
  const ttlDisplay = useTTLDisplay(remainingTTL);

  const { primary_verb, objective_text, choices, clues } = directive;

  return (
    <div className="directive-panel">
      {/* Header with verb and TTL */}
      <div className="directive-header">
        <span className="directive-verb">[{primary_verb.toUpperCase()}]</span>
        {ttlDisplay && (
          <span className={`ttl-counter ${isUrgent ? "urgent" : ""}`}>
            <span>TTL:</span>
            <span>{ttlDisplay}</span>
          </span>
        )}
      </div>

      {/* Objective */}
      <div className="directive-objective">
        <span className="prompt">&gt;</span>
        <p className="objective-text">{objective_text}</p>
      </div>

      {/* Clues */}
      {clues && clues.length > 0 && (
        <div className="directive-clues">
          <span className="clue-label">[ CLUES ]</span>
          {clues.map((clue) => (
            <div key={clue.clue_id} className="clue-item">
              <span className="clue-type">[{clue.type}]</span>
              <span className="clue-content">{clue.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Choices */}
      {choices && choices.length > 0 && (
        <ChoiceButtons
          choices={choices}
          onSelect={onChoiceSelect}
          disabled={disabled}
        />
      )}
    </div>
  );
}

/**
 * DirectiveLitePanel - for quick hints
 */
interface DirectiveLitePanelProps {
  hint: string;
  action: string;
  priority: number;
}

export function DirectiveLitePanel({
  hint,
  action,
  priority,
}: DirectiveLitePanelProps) {
  const priorityStyle = {
    color:
      priority >= 3
        ? "var(--terminal-error)"
        : priority >= 2
        ? "var(--terminal-warning)"
        : "var(--terminal-fg-dim)",
  };

  return (
    <div
      className="directive-lite-panel"
      style={{
        padding: "8px 12px",
        border: "1px dashed var(--terminal-fg-dim)",
        marginBottom: "8px",
        fontSize: "12px",
      }}
    >
      <span style={priorityStyle}>[{action}]</span>
      <span style={{ marginLeft: "8px" }}>{hint}</span>
    </div>
  );
}
