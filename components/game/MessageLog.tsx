"use client";

/**
 * MessageLog Component
 *
 * Displays the scrolling message history.
 * Shows system messages, player actions, NPC dialogue, and directives.
 */

import { useEffect, useRef } from "react";
import { GameMessage } from "@/lib/engine/types";

interface MessageLogProps {
  messages: GameMessage[];
  maxMessages?: number;
}

export function MessageLog({ messages, maxMessages = 100 }: MessageLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const displayMessages = messages.slice(-maxMessages);

  if (displayMessages.length === 0) {
    return (
      <div className="message-log" ref={containerRef}>
        <div className="message-item system">
          게임을 시작하려면 행동을 입력하세요...
        </div>
      </div>
    );
  }

  return (
    <div className="message-log" ref={containerRef}>
      {displayMessages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}

interface MessageItemProps {
  message: GameMessage;
}

function MessageItem({ message }: MessageItemProps) {
  const { type, content, timestamp } = message;

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`message-item ${type}`}>
      <span className="message-time" style={{
        color: "var(--terminal-fg-dim)",
        fontSize: "11px",
        marginRight: "8px"
      }}>
        [{formatTime(timestamp)}]
      </span>
      <span className="message-content">{content}</span>
    </div>
  );
}
