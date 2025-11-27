import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  MessageCircle,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { getPostDetail } from "@/app/api/post/postapi";
import PostComments from "./postcomments";
import PostMenu from "./postmenu";

export default async function PostDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  console.log("📌 [Server] Extracted id:", id);
  const post = await getPostDetail(id);
  console.log("📌 [Server] getPostDetail result:", post);
  const isAuthor =
    post.currentMemberId && post.currentMemberId === post.memberId;
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        게시글을 찾을 수 없습니다.
      </div>
    );
  }

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
                <Badge variant="secondary">{post.postType}</Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-start justify-between mb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-balance">
                  {post.title}
                </h1>

                <PostMenu postId={id} isAuthor={isAuthor} />
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
                <Button variant="outline" size="sm">
                  팔로우
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comments}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{post.likes}</span>
                </div>
              </div>
            </div>

            <Separator className="mb-8" />
            <div className="prose prose-lg max-w-none mb-8 whitespace-pre-line">
              {post.content}
            </div>

            {post.attachmentPath && (
              <>
                <Separator className="mb-8" />
                <img
                  src={post.attachmentPath}
                  alt="첨부 이미지"
                  className="w-full max-h-[400px] object-cover rounded-lg"
                />
              </>
            )}

            <Separator className="my-12" />

            <div className="flex items-center justify-center gap-4 mb-12">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 bg-transparent"
              >
                <Heart className="h-5 w-5" />
                좋아요 {post.likes}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 bg-transparent"
              >
                <Share2 className="h-5 w-5" />
                공유하기
              </Button>
            </div>

            {post.category !== "정보" && <PostComments postId={id} />}

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
