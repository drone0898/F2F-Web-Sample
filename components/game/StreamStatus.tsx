"use client";

/**
 * Stream Status Component
 *
 * Displays SSE connection status, loop state, and short messages.
 */

import { SSEConnectionStatus, LoopStatus } from "@/lib/engine/types";

interface StreamStatusProps {
  connectionStatus: SSEConnectionStatus;
  loopState: LoopStatus | null;
  shortMessage: string | null;
  className?: string;
}

const CONNECTION_STATUS_CONFIG: Record<
  SSEConnectionStatus,
  { label: string; color: string; icon: string }
> = {
  connecting: { label: "연결 중...", color: "#ffaa00", icon: "..." },
  connected: { label: "연결됨", color: "#00ff88", icon: "*" },
  disconnected: { label: "연결 끊김", color: "#888888", icon: "x" },
  error: { label: "오류", color: "#ff4444", icon: "!" },
};

const LOOP_STATE_CONFIG: Record<
  LoopStatus,
  { label: string; color: string }
> = {
  WAIT: { label: "대기 중", color: "#888888" },
  DECIDE: { label: "분석 중...", color: "#ffaa00" },
  GENERATE: { label: "응답 생성 중...", color: "#00aaff" },
  PAUSE: { label: "일시 정지", color: "#888888" },
  ERROR: { label: "오류 발생", color: "#ff4444" },
};

export function StreamStatus({
  connectionStatus,
  loopState,
  shortMessage,
  className = "",
}: StreamStatusProps) {
  const connConfig = CONNECTION_STATUS_CONFIG[connectionStatus];
  const loopConfig = loopState ? LOOP_STATE_CONFIG[loopState] : null;

  const isProcessing = loopState === "DECIDE" || loopState === "GENERATE";

  return (
    <div className={`stream-status ${className}`}>
      {/* Connection Status */}
      <div className="connection-indicator" style={{ color: connConfig.color }}>
        <span className="indicator-icon">[{connConfig.icon}]</span>
        <span className="indicator-label">{connConfig.label}</span>
      </div>

      {/* Loop State */}
      {loopConfig && isProcessing && (
        <div className="loop-state" style={{ color: loopConfig.color }}>
          <span className="processing-indicator">
            {loopState === "GENERATE" ? (
              <LoadingDots />
            ) : (
              <span className="pulse">*</span>
            )}
          </span>
          <span className="loop-label">{loopConfig.label}</span>
        </div>
      )}

      {/* Short Message */}
      {shortMessage && (
        <div className="short-message">
          <span className="message-text">{shortMessage}</span>
        </div>
      )}

      <style jsx>{`
        .stream-status {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-family: var(--font-mono, monospace);
          font-size: 0.75rem;
        }

        .connection-indicator {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .indicator-icon {
          font-weight: bold;
        }

        .loop-state {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .processing-indicator {
          display: inline-flex;
          width: 1.5em;
          justify-content: center;
        }

        .pulse {
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .short-message {
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

/**
 * Animated loading dots
 */
function LoadingDots() {
  return (
    <span className="loading-dots">
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>

      <style jsx>{`
        .loading-dots {
          display: inline-flex;
        }

        .dot {
          animation: bounce 1.4s ease-in-out infinite;
        }

        .dot:nth-child(1) { animation-delay: 0s; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
      `}</style>
    </span>
  );
}

/**
 * Compact version for header
 */
export function StreamStatusCompact({
  connectionStatus,
  isProcessing,
}: {
  connectionStatus: SSEConnectionStatus;
  isProcessing: boolean;
}) {
  const connConfig = CONNECTION_STATUS_CONFIG[connectionStatus];

  return (
    <div className="stream-status-compact">
      <span
        className={`status-dot ${isProcessing ? "processing" : ""}`}
        style={{ backgroundColor: connConfig.color }}
        title={connConfig.label}
      />

      {isProcessing && <LoadingDots />}

      <style jsx>{`
        .stream-status-compact {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: background-color 0.3s;
        }

        .status-dot.processing {
          animation: pulse-dot 1s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export default StreamStatus;
