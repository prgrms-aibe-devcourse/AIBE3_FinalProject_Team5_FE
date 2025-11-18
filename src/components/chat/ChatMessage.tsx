"use client";

import { ChatMessage as ChatMessageType, MessageType } from "@/src/types/chat";
import { format } from "date-fns";

interface ChatMessageProps {
  message: ChatMessageType;
  isMyMessage: boolean;
}

export default function ChatMessage({
  message,
  isMyMessage,
}: ChatMessageProps) {
  // 시스템 메시지
  if (
    message.type === MessageType.ENTER ||
    message.type === MessageType.LEAVE
  ) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-muted text-muted-foreground text-sm px-4 py-2 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  // 일반 메시지
  return (
    <div
      className={`flex mb-4 ${isMyMessage ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[70%] ${isMyMessage ? "order-2" : "order-1"}`}>
        {!isMyMessage && (
          <div className="text-sm text-muted-foreground mb-1">
            {message.senderNickname}
          </div>
        )}
        <div
          className={`px-4 py-2 rounded-lg ${
            isMyMessage
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-muted text-foreground rounded-bl-none"
          }`}
        >
          <p className="break-words">{message.content}</p>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {format(new Date(message.createdAt), "HH:mm")}
        </div>
      </div>
    </div>
  );
}
