import BoardLayout from "@/components/board-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function GroupBuyingPage() {
  const categories = [
    { id: "all", label: "전체", count: 156 },
    { id: "food", label: "식품", count: 67 },
    { id: "living", label: "생활용품", count: 45 },
    { id: "electronics", label: "전자제품", count: 28 },
    { id: "etc", label: "기타", count: 16 },
  ];

  const groupBuys = [
    {
      id: 1,
      category: "식품",
      categoryColor: "bg-orange-100 text-orange-700",
      location: "강남구",
      time: "1시간 전",
      title: "코스트코 과일 공동구매 (3명 더 모집)",
      excerpt:
        "이번 주말에 코스트코 가는데 과일 같이 사실 분 구합니다. 딸기, 블루베리 등",
      tags: ["코스트코", "과일", "주말"],
      author: "과일러버",
      avatar: "/placeholder.svg?height=40&width=40",
      currentPeople: 7,
      targetPeople: 10,
      views: 234,
      comments: 12,
      status: "모집중",
      deadline: "2일 남음",
      image: "/fresh-fruits-costco.jpg",
    },
    {
      id: 2,
      category: "생활용품",
      categoryColor: "bg-blue-100 text-blue-700",
      location: "마포구",
      time: "2시간 전",
      title: "세제 대용량 공구 함께하실 분",
      excerpt: "세탁세제, 주방세제 대용량으로 저렴하게 구매해요.",
      tags: ["세제", "생활용품", "대용량"],
      author: "절약왕",
      avatar: "/placeholder.svg?height=40&width=40",
      currentPeople: 5,
      targetPeople: 8,
      views: 189,
      comments: 8,
      status: "모집중",
      deadline: "1일 남음",
      image: "/laundry-detergent-bottles.jpg",
    },
    {
      id: 3,
      category: "식품",
      categoryColor: "bg-orange-100 text-orange-700",
      location: "송파구",
      time: "3시간 전",
      title: "유기농 쌀 10kg 공동구매",
      excerpt: "농가 직거래로 신선한 유기농 쌀 구매합니다.",
      tags: ["쌀", "유기농", "농가직거래"],
      author: "건강식",
      avatar: "/placeholder.svg?height=40&width=40",
      currentPeople: 8,
      targetPeople: 8,
      views: 456,
      comments: 23,
      status: "마감",
      deadline: "마감",
      image: "/organic-rice-bag.jpg",
    },
    {
      id: 4,
      category: "전자제품",
      categoryColor: "bg-purple-100 text-purple-700",
      location: "서초구",
      time: "4시간 전",
      title: "공기청정기 필터 대량 구매",
      excerpt: "정품 필터 대량 구매로 개당 가격 낮춰요.",
      tags: ["공기청정기", "필터", "전자제품"],
      author: "깨끗한공기",
      avatar: "/placeholder.svg?height=40&width=40",
      currentPeople: 4,
      targetPeople: 6,
      views: 312,
      comments: 15,
      status: "모집중",
      deadline: "3일 남음",
      image: "/air-purifier-filter.jpg",
    },
    {
      id: 5,
      category: "식품",
      categoryColor: "bg-orange-100 text-orange-700",
      location: "용산구",
      time: "5시간 전",
      title: "이마트 트레이더스 공구 같이해요",
      excerpt: "대용량 식품 구매하실 분들 모집합니다.",
      tags: ["트레이더스", "대용량", "식품"],
      author: "장보기",
      avatar: "/placeholder.svg?height=40&width=40",
      currentPeople: 6,
      targetPeople: 10,
      views: 278,
      comments: 18,
      status: "모집중",
      deadline: "2일 남음",
      image: "/bulk-food-shopping.jpg",
    },
    {
      id: 6,
      category: "생활용품",
      categoryColor: "bg-blue-100 text-blue-700",
      location: "성동구",
      time: "6시간 전",
      title: "화장지 대용량 공동구매",
      excerpt: "3겹 화장지 30롤 묶음 공동구매 합니다.",
      tags: ["화장지", "생필품", "대용량"],
      author: "생필품마스터",
      avatar: "/placeholder.svg?height=40&width=40",
      currentPeople: 9,
      targetPeople: 12,
      views: 523,
      comments: 31,
      status: "모집중",
      deadline: "1일 남음",
      image: "/toilet-paper-rolls.jpg",
    },
  ];

  return (
    <BoardLayout
      hero={
        <section className="bg-gradient-to-r from-orange-50 to-amber-50 py-12 border-b">
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
          <aside className="lg:w-64 flex-shrink-0">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">카테고리</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        category.id === "all"
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
                  placeholder="상품명, 지역으로 검색..."
                  className="pl-10"
                />
              </div>
              <Link href="/local/group-buying/write">
                <Button className="bg-primary text-primary-foreground w-full sm:w-auto">
                  <PenSquare className="h-4 w-4 mr-2" /> 글쓰기
                </Button>
              </Link>
            </div>

            {/* Sort and Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {groupBuys.length}개
                </span>
                의 공동구매
              </p>
              <Select defaultValue="latest">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="deadline">마감임박순</SelectItem>
                  <SelectItem value="popular">인기순</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group Buying List */}
            <div className="space-y-4">
              {groupBuys.map((item) => (
                <Link key={item.id} href={`/local/group-buying/${item.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={`${item.categoryColor} border-0`}>
                              {item.category}
                            </Badge>
                            <Badge
                              variant={
                                item.status === "모집중" ? "default" : "outline"
                              }
                              className={
                                item.status === "모집중" ? "bg-green-500" : ""
                              }
                            >
                              {item.status}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{item.location}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{item.deadline}</span>
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold mb-2 text-balance">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {item.excerpt}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {item.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Image
                                  src={
                                    item.avatar ||
                                    "/placeholder.svg" ||
                                    "/placeholder.svg"
                                  }
                                  alt={item.author}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                                <span className="text-sm font-medium">
                                  {item.author}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="font-medium text-primary">
                                  {item.currentPeople}/{item.targetPeople}명
                                </span>
                                <span className="text-muted-foreground">
                                  참여중
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{item.views}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />
                                <span>{item.comments}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="w-32 h-32 flex-shrink-0 hidden sm:block">
                          <Image
                            src={
                              item.image ||
                              "/placeholder.svg" ||
                              "/placeholder.svg"
                            }
                            alt={item.title}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled>
                이전
              </Button>
              <Button variant="default" size="sm">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                다음
              </Button>
            </div>
          </div>
        </div>
      </div>
    </BoardLayout>
  );
}
