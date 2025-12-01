import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PostResponse } from "../../types/postResponse";

interface ReactionButtonsProps {
  post: PostResponse;
}

export default function ReactionButtons({ post }: ReactionButtonsProps) {
  const [selected, setSelected] = useState<"LIKE" | "DISLIKE" | null>(null);

  const handleSelect = (type: "LIKE" | "DISLIKE") => {
    setSelected(type);
    // TODO: API 연동 (추천/비추천)
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
        <span className="text-lg font-semibold text-gray-700">
          {post.likeCount ?? 0}
        </span>
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
          {post.dislikecount ?? 0}
        </span>
      </div>
    </div>
  );
}
