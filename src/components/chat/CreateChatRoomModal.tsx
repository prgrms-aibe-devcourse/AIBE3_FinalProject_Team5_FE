"use client";

import { useState } from "react";
import { ChatRoomType } from "@/src/types/chat";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { X } from "lucide-react";

interface CreateChatRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    type: ChatRoomType;
    region: string;
    description: string;
    maxParticipants: number;
  }) => void;
}

export default function CreateChatRoomModal({
  isOpen,
  onClose,
  onCreate,
}: CreateChatRoomModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    description: "",
    maxParticipants: 10,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      type: ChatRoomType.SMALL_GROUP, // 소모임으로 고정
    });
    onClose();
    setFormData({
      name: "",
      region: "",
      description: "",
      maxParticipants: 10,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg p-6 w-full max-w-md border shadow-lg relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-4">소모임 만들기</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">소모임 이름</Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="소모임 이름을 입력하세요"
            />
          </div>

          <div>
            <Label htmlFor="region">지역</Label>
            <Input
              id="region"
              type="text"
              required
              value={formData.region}
              onChange={(e) =>
                setFormData({ ...formData, region: e.target.value })
              }
              placeholder="예: 강남구"
            />
          </div>

          <div>
            <Label htmlFor="description">목적 / 설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="소모임의 목적이나 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="maxParticipants">
              최대 인원: {formData.maxParticipants}명
            </Label>
            <input
              id="maxParticipants"
              type="range"
              min="2"
              max="50"
              value={formData.maxParticipants}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxParticipants: Number(e.target.value),
                })
              }
              className="w-full accent-primary"
            />
          </div>

          <div className="flex gap-2 pt-4">
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
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              만들기
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
