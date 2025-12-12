export interface PostResponse {
  id: number;
  title: string;
  content: string;
  imageUrls?: string[];
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
  bookmarked?: boolean;
}

export interface PostRequestDto {
  title: string;
  content: string;
  postType: string;
  tags: string[];
  files?: File[];
  remainFileUrls?: string[];
}
