import { create } from "zustand";
import { ChatMessage, ChatRoom } from "@/types/chat";

interface ChatStore {
  currentChatRoom: ChatRoom | null;
  setCurrentChatRoom: (room: ChatRoom | null) => void;

  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;

  chatRooms: ChatRoom[];
  setChatRooms: (rooms: ChatRoom[]) => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currentChatRoom: null,
  setCurrentChatRoom: (room) => set({ currentChatRoom: room }),

  messages: [],
  addMessage: (message) =>
    set((state) => {
      // 중복 메시지 방지 (같은 ID가 이미 있으면 추가 안 함)
      const isDuplicate = state.messages.some(
        (m) =>
          m.id === message.id ||
          (m.content === message.content &&
            m.senderId === message.senderId &&
            m.createdAt === message.createdAt)
      );

      if (isDuplicate) {
        console.log("중복 메시지 무시:", message);
        return state;
      }

      return {
        messages: [...state.messages, message],
      };
    }),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),

  chatRooms: [],
  setChatRooms: (rooms) => set({ chatRooms: rooms }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
