export interface PostResponse {
  id: number;
  title: string;
  content: string;
  attachmentPath?: string;
  memberNickname: string;
  memberId: number;
  postType: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  dislikecount: number;
  createdAt: string;
  updatedAt: string;
  isHot: boolean;
  author: boolean;
  admin: boolean;
  comments?: number;
  likes?: number;
}

export interface PostRequestDto {
  title: string;
  content: string;
  attachmentPath?: string | null;
  postType: string;
  tags: string[];
}
