"use client";

/**
 * DirectivePanel Component
 *
 * Displays the current directive from F2F-Engine.
 * Shows objective, clues, and choice buttons.
 * Supports dynamic payload structure from GameSchema.
 */

import { Directive, Choice, ClueItem } from "@/lib/engine/types";
import { useDirectiveWithTTL, useTTLDisplay } from "@/lib/hooks/useDirective";
import { ChoiceButtons } from "./ChoiceButtons";

interface DirectivePanelProps {
  directive: Directive;
  onChoiceSelect: (choice: Choice) => void;
  disabled?: boolean;
}

/**
 * Extract value from directive - checks both top-level fields and payload
 */
function getDirectiveField<T>(directive: Directive, field: string): T | undefined {
  // First check top-level fields (for backward compatibility)
  const directiveRecord = directive as unknown as Record<string, unknown>;
  if (field in directiveRecord) {
    return directiveRecord[field] as T;
  }
  // Then check payload
  if (directive.payload && field in directive.payload) {
    return directive.payload[field] as T;
  }
  return undefined;
}

export function DirectivePanel({
  directive,
  onChoiceSelect,
  disabled = false,
}: DirectivePanelProps) {
  const { remainingTTL, isUrgent, isProcessing, shortMessage } = useDirectiveWithTTL();
  const ttlDisplay = useTTLDisplay(remainingTTL);

  const { primary_verb } = directive;

  // Get fields from directive (supports both legacy and payload-based)
  const objectiveText = getDirectiveField<string>(directive, "objective_text");
  const choices = getDirectiveField<Choice[]>(directive, "choices");
  const clues = getDirectiveField<ClueItem[]>(directive, "clues");
  const mood = getDirectiveField<string>(directive, "mood");

  return (
    <div className={`directive-panel ${mood ? `mood-${mood}` : ""}`}>
      {/* Processing indicator */}
      {isProcessing && shortMessage && (
        <div className="processing-message">
          <span className="processing-dots">...</span>
          <span>{shortMessage}</span>
        </div>
      )}

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
      {objectiveText && (
        <div className="directive-objective">
          <span className="prompt">&gt;</span>
          <p className="objective-text">{objectiveText}</p>
        </div>
      )}

      {/* Clues */}
      {clues && clues.length > 0 && (
        <div className="directive-clues">
          <span className="clue-label">[ CLUES ]</span>
          {clues.map((clue, index) => {
            // Handle both string and object formats
            const isString = typeof clue === "string";
            const key = isString ? `clue-${index}` : clue.clue_id || `clue-${index}`;
            const content = isString ? clue : clue.content;
            const type = isString ? "단서" : clue.type;

            return (
              <div key={key} className="clue-item">
                <span className="clue-type">[{type}]</span>
                <span className="clue-content">{content}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Choices */}
      {choices && choices.length > 0 && (
        <ChoiceButtons
          choices={choices}
          onSelect={onChoiceSelect}
          disabled={disabled || isProcessing}
        />
      )}

      <style jsx>{`
        .processing-message {
          padding: 8px 12px;
          margin-bottom: 12px;
          background: rgba(0, 170, 255, 0.1);
          border: 1px dashed rgba(0, 170, 255, 0.5);
          color: #00aaff;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .processing-dots {
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .mood-tense {
          border-color: #ff6600 !important;
        }

        .mood-urgent {
          border-color: #ff4444 !important;
          animation: urgent-pulse 2s ease-in-out infinite;
        }

        @keyframes urgent-pulse {
          0%, 100% { border-color: #ff4444; }
          50% { border-color: #ff8888; }
        }
      `}</style>
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
