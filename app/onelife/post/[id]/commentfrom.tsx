"use client";

import { useState } from "react";
import { createComment } from "@/app/api/post/commentapi";
import { useAuth } from "@/app/global/auth/useAuth";

export default function CommentForm({
  postId,
  onSuccess,
}: {
  postId: string;
  onSuccess: () => void;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { isLogin } = useAuth();

  async function handleSubmit() {
    if (!isLogin) {
      alert("회원만 작성 가능합니다.");
      return;
    }
    if (!content.trim()) return;

    setLoading(true);
    try {
      await createComment(postId, content);
      setContent("");
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("댓글 작성 실패!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <textarea
        className="w-full min-h-[120px] p-3 border rounded-md"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 입력하세요..."
      />

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-primary text-white rounded-md"
      >
        {loading ? "작성 중..." : "댓글 작성"}
      </button>
    </form>
  );
}
