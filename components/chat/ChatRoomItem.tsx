"use client";

import { ChatRoom } from "@/types/chat";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { getCategoryIcon, getCategoryColor } from "@/lib/utils/categoryIcons";

interface ChatRoomItemProps {
  chatRoom: ChatRoom;
  onClick: () => void;
}

export default function ChatRoomItem({ chatRoom, onClick }: ChatRoomItemProps) {
  const isFull = chatRoom.currentParticipants >= chatRoom.maxParticipants;
  const CategoryIcon = getCategoryIcon(chatRoom.category);
  const categoryColor = getCategoryColor(chatRoom.category);

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex flex-col gap-3">
          {/* 헤더 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{chatRoom.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {chatRoom.description}
              </p>
            </div>
          </div>

          {/* 배지 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary"
            >
              소모임
            </Badge>

            {/* 카테고리 배지 추가 */}
            {chatRoom.category && (
              <Badge variant="outline" className="gap-1">
                <CategoryIcon className={`w-3 h-3 ${categoryColor}`} />
                {chatRoom.category}
              </Badge>
            )}

            {isFull && (
              <Badge
                variant="destructive"
                className="bg-destructive/10 text-destructive"
              >
                마감
              </Badge>
            )}
          </div>

          {/* 정보 */}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{chatRoom.region}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>
                {chatRoom.currentParticipants}/{chatRoom.maxParticipants}명
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(chatRoom.createdAt), "yyyy.MM.dd", {
                  locale: ko,
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
