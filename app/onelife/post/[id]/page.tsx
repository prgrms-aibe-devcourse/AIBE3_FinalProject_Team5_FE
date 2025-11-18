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

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const post = {
    id: params.id,
    category: "꿀팁",
    time: "2시간 전",
    title: "원룸에서 효율적으로 수납하는 10가지 방법",
    author: "정리왕",
    views: "1,247",
    comments: "89",
    likes: "23",
    images: [
      "/organized-storage-shelves.jpg",
      "/under-bed-storage-boxes.jpg",
      "/wall-mounted-shelves-in-small-room.jpg",
    ],
    content: `
안녕하세요! 원룸에서 3년째 살고 있는 정리왕입니다.

좁은 공간에서도 효율적으로 수납할 수 있는 방법들을 공유해드리려고 합니다.

## 1. 벽면 활용하기

벽면에 선반을 설치하면 바닥 공간을 차지하지 않으면서도 수납 공간을 크게 늘릴 수 있습니다.
특히 침대 위나 책상 위 공간을 활용하면 좋습니다.

## 2. 침대 밑 공간 활용

침대 밑은 가장 큰 수납 공간입니다. 수납 박스를 활용하여 계절 옷이나 이불을 보관하세요.

## 3. 문 뒤 공간 활용

문 뒤에 후크를 달아 가방이나 모자를 걸어두면 공간을 효율적으로 사용할 수 있습니다.

## 4. 수직 공간 활용

높이를 활용한 수납장을 사용하면 바닥 면적은 적게 차지하면서도 많은 물건을 보관할 수 있습니다.

## 5. 다용도 가구 사용

침대 겸 소파, 수납 겸 의자 등 다용도 가구를 활용하면 공간을 절약할 수 있습니다.

## 6. 투명 수납함 사용

투명 수납함을 사용하면 어디에 무엇이 있는지 한눈에 파악할 수 있어 편리합니다.

## 7. 라벨링하기

모든 수납함에 라벨을 붙여두면 정리 정돈이 훨씬 쉬워집니다.

## 8. 계절별 옷 분리

현재 계절에 입지 않는 옷은 따로 보관하여 옷장 공간을 효율적으로 사용하세요.

## 9. 정기적인 정리

3개월에 한 번씩 사용하지 않는 물건을 정리하면 공간을 깔끔하게 유지할 수 있습니다.

## 10. 미니멀 라이프

가장 중요한 것은 필요한 물건만 소유하는 것입니다. 정기적으로 물건을 정리하세요.

이상 원룸 수납 팁이었습니다. 도움이 되셨으면 좋겠습니다!
    `,
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
              <span className="text-foreground">게시글</span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{post.category}</Badge>
                <span className="text-sm text-muted-foreground">
                  {post.time}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
                {post.title}
              </h1>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{post.author[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.author}</p>
                    <p className="text-sm text-muted-foreground">{post.time}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  팔로우
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.views}</span>
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

            <div className="prose prose-lg max-w-none mb-8">
              <div className="whitespace-pre-line leading-relaxed">
                {post.content}
              </div>
            </div>

            <Separator className="mb-8" />

            {post.images && post.images.length > 0 && (
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {post.images.map((image, index) => (
                    <img
                      key={index}
                      src={image || "/placeholder.svg"}
                      alt={`게시글 이미지 ${index + 1}`}
                      className="w-full h-auto rounded-lg border object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

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

            {post.category !== "정보" && (
              <Card className="mb-12">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-6">
                    댓글 {post.comments}
                  </h3>
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarFallback>나</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <textarea
                          className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="댓글을 입력하세요..."
                        />
                        <div className="flex justify-end mt-2">
                          <Button>댓글 작성</Button>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <div className="flex gap-3">
                        <Avatar>
                          <AvatarFallback>수</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">수납고수</span>
                            <span className="text-sm text-muted-foreground">
                              1시간 전
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed mb-2">
                            정말 유용한 정보네요! 특히 벽면 활용 팁이 도움이
                            많이 됐어요. 감사합니다!
                          </p>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Heart className="h-3 w-3" />
                            좋아요 5
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Avatar>
                          <AvatarFallback>원</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">원룸러</span>
                            <span className="text-sm text-muted-foreground">
                              30분 전
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed mb-2">
                            침대 밑 수납 박스 추천해주실 수 있나요?
                          </p>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Heart className="h-3 w-3" />
                            좋아요 2
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(() => {
              const currentId = Number.parseInt(params.id, 10) || 0;
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
                category: "혼밥",
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
