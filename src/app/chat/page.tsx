"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/src/store/chatStore";
import { fetchChatRooms, createChatRoom } from "@/src/lib/api/chatApi";
import ChatRoomList from "@/src/components/chat/ChatRoomList";
import CreateChatRoomModal from "@/src/components/chat/CreateChatRoomModal";
import ChatRoomDetailModal from "@/src/components/chat/ChatRoomDetailModal";
import {
  ChatRoom,
  ChatRoomCreateRequest,
  ChatRoomType,
} from "@/src/types/chat";
import BoardLayout from "@/src/components/board-layout";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Search } from "lucide-react";

export default function ChatPage() {
  const { chatRooms, setChatRooms, isLoading, setIsLoading } = useChatStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  // 소모임 채팅방 목록 불러오기
  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    try {
      setIsLoading(true);
      // 소모임만 필터링
      const rooms = await fetchChatRooms(undefined, ChatRoomType.SMALL_GROUP);
      setChatRooms(rooms);
    } catch (error) {
      console.error("채팅방 목록 조회 실패:", error);
      alert("채팅방 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 채팅방 생성
  const handleCreateChatRoom = async (data: ChatRoomCreateRequest) => {
    try {
      // 소모임으로 고정
      await createChatRoom({ ...data, type: ChatRoomType.SMALL_GROUP });
      alert("소모임 채팅방이 생성되었습니다!");
      loadChatRooms();
    } catch (error) {
      console.error("채팅방 생성 실패:", error);
      alert("채팅방 생성에 실패했습니다.");
    }
  };

  // 채팅방 클릭 (모달 열기)
  const handleChatRoomClick = (chatRoom: ChatRoom) => {
    setSelectedChatRoom(chatRoom);
  };

  // 필터링된 채팅방 (소모임만)
  const filteredRooms = chatRooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BoardLayout
      title="소모임"
      subtitle="지역 기반 소모임 채팅방에 참여해보세요!"
    >
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* 검색 및 생성 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="소모임 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + 소모임 만들기
            </Button>
          </div>

          {/* 결과 카운트 */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-muted-foreground">
              총 {filteredRooms.length}개의 소모임
            </span>
          </div>

          {/* 로딩 */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ChatRoomList
              chatRooms={filteredRooms}
              onChatRoomClick={handleChatRoomClick}
            />
          )}
        </div>
      </section>

      {/* 소모임 생성 모달 */}
      <CreateChatRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateChatRoom}
      />

      {/* 채팅방 상세 모달 */}
      {selectedChatRoom && (
        <ChatRoomDetailModal
          chatRoom={selectedChatRoom}
          onClose={() => setSelectedChatRoom(null)}
        />
      )}
    </BoardLayout>
  );
}
