"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/global/auth/useAuth";
import { ChatRoom } from "@/types/chat";
import { joinChatRoom } from "@/lib/api/chatApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Users, MapPin, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface ChatRoomDetailModalProps {
  chatRoom: ChatRoom;
  onClose: () => void;
}

export default function ChatRoomDetailModal({
  chatRoom,
  onClose,
}: ChatRoomDetailModalProps) {
  const router = useRouter();
  const { isLogin, loginMember } = useAuth();
  const [isJoining, setIsJoining] = useState(false);

  const isFull = chatRoom.currentParticipants >= chatRoom.maxParticipants;
  const isCreator = loginMember?.id === chatRoom.creatorId;

  // 쿠키 기반 - 채팅방 참여
  const handleJoin = async () => {
    // 로그인 체크
    if (!isLogin || !loginMember) {
      alert("로그인이 필요한 기능입니다.");
      onClose();
      router.push("/login");
      return;
    }

    // 생성자는 바로 입장 (API 호출 X)
    if (isCreator) {
      console.log("[참여하기] 생성자 → 바로 입장");
      onClose();
      router.push(`/groups/${chatRoom.id}/chat`);
      return;
    }

    try {
      setIsJoining(true);
      console.log("[참여하기] API 호출:", {
        chatRoomId: chatRoom.id,
      });

      // 쿠키 기반 - 파라미터 간소화
      await joinChatRoom(chatRoom.id);

      console.log("✅ [참여하기] API 성공 - 새로 참여");
      alert("소모임에 참여했습니다!");
      onClose();
      router.push(`/groups/${chatRoom.id}/chat`);
    } catch (error: any) {
      console.error("❌ [참여하기] API 실패:", error);

      // 이미 참여 중인 경우 → 에러를 무시하고 바로 입장
      if (
        error.message.includes("이미 참여") ||
        error.message.includes("already") ||
        error.status === 500
      ) {
        console.log("ℹ️ [참여하기] 이미 참여 중 → 바로 입장");
        onClose();
        router.push(`/groups/${chatRoom.id}/chat`);
      }
      // 인원 마감인 경우
      else if (
        error.message.includes("인원") ||
        error.message.includes("마감") ||
        error.message.includes("full")
      ) {
        alert("이미 인원이 가득 찼습니다.");
      }
      // 기타 에러
      else {
        alert("소모임 참여에 실패했습니다: " + error.message);
      }
    } finally {
      setIsJoining(false);
    }
  };

  // 버튼 텍스트 결정
  const getButtonText = () => {
    if (isJoining) return "처리 중...";
    if (isCreator) return "입장하기";
    return "참여하기";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg w-full max-w-lg border shadow-lg relative">
        {/* 닫기 버튼 - absolute 위치 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 헤더 - X 버튼 공간 확보 */}
        <div className="p-6 pr-14 border-b">
          <div className="flex items-start gap-3 mb-3">
            <h2 className="text-2xl font-bold flex-1 wrap-break-word">
              {chatRoom.name}
            </h2>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary shrink-0"
            >
              소모임
            </Badge>
          </div>
          <p className="text-muted-foreground wrap-break-word">
            {chatRoom.description}
          </p>
        </div>

        {/* 상세 정보 */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">지역</p>
                <p className="font-medium truncate">{chatRoom.region}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">참여 인원</p>
                <p className="font-medium">
                  {chatRoom.currentParticipants}/{chatRoom.maxParticipants}명
                  {isFull && (
                    <span className="text-destructive ml-1">(마감)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">생성일</p>
                <p className="font-medium text-sm">
                  {format(new Date(chatRoom.createdAt), "yyyy년 MM월 dd일", {
                    locale: ko,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">방장</p>
                <p className="font-medium truncate">
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
            disabled={isJoining}
            className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50"
          >
            {getButtonText()}
          </Button>
        </div>
      </div>
    </div>
  );
}
