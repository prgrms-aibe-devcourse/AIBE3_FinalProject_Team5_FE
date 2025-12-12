import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { ChatMessage, ChatMessageSendRequest, MessageType } from "@/types/chat";
import Cookies from "js-cookie";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws";

export class ChatWebSocketClient {
  private client: Client | null = null;
  private chatRoomId: number | null = null;
  private onMessageReceived: ((message: ChatMessage) => void) | null = null;
  private isConnectedState: boolean = false;
  private userId: number;
  private userNickname: string;

  /**
   * 생성자 - 사용자 정보를 받아서 저장
   * (userId, userNickname은 유지하지만 WebSocket 인증에는 사용하지 않음)
   */
  constructor(userId: number, userNickname: string) {
    this.userId = userId;
    this.userNickname = userNickname;
    console.log("WebSocket 클라이언트 생성:", { userId, userNickname });
  }

  connect(
      chatRoomId: number,
      onMessage: (message: ChatMessage) => void,
      onConnect?: () => void
  ) {
    this.chatRoomId = chatRoomId;
    this.onMessageReceived = onMessage;
    this.isConnectedState = false;

    console.log("WebSocket 연결 시도 (SockJS):", WS_URL);

    const token = Cookies.get("accessToken");

    if (!token) {
      console.error("❌ 인증 토큰이 없습니다. 로그인이 필요합니다.");
      throw new Error("인증 토큰이 없습니다. 로그인이 필요합니다.");
    }

    this.client = new Client({
      // SockJS 사용 (백엔드가 .withSockJS() 사용)
      webSocketFactory: () => new SockJS(WS_URL),

      // JWT 토큰을 Authorization 헤더에 포함 (userId, nickname 대신)
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      debug: (str) => {
        console.log("[WebSocket Debug]", str);
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log("✅ WebSocket 연결 성공!");
        this.isConnectedState = true;

        // 구독
        this.subscribeToChatRoom(chatRoomId);

        if (onConnect) {
          onConnect();
        }
      },

      onStompError: (frame) => {
        console.error("❌ STOMP 에러:", frame.headers["message"]);
        console.error("상세:", frame.body);
        this.isConnectedState = false;
      },

      onWebSocketClose: () => {
        console.log("WebSocket 연결 종료");
        this.isConnectedState = false;
      },

      onWebSocketError: (error) => {
        console.error("❌ WebSocket 에러:", error);
        this.isConnectedState = false;
      },
    });

    this.client.activate();
  }

  private subscribeToChatRoom(chatRoomId: number) {
    if (!this.client) return;

    this.client.subscribe(`/topic/chatroom/${chatRoomId}`, (message) => {
      try {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        console.log("메시지 수신:", chatMessage);

        if (this.onMessageReceived) {
          this.onMessageReceived(chatMessage);
        }
      } catch (error) {
        console.error("메시지 파싱 에러:", error);
      }
    });

    console.log(`채팅방 구독 완료: /topic/chatroom/${chatRoomId}`);
  }

  sendMessage(message: ChatMessageSendRequest) {
    if (!this.client || !this.client.active || !this.isConnectedState) {
      console.error("❌ WebSocket이 연결되지 않았습니다.");
      console.error(
          "client:",
          !!this.client,
          "active:",
          this.client?.active,
          "state:",
          this.isConnectedState
      );
      return;
    }

    try {
      this.client.publish({
        destination: "/app/chat/message",
        body: JSON.stringify(message),
      });

      console.log(
          "메시지 전송 성공:",
          message.type,
          message.content.substring(0, 20)
      );
    } catch (error) {
      console.error("❌ 메시지 전송 실패:", error);
    }
  }

  disconnect() {
    if (this.client) {
      console.log("WebSocket 연결 해제 시작");

      this.client.deactivate();
      this.isConnectedState = false;

      console.log("✅ WebSocket 연결 해제 완료");
    }
  }

  isConnected(): boolean {
    return this.isConnectedState && this.client !== null && this.client.active;
  }
}
