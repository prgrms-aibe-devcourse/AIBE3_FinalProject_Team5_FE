"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import BoardLayout from "@/components/board-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import PaginatedPosts from "@/components/paginated-posts";
import { getOneLifePosts } from "../api/post/postapi";

export default function OneLifePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [posts, setPosts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();

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
  }, [searchParams]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);

        const data = await getOneLifePosts({
          page: 0,
          size: 10,
          type:
            selectedCategory === "all" ? "ALL" : selectedCategory.toUpperCase(),
        });

        setPosts(data.data.content);
        setTotalCount(data.data.totalElements);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [selectedCategory]);

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
                  />
                </div>
                <Button className="bg-primary hover:bg-primary/90" asChild>
                  <a href="/onelife/write">+ 글쓰기</a>
                </Button>
              </div>
              {loading ? (
                <p className="text-center py-10">불러오는 중... </p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm text-muted-foreground">
                      총 {totalCount}개의 게시글
                    </span>
                    <select className="text-sm border rounded-md px-3 py-1.5 bg-background">
                      <option>최신순</option>
                      <option>인기순</option>
                      <option>댓글순</option>
                    </select>
                  </div>

                  <PaginatedPosts
                    posts={posts}
                    selectedCategory={selectedCategory}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </BoardLayout>
  );
}
