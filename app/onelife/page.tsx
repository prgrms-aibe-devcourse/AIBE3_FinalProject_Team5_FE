"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import BoardLayout from "@/components/board-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import PaginatedPosts from "@/components/paginated-posts";

export default function OneLifePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;
    const raw = searchParams.get("category");
    if (!raw) return;
    const map: Record<string, string> = {
      tips: "꿀팁",
      recipe: "혼밥",
      policy: "정보",
      info: "정보",
      all: "all",
    };
    const value = map[raw] || raw;
    setSelectedCategory(value);
  }, [searchParams]);

  const categories = [
    { id: "all", label: "전체", value: "all", count: 1247 },
    { id: "general", label: "자유", value: "자유", count: 234 },
    { id: "tips", label: "꿀팁", value: "꿀팁", count: 456 },
    { id: "policy", label: "정보", value: "정보", count: 234 },
  ];

  const posts = [
    {
      id: 1,
      category: "꿀팁",
      categoryColor: "orange",
      time: "2시간 전",
      title: "원룸에서 효율적으로 수납하는 10가지 방법",
      excerpt:
        "좁은 공간을 최대한 활용할 수 있는 수납 아이디어를 소개합니다. 벽면 활용부터 침대 밑 공간까지...",
      tags: ["#수납", "#정리", "#효율", "#인테리어"],
      author: "정리왕",
      avatar: "/placeholder.svg?height=40&width=40",
      views: 1247,
      likes: 89,
      comments: 23,
      shares: 45,
      image: "/organized-room-interior.jpg",
    },
    {
      id: 2,
      category: "혼밥",
      categoryColor: "orange",
      time: "4시간 전",
      title: "5분만에 완성하는 간단 혼밥 레시피 모음",
      excerpt:
        "바쁜 일상 속에서도 건강하고 맛있는 한 끼를 해결할 수 있는 초간단 레시피를 모았습니다...",
      tags: ["#요리", "#간편식", "#혼밥시간", "#건강"],
      author: "요리초보",
      avatar: "/placeholder.svg?height=40&width=40",
      views: 892,
      likes: 67,
      comments: 15,
      shares: 32,
      image: "/simple-pasta-dish.jpg",
    },
    {
      id: 3,
      category: "정보",
      categoryColor: "orange",
      time: "6시간 전",
      title: "2024년 청년 주거지원 정책 총정리",
      excerpt:
        "올해 새롭게 시행되는 청년 주거지원 정책들을 한눈에 정리했습니다. 신청 방법과 자격 요건까지...",
      tags: ["#정책", "#주거지원", "#청년", "#혜택"],
      author: "정책알리미",
      avatar: "/placeholder.svg?height=40&width=40",
      views: 2156,
      likes: 134,
      comments: 41,
      shares: 89,
      image: "/modern-apartment-building.png",
    },
    {
      id: 4,
      category: "꿀팁",
      categoryColor: "orange",
      time: "8시간 전",
      title: "혼자 살 때 꼭 알아야 할 생활비 절약법",
      excerpt:
        "매월 고정비부터 변동비까지, 1인 가구 실생활 꿀 노하우를 공유합니다. 연 300만원 절약 가능...",
      tags: ["#절약", "#가계부", "#생활비", "#재테크"],
      author: "절약마스터",
      avatar: "/placeholder.svg?height=40&width=40",
      views: 1543,
      likes: 98,
      comments: 32,
      shares: 67,
      image: "/saving-money-illustration.png",
    },
    {
      id: 5,
      category: "혼밥",
      categoryColor: "orange",
      time: "10시간 전",
      title: "집에서 만드는 카페 스타일 브런치",
      excerpt:
        "주말 아침, 카페 못지않은 예쁘고 맛있는 브런치를 집에서 만들어보세요. 플레이팅 팁까지...",
      tags: ["#브런치", "#홈카페", "#카페", "#주말"],
      author: "브런치러버",
      avatar: "/placeholder.svg?height=40&width=40",
      views: 756,
      likes: 45,
      comments: 12,
      shares: 28,
      image: "/cafe-style-brunch.jpg",
    },
    {
      id: 6,
      category: "꿀팁",
      categoryColor: "orange",
      time: "12시간 전",
      title: "혼자 사는 집에 반려식물 들이기",
      excerpt:
        "초보자도 쉽게 키울 수 있는 반려식물 추천과 관리법을 소개합니다. 공기정화 효과까지...",
      tags: ["#반려식물", "#인테리어", "#공기정화", "#취미"],
      author: "식물집사",
      avatar: "/placeholder.svg?height=40&width=40",
      views: 634,
      likes: 38,
      comments: 9,
      shares: 22,
      image: "/indoor-plants.png",
    },
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
                        <div className="flex items-center justify-between">
                          <span>{category.label}</span>
                          <span className="text-sm text-muted-foreground">
                            {category.count}
                          </span>
                        </div>
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

              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-muted-foreground">
                  총 6개의 게시글
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
            </div>
          </div>
        </div>
      </section>
    </BoardLayout>
  );
}
