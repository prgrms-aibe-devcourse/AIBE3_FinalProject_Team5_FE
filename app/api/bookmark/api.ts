const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export async function addBookmark(type: string, targetId: number) {
  const res = await fetch(
    `${BASE_URL}/bookmarks/${type.toUpperCase()}/${targetId}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error("북마크 추가 실패");
  }

  return res.json();
}

export async function removeBookmark(type: string, targetId: number) {
  const res = await fetch(
    `${BASE_URL}/bookmarks/${type.toUpperCase()}/${targetId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!res.ok) {
    throw new Error("북마크 삭제 실패");
  }

  return true;
}
