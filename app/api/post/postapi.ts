const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getOneLifePosts({
  page = 0,
  size = 10,
  type = "FREE",
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

  const res = await fetch(`${BASE_URL}/api/v1/posts/onelife?${query}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("게시글 목록을 불러오지 못했습니다.");
  return res.json();
}
