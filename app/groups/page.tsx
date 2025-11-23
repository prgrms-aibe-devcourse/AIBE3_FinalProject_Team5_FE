"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/global/auth/useAuth";
import { fetchChatRooms } from "@/lib/api/chatApi";
import { ChatRoom } from "@/types/chat";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ChatRoomItem from "@/components/chat/ChatRoomItem";
import ChatRoomDetailModal from "@/components/chat/ChatRoomDetailModal";
import CreateChatRoomModal from "@/components/chat/CreateChatRoomModal";
import { Plus } from "lucide-react";

export default function ChatPage() {
  const router = useRouter();
  const { isLogin, apiKey, accessToken } = useAuth();

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    try {
      setIsLoading(true);
      // 비회원도 목록 조회 가능 (apiKey, accessToken은 선택)
      const rooms = await fetchChatRooms(
        undefined,
        undefined,
        apiKey,
        accessToken
      );
      setChatRooms(rooms);
    } catch (error) {
      console.error("채팅방 목록 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    // 로그인 체크
    if (!isLogin) {
      alert("로그인이 필요한 기능입니다.");
      router.push("/login");
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleRoomCreated = () => {
    setIsCreateModalOpen(false);
    loadChatRooms();
  };

  if (isLoading) {
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
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">소모임 채팅</h1>
              <p className="text-muted-foreground mt-2">
                {isLogin
                  ? "관심있는 소모임에 참여해보세요!"
                  : "로그인하면 소모임을 만들고 참여할 수 있어요!"}
              </p>
            </div>
            <Button onClick={handleCreateClick} className="gap-2">
              <Plus className="w-4 h-4" />
              소모임 만들기
            </Button>
          </div>

          {/* 채팅방 목록 */}
          {chatRooms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  아직 생성된 소모임이 없습니다.
                </p>
                <Button onClick={handleCreateClick} variant="outline">
                  첫 소모임 만들기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chatRooms.map((room) => (
                <ChatRoomItem
                  key={room.id}
                  chatRoom={room}
                  onClick={() => setSelectedRoom(room)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedRoom && (
        <ChatRoomDetailModal
          chatRoom={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}

      {/* 생성 모달 */}
      {isCreateModalOpen && (
        <CreateChatRoomModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleRoomCreated}
        />
      )}
    </>
  );
}
