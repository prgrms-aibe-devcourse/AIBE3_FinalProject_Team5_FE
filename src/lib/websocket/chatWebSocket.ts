import { Client } from "@stomp/stompjs";
import {
  ChatMessage,
  ChatMessageSendRequest,
  MessageType,
} from "../../types/chat";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/api/ws";

const TEMP_USER_ID = 1;
const TEMP_USER_NICKNAME = "테스트유저";

export class ChatWebSocketClient {
  private client: Client | null = null;
  private chatRoomId: number | null = null;
  private onMessageReceived: ((message: ChatMessage) => void) | null = null;
  private isConnectedState: boolean = false;
  private isEnterMessageSent: boolean = false;

  connect(
    chatRoomId: number,
    onMessage: (message: ChatMessage) => void,
    onConnect?: () => void
  ) {
    this.chatRoomId = chatRoomId;
    this.onMessageReceived = onMessage;
    this.isConnectedState = false;
    this.isEnterMessageSent = false;

    console.log("🔌 WebSocket 연결 시도:", WS_URL);

    this.client = new Client({
      brokerURL: WS_URL,

      connectHeaders: {
        userId: TEMP_USER_ID.toString(),
        nickname: TEMP_USER_NICKNAME,
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

        // 입장 메시지 (한 번만!)
        if (!this.isEnterMessageSent) {
          // 약간의 딜레이 후 전송 (구독 완료 대기)
          setTimeout(() => {
            this.sendEnterMessage(chatRoomId);
            this.isEnterMessageSent = true;
          }, 100);
        }

        if (onConnect) {
          onConnect();
        }
      },

      onStompError: (frame) => {
        console.error("STOMP 에러:", frame.headers["message"]);
        console.error("상세:", frame.body);
        this.isConnectedState = false;
      },

      onWebSocketClose: () => {
        console.log("WebSocket 연결 종료");
        this.isConnectedState = false;
        this.isEnterMessageSent = false;
      },

      onWebSocketError: (error) => {
        console.error("WebSocket 에러:", error);
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

  private sendEnterMessage(chatRoomId: number) {
    console.log("입장 메시지 전송 시도");

    const enterMessage: ChatMessageSendRequest = {
      chatRoomId,
      type: MessageType.ENTER,
      content: `${TEMP_USER_NICKNAME}님이 입장하셨습니다.`,
    };

    this.sendMessage(enterMessage);
  }

  sendMessage(message: ChatMessageSendRequest) {
    // active 상태 체크로 변경!
    if (!this.client || !this.client.active || !this.isConnectedState) {
      console.error("WebSocket이 연결되지 않았습니다.");
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
      console.error("메시지 전송 실패:", error);
    }
  }

  sendLeaveMessage() {
    if (!this.chatRoomId) return;

    const leaveMessage: ChatMessageSendRequest = {
      chatRoomId: this.chatRoomId,
      type: MessageType.LEAVE,
      content: `${TEMP_USER_NICKNAME}님이 퇴장하셨습니다.`,
    };

    this.sendMessage(leaveMessage);
  }

  disconnect() {
    if (this.client) {
      console.log("🔌 WebSocket 연결 해제 시작");

      // 퇴장 메시지 전송
      if (this.isConnectedState) {
        this.sendLeaveMessage();
      }

      // 연결 해제
      this.client.deactivate();
      this.isConnectedState = false;
      this.isEnterMessageSent = false;

      console.log("✅ WebSocket 연결 해제 완료");
    }
  }

  // 연결 상태 확인 메서드 추가
  isConnected(): boolean {
    return this.isConnectedState && this.client !== null && this.client.active;
  }
}
