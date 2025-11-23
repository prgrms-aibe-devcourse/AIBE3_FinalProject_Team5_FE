import { ChatRoom, ChatRoomCreateRequest, ChatMessage } from "@/types/chat";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

/**
 * 인증 헤더 생성
 */
function getAuthHeaders(apiKey?: string | null, accessToken?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey && accessToken) {
    headers["Authorization"] = `Bearer ${apiKey} ${accessToken}`;
  }

  return headers;
}

/**
 * 백엔드 RsData 응답 처리
 */
interface RsData<T> {
  resultCode: string;
  msg: string;
  data: T;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const json = await response.json();

    // RsData 구조인 경우
    if (json.resultCode && json.data !== undefined) {
      return json.data as T;
    }

    // 직접 데이터인 경우
    return json as T;
  }

  // JSON이 아닌 경우
  return undefined as T;
}

/**
 * 채팅방 목록 조회 (비회원도 가능)
 */
export async function fetchChatRooms(
  region?: string,
  type?: string,
  apiKey?: string | null,
  accessToken?: string | null
): Promise<ChatRoom[]> {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
  if (type) params.append("type", type);

  const url = params.toString()
    ? `${API_BASE_URL}/chatrooms?${params}`
    : `${API_BASE_URL}/chatrooms`;

  const response = await fetch(url, {
    headers: getAuthHeaders(apiKey, accessToken),
  });

  const data = await handleResponse<{ chatRooms: ChatRoom[] }>(response);
  return data.chatRooms || [];
}

/**
 * 채팅방 상세 조회 (로그인 필수)
 */
export async function fetchChatRoom(
  chatRoomId: number,
  apiKey: string,
  accessToken: string
): Promise<ChatRoom> {
  const response = await fetch(`${API_BASE_URL}/chatrooms/${chatRoomId}`, {
    headers: getAuthHeaders(apiKey, accessToken),
  });

  return handleResponse<ChatRoom>(response);
}

/**
 * 채팅방 생성 (로그인 필수)
 */
export async function createChatRoom(
  data: ChatRoomCreateRequest,
  apiKey: string,
  accessToken: string
): Promise<ChatRoom> {
  const response = await fetch(`${API_BASE_URL}/chatrooms`, {
    method: "POST",
    headers: getAuthHeaders(apiKey, accessToken),
    body: JSON.stringify(data),
  });

  return handleResponse<ChatRoom>(response);
}

/**
 * 채팅방 참여 (로그인 필수)
 */
export async function joinChatRoom(
  chatRoomId: number,
  apiKey: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chatrooms/${chatRoomId}/join`, {
    method: "POST",
    headers: getAuthHeaders(apiKey, accessToken),
  });

  await handleResponse<void>(response);
}

/**
 * 채팅방 나가기 (로그인 필수)
 */
export async function leaveChatRoom(
  chatRoomId: number,
  apiKey: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/chatrooms/${chatRoomId}/leave`,
    {
      method: "POST",
      headers: getAuthHeaders(apiKey, accessToken),
    }
  );

  await handleResponse<void>(response);
}

/**
 * 채팅 메시지 이력 조회 (로그인 필수)
 */
export async function fetchChatMessages(
  chatRoomId: number,
  apiKey: string,
  accessToken: string,
  count: number = 50
): Promise<ChatMessage[]> {
  const response = await fetch(
    `${API_BASE_URL}/chatrooms/${chatRoomId}/messages/recent?count=${count}`,
    {
      headers: getAuthHeaders(apiKey, accessToken),
    }
  );

  const data = await handleResponse<
    ChatMessage[] | { messages: ChatMessage[] }
  >(response);

  // 배열로 직접 반환되는 경우
  if (Array.isArray(data)) {
    return data;
  }

  // { messages: [...] } 형태인 경우
  if (data && typeof data === "object" && "messages" in data) {
    return (data as { messages: ChatMessage[] }).messages;
  }

  return [];
}

/**
 * 내가 참여한 채팅방 목록 (로그인 필수)
 */
export async function fetchMyChatRooms(
  apiKey: string,
  accessToken: string
): Promise<ChatRoom[]> {
  const response = await fetch(`${API_BASE_URL}/chatrooms/my`, {
    headers: getAuthHeaders(apiKey, accessToken),
  });

  const data = await handleResponse<{ chatRooms: ChatRoom[] }>(response);
  return data.chatRooms || [];
}

/**
 * 채팅방 참여자 목록 조회 (로그인 필수)
 */
export interface ChatParticipant {
  memberId: number;
  nickname: string;
  isCreator: boolean;
  joinedAt: string;
}

export async function fetchChatParticipants(
  chatRoomId: number,
  apiKey: string,
  accessToken: string
): Promise<ChatParticipant[]> {
  const response = await fetch(
    `${API_BASE_URL}/chatrooms/${chatRoomId}/participants`,
    {
      headers: getAuthHeaders(apiKey, accessToken),
    }
  );

  const data = await handleResponse<
    ChatParticipant[] | { participants: ChatParticipant[] }
  >(response);

  // 배열로 직접 반환되는 경우
  if (Array.isArray(data)) {
    return data;
  }

  // { participants: [...] } 형태인 경우
  if (data && typeof data === "object" && "participants" in data) {
    return (data as { participants: ChatParticipant[] }).participants;
  }

  return [];
}
