import {
  GroupBuyingPost,
  GroupBuyingListResponse,
  GroupBuyingCreateRequest,
  GroupBuyingJoinRequest,
  GroupBuyingParticipant,
  GroupBuyingStatus,
} from "@/types/groupBuying";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

/**
 * FileEntity 타입 정의
 */
export interface FileEntity {
  id: number;
  fileName: string;
  imgUrl: string;
}

/**
 * 공통 fetch 옵션 (쿠키 기반 인증)
 */
function getFetchOptions(method: string = "GET", body?: any): RequestInit {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
}

/**
 * 백엔드 응답 처리
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // 에러 응답 파싱 개선
    try {
      const contentType = response.headers.get("content-type");

      // JSON 응답인 경우
      if (contentType && contentType.includes("application/json")) {
        const errorJson = await response.json();

        // RsData 에러 형태 (resultCode + msg)
        if (errorJson.resultCode && errorJson.msg) {
          throw new Error(errorJson.msg);
        }

        // Spring Boot 에러 형태 (message 필드)
        if (errorJson.message) {
          throw new Error(errorJson.message);
        }

        // Spring Boot 에러 형태 (error 필드)
        if (errorJson.error) {
          throw new Error(errorJson.error);
        }

        // 둘 다 없으면 전체 JSON을 문자열로
        throw new Error(JSON.stringify(errorJson));
      }

      // Text 응답인 경우
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    } catch (error: any) {
      // JSON 파싱 실패 시
      if (error instanceof SyntaxError) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // 이미 Error 객체면 그대로 throw
      throw error;
    }
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
 * 이미지 업로드 API
 * @param images 업로드할 이미지 File 배열 (최대 5개)
 * @returns 업로드된 FileEntity 배열
 */
export async function uploadGroupBuyingImages(
  images: File[]
): Promise<FileEntity[]> {
  if (images.length > 5) {
    throw new Error("이미지는 최대 5개까지 업로드 가능합니다.");
  }

  const formData = new FormData();
  images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await fetch(`${API_BASE_URL}/group-buying/images`, {
    method: "POST",
    credentials: "include",
    body: formData,
    // ⚠️ Content-Type 헤더는 자동 설정됨 (multipart/form-data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`이미지 업로드 실패: ${errorText}`);
  }

  return await response.json();
}

/**
 * 공동구매 목록 조회 (비회원도 가능)
 */
export async function fetchGroupBuyingPosts(
  region?: string,
  status?: GroupBuyingStatus
): Promise<GroupBuyingPost[]> {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
  if (status) params.append("status", status);

  const url = params.toString()
    ? `${API_BASE_URL}/group-buying?${params}`
    : `${API_BASE_URL}/group-buying`;

  const response = await fetch(url, getFetchOptions());

  const data = await handleResponse<GroupBuyingListResponse>(response);
  return data.posts || [];
}

/**
 * 공동구매 상세 조회 (조회수 증가 O)
 * 상세 페이지에서 사용
 */
export async function fetchGroupBuyingPost(
  postId: number
): Promise<GroupBuyingPost> {
  const response = await fetch(
    `${API_BASE_URL}/group-buying/${postId}`,
    getFetchOptions()
  );

  return handleResponse<GroupBuyingPost>(response);
}

/**
 * 공동구매 정보 조회 (조회수 증가 X)
 * 채팅방 등에서 게시글 정보만 필요할 때 사용
 */
export async function fetchGroupBuyingPostInfo(
  postId: number
): Promise<GroupBuyingPost> {
  const response = await fetch(
    `${API_BASE_URL}/group-buying/${postId}/info`,
    getFetchOptions()
  );

  return handleResponse<GroupBuyingPost>(response);
}

/**
 * 공동구매 게시글 생성 (로그인 필수)
 * imageIds 추가
 */
export async function createGroupBuyingPost(
  data: GroupBuyingCreateRequest & { imageIds?: number[] }
): Promise<GroupBuyingPost> {
  const response = await fetch(
    `${API_BASE_URL}/group-buying`,
    getFetchOptions("POST", data)
  );

  return handleResponse<GroupBuyingPost>(response);
}

/**
 * 공동구매 참여 (로그인 필수)
 */
export async function joinGroupBuyingPost(
  postId: number,
  data: GroupBuyingJoinRequest
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/group-buying/${postId}/join`,
    getFetchOptions("POST", data)
  );

  await handleResponse<void>(response);
}

/**
 * 공동구매 나가기 (로그인 필수)
 */
export async function leaveGroupBuyingPost(postId: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/group-buying/${postId}/leave`,
    getFetchOptions("POST")
  );

  await handleResponse<void>(response);
}

/**
 * 공동구매 게시글 삭제 (로그인 필수, 작성자만)
 */
export async function deleteGroupBuyingPost(postId: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/group-buying/${postId}`,
    getFetchOptions("DELETE")
  );

  await handleResponse<void>(response);
}

/**
 * 내가 참여한 공동구매 목록 (로그인 필수)
 */
export async function fetchMyGroupBuyingPosts(): Promise<GroupBuyingPost[]> {
  const response = await fetch(
    `${API_BASE_URL}/group-buying/my`,
    getFetchOptions()
  );

  const data = await handleResponse<GroupBuyingListResponse>(response);
  return data.posts || [];
}

/**
 * 공동구매 참여자 목록 조회 (로그인 필수)
 */
export async function fetchGroupBuyingParticipants(
  postId: number
): Promise<GroupBuyingParticipant[]> {
  const response = await fetch(
    `${API_BASE_URL}/group-buying/${postId}/participants`,
    getFetchOptions()
  );

  const data = await handleResponse<
    GroupBuyingParticipant[] | { participants: GroupBuyingParticipant[] }
  >(response);

  // 배열로 직접 반환되는 경우
  if (Array.isArray(data)) {
    return data;
  }

  // { participants: [...] } 형태인 경우
  if (data && typeof data === "object" && "participants" in data) {
    return (data as { participants: GroupBuyingParticipant[] }).participants;
  }

  return [];
}

/**
 * 공동구매 게시글 수정 (로그인 필수, 작성자만)
 */
export async function updateGroupBuyingPost(
  postId: number,
  data: {
    title: string;
    content: string;
    category: string;
    region: string;
    deadline: string;
    imageIds?: number[];
  }
): Promise<GroupBuyingPost> {
  const response = await fetch(
    `${API_BASE_URL}/group-buying/${postId}`,
    getFetchOptions("PUT", data)
  );

  return handleResponse<GroupBuyingPost>(response);
}
