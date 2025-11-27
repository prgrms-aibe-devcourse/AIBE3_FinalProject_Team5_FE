"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PostMenu({
  postId,
  isAuthor,
}: {
  postId: string;
  isAuthor: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!isAuthor) return null;

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("삭제 실패");
      }

      alert("삭제 완료되었습니다.");
      router.push("/onelife");
    } catch (err) {
      console.error(err);
      alert("게시글 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}>
        <MoreVertical className="w-6 h-6" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-28 bg-white shadow-lg rounded-md border z-50">
          <button
            onClick={() => router.push(`/onelife/post/${postId}/edit`)}
            className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="block w-full text-left px-3 py-2 hover:bg-red-100 text-sm text-red-500"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
