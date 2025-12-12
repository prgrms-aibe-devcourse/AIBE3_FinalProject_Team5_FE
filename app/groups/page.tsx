"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/global/auth/useAuth";
import { fetchChatRooms } from "@/lib/api/chatApi";
import { ChatRoom } from "@/types/chat";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ChatRoomItem from "@/components/chat/ChatRoomItem";
import ChatRoomDetailModal from "@/components/chat/ChatRoomDetailModal";
import CreateChatRoomModal from "@/components/chat/CreateChatRoomModal";
import { Plus } from "lucide-react";
import { getCategoryIcon } from "@/lib/utils/categoryIcons";

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "맛집", label: "맛집" },
  { value: "운동", label: "운동" },
  { value: "문화", label: "문화" },
  { value: "독서", label: "독서" },
  { value: "요리", label: "요리" },
  { value: "게임", label: "게임" },
  { value: "여행", label: "여행" },
  { value: "스터디", label: "스터디" },
  { value: "기타", label: "기타" },
];

export default function ChatPage() {
  const router = useRouter();
  const { isLogin } = useAuth();

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    try {
      setIsLoading(true);
      const rooms = await fetchChatRooms();
      setChatRooms(rooms);
    } catch (error) {
      console.error("채팅방 목록 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
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

  const filteredRooms = chatRooms.filter((room) => {
    if (filterCategory === "all") return true;
    return room.category === filterCategory;
  });

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
          <div className="flex justify-between items-center mb-6">
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

          {/* 가로 스크롤 카테고리 필터 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((cat) => {
                const Icon =
                  cat.value !== "all" ? getCategoryIcon(cat.value) : null;
                const isSelected = filterCategory === cat.value;

                return (
                  <button
                    key={cat.value}
                    onClick={() => setFilterCategory(cat.value)}
                    className={`
                      flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap
                      transition-all duration-200 shrink-0
                      ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      }
                    `}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span className="font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 결과 수 */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {filteredRooms.length}개
              </span>
              의 소모임
            </p>
          </div>

          {/* 채팅방 목록 */}
          {filteredRooms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {filterCategory === "all"
                    ? "아직 생성된 소모임이 없습니다."
                    : `"${filterCategory}" 카테고리의 소모임이 없습니다.`}
                </p>
                {filterCategory !== "all" ? (
                  <Button
                    onClick={() => setFilterCategory("all")}
                    variant="outline"
                  >
                    전체 보기
                  </Button>
                ) : (
                  <Button onClick={handleCreateClick} variant="outline">
                    첫 소모임 만들기
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room) => (
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
