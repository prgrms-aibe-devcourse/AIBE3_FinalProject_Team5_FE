"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    onSend(message.trim());
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-card">
      <div className="container mx-auto flex gap-2">
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!message.trim()}
          className="bg-primary hover:bg-primary/90"
        >
          <Send className="w-4 h-4 mr-2" />
          전송
        </Button>
      </div>
    </form>
  );
}
