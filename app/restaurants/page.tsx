"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Plus, Minus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function RestaurantsPage() {
  const [activeTab, setActiveTab] = useState<"list" | "map">("map");

  const restaurants = [
    {
      id: 1,
      rank: 1,
      name: "제주동화마을",
      category: "맛집",
      tags: ["제주식", "나홀로", "돌솥밥"],
      location: "제주시 나홀로(木), 제주시 돌(石)",
      image: "/jeju-restaurant.jpg",
      rating: 4.5,
      reviews: 234,
    },
    {
      id: 2,
      rank: 2,
      name: "수목원 야시장",
      category: "맛집",
      tags: ["제주식", "특색음식", "담이면"],
      location: "제주 특색 가득 담아낸 요리백",
      image: "/night-market.jpg",
      rating: 4.3,
      reviews: 189,
    },
    {
      id: 3,
      rank: 3,
      name: "에클잉포크한정식 본점",
      category: "식당",
      tags: ["한식", "제갈홍", "전통", "담이"],
      location: "시장님의 전원 담이접한 신선한 회와",
      image: "/korean-restaurant.jpg",
      rating: 4.7,
      reviews: 312,
    },
    {
      id: 4,
      rank: 4,
      name: "계절식당 함덕점",
      category: "식당",
      tags: ["손상겸", "년고스토힙", "담이"],
      location: "년고상차토힙, 년고스토힙",
      image: "/seasonal-restaurant.jpg",
      rating: 4.4,
      reviews: 156,
    },
    {
      id: 5,
      rank: 5,
      name: "김덕면으로킬",
      category: "맛집",
      tags: ["김버떠으킬", "담면", "전보인"],
      location: "만소시(안이터민 비다맙 찌기른 긴소우",
      image: "/noodle-restaurant.jpg",
      rating: 4.6,
      reviews: 278,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {/* Header */}
      <div className="border-b bg-white dark:bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">혼밥식당</h1>

          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="음식점, 지역, 음식 종류로 검색..."
                className="pl-10"
              />
            </div>
            <Button>검색</Button>
          </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="cursor-pointer">
              전체
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              한식
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              양식
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              일식
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              중식
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              카페
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex h-[calc(100vh-280px)]">
        {/* Left Sidebar - Restaurant List */}
        <div className="w-[30%] min-w-[280px] max-w-[400px] border-r bg-white dark:bg-card overflow-y-auto">
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                검색결과 <span className="text-primary font-bold">120</span>개
                검색
              </p>
              <Button variant="ghost" size="sm">
                <MapPin className="h-4 w-4 mr-1" />
                현위치
              </Button>
            </div>
          </div>

          <div className="divide-y">
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/restaurants/${restaurant.id}`}
                className="block hover:bg-muted/50 transition-colors"
              >
                <div className="p-4">
                  <div className="flex gap-3">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        {restaurant.rank}
                      </div>
                    </div>

                    {/* Image */}
                    <div className="flex-shrink-0">
                      <Image
                        src={restaurant.image || "/placeholder.svg"}
                        alt={restaurant.name}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {restaurant.category}
                        </Badge>
                        <h3 className="font-semibold text-sm truncate">
                          {restaurant.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">
                          {restaurant.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({restaurant.reviews})
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {restaurant.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs px-1.5 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {restaurant.location}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="p-4 border-t flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled>
              {"<<"}
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
              {">>"}
            </Button>
          </div>
        </div>

        {/* Right Side - Map Placeholder */}
        <div className="flex-1 relative bg-gray-100 dark:bg-gray-900">
          {/* Map Controls */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="bg-white shadow-lg"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="bg-white shadow-lg"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>

          {/* Map Placeholder with markers indication */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                지도 영역
              </p>
              <p className="text-sm text-muted-foreground">
                실제 지도는 추후 연동 예정입니다
              </p>
            </div>
          </div>

          {/* Sample Markers Info Cards (floating) */}
          <div className="absolute top-4 right-4 space-y-2">
            <Card className="shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">수목원 야시장</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <Card className="shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">제주동화마을</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
