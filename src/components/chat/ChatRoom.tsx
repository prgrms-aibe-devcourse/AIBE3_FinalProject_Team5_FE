"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatWebSocketClient } from "@/src/lib/websocket/chatWebSocket";
import { useChatStore } from "@/src/store/chatStore";
import {
  fetchChatRoom,
  fetchChatMessages,
  leaveChatRoom,
} from "@/src/lib/api/chatApi";
import ChatMessageList from "./ChatMessageList";
import ChatMessageInput from "./ChatMessageInput";
import { MessageType } from "@/src/types/chat";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ArrowLeft, Users, MapPin } from "lucide-react";

interface ChatRoomProps {
  chatRoomId: number;
}

const TEMP_USER_ID = 1;

export default function ChatRoom({ chatRoomId }: ChatRoomProps) {
  const router = useRouter();
  const wsClient = useRef<ChatWebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const {
    currentChatRoom,
    setCurrentChatRoom,
    messages,
    addMessage,
    setMessages,
  } = useChatStore();

  useEffect(() => {
    loadChatRoomData();

    return () => {
      if (wsClient.current) {
        wsClient.current.disconnect();
      }
    };
  }, [chatRoomId]);

  const loadChatRoomData = async () => {
    try {
      const room = await fetchChatRoom(chatRoomId);
      setCurrentChatRoom(room);

      const previousMessages = await fetchChatMessages(chatRoomId);
      setMessages(previousMessages);

      connectWebSocket();
    } catch (error) {
      console.error("채팅방 데이터 로드 실패:", error);
      alert("채팅방을 불러오는데 실패했습니다.");
      router.push("/chat");
    }
  };

  const connectWebSocket = () => {
    wsClient.current = new ChatWebSocketClient();

    wsClient.current.connect(
      chatRoomId,
      (message) => {
        addMessage(message);
      },
      () => {
        setIsConnected(true);
        console.log("WebSocket 연결 완료");
      }
    );
  };

  const handleSendMessage = (content: string) => {
    if (!wsClient.current || !isConnected) {
      alert("채팅 서버에 연결되지 않았습니다.");
      return;
    }

    wsClient.current.sendMessage({
      chatRoomId,
      type: MessageType.TALK,
      content,
    });
  };

  const handleLeaveChatRoom = async () => {
    if (!confirm("채팅방을 나가시겠습니까?")) return;

    try {
      await leaveChatRoom(chatRoomId);
      if (wsClient.current) {
        wsClient.current.disconnect();
      }
      router.push("/chat");
    } catch (error) {
      console.error("채팅방 나가기 실패:", error);
      alert("채팅방 나가기에 실패했습니다.");
    }
  };

  if (!currentChatRoom) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 헤더 */}
      <div className="border-b bg-card px-6 py-4 mt-20">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/chat")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>

            <div className="border-l pl-4">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">{currentChatRoom.name}</h1>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary"
                >
                  {currentChatRoom.type === "SMALL_GROUP"
                    ? "소모임"
                    : "공동구매"}
                </Badge>
                {isConnected ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    연결됨
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    연결 중...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {currentChatRoom.region}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {currentChatRoom.currentParticipants}/
                  {currentChatRoom.maxParticipants}
                </div>
              </div>
            </div>
          </div>

          <Button variant="destructive" size="sm" onClick={handleLeaveChatRoom}>
            나가기
          </Button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-hidden">
        <ChatMessageList messages={messages} currentUserId={TEMP_USER_ID} />
      </div>

      {/* 입력 영역 */}
      <ChatMessageInput chatRoomId={chatRoomId} onSend={handleSendMessage} />
    </div>
  );
}
