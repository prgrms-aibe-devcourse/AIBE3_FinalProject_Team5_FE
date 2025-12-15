const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getOneLifePosts({
  page = 0,
  size = 10,
  type = "ALL",
  keyword = "",
}: {
  page?: number;
  size?: number;
  type?: string;
  keyword?: string;
}) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    type,
  });
  if (keyword) query.append("keyword", keyword);
  const res = await fetch(`${BASE_URL}/posts/onelife?${query}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("게시글 목록을 불러오지 못했습니다.");
  return res.json();
}

export async function getHotPosts({
  page = 0,
  size = 10,
  keyword = "",
}: {
  page?: number;
  size?: number;
  keyword?: string;
}) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (keyword) query.append("keyword", keyword);
  const res = await fetch(`${BASE_URL}/posts/onelife/hot?${query}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("인기 게시글 목록을 불러오지 못했습니다.");
  }

  return res.json();
}

export async function getPostDetail(id: string) {
  const res = await fetch(`${BASE_URL}/posts/onelife/${id}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("API 호출 실패:", res.status, text);
    throw new Error(`API 호출 실패: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

export async function deletePost(id: string | number) {
  const res = await fetch(`${BASE_URL}/posts/onelife/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("게시글 삭제 실패");
  }

  return true;
}

export async function updatePost(id: string, formData: FormData) {
  const res = await fetch(`${BASE_URL}/posts/onelife/${id}`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("게시글 수정 실패:", res.status, text);
    throw new Error(`게시글 수정 실패: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

export async function postLike(postId: number) {
  const res = await fetch(`${BASE_URL}/posts/${postId}/likes/like`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
    alert("좋아요 처리에 실패했습니다.");
  }

  return res.json();
}

export async function postDislike(postId: number) {
  const res = await fetch(`${BASE_URL}/posts/${postId}/likes/dislike`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}

export async function getLikeCount(postId: number) {
  const res = await fetch(`${BASE_URL}/posts/${postId}/likes/likes`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json(); // count 포함
}

export async function getDislikeCount(postId: number) {
  const res = await fetch(`${BASE_URL}/posts/${postId}/likes/dislikes`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}

export async function increasePostView(id: string | number) {
  const res = await fetch(`${BASE_URL}/posts/onelife/${id}/view`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    console.warn("조회수 증가 실패");
  }

  return res.json().catch(() => null);
}
