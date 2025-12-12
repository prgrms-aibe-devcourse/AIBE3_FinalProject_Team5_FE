import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { ChatMessage, MessageType } from "@/types/chat";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080";
export class ChatWebSocketClient {
  private client: Client | null = null;
  private chatRoomId: number | null = null;
  private userId: number;
  private nickname: string;
  constructor(userId: number, nickname: string) {
    this.userId = userId;
    this.nickname = nickname;
  }
  // :흰색_확인_표시: 쿠키에서 accessToken 가져오기
  private getAccessToken(): string {
    if (typeof document === "undefined") return "";
    const cookies = document.cookie.split("; ");
    const accessTokenCookie = cookies.find((row) =>
      row.startsWith("accessToken=")
    );
    return accessTokenCookie ? accessTokenCookie.split("=")[1] : "";
  }
  connect(
    chatRoomId: number,
    onMessage: (message: ChatMessage) => void,
    onConnect?: () => void
  ) {
    this.chatRoomId = chatRoomId;
    // :흰색_확인_표시: accessToken 가져오기
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      console.error(":x: accessToken이 없습니다. 로그인이 필요합니다.");
      throw new Error("인증 토큰이 없습니다.");
    }
    console.log(":전기_플러그: WebSocket 연결 시작:", {
      chatRoomId,
      userId: this.userId,
      nickname: this.nickname,
      hasToken: !!accessToken,
    });
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      // :흰색_확인_표시: Authorization 헤더 추가
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: (str) => {
        console.log(":돋보기: STOMP:", str);
      },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(":흰색_확인_표시: WebSocket 연결 성공");
        if (!this.client || !this.chatRoomId) {
          console.error(":x: client 또는 chatRoomId가 없습니다");
          return;
        }
        // 채팅방 구독
        this.client.subscribe(
          `/topic/chatroom/${this.chatRoomId}`,
          (message) => {
            try {
              const chatMessage: ChatMessage = JSON.parse(message.body);
              console.log(":수신_봉투: 메시지 수신:", chatMessage);
              onMessage(chatMessage);
            } catch (error) {
              console.error("메시지 파싱 오류:", error);
            }
          }
        );
        console.log(`:확성기: 채팅방 ${this.chatRoomId} 구독 완료`);
        if (onConnect) {
          onConnect();
        }
      },
      onStompError: (frame) => {
        console.error(":x: STOMP 오류:", frame);
        console.error("상세 메시지:", frame.body);
      },
      onWebSocketError: (event) => {
        console.error(":x: WebSocket 오류:", event);
      },
      onDisconnect: () => {
        console.log(":전기_플러그: WebSocket 연결 해제");
      },
    });
    this.client.activate();
  }
  sendMessage(message: {
    chatRoomId: number;
    type: MessageType;
    content: string;
  }) {
    if (!this.client?.connected) {
      console.error("WebSocket이 연결되지 않았습니다");
      return;
    }
    console.log(":보낼_편지함_트레이: 메시지 전송:", message);
    this.client.publish({
      destination: "/app/chat.send",
      body: JSON.stringify(message),
    });
  }
  disconnect() {
    if (this.client) {
      console.log(":전기_플러그: WebSocket 연결 해제 시작");
      this.client.deactivate();
      this.client = null;
    }
  }
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}
