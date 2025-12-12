"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Users,
  MapPin,
  Clock,
  DollarSign,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/app/global/auth/useAuth";
import { fetchGroupBuyingPost } from "@/lib/api/groupBuyingApi";
import {
  fetchChatMessages,
  fetchChatParticipants,
  leaveChatRoom,
  ChatParticipant,
} from "@/lib/api/chatApi";
import { ChatWebSocketClient } from "@/lib/websocket/chatWebSocket";
import { GroupBuyingPost, GroupBuyingStatus } from "@/types/groupBuying";
import { ChatMessage, MessageType } from "@/types/chat";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function GroupBuyingChatPage() {
  const router = useRouter();
  const params = useParams();
  const { isLogin, loginMember } = useAuth();
  const postId = params.id as string;

  const [post, setPost] = useState<GroupBuyingPost | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const wsClient = useRef<ChatWebSocketClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLogin) {
      alert("로그인이 필요한 기능입니다.");
      router.push("/login");
      return;
    }

    if (!postId || !loginMember) {
      return;
    }

    if (wsClient.current && isConnected) {
      return;
    }

    loadInitialData();

    return () => {
      if (wsClient.current) {
        wsClient.current.disconnect();
        wsClient.current = null;
      }
    };
  }, [postId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadInitialData = async () => {
    if (!loginMember) return;

    try {
      const postData = await fetchGroupBuyingPost(Number(postId));
      setPost(postData);

      const chatMessages = await fetchChatMessages(postData.chatRoomId, 100);
      const sortedMessages = chatMessages.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
      setMessages(sortedMessages);

      const chatParticipants = await fetchChatParticipants(postData.chatRoomId);
      setParticipants(chatParticipants);

      setIsLoading(false);

      await connectWebSocket(postData.chatRoomId);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      alert("채팅방을 불러오는데 실패했습니다.");
      router.push(`/group-buying/${postId}`);
    }
  };

  const connectWebSocket = async (chatRoomId: number) => {
    if (!loginMember) return;

    try {
      wsClient.current = new ChatWebSocketClient(
        loginMember.id,
        loginMember.nickname
      );

      await wsClient.current.connect(
        chatRoomId,
        (newMessage: ChatMessage) => {
          setMessages((prev) => {
            const isDuplicate = prev.some(
              (msg) =>
                msg.id === newMessage.id ||
                (msg.content === newMessage.content &&
                  msg.senderId === newMessage.senderId &&
                  msg.createdAt === newMessage.createdAt)
            );

            if (isDuplicate) {
              return prev;
            }

            const updated = [...prev, newMessage];
            return updated.sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeA - timeB;
            });
          });
        },
        () => {
          setIsConnected(true);
          console.log("WebSocket 연결 완료");
        }
      );
    } catch (error) {
      console.error("WebSocket 연결 실패:", error);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !wsClient.current || !isConnected || !post) return;

    wsClient.current.sendMessage({
      chatRoomId: post.chatRoomId,
      content: message,
      type: MessageType.TALK,
    });
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLeave = async () => {
    if (!post) return;

    const confirmed = confirm("채팅방을 나가시겠습니까?");
    if (!confirmed) return;

    try {
      await leaveChatRoom(post.chatRoomId);

      if (wsClient.current) {
        wsClient.current.disconnect();
        wsClient.current = null;
      }

      alert("채팅방을 나갔습니다.");
      router.push(`/group-buying`);
    } catch (error: any) {
      console.error("나가기 실패:", error);
      alert(error.message || "나가기에 실패했습니다.");
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  const getStatusBadge = (status: GroupBuyingStatus) => {
    switch (status) {
      case GroupBuyingStatus.RECRUITING:
        return <Badge className="bg-green-500">모집중</Badge>;
      case GroupBuyingStatus.COMPLETED:
        return <Badge variant="secondary">완료</Badge>;
      case GroupBuyingStatus.CANCELLED:
        return <Badge variant="destructive">취소</Badge>;
      default:
        return null;
    }
  };

  const getParticipantNickname = (participant: ChatParticipant): string => {
    const p = participant as any;

    if (p.memberNickname) {
      return String(p.memberNickname);
    }
    if (p.nickname) {
      return String(p.nickname);
    }
    return "알 수 없음";
  };

  if (!isLogin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <p className="text-muted-foreground">채팅방을 찾을 수 없습니다.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-4 md:py-8">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/group-buying/${postId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{post.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {participants.length}명 참여중
                </p>
              </div>
            </div>

            {loginMember && (
              <Button variant="outline" size="sm" onClick={handleLeave}>
                <LogOut className="h-4 w-4 mr-2" />
                나가기
              </Button>
            )}
          </div>

          <div className="grid lg:grid-cols-4 gap-4">
            {/* 채팅 영역 - 3칸 */}
            <div className="lg:col-span-3">
              {/* 높이 */}
              <Card className="flex flex-col h-[calc(100vh-250px)]">
                <CardContent
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4"
                >
                  {messages.map((msg, index) => {
                    const isMyMessage =
                      loginMember && msg.senderId === loginMember.id;

                    const isSystemMessage =
                      msg.type === MessageType.ENTER ||
                      msg.type === MessageType.LEAVE ||
                      msg.type === MessageType.KICK ||
                      msg.type === ("TRANSFER_LEADER" as any);

                    if (isSystemMessage) {
                      return (
                        <div
                          key={msg.id || index}
                          className="flex justify-center my-2"
                        >
                          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            {msg.content}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex gap-2 mb-4 ${
                          isMyMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isMyMessage && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {msg.senderNickname?.[0] || "?"}
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
                                {msg.senderNickname || "알 수 없음"}
                              </span>
                              {post.creatorId === msg.senderId && (
                                <Badge variant="secondary" className="text-xs">
                                  주최자
                                </Badge>
                              )}
                            </div>
                          )}
                          <div
                            className={`rounded-lg px-3 py-2 ${
                              isMyMessage
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">
                            {msg.createdAt
                              ? format(new Date(msg.createdAt), "HH:mm", {
                                  locale: ko,
                                })
                              : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </CardContent>

                <div className="border-t p-4 shrink-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder="메시지를 입력하세요..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                      disabled={!isConnected}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!isConnected || !message.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {!isConnected && (
                    <p className="text-xs text-destructive mt-2">
                      연결 중... 잠시만 기다려주세요.
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* 사이드바 - 1칸 */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">공동구매 정보</h3>
                    {getStatusBadge(post.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      모집 인원
                    </span>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-primary">
                        {post.currentParticipants}/{post.targetParticipants}명
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">
                          목표 금액
                        </p>
                        <p className="text-sm font-medium">
                          {post.targetAmount.toLocaleString()}원
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          현재: {post.currentAmount.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3">
                    <DollarSign className="h-4 w-4 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        1인당 금액
                      </p>
                      <p className="text-base font-bold text-primary">
                        {Math.ceil(
                          post.targetAmount / post.targetParticipants
                        ).toLocaleString()}
                        원
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        목표 금액 ÷ {post.targetParticipants}명
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">지역</p>
                        <p className="text-sm font-medium">{post.region}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">마감일</p>
                        <p className="text-sm font-medium">
                          {format(new Date(post.deadline), "yyyy년 M월 d일", {
                            locale: ko,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">
                        진행률
                      </span>
                      <span className="text-xs font-medium">
                        {post.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${post.progressPercentage}%` }}
                      />
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
                  {participants.map((participant, index) => {
                    const nickname = getParticipantNickname(participant);
                    const isCreator =
                      post.creatorId === (participant as any).memberId;

                    return (
                      <div key={index} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {nickname[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{nickname}</p>
                        </div>
                        {isCreator && (
                          <Badge variant="secondary" className="text-xs">
                            주최자
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
