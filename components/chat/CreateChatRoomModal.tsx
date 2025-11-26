"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/global/auth/useAuth";
import { createChatRoom } from "@/lib/api/chatApi";
import { ChatRoomType } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface CreateChatRoomModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateChatRoomModal({
  onClose,
  onSuccess,
}: CreateChatRoomModalProps) {
  const router = useRouter();
  const { isLogin } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // 쿠키 기반 - 채팅방 생성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      setIsLoading(true);

      // 쿠키 기반 - 파라미터 간소화
      await createChatRoom({
        name,
        description,
        region,
        maxParticipants,
        type: ChatRoomType.SMALL_GROUP,
      });

      alert("소모임이 생성되었습니다!");

      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error("채팅방 생성 실패:", error);
      alert("소모임 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg w-full max-w-md border shadow-lg">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">소모임 만들기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">소모임 이름 *</Label>
            <Input
              id="name"
              placeholder="예: 강남 러닝크루"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">소모임 설명 *</Label>
            <Textarea
              id="description"
              placeholder="소모임에 대해 설명해주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">지역 *</Label>
            <Input
              id="region"
              placeholder="예: 강남구"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxParticipants">최대 인원 *</Label>
            <Input
              id="maxParticipants"
              type="number"
              min={2}
              max={100}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isLoading ? "생성 중..." : "생성하기"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
