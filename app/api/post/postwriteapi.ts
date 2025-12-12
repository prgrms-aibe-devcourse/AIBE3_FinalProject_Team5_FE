const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export interface CreatePostDto {
  title: string;
  content: string;
  attachmentPath: string;
  postType: string;
  tags?: string[];
  files?: File[];
}

export const createPost = async (formData: FormData) => {
  const res = await fetch(`${BASE_URL}/posts/onelife`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "게시글 작성에 실패했습니다.");
  }

  return res.json();
};
