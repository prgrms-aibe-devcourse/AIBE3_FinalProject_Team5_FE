"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageCircle, ThumbsUp } from "lucide-react";
import { getOneLifePosts } from "@/app/api/post/postapi";
import type { PostResponse } from "@/app/onelife/types/postResponse";

// 카테고리 매핑
const CATEGORY_LABEL_MAP: Record<string, string> = {
  TIP: "꿀팁",
  INFO: "정보",
  HOT: "인기",
  FREE: "자유",
  ALL: "전체",
};

export function LatestPostsSection() {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 최신 게시글 6개 가져오기
  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        setError(null);

        const response = await getOneLifePosts({
          page: 0,
          size: 6,
          type: "ALL",
        });

        setPosts(response.data.content);
      } catch (err) {
        console.error("게시글 로딩 실패:", err);
        setError("게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  // 애니메이션 효과
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || loading) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      (window as any).matchMedia &&
      (window as any).matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      Array.from(grid.querySelectorAll("[data-anim-card]")).forEach((el) => {
        el.classList.remove("opacity-0", "translate-y-6");
        el.classList.add("opacity-100", "translate-y-0");
      });
      return;
    }

    const timeouts: number[] = [];
    const rootEl = document.querySelector("main") || null;

    const reveal = () => {
      const cards = Array.from(
        grid.querySelectorAll("[data-anim-card]")
      ) as HTMLElement[];
      cards.forEach((card, i) => {
        const t = window.setTimeout(() => {
          card.classList.remove("opacity-0", "translate-y-6");
          card.classList.add("opacity-100", "translate-y-0");
        }, i * 120);
        timeouts.push(t);
      });
    };

    const reset = () => {
      timeouts.forEach((id) => clearTimeout(id));
      timeouts.length = 0;
      Array.from(grid.querySelectorAll("[data-anim-card]")).forEach((el) => {
        el.classList.add("opacity-0", "translate-y-6");
        el.classList.remove("opacity-100", "translate-y-0");
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal();
          else reset();
        });
      },
      { root: rootEl, threshold: 0.25 }
    );

    observer.observe(grid);
    return () => {
      observer.disconnect();
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [loading]);

  return (
    <section className="py-20 md:py-24">
      <div className="w-full max-w-[1200px] mx-auto px-6">
        <div className="flex items-start justify-between mb-12">
          <div className="sticky" style={{ top: "calc(80px + 1rem)" }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              혼라이프 게시글 리스트
            </h2>
            <p className="text-lg text-muted-foreground text-pretty font-semibold">
              혼라이프 주요 게시판으로 빠르게 이동하세요
            </p>
          </div>
          <Button
            variant="outline"
            asChild
            className="hidden md:flex bg-primary text-black bg-primary"
          >
            <Link href="/onelife">더보기</Link>
          </Button>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">
              게시글을 불러오는 중...
            </p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="text-center py-20">
            <p className="text-lg text-red-500">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              다시 시도
            </Button>
          </div>
        )}

        {/* 게시글 목록 */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">
              아직 게시글이 없습니다.
            </p>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div
            ref={gridRef}
            className="grid gap-8 md:grid-cols-3 items-stretch"
          >
            {posts.map((post) => (
              <Link href={`/onelife/post/${post.id}`} key={post.id}>
                <Card
                  data-anim-card
                  className="h-full transition-all duration-700 ease-out opacity-0 translate-y-6 hover:shadow-lg hover:scale-105 flex items-center justify-center p-12 min-h-[180px] md:min-h-[260px]"
                >
                  <CardContent>
                    <CardHeader>
                      <Badge>
                        {CATEGORY_LABEL_MAP[post.postType] || post.postType}
                      </Badge>
                      <h3 className="font-semibold text-xl mt-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        by {post.memberNickname}
                      </p>
                    </CardHeader>
                    <div className="flex justify-center mt-4">
                      <div className="flex items-center mr-4">
                        <Eye className="mr-2 h-4 w-4" />
                        <span className="text-sm">
                          {post.viewCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center mr-4">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        <span className="text-sm">
                          {post.commentCount || 0}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        <span className="text-sm">{post.likeCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
