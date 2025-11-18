import { ChatRoom, ChatRoomCreateRequest, ChatMessage } from "../../types/chat";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// 임시 사용자 정보 (TODO: 실제로는 JWT에서 가져오기)
const TEMP_USER_ID = "1";
const TEMP_USER_NICKNAME = "테스트유저";

/**
 * 채팅방 목록 조회
 */
export async function fetchChatRooms(
  region?: string,
  type?: string
): Promise<ChatRoom[]> {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
  if (type) params.append("type", type);

  const response = await fetch(`${API_BASE_URL}/chatrooms?${params}`, {
    headers: {
      "X-User-Id": TEMP_USER_ID,
    },
  });

  if (!response.ok) {
    throw new Error("채팅방 목록 조회 실패");
  }

  const data = await response.json();
  return data.chatRooms;
}

/**
 * 채팅방 상세 조회
 */
export async function fetchChatRoom(chatRoomId: number): Promise<ChatRoom> {
  const response = await fetch(`${API_BASE_URL}/chatrooms/${chatRoomId}`, {
    headers: {
      "X-User-Id": TEMP_USER_ID,
    },
  });

  if (!response.ok) {
    throw new Error("채팅방 조회 실패");
  }

  return response.json();
}

/**
 * 채팅방 생성
 */
export async function createChatRoom(
  data: ChatRoomCreateRequest
): Promise<ChatRoom> {
  const response = await fetch(`${API_BASE_URL}/chatrooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": TEMP_USER_ID,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("채팅방 생성 실패");
  }

  return response.json();
}

/**
 * 채팅방 참여
 */
export async function joinChatRoom(chatRoomId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chatrooms/${chatRoomId}/join`, {
    method: "POST",
    headers: {
      "X-User-Id": TEMP_USER_ID,
      "X-User-Nickname": encodeURIComponent(TEMP_USER_NICKNAME),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "채팅방 참여 실패");
  }
}

/**
 * 채팅방 나가기
 */
export async function leaveChatRoom(chatRoomId: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/chatrooms/${chatRoomId}/leave`,
    {
      method: "POST",
      headers: {
        "X-User-Id": TEMP_USER_ID,
        "X-User-Nickname": encodeURIComponent(TEMP_USER_NICKNAME),
      },
    }
  );

  if (!response.ok) {
    throw new Error("채팅방 나가기 실패");
  }
}

/**
 * 채팅 메시지 이력 조회
 */
export async function fetchChatMessages(
  chatRoomId: number,
  page = 0,
  size = 50
): Promise<ChatMessage[]> {
  const response = await fetch(
    `${API_BASE_URL}/chatrooms/${chatRoomId}/messages/recent?count=${size}`,
    {
      headers: {
        "X-User-Id": TEMP_USER_ID,
      },
    }
  );

  if (!response.ok) {
    throw new Error("메시지 조회 실패");
  }

  return response.json();
}

/**
 * 내가 참여한 채팅방 목록
 */
export async function fetchMyChatRooms(): Promise<ChatRoom[]> {
  const response = await fetch(`${API_BASE_URL}/chatrooms/my`, {
    headers: {
      "X-User-Id": TEMP_USER_ID,
    },
  });

  if (!response.ok) {
    throw new Error("내 채팅방 목록 조회 실패");
  }

  const data = await response.json();
  return data.chatRooms;
}
