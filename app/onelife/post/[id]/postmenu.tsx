"use client";

import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Props {
  post: {
    id: number;
    author: boolean;
    admin: boolean;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

export default function postMenu({ post, onEdit, onDelete, onReport }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-32">
        {/* 작성자 - 수정 가능 */}
        {post.author && (
          <DropdownMenuItem onClick={onEdit}>수정</DropdownMenuItem>
        )}

        {/* 작성자 or 관리자 - 삭제 가능 */}
        {(post.author || post.admin) && (
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-500 focus:text-red-500"
          >
            삭제
          </DropdownMenuItem>
        )}

        {/* 일반 회원 신고*/}
        {!post.author && !post.admin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onReport}>신고하기</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
