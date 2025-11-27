const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getOneLifePosts({
  page = 0,
  size = 10,
  type = "ALL",
}: {
  page?: number;
  size?: number;
  type?: string;
}) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    type,
  });

  const res = await fetch(`${BASE_URL}/posts/onelife?${query}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("게시글 목록을 불러오지 못했습니다.");
  return res.json();
}

export async function getPostDetail(id: string) {
  const res = await fetch(`${BASE_URL}/posts/onelife/${id}`, {
    method: "GET",
    credentials: "include",
  });

  const json = await res.json();
  return json.data;
}

export async function deletePost(id: string | number) {
  const res = await fetch(`${BASE_URL}/posts/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("게시글 삭제 실패");
  }

  return true;
}
