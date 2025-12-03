import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PostResponse } from "../../types/postResponse";
import {
  postLike,
  postDislike,
  getLikeCount,
  getDislikeCount,
} from "@/app/api/post/postapi";
interface ReactionButtonsProps {
  post: PostResponse;
}

export default function ReactionButtons({ post }: ReactionButtonsProps) {
  const [selected, setSelected] = useState<"LIKE" | "DISLIKE" | null>(null);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [dislikeCount, setDislikeCount] = useState<number>(0);

  const postId = post.id;

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const likeRes = await getLikeCount(postId);
        const dislikeRes = await getDislikeCount(postId);

        setLikeCount(likeRes.data);
        setDislikeCount(dislikeRes.data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchCounts();
  }, [postId]);

  const handleSelect = async (type: "LIKE" | "DISLIKE") => {
    setSelected(type);

    try {
      if (type === "LIKE") {
        const res = await postLike(postId);
        console.log("좋아요 결과:", res);

        const likeRes = await getLikeCount(postId);
        const dislikeRes = await getDislikeCount(postId);

        setLikeCount(likeRes.data);
        setDislikeCount(dislikeRes.data);
      } else {
        const res = await postDislike(postId);
        console.log("비추천 결과:", res);

        const likeRes = await getLikeCount(postId);
        const dislikeRes = await getDislikeCount(postId);

        setLikeCount(likeRes.data);
        setDislikeCount(dislikeRes.data);
      }
    } catch (err) {
      console.error("Reaction error:", err);
    }
  };

  return (
    <div className="flex items-center justify-center gap-10 my-10">
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleSelect("LIKE")}
          className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition
            ${
              selected === "LIKE"
                ? "bg-green-500 text-white border-green-500"
                : "bg-transparent text-gray-600"
            }
          `}
        >
          <ThumbsUp className="h-8 w-8" />
        </Button>
        <span className="text-lg font-semibold text-gray-700">{likeCount}</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleSelect("DISLIKE")}
          className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition 
            ${
              selected === "DISLIKE"
                ? "bg-red-500 text-white border-green-500"
                : "bg-transparent text-gray-600"
            }
          `}
        >
          <ThumbsDown className="h-8 w-8" />
        </Button>
        <span className="text-lg font-semibold text-gray-700">
          {dislikeCount}
        </span>
      </div>
    </div>
  );
}
