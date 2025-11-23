"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/global/auth/useAuth";
import { ChatWebSocketClient } from "@/lib/websocket/chatWebSocket";
import { useChatStore } from "@/store/chatStore";
import {
  fetchChatRoom,
  fetchChatMessages,
  leaveChatRoom,
  fetchChatParticipants,
  ChatParticipant,
} from "@/lib/api/chatApi";
import { MessageType } from "@/types/chat";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import Link from "next/link";

export default function GroupChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isLogin, loginMember, apiKey, accessToken } = useAuth();
  const wsClient = useRef<ChatWebSocketClient | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const isInitialized = useRef(false);

  const chatRoomId = Number(id);

  const {
    currentChatRoom,
    setCurrentChatRoom,
    messages,
    addMessage,
    setMessages,
    clearMessages,
  } = useChatStore();

  // 로그인 체크
  useEffect(() => {
    if (!isLogin || !loginMember) {
      alert("로그인이 필요한 기능입니다.");
      router.push("/login");
      return;
    }
  }, [isLogin, loginMember, router]);

  // 채팅방 데이터 로드
  useEffect(() => {
    if (!isLogin || !loginMember || isInitialized.current) {
      return;
    }

    console.log("채팅방 초기화 시작:", chatRoomId);
    isInitialized.current = true;

    loadChatRoomData();

    // 클린업 함수
    return () => {
      console.log("채팅방 클린업");
      if (wsClient.current) {
        wsClient.current.disconnect();
        wsClient.current = null;
      }
      clearMessages();
      isInitialized.current = false;
    };
  }, [chatRoomId, isLogin, loginMember]);

  // 자동 스크롤 - 채팅 컨테이너만 스크롤
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatRoomData = async () => {
    if (!apiKey || !accessToken) {
      console.error("인증 정보 없음");
      return;
    }

    try {
      // 1. 채팅방 정보 조회
      const room = await fetchChatRoom(chatRoomId, apiKey, accessToken);
      setCurrentChatRoom(room);

      // 2. 이전 메시지 불러오기
      const previousMessages = await fetchChatMessages(
        chatRoomId,
        apiKey,
        accessToken
      );
      setMessages(previousMessages);

      // 3. 참여자 목록 불러오기
      try {
        const participantsList = await fetchChatParticipants(
          chatRoomId,
          apiKey,
          accessToken
        );
        setParticipants(participantsList);
        console.log("참여자 목록 로드:", participantsList);
      } catch (error) {
        console.error("참여자 목록 로드 실패:", error);
        // 참여자 목록 로드 실패해도 계속 진행
      }

      // 4. WebSocket 연결
      if (wsClient.current) {
        wsClient.current.disconnect();
      }
      connectWebSocket();
    } catch (error) {
      console.error("채팅방 데이터 로드 실패:", error);
      alert("채팅방을 불러오는데 실패했습니다.");
      router.push("/groups");
    }
  };

  const connectWebSocket = () => {
    if (!loginMember) return;

    console.log("WebSocket 연결 시작");
    wsClient.current = new ChatWebSocketClient(
      loginMember.id,
      loginMember.nickname
    );

    wsClient.current.connect(
      chatRoomId,
      (msg) => {
        console.log("새 메시지:", msg);
        addMessage(msg);

        // 입장/퇴장 메시지 시 참여자 목록 + 채팅방 정보 실시간 갱신
        if (msg.type === MessageType.ENTER || msg.type === MessageType.LEAVE) {
          console.log("참여자 변동 감지 - 목록 갱신 중...");

          if (apiKey && accessToken) {
            // 1. 참여자 목록 갱신
            fetchChatParticipants(chatRoomId, apiKey, accessToken)
              .then((list) => {
                setParticipants(list);
                console.log("✅ 참여자 목록 갱신 완료:", list);
              })
              .catch((error) =>
                console.error("❌ 참여자 목록 갱신 실패:", error)
              );

            // 2. 채팅방 정보 갱신 (currentParticipants 업데이트)
            fetchChatRoom(chatRoomId, apiKey, accessToken)
              .then((updatedRoom) => {
                setCurrentChatRoom(updatedRoom);
                console.log("✅ 채팅방 정보 갱신 완료:", updatedRoom);
              })
              .catch((error) =>
                console.error("❌ 채팅방 정보 갱신 실패:", error)
              );
          }
        }
      },
      () => {
        setIsConnected(true);
        console.log("✅ WebSocket 연결 완료");
      }
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    if (!wsClient.current || !wsClient.current.isConnected()) {
      alert("채팅 서버에 연결 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    wsClient.current.sendMessage({
      chatRoomId: chatRoomId,
      type: MessageType.TALK,
      content: message.trim(),
    });

    setMessage("");
  };

  const handleLeave = async () => {
    if (!apiKey || !accessToken || !currentChatRoom) return;

    const isCreator = loginMember?.id === currentChatRoom.creatorId;
    const hasOtherParticipants = currentChatRoom.currentParticipants > 1;

    // 방장 여부에 따라 다른 확인 메시지
    let confirmMessage = "소모임을 나가시겠습니까?";

    if (isCreator && hasOtherParticipants) {
      confirmMessage =
        "방장 권한이 다음 참여자에게 자동으로 이양됩니다.\n소모임을 나가시겠습니까?";
    } else if (isCreator && !hasOtherParticipants) {
      confirmMessage =
        "마지막 참여자이므로 채팅방이 삭제됩니다.\n소모임을 나가시겠습니까?";
    }

    if (!confirm(confirmMessage)) return;

    try {
      console.log("🚪 채팅방 나가기 시작...");

      // 1. WebSocket 연결 해제
      if (wsClient.current) {
        wsClient.current.disconnect();
        console.log("✅ WebSocket 연결 해제");
      }

      // 2. 백엔드 API 호출 (방장 권한 이양은 백엔드에서 자동 처리)
      await leaveChatRoom(chatRoomId, apiKey, accessToken);
      console.log("✅ 백엔드 퇴장 처리 완료");

      // 3. 상태 초기화
      clearMessages();
      setCurrentChatRoom(null);

      // 4. 목록 페이지로 이동
      router.push("/groups");
      router.refresh();
      console.log("✅ 채팅방 나가기 완료");
    } catch (error: any) {
      console.error("❌ 나가기 실패:", error);

      // 채팅방이 이미 삭제된 경우
      if (error.message?.includes("존재하지 않는") || error.status === 404) {
        console.log("ℹ️ 채팅방이 이미 삭제되었습니다.");
        clearMessages();
        setCurrentChatRoom(null);
        router.push("/groups");
        router.refresh();
      } else {
        alert("소모임 나가기에 실패했습니다.");
      }
    }
  };

  if (!isLogin || !loginMember) {
    return null;
  }

  if (!currentChatRoom) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-4 md:py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <Link
              href="/groups"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              소모임 목록으로 돌아가기
            </Link>

            {/* 채팅 영역 */}
            <div className="grid lg:grid-cols-4 gap-4">
              {/* Chat Area */}
              <div className="lg:col-span-3">
                {/* Card 높이 */}
                <Card className="flex flex-col h-[calc(100vh-250px)]">
                  {/* Chat Header - 고정 */}
                  <CardHeader className="border-b shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">
                          {currentChatRoom.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {currentChatRoom.description || "연결됨"}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  {/* Messages - 스크롤 가능 영역 */}
                  <CardContent
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                  >
                    {/* 환영 메시지 - 항상 표시 */}
                    <div className="flex justify-center items-center py-8">
                      <div className="text-center space-y-3">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                          <svg
                            className="w-8 h-8 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-foreground mb-1">
                            소모임 채팅방에 입장하셨습니다
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {currentChatRoom?.name}에 오신 것을 환영합니다! 🎉
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 메시지 목록 */}
                    {messages.length === 0 ? (
                      <div className="flex justify-center items-center py-4">
                        <p className="text-sm text-muted-foreground">
                          첫 메시지를 보내보세요! 💬
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* 메시지를 시간순으로 정렬 (오래된 것 위 → 최신 것 아래) */}
                        {[...messages]
                          .sort(
                            (a, b) =>
                              new Date(a.createdAt).getTime() -
                              new Date(b.createdAt).getTime()
                          )
                          .map((msg, index) => {
                            const isMyMessage = msg.senderId === loginMember.id;
                            const isSystemMessage =
                              msg.type === MessageType.ENTER ||
                              msg.type === MessageType.LEAVE;

                            const uniqueKey = msg.id
                              ? `msg-${msg.id}`
                              : `msg-${index}-${
                                  msg.createdAt
                                }-${msg.content.substring(0, 10)}`;

                            // 시스템 메시지
                            if (isSystemMessage) {
                              return (
                                <div
                                  key={uniqueKey}
                                  className="flex justify-center"
                                >
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {msg.content}
                                  </Badge>
                                </div>
                              );
                            }

                            // 일반 메시지
                            return (
                              <div
                                key={uniqueKey}
                                className={`flex gap-3 ${
                                  isMyMessage ? "flex-row-reverse" : ""
                                }`}
                              >
                                {!isMyMessage && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {msg.senderNickname[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div
                                  className={`flex flex-col ${
                                    isMyMessage ? "items-end" : "items-start"
                                  } max-w-[70%]`}
                                >
                                  {!isMyMessage && (
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium">
                                        {msg.senderNickname}
                                      </span>
                                      {msg.senderId ===
                                        currentChatRoom.creatorId && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          방장
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  <div
                                    className={`rounded-lg px-4 py-2 ${
                                      isMyMessage
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                    }`}
                                  >
                                    <p className="text-sm leading-relaxed wrap-break-word">
                                      {msg.content}
                                    </p>
                                  </div>
                                  <span className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(msg.createdAt), "a h:mm", {
                                      locale: ko,
                                    })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </>
                    )}
                  </CardContent>

                  {/* Message Input - 고정 하단 */}
                  <div className="border-t p-4 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        placeholder={
                          isConnected ? "메시지를 입력하세요..." : "연결 중..."
                        }
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1"
                        disabled={!isConnected}
                      />
                      <Button
                        type="submit"
                        disabled={!message.trim() || !isConnected}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                {/* Group Info */}
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold">소모임 정보</h3>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        참여 인원
                      </span>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">
                          {currentChatRoom.currentParticipants}/
                          {currentChatRoom.maxParticipants}명
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {currentChatRoom.region && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            활동 지역
                          </p>
                          <p className="text-sm font-medium">
                            {currentChatRoom.region}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">생성일</p>
                        <p className="text-sm font-medium">
                          {format(
                            new Date(currentChatRoom.createdAt),
                            "yyyy년 MM월 dd일",
                            {
                              locale: ko,
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Participants - API 기반 */}
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      참여자 ({participants.length})
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                    {participants.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        참여자 정보를 불러오는 중...
                      </p>
                    ) : (
                      participants.map((participant) => {
                        const isMe = participant.memberId === loginMember.id;

                        return (
                          <div
                            key={participant.memberId}
                            className="flex items-center gap-2"
                          >
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {participant.nickname[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background bg-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {participant.nickname}
                                  {isMe && " (나)"}
                                </p>
                                {participant.isCreator && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    방장
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* Leave Button */}
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
      </main>

      <Footer />
    </div>
  );
}
