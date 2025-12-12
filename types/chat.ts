export enum ChatRoomType {
  SMALL_GROUP = "SMALL_GROUP",
  GROUP_PURCHASE = "GROUP_PURCHASE",
}

export enum MessageType {
  ENTER = "ENTER",
  TALK = "TALK",
  LEAVE = "LEAVE",
  KICK = "KICK",
  TRANSFER = "TRANSFER", // ✅ 추가
}

export interface ChatRoom {
  id: number;
  name: string;
  type: ChatRoomType;
  creatorId: number;
  region: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  isActive: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderNickname: string;
  type: MessageType;
  content: string;
  targetMemberId?: number;
  createdAt: string;
}

export interface ChatRoomCreateRequest {
  name: string;
  type: ChatRoomType;
  region: string;
  description?: string;
  maxParticipants: number;
}

export interface ChatMessageSendRequest {
  chatRoomId: number;
  type: MessageType;
  content: string;
}
