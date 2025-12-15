"use client";

import { useEffect, useState } from "react";
import {
  getComments,
  deleteComment,
  updateComment,
} from "@/app/api/post/commentapi";
import { useAuth } from "@/app/global/auth/useAuth";

export default function CommentList({
  postId,
  refreshKey,
}: {
  postId: string;
  refreshKey: number;
}) {
  const [comments, setComments] = useState([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const { loginMember, isLogin, isAdmin } = useAuth();

  useEffect(() => {
    async function fetchComments() {
      const data = await getComments(postId);
      setComments(data || []);
    }

    fetchComments();
  }, [postId, refreshKey]);

  async function handleDelete(commentId: number) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    await deleteComment(postId, commentId);
    window.location.reload();
  }

  function startEdit(comment: any) {
    setEditId(comment.id);
    setEditContent(comment.content);
  }

  function cancelEdit() {
    setEditId(null);
    setEditContent("");
  }

  async function handleUpdate(commentId: number) {
    if (!editContent.trim()) return alert("내용을 입력하세요!");

    await updateComment(postId, commentId, editContent);

    setEditId(null);
    setEditContent("");
    window.location.reload();
  }

  if (comments.length === 0) return <p>댓글이 없습니다.</p>;

  return (
    <div className="space-y-4 mt-8">
      {comments.map((c: any) => {
        const canModify =
          isLogin && (loginMember?.id === c.memberId || isAdmin);

        return (
          <div key={c.id} className="border rounded-lg p-4">
            <p className="font-medium">{c.memberNickname}</p>

            {editId === c.id ? (
              <>
                <textarea
                  className="w-full mt-2 p-2 border rounded-md"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleUpdate(c.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md"
                  >
                    수정 완료
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1 bg-gray-300 rounded-md"
                  >
                    취소
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm mt-1">{c.content}</p>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              {new Date(c.createdAt).toLocaleString()}
            </p>

            {canModify && (
              <div className="flex gap-3 mt-3 text-sm">
                <button
                  onClick={() => startEdit(c)}
                  className="text-blue-600 hover:underline"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-red-600 hover:underline"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
