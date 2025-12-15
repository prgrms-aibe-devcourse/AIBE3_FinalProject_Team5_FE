"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BoardLayout from "@/components/board-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GROUP_BUYING_CATEGORIES,
  GroupBuyingPost,
  GroupBuyingStatus,
} from "@/types/groupBuying";
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
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/global/auth/useAuth";
import { fetchGroupBuyingPosts } from "@/lib/api/groupBuyingApi";

export default function GroupBuyingPage() {
  const router = useRouter();
  const { isLogin } = useAuth();

  const [posts, setPosts] = useState<GroupBuyingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchRegion, setSearchRegion] = useState("");
  const [debouncedRegion, setDebouncedRegion] = useState("");
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
    const timer = setTimeout(() => {
      setDebouncedRegion(searchRegion);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchRegion]);

  useEffect(() => {
    loadPosts();
  }, [debouncedRegion, filterStatus]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);

      const region = debouncedRegion.trim() || undefined;
      const status = filterStatus === "all" ? undefined : filterStatus;

      const data = await fetchGroupBuyingPosts(region, status);
      setPosts(data);
    } catch (error) {
      console.error("게시글 로드 실패:", error);
      alert("게시글을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    return matchesCategory;
  });

  const handleClearSearch = () => {
    setSearchRegion("");
  };

  const handleWriteClick = () => {
    if (!isLogin) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }
    router.push("/group-buying/write");
  };

  const getStatusBadge = (status: GroupBuyingStatus) => {
    if (status === "RECRUITING") {
      return {
        label: "모집중",
        variant: "default" as const,
        className: "bg-green-500 hover:bg-green-600 text-white",
      };
    } else if (status === "COMPLETED") {
      return {
        label: "완료",
        variant: "secondary" as const,
        className: "bg-gray-400 text-white",
      };
    }
    return {
      label: status,
      variant: "secondary" as const,
      className: "",
    };
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      living: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      electronics: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      fashion: "bg-pink-100 text-pink-800 hover:bg-pink-200",
      beauty: "bg-rose-100 text-rose-800 hover:bg-rose-200",
      etc: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    };
    return colors[category] || colors.etc;
  };

  const getCategoryLabel = (category: string) => {
    return (
      GROUP_BUYING_CATEGORIES[
        category as keyof typeof GROUP_BUYING_CATEGORIES
      ] || "기타"
    );
  };

  const getDeadlineText = (deadline: string, isExpired: boolean) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (isExpired) {
      return "마감됨";
    }

    if (diffDays === 0) {
      return "오늘 마감";
    } else if (diffDays === 1) {
      return "내일 마감";
    } else if (diffDays > 0) {
      return `${diffDays}일 남음`;
    } else {
      return "마감됨";
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return "방금 전";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString("ko-KR");
    }
  };

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
                  placeholder="지역으로 검색 (예: 식사, 강남구)..."
                  className="pl-10 pr-10"
                  value={searchRegion}
                  onChange={(e) => {
                    console.log("입력:", e.target.value);
                    setSearchRegion(e.target.value);
                  }}
                />
                {/* X 버튼 */}
                {searchRegion && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                className="bg-primary text-primary-foreground w-full sm:w-auto"
                onClick={handleWriteClick}
              >
                <PenSquare className="h-4 w-4 mr-2" /> 글쓰기
              </Button>
            </div>

            {/* 검색 상태 표시 */}
            {debouncedRegion && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">"{debouncedRegion}"</span>{" "}
                  지역 검색 결과
                </p>
                <button
                  onClick={handleClearSearch}
                  className="text-blue-800 hover:text-blue-900 text-sm font-medium underline"
                >
                  초기화
                </button>
              </div>
            )}

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
                    {debouncedRegion || filterStatus !== "all"
                      ? "검색 결과가 없습니다."
                      : "공동구매 게시글이 없습니다."}
                  </p>
                  {debouncedRegion && (
                    <Button
                      onClick={handleClearSearch}
                      variant="outline"
                      className="mb-2"
                    >
                      검색 초기화
                    </Button>
                  )}
                  {!debouncedRegion && filterStatus === "all" && (
                    <Button onClick={handleWriteClick}>
                      첫 게시글 작성하기
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((item) => {
                  const statusBadge = getStatusBadge(item.status);
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
                                        {item.creatorNickname?.[0] || "?"}
                                      </span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {item.creatorNickname || "익명"}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      · {getTimeAgo(item.createdAt)}
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
                                    <span>{item.viewCount ?? 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageCircle className="h-4 w-4" />
                                    <span>
                                      {item.chatRoomMessageCount ?? 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {item.images && item.images.length > 0 && (
                              <div className="w-32 h-32 shrink-0 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                                <Image
                                  src={item.images[0]}
                                  alt={item.title}
                                  width={128}
                                  height={128}
                                  className="w-full h-full object-cover"
                                  onError={(
                                    e: React.SyntheticEvent<HTMLImageElement>
                                  ) => {
                                    e.currentTarget.style.display = "none";
                                    const parent =
                                      e.currentTarget.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `
                                        <svg class="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                      `;
                                    }
                                  }}
                                />
                              </div>
                            )}
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
