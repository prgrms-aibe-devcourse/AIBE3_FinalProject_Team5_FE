import { useState } from "react";
import { Bookmark } from "lucide-react";
import { addBookmark, removeBookmark } from "@/app/api/bookmark/api";

export default function BookmarkButton({
  type,
  postId,
  isBookmarked: initial,
}: {
  type: "POST" | "GROUP_BUY" | "SMALL_GROUP";
  postId: number;
  isBookmarked?: boolean;
}) {
  const [isBookmarked, setIsBookmarked] = useState(initial ?? false);
  const [loading, setLoading] = useState(false);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      if (isBookmarked) {
        await removeBookmark(type, postId);
      } else {
        await addBookmark(type, postId);
      }

      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error(err);
      alert("북마크 처리에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleBookmark}
      className={`flex items-center gap-1 transition ${
        isBookmarked ? "text-yellow-500" : "text-muted-foreground"
      }`}
    >
      <Bookmark
        className="h-8 w-8"
        fill={isBookmarked ? "rgb(234 179 8)" : "none"}
        stroke={isBookmarked ? "rgb(202 138 4)" : "currentColor"}
      />
    </button>
  );
}
