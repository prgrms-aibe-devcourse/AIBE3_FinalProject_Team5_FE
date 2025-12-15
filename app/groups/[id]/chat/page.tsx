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
  transferCreator,
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
  Crown,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

// UTC 시간을 한국 시간으로 변환
const formatKoreanTime = (dateString: string): string => {
  if (!dateString) return "";
  const utcDate = new Date(dateString + "Z");
  return format(utcDate, "a h:mm", { locale: ko });
};
import Link from "next/link";
import { getCategoryIcon, getCategoryColor } from "@/lib/utils/categoryIcons";

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

  const {
    currentChatRoom,
    setCurrentChatRoom,
    messages,
    addMessage,
    setMessages,
    clearMessages,
  } = useChatStore();

  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTransferTarget, setSelectedTransferTarget] = useState<
    number | null
  >(null);

  const isCreator =
    loginMember && currentChatRoom
      ? loginMember.id === currentChatRoom.creatorId
      : false;

  const CategoryIcon = currentChatRoom
    ? getCategoryIcon(currentChatRoom.category)
    : null;
  const categoryColor = currentChatRoom
    ? getCategoryColor(currentChatRoom.category)
    : "";

  useEffect(() => {
    if (!isLogin) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    loadChatRoomData();
    loadParticipants();

    return () => {
      if (wsClient.current) {
        wsClient.current.disconnect();
      }
    };
  }, [id, isLogin]);

  const loadChatRoomData = async () => {
    try {
      const room = await fetchChatRoom(Number(id));
      setCurrentChatRoom(room);

      const previousMessages = await fetchChatMessages(Number(id));
      setMessages(previousMessages);

      connectWebSocket();
    } catch (error: any) {
      console.error("❌ 채팅방 데이터 로드 실패:", error);

      console.log("에러 응답 전체:", error.response);

      let errorMessage = "채팅방을 불러오는데 실패했습니다.";

      // 방법 1: error.response?.data?.msg (RsData 형식)
      if (error.response?.data?.msg) {
        const msg = error.response.data.msg;
        errorMessage = msg;

        // 추가 처리: 더 명확한 메시지
        if (msg.includes("강퇴")) {
          errorMessage = "강퇴된 채팅방에는 다시 참여할 수 없습니다.";
        } else if (msg.includes("참여자만")) {
          errorMessage = "채팅방 참여자만 입장할 수 있습니다.";
        }
      }
      // 방법 2: error.response?.data?.message (Spring Boot 기본)
      else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      // 방법 3: error.message (네트워크 에러)
      else if (error.message) {
        errorMessage = error.message;
      }

      // HTTP 상태 코드별 처리
      if (error.response?.status === 403) {
        if (!error.response?.data?.msg && !error.response?.data?.message) {
          errorMessage = "접근 권한이 없습니다.";
        }
      } else if (error.response?.status === 404) {
        errorMessage = "채팅방을 찾을 수 없습니다.";
      } else if (error.response?.status === 500) {
        if (!error.response?.data?.msg && !error.response?.data?.message) {
          errorMessage = "서버 오류가 발생했습니다.";
        }
      }

      alert(errorMessage);
      router.push("/groups");
    }
  };

  const loadParticipants = async () => {
    try {
      const participantsList = await fetchChatParticipants(Number(id));
      setParticipants(participantsList);
    } catch (error) {
      console.error("참여자 목록 로드 실패:", error);
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
      Number(id),
      (message) => {
        addMessage(message);

        if (message.type === MessageType.KICK) {
          if (message.senderId === loginMember?.id) {
            console.log("강퇴당함! 자동 퇴장");

            if (wsClient.current?.isConnected()) {
              wsClient.current.disconnect();
            }

            alert("채팅방에서 강퇴되었습니다.");

            router.push("/groups");
            return;
          }
        }

        const msgType = String(message.type);
        if (
          msgType === MessageType.ENTER ||
          msgType === MessageType.LEAVE ||
          msgType === MessageType.KICK ||
          msgType === MessageType.TRANSFER
        ) {
          updateChatRoomInfo();
          loadParticipants();
        }
      },
      () => {
        setIsConnected(true);
      }
    );
  };

  const updateChatRoomInfo = async () => {
    try {
      const updatedRoom = await fetchChatRoom(Number(id));
      setCurrentChatRoom(updatedRoom);
    } catch (error) {
      console.error("채팅방 정보 업데이트 실패:", error);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !wsClient.current || !isConnected) {
      return;
    }

    wsClient.current.sendMessage({
      chatRoomId: Number(id),
      type: MessageType.TALK,
      content: message.trim(),
    });

    setMessage("");
  };

  const handleLeaveChatRoom = async () => {
    if (!confirm("채팅방을 나가시겠습니까?")) return;

    if (!loginMember) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!currentChatRoom) {
      alert("채팅방 정보를 불러올 수 없습니다.");
      return;
    }

    try {
      console.log("🚪 채팅방 나가기 시작:", {
        chatRoomId: currentChatRoom.id,
        memberId: loginMember.id,
      });

      await leaveChatRoom(Number(id));

      if (wsClient.current?.isConnected()) {
        wsClient.current.sendMessage({
          chatRoomId: currentChatRoom.id,
          content: `${loginMember.nickname}님이 퇴장했습니다.`,
          type: MessageType.LEAVE,
        });
      }

      if (wsClient.current) {
        wsClient.current.disconnect();
      }

      clearMessages();
      setCurrentChatRoom(null);

      alert("채팅방을 나갔습니다.");
      router.push("/groups");
      router.refresh();
    } catch (error: any) {
      console.error("채팅방 나가기 실패:", error);

      if (error.message?.includes("존재하지 않는") || error.status === 404) {
        clearMessages();
        setCurrentChatRoom(null);
        router.push("/groups");
        router.refresh();
        return;
      }

      if (error.message?.includes("권한을 이양")) {
        alert("방장은 다른 참여자에게 권한을 이양한 후 나갈 수 있습니다.");
      } else {
        alert(
          "채팅방 나가기에 실패했습니다: " +
            (error.message || "알 수 없는 오류")
        );
      }
    }
  };

  const handleKickParticipant = async (
    targetMemberId: number,
    targetNickname: string
  ) => {
    if (
      !confirm(
        `${targetNickname}님을 강퇴하시겠습니까?\n강퇴된 사용자는 다시 입장할 수 없습니다.`
      )
    ) {
      return;
    }

    try {
      await kickParticipant(Number(id), targetMemberId);
      alert(`${targetNickname}님을 강퇴했습니다.`);
      await loadParticipants();
    } catch (error: any) {
      console.error("강퇴 실패:", error);
      alert(error.message || "강퇴에 실패했습니다.");
    }
  };

  const handleTransferClick = () => {
    setTransferModalOpen(true);
  };

  const handleTransferConfirm = async () => {
    if (!selectedTransferTarget) {
      alert("권한을 이양할 참여자를 선택해주세요.");
      return;
    }

    const targetParticipant = participants.find(
      (p) => p.memberId === selectedTransferTarget
    );

    if (!targetParticipant) return;

    if (
      !confirm(
        `${targetParticipant.nickname}님에게 방장 권한을 이양하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }

    try {
      await transferCreator(Number(id), selectedTransferTarget);
      alert(`${targetParticipant.nickname}님에게 권한을 이양했습니다.`);
      setTransferModalOpen(false);
      setSelectedTransferTarget(null);
      await updateChatRoomInfo();
      await loadParticipants();
    } catch (error: any) {
      console.error("권한 이양 실패:", error);
      alert(error.message || "권한 이양에 실패했습니다.");
    }
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

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
      <main className="min-h-screen bg-background flex-1 py-4 md:py-8">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/groups"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
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
                    {isCreator && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTransferClick}
                        className="gap-2"
                      >
                        <Crown className="h-4 w-4" />
                        권한 이양
                      </Button>
                    )}
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

                          const msgType = String(msg.type);
                          const isSystemMessage =
                            msgType === "ENTER" ||
                            msgType === "LEAVE" ||
                            msgType === "KICK" ||
                            msgType === "TRANSFER";

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
                                <div className="bg-muted px-4 py-2 rounded-full text-xs text-muted-foreground">
                                  {msg.content}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={uniqueKey}
                              className={`flex gap-2 ${
                                isMyMessage ? "justify-end" : ""
                              }`}
                            >
                              {!isMyMessage && (
                                <Avatar className="h-8 w-8 mt-1">
                                  <AvatarFallback className="text-xs">
                                    {msg.senderNickname?.[0] || "?"}
                                  </AvatarFallback>
                                </Avatar>
                              )}

                              <div
                                className={`max-w-[70%] ${
                                  isMyMessage ? "items-end" : ""
                                }`}
                              >
                                {!isMyMessage && (
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {msg.senderNickname || "알 수 없음"}
                                  </p>
                                )}

                                <div
                                  className={`rounded-lg px-3 py-2 ${
                                    isMyMessage
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  <p className="text-sm wrap-break-word">
                                    {msg.content}
                                  </p>
                                </div>

                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatKoreanTime(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </>
                  )}
                </CardContent>

                <div className="border-t p-4 shrink-0">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="메시지를 입력하세요..."
                      disabled={!isConnected}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!isConnected || !message.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">소모임 정보</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">참여 인원</p>
                      <span className="font-medium text-green-600">
                        {currentChatRoom.currentParticipants}/
                        {currentChatRoom.maxParticipants}명
                      </span>
                    </div>
                  </div>

                  {/* 카테고리 추가 */}
                  {currentChatRoom.category && CategoryIcon && (
                    <div className="flex items-start gap-2 text-sm">
                      <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">카테고리</p>
                        <div className="flex items-center gap-1">
                          <CategoryIcon
                            className={`h-4 w-4 ${categoryColor}`}
                          />
                          <p className="font-medium">
                            {currentChatRoom.category}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

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
                onClick={handleLeaveChatRoom}
              >
                소모임 나가기
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg w-full max-w-md border shadow-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">방장 권한 이양</h2>
              <p className="text-sm text-muted-foreground mt-2">
                권한을 이양할 참여자를 선택하세요
              </p>
            </div>

            <div className="p-6 max-h-[400px] overflow-y-auto space-y-2">
              {participants
                .filter((p) => !p.isCreator)
                .map((participant) => (
                  <div
                    key={participant.memberId}
                    onClick={() =>
                      setSelectedTransferTarget(participant.memberId)
                    }
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                      selectedTransferTarget === participant.memberId
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{participant.nickname[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{participant.nickname}</p>
                      <p className="text-xs opacity-80">
                        {format(
                          new Date(participant.joinedAt + "Z"),
                          "yyyy.MM.dd a h:mm",
                          { locale: ko }
                        )}{" "}
                        입장
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-6 border-t flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setTransferModalOpen(false);
                  setSelectedTransferTarget(null);
                }}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleTransferConfirm}
                disabled={!selectedTransferTarget}
                className="flex-1"
              >
                권한 이양
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
