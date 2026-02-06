"use client";

/**
 * ExperiencePanel Component
 *
 * Displays the current experience from F2F-Engine.
 * Shows title, summary, clues, and choice buttons.
 * Uses extractChoices/extractClues from sdk-bridge for payload parsing.
 */

import {
  type Experience,
  type Choice,
  extractChoices,
  extractClues,
  extractPayloadField,
} from "@/lib/engine/sdk-bridge";
import { useExperienceWithTTL, useTTLDisplay } from "@/lib/hooks/useExperience";
import { ChoiceButtons } from "./ChoiceButtons";

interface ExperiencePanelProps {
  experience: Experience;
  onChoiceSelect: (choice: Choice) => void;
  disabled?: boolean;
}

export function ExperiencePanel({
  experience,
  onChoiceSelect,
  disabled = false,
}: ExperiencePanelProps) {
  const { remainingTTL, isUrgent, isProcessing, shortMessage } = useExperienceWithTTL();
  const ttlDisplay = useTTLDisplay(remainingTTL);

  const { primary_verb, title, summary, payload } = experience;

  // Extract from payload
  const choices = extractChoices(payload);
  const clues = extractClues(payload);
  const mood = extractPayloadField<string>(payload, "mood");

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

      {/* Title */}
      {title && (
        <div className="directive-objective">
          <span className="prompt">&gt;</span>
          <p className="objective-text" style={{ fontWeight: "bold" }}>{title}</p>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="directive-objective">
          <p className="objective-text">{summary}</p>
        </div>
      )}

      {/* Clues */}
      {clues.length > 0 && (
        <div className="directive-clues">
          <span className="clue-label">[ CLUES ]</span>
          {clues.map((clue, index) => (
            <div key={`clue-${index}`} className="clue-item">
              <span className="clue-type">[단서]</span>
              <span className="clue-content">{clue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Choices */}
      {choices.length > 0 && (
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
 * ExperienceLitePanel - for quick hints
 */
interface ExperienceLitePanelProps {
  hint: string;
  action: string;
  priority: number;
}

export function ExperienceLitePanel({
  hint,
  action,
  priority,
}: ExperienceLitePanelProps) {
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
