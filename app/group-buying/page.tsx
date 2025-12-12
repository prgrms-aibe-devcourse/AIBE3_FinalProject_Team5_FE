"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BoardLayout from "@/components/board-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GROUP_BUYING_CATEGORIES } from "@/types/groupBuying";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  MessageCircle,
  Users,
  MapPin,
  Clock,
  Search,
  PenSquare,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/global/auth/useAuth";
import { fetchGroupBuyingPosts } from "@/lib/api/groupBuyingApi";
import { GroupBuyingPost, GroupBuyingStatus } from "@/types/groupBuying";

export default function GroupBuyingPage() {
  const router = useRouter();
  const { isLogin } = useAuth();

  const [posts, setPosts] = useState<GroupBuyingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchRegion, setSearchRegion] = useState("");
  const [filterStatus, setFilterStatus] = useState<GroupBuyingStatus | "all">(
    "all"
  );
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "전체", count: posts.length },
    {
      id: "food",
      label: "식품",
      count: posts.filter((p) => p.category === "food").length,
    },
    {
      id: "living",
      label: "생활용품",
      count: posts.filter((p) => p.category === "living").length,
    },
    {
      id: "electronics",
      label: "전자제품",
      count: posts.filter((p) => p.category === "electronics").length,
    },
    {
      id: "fashion",
      label: "패션/의류",
      count: posts.filter((p) => p.category === "fashion").length,
    },
    {
      id: "beauty",
      label: "뷰티/화장품",
      count: posts.filter((p) => p.category === "beauty").length,
    },
    {
      id: "etc",
      label: "기타",
      count: posts.filter((p) => p.category === "etc" || !p.category).length,
    },
  ];

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [filterStatus]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const region = searchRegion || undefined;
      const status =
        filterStatus === "all"
          ? undefined
          : (filterStatus as GroupBuyingStatus);
      const data = await fetchGroupBuyingPosts(region, status);
      setPosts(data);
    } catch (error) {
      console.error("게시글 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadPosts();
  };

  const handleWriteClick = () => {
    if (!isLogin) {
      alert("로그인이 필요한 기능입니다.");
      router.push("/login");
      return;
    }
    router.push("/group-buying/write");
  };

  const getStatusBadge = (status: GroupBuyingStatus) => {
    switch (status) {
      case GroupBuyingStatus.RECRUITING:
        return {
          label: "모집중",
          variant: "default" as const,
          className: "bg-green-500",
        };
      case GroupBuyingStatus.COMPLETED:
        return { label: "완료", variant: "outline" as const, className: "" };
      case GroupBuyingStatus.CANCELLED:
        return { label: "취소", variant: "outline" as const, className: "" };
      default:
        return { label: status, variant: "outline" as const, className: "" };
    }
  };

  // 카테고리 색상 - post.category 필드 우선 사용
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "food":
        return "bg-orange-100 text-orange-700";
      case "living":
        return "bg-blue-100 text-blue-700";
      case "electronics":
        return "bg-purple-100 text-purple-700";
      case "fashion":
        return "bg-pink-100 text-pink-700";
      case "beauty":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // 카테고리 라벨 - post.category 필드 우선 사용
  const getCategoryLabel = (category?: string) => {
    if (
      category &&
      GROUP_BUYING_CATEGORIES[category as keyof typeof GROUP_BUYING_CATEGORIES]
    ) {
      return GROUP_BUYING_CATEGORIES[
        category as keyof typeof GROUP_BUYING_CATEGORIES
      ];
    }
    return "기타";
  };

  const getDeadlineText = (deadline: string, isExpired: boolean) => {
    if (isExpired) return "마감";
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return "마감";
    if (days === 0) return "오늘 마감";
    return `${days}일 남음`;
  };

  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diff = now.getTime() - created.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  // 필터링 - post.category 필드 사용
  const filteredPosts = posts.filter((post) => {
    if (selectedCategory !== "all") {
      // category 필드가 있으면 그걸 사용, 없으면 "기타"로 처리
      const postCategory = post.category || "etc";
      if (postCategory !== selectedCategory) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <BoardLayout
        hero={
          <section className="bg-linear-to-r from-orange-50 to-amber-50 py-12 border-b">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                공동구매 모집
              </h1>
              <p className="text-muted-foreground">
                함께 사면 더 저렴하고 재미있는 쇼핑
              </p>
            </div>
          </section>
        }
      >
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </BoardLayout>
    );
  }

  return (
    <BoardLayout
      hero={
        <section className="bg-linear-to-r from-orange-50 to-amber-50 py-12 border-b">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              공동구매 모집
            </h1>
            <p className="text-muted-foreground">
              함께 사면 더 저렴하고 재미있는 쇼핑
            </p>
          </div>
        </section>
      }
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">카테고리</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        category.id === selectedCategory
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

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="지역으로 검색 (예: 강남구)..."
                  className="pl-10"
                  value={searchRegion}
                  onChange={(e) => setSearchRegion(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <Button
                className="bg-primary text-primary-foreground w-full sm:w-auto"
                onClick={handleWriteClick}
              >
                <PenSquare className="h-4 w-4 mr-2" /> 글쓰기
              </Button>
            </div>

            {/* Sort and Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {filteredPosts.length}개
                </span>
                의 공동구매
              </p>
              <Select
                value={filterStatus}
                onValueChange={(value) =>
                  setFilterStatus(value as GroupBuyingStatus | "all")
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="RECRUITING">모집중</SelectItem>
                  <SelectItem value="COMPLETED">완료</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group Buying List */}
            {filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">
                    공동구매 게시글이 없습니다.
                  </p>
                  <Button onClick={handleWriteClick}>첫 게시글 작성하기</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((item) => {
                  const statusBadge = getStatusBadge(item.status);
                  // post.category 필드 사용
                  const categoryColor = getCategoryColor(item.category);
                  const categoryLabel = getCategoryLabel(item.category);

                  return (
                    <Link key={item.id} href={`/group-buying/${item.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge className={`${categoryColor} border-0`}>
                                  {categoryLabel}
                                </Badge>
                                <Badge
                                  variant={statusBadge.variant}
                                  className={statusBadge.className}
                                >
                                  {statusBadge.label}
                                </Badge>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{item.region}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {getDeadlineText(
                                      item.deadline,
                                      item.isExpired
                                    )}
                                  </span>
                                </div>
                              </div>
                              <h3 className="text-xl font-semibold mb-2 text-balance">
                                {item.title}
                              </h3>
                              <p className="text-muted-foreground mb-3 line-clamp-2">
                                {item.content}
                              </p>
                              <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-sm font-medium text-primary">
                                        {item.creatorId}
                                      </span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {getTimeAgo(item.createdAt)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-sm">
                                    <Users className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-primary">
                                      {item.currentParticipants}/
                                      {item.targetParticipants}명
                                    </span>
                                    <span className="text-muted-foreground">
                                      참여중
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-4 w-4" />
                                    <span>0</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageCircle className="h-4 w-4" />
                                    <span>0</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="w-32 h-32 shrink-0 flex sm:block bg-muted rounded-lg flex items-center justify-center">
                              <Users className="h-12 w-12 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </BoardLayout>
  );
}
