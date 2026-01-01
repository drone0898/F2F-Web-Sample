"use client";

/**
 * StatusBar Component
 *
 * Displays player status information.
 * HP bar, gold, location, and reputation.
 */

import { getLocation } from "@/lib/game/capabilities";

interface StatusBarProps {
  hp: number;
  maxHp: number;
  gold: number;
  location: string;
  reputation?: number;
}

export function StatusBar({
  hp,
  maxHp,
  gold,
  location,
  reputation = 0,
}: StatusBarProps) {
  const hpPercentage = Math.round((hp / maxHp) * 100);
  const locationInfo = getLocation(location);
  const locationName = locationInfo?.name ?? location;

  // HP bar color based on percentage
  const hpColor =
    hpPercentage > 60
      ? "var(--terminal-fg)"
      : hpPercentage > 30
      ? "var(--terminal-warning)"
      : "var(--terminal-error)";

  // Reputation display
  const reputationLabel =
    reputation > 50
      ? "영웅"
      : reputation > 20
      ? "존경받음"
      : reputation > 0
      ? "알려짐"
      : reputation < -20
      ? "악명 높음"
      : reputation < 0
      ? "의심받음"
      : "무명";

  return (
    <div className="status-bar">
      {/* Location */}
      <div className="status-section">
        <span className="status-label">위치</span>
        <span className="status-value location">{locationName}</span>
      </div>

      {/* HP */}
      <div className="status-section">
        <span className="status-label">체력</span>
        <div className="hp-bar">
          <div
            className="hp-fill"
            style={{
              width: `${hpPercentage}%`,
              backgroundColor: hpColor,
            }}
          />
          <span className="hp-text">
            {hp}/{maxHp}
          </span>
        </div>
      </div>

      {/* Gold */}
      <div className="status-section">
        <span className="status-label">금화</span>
        <span className="status-value gold">{gold} G</span>
      </div>

      {/* Reputation */}
      <div className="status-section">
        <span className="status-label">평판</span>
        <span
          className="status-value"
          style={{
            color:
              reputation > 0
                ? "var(--terminal-fg)"
                : reputation < 0
                ? "var(--terminal-error)"
                : "var(--terminal-fg-dim)",
          }}
        >
          {reputationLabel} ({reputation})
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid var(--terminal-border)",
          margin: "16px 0",
        }}
      />

      {/* Quick Commands */}
      <div className="status-section">
        <span className="status-label">명령어</span>
        <div
          style={{
            fontSize: "11px",
            color: "var(--terminal-fg-dim)",
            lineHeight: "1.8",
          }}
        >
          <div>이동: go [장소]</div>
          <div>조사: look [대상]</div>
          <div>대화: talk [NPC]</div>
          <div>휴식: rest</div>
        </div>
      </div>
    </div>
  );
}
