"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BoardLayout from "@/components/board-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import PaginatedPosts from "@/components/paginated-posts";
import { getOneLifePosts, getHotPosts } from "../api/post/postapi";
import { useAuth } from "@/app/global/auth/useAuth";
import type { PostResponse } from "../onelife/types/postResponse";

export default function OneLifePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);

  const { isAdmin, isLogin } = useAuth();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!searchParams) return;
    const raw = searchParams.get("PostType");
    if (!raw) return;

    const map: Record<string, string> = {
      tip: "TIP",
      info: "INFO",
      hot: "HOT",
      free: "FREE",
      all: "ALL",
    };

    setSelectedCategory(map[raw] || raw);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchKeyword(keyword);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);

        const data =
          selectedCategory === "hot"
            ? await getHotPosts({
                page: page - 1,
                size: 5,
                keyword: searchKeyword,
              })
            : await getOneLifePosts({
                page: page - 1,
                size: 5,
                type:
                  selectedCategory === "all"
                    ? "ALL"
                    : selectedCategory.toUpperCase(),
                keyword: searchKeyword,
              });

        setPosts(data.data.content);
        setTotalPages(data.data.totalPages);
        setTotalCount(data.data.totalElements);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [selectedCategory, searchKeyword, page]);

  function goto(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);

    const el = document.querySelector("#onelife-posts");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const categories = [
    { id: "All", label: "전체", value: "all" },
    { id: "FREE", label: "자유", value: "free" },
    { id: "HOT", label: "인기", value: "hot" },
    { id: "TIP", label: "꿀팁", value: "tip" },
    { id: "INFO", label: "정보", value: "info" },
  ];

  return (
    <BoardLayout
      title="혼라이프"
      subtitle="혼자 사는 일상의 꿀팁과 정보를 나누는 공간"
    >
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 flex-shrink-0">
              <Card className="sticky top-20">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">카테고리</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedCategory === category.value
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span>{category.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </aside>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="게시글이나 내용으로 검색..."
                    className="pl-10"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    if (!isLogin) {
                      alert("회원만 작성 가능합니다.");
                      return;
                    }
                    router.push("/onelife/write");
                  }}
                >
                  + 글쓰기
                </Button>
              </div>
              {selectedCategory === "info" && !isAdmin && (
                <div className="mb-6 p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600 font-semibold">
                    관리자만 작성 가능합니다.
                  </p>
                </div>
              )}
              {loading ? (
                <p className="text-center py-10">불러오는 중... </p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm text-muted-foreground">
                      총 {totalCount}개의 게시글
                    </span>
                  </div>
                  <PaginatedPosts
                    posts={posts}
                    selectedCategory={selectedCategory}
                  />

                  {/* 페이지네이션 */}
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => goto(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft />
                    </Button>

                    {Array.from({ length: totalPages }).map((_, i) => (
                      <Button
                        key={i}
                        size="icon"
                        variant={page === i + 1 ? "default" : "outline"}
                        onClick={() => goto(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => goto(page + 1)}
                      disabled={page === totalPages}
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </BoardLayout>
  );
}
