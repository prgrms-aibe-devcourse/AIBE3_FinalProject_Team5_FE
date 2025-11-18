"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatRoom } from "@/src/types/chat";
import { joinChatRoom } from "@/src/lib/api/chatApi";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { X, Users, MapPin, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface ChatRoomDetailModalProps {
  chatRoom: ChatRoom;
  onClose: () => void;
}

const TEMP_USER_ID = 1; // TODO: 실제 사용자 ID로 변경

export default function ChatRoomDetailModal({
  chatRoom,
  onClose,
}: ChatRoomDetailModalProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const isFull = chatRoom.currentParticipants >= chatRoom.maxParticipants;
  const isCreator = chatRoom.creatorId === TEMP_USER_ID; // 생성자인지 확인

  // 참여하기 or 입장하기
  const handleJoin = async () => {
    // 생성자는 이미 참여자이므로 바로 입장
    if (isCreator) {
      onClose();
      router.push(`/chat/${chatRoom.id}`);
      return;
    }

    if (isFull) {
      alert("이미 인원이 가득 찼습니다.");
      return;
    }

    const confirm = window.confirm("이 소모임에 참여하시겠습니까?");
    if (!confirm) return;

    try {
      setIsJoining(true);
      await joinChatRoom(chatRoom.id);
      alert("소모임에 참여했습니다!");
      onClose();
      router.push(`/chat/${chatRoom.id}`);
    } catch (error: any) {
      console.error("참여 실패:", error);

      // 이미 참여 중인 경우 바로 입장
      if (error.message.includes("이미 참여")) {
        onClose();
        router.push(`/chat/${chatRoom.id}`);
      } else {
        alert("소모임 참여에 실패했습니다.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg w-full max-w-lg border shadow-lg relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 헤더 */}
        <div className="p-6 border-b">
          <div className="flex items-start gap-3 mb-3">
            <h2 className="text-2xl font-bold flex-1">{chatRoom.name}</h2>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary"
            >
              소모임
            </Badge>
          </div>
          <p className="text-muted-foreground">{chatRoom.description}</p>
        </div>

        {/* 상세 정보 */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 지역 */}
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">지역</p>
                <p className="font-medium">{chatRoom.region}</p>
              </div>
            </div>

            {/* 인원 */}
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">참여 인원</p>
                <p className="font-medium">
                  {chatRoom.currentParticipants}/{chatRoom.maxParticipants}명
                  {isFull && (
                    <span className="text-destructive ml-1">(마감)</span>
                  )}
                </p>
              </div>
            </div>

            {/* 생성일 */}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">생성일</p>
                <p className="font-medium">
                  {format(new Date(chatRoom.createdAt), "yyyy년 MM월 dd일", {
                    locale: ko,
                  })}
                </p>
              </div>
            </div>

            {/* 방장 */}
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">방장</p>
                <p className="font-medium">
                  ID: {chatRoom.creatorId}
                  {isCreator && <span className="text-primary ml-1">(나)</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="p-6 border-t flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button
            onClick={handleJoin}
            disabled={(!isCreator && isFull) || isJoining}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isJoining
              ? "참여 중..."
              : isCreator
              ? "입장하기"
              : isFull
              ? "인원 마감"
              : "참여하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
