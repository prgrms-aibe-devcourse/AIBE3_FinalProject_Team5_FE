"use client";

import { ChatRoom } from "@/src/types/chat";
import ChatRoomItem from "./ChatRoomItem";

interface ChatRoomListProps {
  chatRooms: ChatRoom[];
  onChatRoomClick: (chatRoom: ChatRoom) => void;
}

export default function ChatRoomList({
  chatRooms,
  onChatRoomClick,
}: ChatRoomListProps) {
  return (
    <div>
      {chatRooms.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-muted-foreground mb-2">
            <p className="text-lg mb-2">소모임이 없습니다</p>
            <p className="text-sm">새로운 소모임을 만들어보세요!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chatRooms.map((room) => (
            <ChatRoomItem
              key={room.id}
              chatRoom={room}
              onClick={() => onChatRoomClick(room)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
