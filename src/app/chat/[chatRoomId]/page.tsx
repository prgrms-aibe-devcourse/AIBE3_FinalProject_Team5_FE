"use client";

import { use } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatWebSocketClient } from "@/src/lib/websocket/chatWebSocket";
import { useChatStore } from "@/src/store/chatStore";
import {
  fetchChatRoom,
  fetchChatMessages,
  leaveChatRoom,
} from "@/src/lib/api/chatApi";
import { MessageType } from "@/src/types/chat";
import { Header } from "@/src/components/header";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import {
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  Send,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const TEMP_USER_ID = 1;
const TEMP_USER_NICKNAME = "테스트유저";

export default function ChatRoomPage({
  params,
}: {
  params: Promise<{ chatRoomId: string }>;
}) {
  const { chatRoomId } = use(params);
  const router = useRouter();
  const wsClient = useRef<ChatWebSocketClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState("");
  const isInitialized = useRef(false);

  const {
    currentChatRoom,
    setCurrentChatRoom,
    messages,
    addMessage,
    setMessages,
    clearMessages,
  } = useChatStore();

  // 채팅방 데이터 로드
  useEffect(() => {
    if (isInitialized.current) {
      console.log("이미 초기화됨, 중복 실행 방지");
      return;
    }

    console.log("🔄 채팅방 초기화 시작:", chatRoomId);
    isInitialized.current = true;

    loadChatRoomData();

    // 클린업 함수
    return () => {
      console.log("채팅방 클린업");
      if (wsClient.current) {
        wsClient.current.disconnect();
        wsClient.current = null;
      }
      clearMessages(); // 메시지 초기화
      isInitialized.current = false;
    };
  }, [chatRoomId]);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatRoomData = async () => {
    try {
      // 1. 채팅방 정보 조회
      const room = await fetchChatRoom(Number(chatRoomId));
      setCurrentChatRoom(room);

      // 2. 이전 메시지 불러오기
      const previousMessages = await fetchChatMessages(Number(chatRoomId));
      setMessages(previousMessages);

      // 3. WebSocket 연결 (기존 연결 있으면 해제)
      if (wsClient.current) {
        wsClient.current.disconnect();
      }
      connectWebSocket();
    } catch (error) {
      console.error("채팅방 데이터 로드 실패:", error);
      alert("채팅방을 불러오는데 실패했습니다.");
      router.push("/chat");
    }
  };

  const connectWebSocket = () => {
    console.log("🔌 WebSocket 연결 시작");
    wsClient.current = new ChatWebSocketClient();

    wsClient.current.connect(
      Number(chatRoomId),
      (msg) => {
        console.log("새 메시지 추가:", msg);
        addMessage(msg);
      },
      () => {
        setIsConnected(true);
        console.log("WebSocket 연결 완료");
      }
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    // 연결 체크 메서드 사용
    if (!wsClient.current || !wsClient.current.isConnected()) {
      console.error("WebSocket 미연결:", {
        client: !!wsClient.current,
        connected: isConnected,
      });
      alert("채팅 서버에 연결 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    console.log("메시지 전송:", message);

    wsClient.current.sendMessage({
      chatRoomId: Number(chatRoomId),
      type: MessageType.TALK,
      content: message.trim(),
    });

    setMessage("");
  };

  const handleLeave = async () => {
    if (!confirm("소모임을 나가시겠습니까?")) return;

    try {
      await leaveChatRoom(Number(chatRoomId));
      if (wsClient.current) {
        wsClient.current.disconnect();
      }
      router.push("/chat");
    } catch (error) {
      console.error("나가기 실패:", error);
      alert("소모임 나가기에 실패했습니다.");
    }
  };

  if (!currentChatRoom) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* 뒤로가기 */}
          <button
            onClick={() => router.push("/chat")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>소모임 상세로 돌아가기</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 좌측: 채팅 영역 */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  {/* 헤더 */}
                  <div className="p-6 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-2">
                          {currentChatRoom.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          {currentChatRoom.description}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* 채팅 메시지 영역 */}
                  <div className="p-6 h-[500px] overflow-y-auto space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-20">
                        <p>아직 메시지가 없습니다.</p>
                        <p className="text-sm mt-2">첫 메시지를 보내보세요!</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg, index) => {
                          const isMyMessage = msg.senderId === TEMP_USER_ID;
                          const isSystemMessage =
                            msg.type === MessageType.ENTER ||
                            msg.type === MessageType.LEAVE;

                          // 고유 key 생성
                          const uniqueKey = msg.id
                            ? `msg-${msg.id}`
                            : `msg-${index}-${
                                msg.createdAt
                              }-${msg.content.substring(0, 10)}`;

                          if (isSystemMessage) {
                            return (
                              <div key={uniqueKey} className="text-center">
                                <div className="inline-block bg-muted px-4 py-2 rounded-full text-sm text-muted-foreground">
                                  {msg.content}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={uniqueKey}
                              className="flex items-start gap-3"
                            >
                              {/* 프로필 아이콘 */}
                              {!isMyMessage && (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-primary font-medium text-sm">
                                    {msg.senderNickname.substring(0, 2)}
                                  </span>
                                </div>
                              )}

                              <div
                                className={`flex-1 ${
                                  isMyMessage ? "text-right" : ""
                                }`}
                              >
                                {/* 닉네임 */}
                                {!isMyMessage && (
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                      {msg.senderNickname}
                                    </span>
                                    {msg.senderId ===
                                      currentChatRoom.creatorId && (
                                      <span className="text-xs text-primary">
                                        주최자
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* 메시지 */}
                                <div
                                  className={`inline-block ${
                                    isMyMessage ? "ml-auto" : ""
                                  }`}
                                >
                                  <div
                                    className={`px-4 py-2 rounded-lg ${
                                      isMyMessage
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                    }`}
                                  >
                                    <p className="break-words">{msg.content}</p>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(msg.createdAt), "a h:mm", {
                                      locale: ko,
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* 입력 영역 */}
                  <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                          isConnected ? "메시지를 입력하세요..." : "연결 중..."
                        }
                        className="flex-1"
                        disabled={!isConnected}
                      />
                      <Button
                        type="submit"
                        disabled={!message.trim() || !isConnected}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 우측: 정보 사이드바 - 기존과 동일 */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">소모임 정보</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Users className="w-4 h-4" />
                        <span>모집 인원</span>
                      </div>
                      <p className="font-medium text-primary">
                        {currentChatRoom.currentParticipants}/
                        {currentChatRoom.maxParticipants}명
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-4 h-4" />
                        <span>만날 장소</span>
                      </div>
                      <p className="font-medium">{currentChatRoom.region}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4" />
                        <span>생성일</span>
                      </div>
                      <p className="font-medium">
                        {format(
                          new Date(currentChatRoom.createdAt),
                          "MM월 dd일",
                          {
                            locale: ko,
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5" />
                    <h3 className="font-bold text-lg">
                      참여자 ({currentChatRoom.currentParticipants})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium text-xs">
                          {TEMP_USER_ID === currentChatRoom.creatorId
                            ? "나"
                            : "주"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {TEMP_USER_ID === currentChatRoom.creatorId
                            ? TEMP_USER_NICKNAME
                            : "주최자"}
                        </p>
                        <p className="text-xs text-muted-foreground">주최자</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>

                    {currentChatRoom.currentParticipants === 1 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        아직 다른 참여자가 없습니다
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleLeave}
              >
                소모임 나가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
