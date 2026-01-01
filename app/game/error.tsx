"use client";

/**
 * Game Error UI
 *
 * Displayed when an error occurs in the game.
 */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GameError({ error, reset }: ErrorProps) {
  return (
    <div className="error-container">
      <h2 className="error-title">[ SYSTEM ERROR ]</h2>
      <p className="error-message">
        {error.message || "알 수 없는 오류가 발생했습니다."}
      </p>
      {error.digest && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--terminal-fg-dim)",
            marginTop: "8px",
          }}
        >
          Error ID: {error.digest}
        </p>
      )}
      <button onClick={reset} className="error-button">
        다시 시도
      </button>
    </div>
  );
}
