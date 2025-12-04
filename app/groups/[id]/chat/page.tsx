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
  kickParticipant,
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
import {
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  Send,
  MoreVertical,
  UserX,
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
  const { isLogin, loginMember } = useAuth();
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
    clearMessages,
  } = useChatStore();

  useEffect(() => {
    if (!isLogin || !loginMember) {
      alert("로그인이 필요한 기능입니다.");
      router.push("/login");
      return;
    }
  }, [isLogin, loginMember, router]);

  useEffect(() => {
    if (!isLogin || !loginMember || isInitialized.current) {
      return;
    }

    console.log("채팅방 초기화 시작:", chatRoomId);
    isInitialized.current = true;

    loadChatRoomData();

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

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatRoomData = async () => {
    try {
      const room = await fetchChatRoom(chatRoomId);
      setCurrentChatRoom(room);

      const previousMessages = await fetchChatMessages(chatRoomId);
      clearMessages();
      previousMessages.forEach((msg) => addMessage(msg));

      try {
        const participantsList = await fetchChatParticipants(chatRoomId);
        console.log("✅ 초기 참여자 목록:", participantsList);
        setParticipants(participantsList);
      } catch (error) {
        console.error("참여자 목록 로드 실패:", error);
      }

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

    wsClient.current = new ChatWebSocketClient(
      loginMember.id,
      loginMember.nickname
    );

    wsClient.current.connect(
      chatRoomId,
      (msg) => {
        console.log("📨 새 메시지 수신:", msg);
        addMessage(msg);

        // 메시지 타입을 문자열로 변환 (enum 비교 문제 방지)
        const messageType = String(msg.type);
        console.log("📝 메시지 타입:", messageType);

        // 입장/퇴장/강퇴 메시지 시 참여자 목록 갱신
        if (
          messageType === "ENTER" ||
          messageType === "LEAVE" ||
          messageType === "KICK"
        ) {
          console.log("🔄 참여자 변동 감지:", messageType);

          // 참여자 목록 갱신
          setTimeout(() => {
            fetchChatParticipants(chatRoomId)
              .then((list) => {
                console.log("✅ 참여자 목록 갱신:", list);
                setParticipants(list);
              })
              .catch((error) => {
                console.error("❌ 참여자 갱신 실패:", error);
              });
          }, 100); // 100ms 지연으로 백엔드 처리 대기

          // 채팅방 정보 갱신
          fetchChatRoom(chatRoomId)
            .then((updatedRoom) => {
              console.log("✅ 채팅방 정보 갱신:", updatedRoom);
              setCurrentChatRoom(updatedRoom);
            })
            .catch((error) => {
              console.error("❌ 채팅방 갱신 실패:", error);
            });

          // 내가 강퇴당한 경우
          if (messageType === "KICK" && msg.senderId === loginMember.id) {
            console.log("🚫 본인이 강퇴당함");
            alert("채팅방에서 강퇴되었습니다.");
            if (wsClient.current) {
              wsClient.current.disconnect();
            }
            clearMessages();
            setCurrentChatRoom(null);
            router.push("/groups");
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
      alert("채팅 서버에 연결 중입니다.");
      return;
    }

    wsClient.current.sendMessage({
      chatRoomId: chatRoomId,
      type: MessageType.TALK,
      content: message.trim(),
    });

    setMessage("");
  };

  // 참여자 강퇴
  const handleKickParticipant = async (
    targetMemberId: number,
    nickname: string
  ) => {
    if (!loginMember || !currentChatRoom) return;

    if (loginMember.id !== currentChatRoom.creatorId) {
      alert("방장만 참여자를 강퇴할 수 있습니다.");
      return;
    }

    if (!confirm(`${nickname}님을 강퇴하시겠습니까?`)) return;

    try {
      console.log("🚫 강퇴 시작:", nickname, targetMemberId);
      await kickParticipant(chatRoomId, targetMemberId);
      console.log("✅ 강퇴 API 성공");
    } catch (error: any) {
      console.error("❌ 강퇴 실패:", error);
      alert(error.message || "강퇴에 실패했습니다.");
    }
  };

  const handleLeave = async () => {
    if (!currentChatRoom) return;

    const isCreator = loginMember?.id === currentChatRoom.creatorId;
    const hasOtherParticipants = currentChatRoom.currentParticipants > 1;

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
      if (wsClient.current) {
        wsClient.current.disconnect();
      }

      await leaveChatRoom(chatRoomId);
      clearMessages();
      setCurrentChatRoom(null);
      router.push("/groups");
      router.refresh();
    } catch (error: any) {
      console.error("❌ 나가기 실패:", error);

      if (error.message?.includes("존재하지 않는") || error.status === 404) {
        clearMessages();
        setCurrentChatRoom(null);
        router.push("/groups");
        router.refresh();
      } else {
        alert("소모임 나가기에 실패했습니다.");
      }
    }
  };

  if (!currentChatRoom || !loginMember) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8">
          <div className="flex justify-center items-center h-[60vh]">
            <p className="text-muted-foreground">
              채팅방 정보를 불러오는 중...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isCreator = loginMember.id === currentChatRoom.creatorId;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-4 md:py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/groups"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            소모임 목록으로 돌아가기
          </Link>

          <div className="grid lg:grid-cols-4 gap-4">
            {/* Chat Area */}
            <div className="lg:col-span-3">
              <Card className="flex flex-col h-[calc(100vh-250px)]">
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

                <CardContent
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                >
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

                  {messages.length === 0 ? (
                    <div className="flex justify-center items-center py-4">
                      <p className="text-sm text-muted-foreground">
                        첫 메시지를 보내보세요! 💬
                      </p>
                    </div>
                  ) : (
                    <>
                      {[...messages]
                        .sort(
                          (a, b) =>
                            new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime()
                        )
                        .map((msg, index) => {
                          const isMyMessage = loginMember
                            ? msg.senderId === loginMember.id
                            : false;

                          // 문자열로 비교
                          const msgType = String(msg.type);
                          const isSystemMessage =
                            msgType === "ENTER" ||
                            msgType === "LEAVE" ||
                            msgType === "KICK";

                          const uniqueKey = msg.id
                            ? `msg-${msg.id}`
                            : `msg-${index}-${
                                msg.createdAt
                              }-${msg.content.substring(0, 10)}`;

                          if (isSystemMessage) {
                            return (
                              <div
                                key={uniqueKey}
                                className="flex justify-center"
                              >
                                <Badge
                                  variant={
                                    msgType === "KICK"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {msg.content}
                                </Badge>
                              </div>
                            );
                          }

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

                <div className="border-t p-4 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1"
                      disabled={!isConnected}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!isConnected || !message.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                  {!isConnected && (
                    <p className="text-xs text-muted-foreground mt-2">
                      서버에 연결 중...
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">소모임 정보</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">참여 인원</span>
                    <span className="ml-auto font-medium text-primary">
                      {currentChatRoom.currentParticipants}/
                      {currentChatRoom.maxParticipants}명
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">활동 지역</p>
                      <p className="font-medium">
                        {currentChatRoom.region || "지역 없음"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">생성일</p>
                      <p className="font-medium">
                        {format(
                          new Date(currentChatRoom.createdAt),
                          "yyyy년 M월 d일",
                          { locale: ko }
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-semibold">
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
                      const isMe = loginMember
                        ? participant.memberId === loginMember.id
                        : false;

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
                                <Badge variant="secondary" className="text-xs">
                                  방장
                                </Badge>
                              )}
                            </div>
                          </div>
                          {/* 강퇴 버튼 */}
                          {isCreator && !isMe && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() =>
                                handleKickParticipant(
                                  participant.memberId,
                                  participant.nickname
                                )
                              }
                              title="강퇴"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
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
      </main>

      <Footer />
    </div>
  );
}
