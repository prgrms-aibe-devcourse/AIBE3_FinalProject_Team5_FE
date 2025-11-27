"use client";

import { useEffect, useRef } from "react";
import { ChatMessage as ChatMessageType } from "@/types/chat";
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

  // 새 메시지가 올 때마다 스크롤을 맨 아래로 (카카오톡 스타일)
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지를 시간순으로 정렬 (오래된 것 위 → 최신 것 아래)
  const sortedMessages = [...messages].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    // 스크롤 컨테이너
    <div className="px-6 py-4">
      {sortedMessages.length === 0 ? (
        // 빈 화면 - 중앙 정렬
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground text-lg mb-2">
              💬 첫 메시지를 보내보세요!
            </p>
            <p className="text-sm text-muted-foreground/70">
              대화를 시작해보세요
            </p>
          </div>
        </div>
      ) : (
        // 메시지 목록 - 위에서 아래로 흐름
        <div className="space-y-3">
          {sortedMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isMyMessage={message.senderId === currentUserId}
            />
          ))}
          {/* 스크롤 타겟 - 항상 최신 메시지로 스크롤 */}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
