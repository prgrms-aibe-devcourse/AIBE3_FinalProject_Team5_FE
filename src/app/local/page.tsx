import { Header } from "@/src/components/header";
import { Footer } from "@/src/components/footer";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  MessageSquare,
  Users,
  ShoppingCart,
  Eye,
  MessageCircle,
  Heart,
} from "lucide-react";
import Link from "next/link";

export default function LocalPage() {
  const services = [
    {
      icon: MessageSquare,
      title: "내 동네 게시판",
      description: "우리 동네 소식과 정보를 나누는 공간",
      stats: "게시글 1,247 · 멤버 3,456",
      tags: ["일반 게시판", "공동 구매 모집", "소모임 모집"],
      href: "/local/neighborhood",
      color: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      icon: Users,
      title: "밥친구 찾기",
      description: "혼밥이 아닌 함께 식사할 친구를 찾아보세요",
      stats: "게시글 892 · 멤버 2,134",
      tags: ["식사 약속", "맛집 추천", "요리 모임"],
      href: "/local/dining",
      color: "bg-green-50",
      iconColor: "text-green-500",
    },
    {
      icon: ShoppingCart,
      title: "공동구매 모집",
      description: "함께 사면 더 저렴하고 재미있는 쇼핑",
      stats: "게시글 156 · 멤버 4,667",
      tags: ["생활용 공구", "식사 재료", "배달비 절약"],
      href: "/local/group-buying",
      color: "bg-orange-50",
      iconColor: "text-orange-500",
    },
  ];

  const popularPosts = [
    {
      id: 1,
      category: "일반",
      categoryColor: "bg-blue-100 text-blue-700",
      time: "3시간 전",
      title: "우리 동네 숨은 맛집 BEST 10",
      author: "동네맛집왕",
      views: 2456,
      likes: 189,
      comments: 67,
    },
    {
      id: 2,
      category: "밥친구",
      categoryColor: "bg-green-100 text-green-700",
      time: "5시간 전",
      title: "혼자 먹기 아까운 맛집 리스트",
      author: "혼밥탈출",
      views: 1834,
      likes: 145,
      comments: 43,
    },
    {
      id: 3,
      category: "소모임",
      categoryColor: "bg-purple-100 text-purple-700",
      time: "1일 전",
      title: "독서 모임 정기 모집 (매주 토요일)",
      author: "책벌레",
      views: 1267,
      likes: 98,
      comments: 29,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage:
                "url(/placeholder.svg?height=600&width=1200&query=community gathering people talking)",
            }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-background/50 to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                우리 동네 <span className="text-primary">로컬 커뮤니티</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                이웃들과 함께 만드는 따뜻한 동네 이야기
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
              {services.map((service) => (
                <Link key={service.title} href={service.href}>
                  <Card
                    className={`h-full hover:shadow-xl transition-all duration-300 cursor-pointer ${service.color} border-0`}
                  >
                    <CardContent className="p-8 text-center">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white mb-6`}
                      >
                        <service.icon
                          className={`h-8 w-8 ${service.iconColor}`}
                        />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">
                        {service.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {service.description}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground mb-4">
                        {service.stats}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {service.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-white/80"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Posts Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">인기 게시글</h2>
              <Button variant="ghost" className="text-primary" asChild>
                <Link href="/local/neighborhood">더보기</Link>
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
              {popularPosts.map((post) => (
                <Link key={post.id} href={`/local/post/${post.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer bg-card">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={`${post.categoryColor} border-0`}>
                          {post.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {post.time}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-4 line-clamp-2 text-balance">
                        {post.title}
                      </h3>
                      <div className="text-sm text-muted-foreground mb-4">
                        {post.author}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{post.views.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 bg-linear-to-r from-green-500 to-blue-500 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                우리 동네 이웃이 되어주세요
              </h2>
              <p className="text-lg md:text-xl mb-8 text-white/90">
                따뜻한 동네 커뮤니티에서 새로운 인연을 만나보세요
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  게시판 둘러보기
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 bg-transparent"
                >
                  밥친구 찾기
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
