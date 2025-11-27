export async function getComments(postId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/comment/${postId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  const json = await res.json();
  return json.data;
}

export async function createComment(postId: string, content: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/comment/${postId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postId, content }),
    }
  );
  if (!res.ok) {
    throw new Error("댓글 작성에 실패했습니다.");
  }

  const json = await res.json();
  return json.data;
}

export async function deleteComment(postId: string, commentId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/comment/${postId}/${commentId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  return res.json();
}

export async function updateComment(
  postId: string,
  commentId: number,
  content: string
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/comment/${postId}/${commentId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content }),
    }
  );

  if (!res.ok) {
    throw new Error("댓글 수정 실패");
  }

  const json = await res.json();
  return json.data;
}
