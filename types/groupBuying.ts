/**
 * 공동구매 게시글 타입
 */
export interface GroupBuyingPost {
  id: number;
  chatRoomId: number;
  creatorId: number;
  title: string;
  category: string;
  content: string;
  targetAmount: number;
  currentAmount: number;
  targetParticipants: number;
  currentParticipants: number;
  deadline: string;
  status: GroupBuyingStatus;
  region: string;
  createdAt: string;
  updatedAt: string;
  progressPercentage: number;
  isExpired: boolean;
  viewCount?: number; // 조회수
  chatRoomMessageCount?: number; // 채팅방 메시지 수
  images?: string[]; // 이미지 URL 목록
  creatorNickname?: string; // 작성자 닉네임
}

/**
 * 공동구매 상태
 */
export enum GroupBuyingStatus {
  RECRUITING = "RECRUITING", // 모집 중
  COMPLETED = "COMPLETED", // 완료
  CANCELLED = "CANCELLED", // 취소
}

/**
 * 공동구매 참여자
 */
export interface GroupBuyingParticipant {
  id: number;
  groupBuyingPostId: number;
  memberId: number;
  memberNickname: string;
  contributedAmount: number;
  joinedAt: string;
}

/**
 * 공동구매 목록 응답
 */
export interface GroupBuyingListResponse {
  posts: GroupBuyingPost[];
  totalCount: number;
}

/**
 * 공동구매 생성 요청
 */
export interface GroupBuyingCreateRequest {
  title: string;
  category: string;
  content: string;
  targetAmount: number;
  targetParticipants: number;
  deadline: string;
  region: string;
  chatRoomName: string;
  chatRoomDescription?: string;
  chatRoomMaxParticipants: number;
}

/**
 * 공동구매 수정 요청
 */
export interface GroupBuyingUpdateRequest {
  title: string;
  content: string;
  category: string;
  region: string;
  deadline: string;
  imageIds?: number[];
}

/**
 * 공동구매 참여 요청
 */
export interface GroupBuyingJoinRequest {
  contributedAmount: number;
}

/**
 * 공동구매 카테고리 (UI용)
 */
export const GROUP_BUYING_CATEGORIES = {
  food: "식품",
  living: "생활용품",
  electronics: "전자제품",
  fashion: "패션/의류",
  beauty: "뷰티/화장품",
  etc: "기타",
} as const;

export type GroupBuyingCategory = keyof typeof GROUP_BUYING_CATEGORIES;
