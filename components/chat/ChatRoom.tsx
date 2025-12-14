"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/global/auth/useAuth";
import { ChatWebSocketClient } from "@/lib/websocket/chatWebSocket";
import { useChatStore } from "@/store/chatStore";
import {
  fetchChatRoom,
  fetchChatMessages,
  leaveChatRoom,
} from "@/lib/api/chatApi";
import ChatMessageList from "./ChatMessageList";
import ChatMessageInput from "./ChatMessageInput";
import { MessageType } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, MapPin } from "lucide-react";
import { getCategoryIcon, getCategoryColor } from "@/lib/utils/categoryIcons";

interface ChatRoomProps {
  chatRoomId: number;
}

export default function ChatRoom({ chatRoomId }: ChatRoomProps) {
  const router = useRouter();
  const { loginMember } = useAuth();
  const wsClient = useRef<ChatWebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const {
    currentChatRoom,
    setCurrentChatRoom,
    messages,
    addMessage,
    setMessages,
    clearMessages,
  } = useChatStore();

  const CategoryIcon = currentChatRoom
    ? getCategoryIcon(currentChatRoom.category)
    : null;
  const categoryColor = currentChatRoom
    ? getCategoryColor(currentChatRoom.category)
    : "";

  useEffect(() => {
    if (!loginMember) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    loadChatRoomData();

    return () => {
      if (wsClient.current) {
        wsClient.current.disconnect();
      }
    };
  }, [chatRoomId, loginMember]);

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
      router.push("/groups");
    }
  };

  const connectWebSocket = () => {
    if (!loginMember) {
      console.error("로그인 정보가 없습니다.");
      return;
    }

    wsClient.current = new ChatWebSocketClient(
      loginMember.id,
      loginMember.nickname
    );

    wsClient.current.connect(
      chatRoomId,
      (message) => {
        addMessage(message);

        if (
          message.type === MessageType.ENTER ||
          message.type === MessageType.LEAVE
        ) {
          updateChatRoomInfo();
        }
      },
      () => {
        setIsConnected(true);
      }
    );
  };

  const updateChatRoomInfo = async () => {
    try {
      const updatedRoom = await fetchChatRoom(chatRoomId);
      setCurrentChatRoom(updatedRoom);
    } catch (error) {
      console.error("❌ 채팅방 정보 업데이트 실패:", error);
    }
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
      // 1. WebSocket 연결 해제
      if (wsClient.current) {
        wsClient.current.disconnect();
      }

      // 2. 채팅방 나가기 API 호출 (쿠키 기반)
      await leaveChatRoom(chatRoomId);

      // 3. 상태 초기화
      clearMessages();
      setCurrentChatRoom(null);

      console.log("✅ 채팅방 나가기 완료");

      // 4. 목록 페이지로 이동 + 새로고침
      router.push("/groups");
      router.refresh();
    } catch (error: any) {
      console.error("❌ 채팅방 나가기 실패:", error);

      // 채팅방이 이미 삭제된 경우
      if (error.message?.includes("존재하지 않는") || error.status === 404) {
        console.log("ℹ️ 채팅방이 이미 삭제되었습니다. 목록으로 이동합니다.");
        clearMessages();
        setCurrentChatRoom(null);
        router.push("/groups");
        router.refresh();
      } else {
        alert("채팅방 나가기에 실패했습니다.");
      }
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
    // h-screen으로 전체 화면 높이 고정
    <div className="flex flex-col h-screen bg-background">
      {/* 헤더 - 고정 위치 (shrink-0로 축소 방지) */}
      <div className="sticky top-0 z-10 border-b bg-card px-6 py-4 mt-20 shrink-0">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/groups")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>

            <div className="border-l pl-4">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">{currentChatRoom.name}</h1>

                {/* ✅ 소모임 배지 */}
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary"
                >
                  {currentChatRoom.type === "SMALL_GROUP"
                    ? "소모임"
                    : "공동구매"}
                </Badge>

                {/* 카테고리 배지 추가 */}
                {currentChatRoom.category && CategoryIcon && (
                  <Badge variant="outline" className="gap-1">
                    <CategoryIcon className={`w-3 h-3 ${categoryColor}`} />
                    {currentChatRoom.category}
                  </Badge>
                )}

                {/* 연결 상태 */}
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

      {/* 메시지 영역 - 스크롤 가능 (flex-1로 남은 공간 차지) */}
      <div className="flex-1 overflow-y-auto">
        <ChatMessageList
          messages={messages}
          currentUserId={loginMember?.id || 0}
        />
      </div>

      {/* 입력 영역 - 고정 하단 (shrink-0로 축소 방지) */}
      <div className="sticky bottom-0 bg-background border-t shrink-0">
        <ChatMessageInput chatRoomId={chatRoomId} onSend={handleSendMessage} />
      </div>
    </div>
  );
}
