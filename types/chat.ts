export enum ChatRoomType {
  SMALL_GROUP = "SMALL_GROUP",
  GROUP_PURCHASE = "GROUP_PURCHASE",
}

export enum MessageType {
  ENTER = "ENTER",
  TALK = "TALK",
  LEAVE = "LEAVE",
  KICK = "KICK",
  TRANSFER = "TRANSFER",
}

export interface ChatRoom {
  id: number;
  name: string;
  type: ChatRoomType;
  creatorId: number;
  creatorNickname: string;
  region: string;
  description: string;
  category?: string;
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
  category?: string;
  maxParticipants: number;
}

export interface ChatMessageSendRequest {
  chatRoomId: number;
  type: MessageType;
  content: string;
}

export const SMALL_GROUP_CATEGORIES = [
  { value: "맛집", label: "맛집" },
  { value: "운동", label: "운동" },
  { value: "문화", label: "문화" },
  { value: "독서", label: "독서" },
  { value: "요리", label: "요리" },
  { value: "게임", label: "게임" },
  { value: "여행", label: "여행" },
  { value: "스터디", label: "스터디" },
  { value: "기타", label: "기타" },
] as const;
