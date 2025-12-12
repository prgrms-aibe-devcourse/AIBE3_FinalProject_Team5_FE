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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface CreateChatRoomModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

// 주요 지역 목록
const REGIONS = [
  { value: "서울", label: "서울특별시" },
  { value: "경기", label: "경기도" },
  { value: "인천", label: "인천광역시" },
  { value: "부산", label: "부산광역시" },
  { value: "대구", label: "대구광역시" },
  { value: "대전", label: "대전광역시" },
  { value: "광주", label: "광주광역시" },
  { value: "울산", label: "울산광역시" },
  { value: "세종", label: "세종특별자치시" },
  { value: "강원", label: "강원특별자치도" },
  { value: "충북", label: "충청북도" },
  { value: "충남", label: "충청남도" },
  { value: "전북", label: "전북특별자치도" },
  { value: "전남", label: "전라남도" },
  { value: "경북", label: "경상북도" },
  { value: "경남", label: "경상남도" },
  { value: "제주", label: "제주특별자치도" },
];

// 최대 인원 옵션 (2~10명)
const MAX_PARTICIPANTS_OPTIONS = Array.from({ length: 9 }, (_, i) => i + 2);

export default function CreateChatRoomModal({
  onClose,
  onSuccess,
}: CreateChatRoomModalProps) {
  const router = useRouter();
  const { isLogin } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<string>("4");
  const [isLoading, setIsLoading] = useState(false);

  // 쿠키 기반 - 채팅방 생성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 지역 선택 검증
    if (!region) {
      alert("지역을 선택해주세요.");
      return;
    }

    try {
      setIsLoading(true);

      // 쿠키 기반 - 파라미터 간소화
      await createChatRoom({
        name,
        description,
        region,
        maxParticipants: Number(maxParticipants),
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

          {/* 지역 드롭다운 */}
          <div className="space-y-2">
            <Label htmlFor="region">지역 *</Label>
            <Select value={region} onValueChange={setRegion} required>
              <SelectTrigger id="region">
                <SelectValue placeholder="지역을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 최대 인원 드롭다운 */}
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">최대 인원 *</Label>
            <Select
              value={maxParticipants}
              onValueChange={setMaxParticipants}
              required
            >
              <SelectTrigger id="maxParticipants">
                <SelectValue placeholder="최대 인원을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {MAX_PARTICIPANTS_OPTIONS.map((num) => (
                  <SelectItem key={num} value={String(num)}>
                    {num}명
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
