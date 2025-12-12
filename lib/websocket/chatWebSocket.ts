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

  connect(
    chatRoomId: number,
    onMessage: (message: ChatMessage) => void,
    onConnect?: () => void
  ) {
    this.chatRoomId = chatRoomId;

    console.log("🔌 WebSocket 연결 시작:", {
      chatRoomId,
      userId: this.userId,
      nickname: this.nickname,
    });

    this.client = new Client({
      // ✅ withCredentials: true로 쿠키 자동 전송!
      webSocketFactory: () =>
        new SockJS(`${WS_URL}/ws`, null, {
          withCredentials: true, // ★ 핵심!
        } as any),

      // ✅ connectHeaders 제거 - 쿠키가 자동 전달됨

      debug: (str) => {
        console.log("STOMP:", str);
      },

      reconnectDelay: 5000,

      onConnect: () => {
        console.log("✅ WebSocket 연결 성공");

        if (!this.client || !this.chatRoomId) {
          console.error("❌ client 또는 chatRoomId가 없습니다");
          return;
        }

        // 채팅방 구독
        this.client.subscribe(
          `/topic/chatroom/${this.chatRoomId}`,
          (message) => {
            try {
              const chatMessage: ChatMessage = JSON.parse(message.body);
              console.log("메시지 수신:", chatMessage);
              onMessage(chatMessage);
            } catch (error) {
              console.error("메시지 파싱 오류:", error);
            }
          }
        );

        console.log(`채팅방 ${this.chatRoomId} 구독 완료`);

        if (onConnect) {
          onConnect();
        }
      },

      onStompError: (frame) => {
        console.error("❌ STOMP 오류:", frame);
        console.error("상세 메시지:", frame.body);
      },

      onWebSocketError: (event) => {
        console.error("❌ WebSocket 오류:", event);
      },

      onDisconnect: () => {
        console.log("WebSocket 연결 해제");
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

    console.log("메시지 전송:", message);

    this.client.publish({
      destination: "/app/chat.send",
      body: JSON.stringify(message),
    });
  }

  disconnect() {
    if (this.client) {
      console.log("WebSocket 연결 해제 시작");
      this.client.deactivate();
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}
