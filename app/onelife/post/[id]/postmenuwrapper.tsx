"use client";

import PostMenu from "./postmenu";

interface PostMenuWrapperProps {
  post: {
    id: number;
    author: boolean;
    admin: boolean;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

export default function PostMenuWrapper({
  post,
  onEdit,
  onDelete,
  onReport,
}: PostMenuWrapperProps) {
  return (
    <PostMenu
      post={post}
      onEdit={onEdit}
      onDelete={onDelete}
      onReport={onReport}
    />
  );
}
