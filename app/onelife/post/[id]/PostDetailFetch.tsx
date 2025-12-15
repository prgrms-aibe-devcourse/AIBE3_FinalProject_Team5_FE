"use client";

import { useEffect, useState } from "react";
import {
  getPostDetail,
  deletePost,
  increasePostView,
} from "@/app/api/post/postapi";
import type { PostResponse } from "@/app/onelife/types/postResponse";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  MessageCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import PostComments from "./postcomments";
import PostMenuWrapper from "./postmenuwrapper";
import { useRouter } from "next/navigation";
import ReactionButtons from "./reactionbuttons";
import BookmarkButton from "@/app/bookmark/BookmarkButton";
import { set } from "date-fns";

export default function PostDetailFetch({ id }: { id: string }) {
  const [post, setPost] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewCount, setViewCount] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      if (!viewCount) {
        try {
          await increasePostView(id);
        } catch (e) {
          console.warn("조회수 증가 오류:", e);
        }
        setViewCount(true);
      }

      const data = await getPostDetail(id);
      setPost(data);
      setLoading(false);
    }

    fetchData();
  }, [id, viewCount]);

  const handleEdit = () => {
    if (!post?.id) {
      return;
    }
    router.push(`/onelife/post/${post.id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 이 게시글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deletePost(id);
      router.push("/onelife");
    } catch (err) {
      console.error("삭제 실패", err);
      alert("게시글 삭제에 실패했습니다.");
    }
  };
  console.log("PostDetailFetch 렌더링:", { loading, post });

  if (loading) return <div>로딩 중...</div>;
  if (!post) return <div>게시글을 찾을 수 없습니다.</div>;

  const CATEGORY_LABEL_MAP: Record<string, string> = {
    TIP: "꿀팁",
    INFO: "정보",
    HOT: "인기",
    FREE: "자유",
    ALL: "전체",
  };
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                홈
              </Link>
              <span>/</span>
              <Link href="/onelife" className="hover:text-foreground">
                혼라이프
              </Link>
              <span>/</span>
              <span className="text-foreground">{post.title}</span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">
                  {CATEGORY_LABEL_MAP[post.postType] ?? post.postType}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-start justify-between mb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-balance">
                  {post.title}
                </h1>
                <PostMenuWrapper
                  post={{ id: post.id, author: post.author, admin: post.admin }}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{post.memberNickname[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.memberNickname}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <BookmarkButton
                  postId={post.id}
                  type="POST"
                  isBookmarked={post.bookmarked}
                />
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.commentCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{post.likeCount}</span>
                </div>
              </div>
            </div>

            <Separator className="mb-8" />
            <div className="prose prose-lg max-w-none mb-8 whitespace-pre-line">
              {post.content}
            </div>

            {post.imageUrls && post.imageUrls.length > 0 && (
              <>
                <Separator className="mb-8" />
                {post.imageUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`첨부 이미지 ${idx}`}
                    className="w-full max-h-[400px] object-cover rounded-lg mb-6"
                  />
                ))}
              </>
            )}
            <Separator className="my-12" />

            <ReactionButtons post={post} />

            {post.postType !== "정보" && <PostComments postId={id} />}

            {(() => {
              const currentId = Number.parseInt(id, 10) || 0;
              const prevPost =
                currentId > 1
                  ? {
                      id: currentId - 1,
                      category: "꿀팁",
                      title: "이전 게시글 보기",
                      author: "",
                    }
                  : null;
              const nextPost = {
                id: currentId + 1,
                category: "자유",
                title: "다음 게시글 보기",
                author: "",
              };

              return (
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {prevPost ? (
                    <Link href={`/onelife/post/${prevPost.id}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow group">
                        <CardContent className="p-6 flex flex-col justify-between">
                          <div>
                            <Badge variant="secondary" className="mb-3">
                              {prevPost.category}
                            </Badge>
                            <h4 className="font-semibold mb-2 text-lg line-clamp-2 text-balance">
                              {prevPost.title}
                            </h4>
                            {prevPost.author && (
                              <p className="text-sm text-muted-foreground">
                                {prevPost.author}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-primary flex items-center gap-2 mt-4">
                            <ChevronLeft className="h-4 w-4" />
                            <span>이전 게시글</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ) : (
                    <div />
                  )}

                  {nextPost && (
                    <div className="flex justify-end">
                      <Link href={`/onelife/post/${nextPost.id}`}>
                        <Card className="h-full hover:shadow-lg transition-shadow group">
                          <CardContent className="p-6 flex flex-col justify-between text-right">
                            <div>
                              <Badge variant="secondary" className="mb-3">
                                {nextPost.category}
                              </Badge>
                              <h4 className="font-semibold mb-2 text-lg line-clamp-2 text-balance">
                                {nextPost.title}
                              </h4>
                              {nextPost.author && (
                                <p className="text-sm text-muted-foreground">
                                  {nextPost.author}
                                </p>
                              )}
                            </div>
                            <div className="text-sm text-primary flex items-center gap-2 mt-4 justify-end">
                              <span>다음 게시글</span>
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
