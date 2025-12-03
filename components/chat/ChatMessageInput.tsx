"use client";

import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatMessageInputProps {
  chatRoomId: number;
  onSend: (content: string) => void;
}

export default function ChatMessageInput({
  chatRoomId,
  onSend,
}: ChatMessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    onSend(trimmedMessage);
    setMessage("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 키만 누르면 전송 (Shift+Enter는 줄바꿈)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-card p-4">
      <div className="container mx-auto flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
          className="resize-none min-h-[60px] max-h-[120px]"
          rows={2}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          className="self-end px-6"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
