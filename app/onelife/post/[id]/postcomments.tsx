"use client";

import { useState } from "react";
import CommentForm from "./commentfrom";
import CommentList from "./commentlist";

export default function PostComments({ postId }: { postId: string }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mt-10">
      <CommentForm
        postId={postId}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />

      <div className="mt-6">
        <CommentList postId={postId} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
