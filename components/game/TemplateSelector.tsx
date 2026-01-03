"use client";

/**
 * Template Selector Component
 *
 * Displays available game templates and allows selection.
 */

import { GameTemplate, listTemplates } from "@/lib/game/templates";

interface TemplateSelectorProps {
  onSelect: (template: GameTemplate) => void;
  selectedTemplateId?: string | null;
}

const THEME_LABELS: Record<string, string> = {
  fantasy: "판타지",
  "sci-fi": "SF",
  mystery: "미스터리",
  horror: "호러",
  custom: "커스텀",
};

const THEME_COLORS: Record<string, string> = {
  fantasy: "#00ff88",
  "sci-fi": "#00aaff",
  mystery: "#ffaa00",
  horror: "#ff4444",
  custom: "#aaaaaa",
};

export function TemplateSelector({ onSelect, selectedTemplateId }: TemplateSelectorProps) {
  const templates = listTemplates();

  return (
    <div className="template-selector">
      <div className="template-grid">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplateId === template.id}
            onSelect={() => onSelect(template)}
          />
        ))}
      </div>

      <style jsx>{`
        .template-selector {
          width: 100%;
          max-width: 800px;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }
      `}</style>
    </div>
  );
}

interface TemplateCardProps {
  template: GameTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const themeColor = THEME_COLORS[template.theme] || "#00ff88";
  const themeLabel = THEME_LABELS[template.theme] || template.theme;

  return (
    <button
      className={`template-card ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
      style={{ "--theme-color": themeColor } as React.CSSProperties}
    >
      <div className="card-header">
        <span className="theme-badge">{themeLabel}</span>
      </div>

      <h3 className="card-title">{template.name}</h3>
      <p className="card-description">{template.description}</p>

      <div className="card-footer">
        <span className="game-id">{template.id}</span>
      </div>

      <style jsx>{`
        .template-card {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid var(--theme-color);
          border-radius: 8px;
          padding: 1.5rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .template-card:hover {
          border-color: var(--theme-color);
          box-shadow: 0 0 20px color-mix(in srgb, var(--theme-color) 30%, transparent);
          transform: translateY(-2px);
        }

        .template-card.selected {
          border-width: 2px;
          box-shadow: 0 0 30px color-mix(in srgb, var(--theme-color) 50%, transparent);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .theme-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: color-mix(in srgb, var(--theme-color) 20%, transparent);
          border: 1px solid var(--theme-color);
          border-radius: 4px;
          color: var(--theme-color);
          text-transform: uppercase;
          font-weight: bold;
        }

        .card-title {
          font-size: 1.25rem;
          color: var(--theme-color);
          margin: 0;
          font-family: var(--font-mono, monospace);
        }

        .card-description {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.5;
          flex: 1;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .game-id {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          font-family: var(--font-mono, monospace);
        }
      `}</style>
    </button>
  );
}

export default TemplateSelector;
