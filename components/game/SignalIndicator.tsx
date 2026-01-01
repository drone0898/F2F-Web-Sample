"use client";

/**
 * SignalIndicator Component
 *
 * Displays F2F-Engine signal values.
 * Shows tension, progress, and other game dynamics.
 */

import { Signal } from "@/lib/engine/types";

interface SignalIndicatorProps {
  signals: Signal[];
}

const SIGNAL_LABELS: Record<string, string> = {
  TENSION: "긴장",
  REPETITION: "반복",
  STAGNATION: "정체",
  DIFFICULTY: "난이도",
  PROGRESS: "진행",
};

export function SignalIndicator({ signals }: SignalIndicatorProps) {
  if (!signals || signals.length === 0) {
    return null;
  }

  // Get most recent signals (10s window preferred)
  const recentSignals = signals.filter(
    (s) => s.window_seconds === 10 || signals.length <= 5
  );

  // Filter to key signals
  const keySignals = recentSignals.filter((s) =>
    ["TENSION", "PROGRESS", "STAGNATION"].includes(s.type)
  );

  if (keySignals.length === 0) {
    return null;
  }

  return (
    <div className="signal-indicator">
      {keySignals.map((signal) => (
        <SignalDot key={signal.type} signal={signal} />
      ))}
    </div>
  );
}

interface SignalDotProps {
  signal: Signal;
}

function SignalDot({ signal }: SignalDotProps) {
  const { type, value, delta } = signal;

  // Determine level based on value
  const level: "low" | "medium" | "high" =
    value > 0.7 ? "high" : value > 0.4 ? "medium" : "low";

  // Determine trend
  const trend = delta > 0.05 ? "↑" : delta < -0.05 ? "↓" : "";

  const label = SIGNAL_LABELS[type] ?? type;

  return (
    <div
      className="signal-item"
      title={`${label}: ${Math.round(value * 100)}%`}
    >
      <div className={`signal-dot ${level}`} />
      <span
        style={{
          fontSize: "11px",
          color: "var(--terminal-fg-dim)",
        }}
      >
        {label}
        {trend}
      </span>
    </div>
  );
}

/**
 * Compact signal bar for inline display
 */
interface SignalBarProps {
  label: string;
  value: number;
  maxValue?: number;
}

export function SignalBar({ label, value, maxValue = 1 }: SignalBarProps) {
  const percentage = Math.round((value / maxValue) * 100);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "11px",
      }}
    >
      <span style={{ width: "40px", color: "var(--terminal-fg-dim)" }}>
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: "4px",
          background: "var(--terminal-border)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background:
              percentage > 70
                ? "var(--terminal-error)"
                : percentage > 40
                ? "var(--terminal-warning)"
                : "var(--terminal-fg)",
            transition: "width 0.3s",
          }}
        />
      </div>
      <span style={{ width: "30px", textAlign: "right" }}>{percentage}%</span>
    </div>
  );
}
