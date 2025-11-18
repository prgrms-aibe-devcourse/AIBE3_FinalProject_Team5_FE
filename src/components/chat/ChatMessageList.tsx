"use client";

import { useEffect, useRef } from "react";
import { ChatMessage as ChatMessageType } from "../../types/chat";
import ChatMessage from "./ChatMessage";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  currentUserId: number;
}

export default function ChatMessageList({
  messages,
  currentUserId,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 오면 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          메시지가 없습니다. 첫 메시지를 보내보세요!
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isMyMessage={message.senderId === currentUserId}
            />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
