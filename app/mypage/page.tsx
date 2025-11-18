"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  MessageCircle,
  Bookmark,
  Users,
  Heart,
  MapPin,
  Settings,
  LogOut,
  Eye,
  Clock,
  ChefHat,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function MyPage() {
  const [activeTab, setActiveTab] = useState("posts");
  const [chatType, setChatType] = useState<"small-group" | "group-buying">(
    "small-group"
  );
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(
    new Set()
  );
  const [postCategory, setPostCategory] = useState<string>("전체");

  const user = {
    nickname: "혼라이프러버",
    location: "강남구 역삼동",
    bio: "1인 가구의 소소한 일상을 공유합니다",
    avatar: "/placeholder.svg?height=100&width=100",
    joinDate: "2024년 1월",
    stats: {
      posts: 24,
      comments: 156,
      bookmarks: 43,
      following: 32,
      followers: 89,
    },
  };

  const smallGroupChats = [
    {
      id: 1,
      title: "홍대 저녁 식사 모임",
      status: "진행중",
      participants: 3,
      date: "12월 12일",
    },
    {
      id: 2,
      title: "강남 카페 스터디",
      status: "진행중",
      participants: 4,
      date: "12월 10일",
    },
  ];

  const groupBuyingChats = [
    {
      id: 3,
      title: "코스트코 과일 공동구매",
      status: "진행중",
      participants: 7,
      date: "12월 15일",
    },
    {
      id: 4,
      title: "세제 대용량 공동구매",
      status: "완료",
      participants: 8,
      date: "12월 5일",
    },
  ];

  const activeChats =
    chatType === "small-group"
      ? smallGroupChats
      : groupBuyingChats.filter((c) => c.status === "진행중");
  const completedChats =
    chatType === "group-buying"
      ? groupBuyingChats.filter((c) => c.status === "완료")
      : [];

  const myPosts = [
    {
      id: 1,
      category: "꿀팁",
      title: "원룸에서 효율적으로 수납하는 10가지 방법",
      views: 1247,
      likes: 89,
      comments: 23,
      date: "2일 전",
    },
    {
      id: 2,
      category: "혼밥",
      title: "5분만에 완성하는 간단 혼밥 레시피",
      views: 892,
      likes: 67,
      comments: 15,
      date: "5일 전",
    },
    {
      id: 3,
      category: "정보",
      title: "1인 가구 혜택 정리",
      views: 654,
      likes: 45,
      comments: 12,
      date: "1주 전",
    },
    {
      id: 4,
      category: "꿀팁",
      title: "전기세 절약 방법",
      views: 543,
      likes: 38,
      comments: 9,
      date: "2주 전",
    },
  ];

  const myRecipes = [
    {
      id: 1,
      title: "5분만에 완성하는 간단 김치볶음밥",
      category: "한식",
      cookingTime: "10분 이내",
      views: 892,
      likes: 67,
      comments: 15,
      date: "3일 전",
      description: "냉장고에 있는 김치와 밥으로 5분 만에 완성하는 맛있는 한끼",
      ingredients: [
        "밥 1공기",
        "김치 1/2컵",
        "식용유 1큰술",
        "참기름 약간",
        "김가루 약간",
      ],
      steps: [
        "팬에 식용유를 두르고 김치를 볶아주세요.",
        "김치가 볶아지면 밥을 넣고 함께 볶아주세요.",
        "밥이 고루 섞이면 참기름을 넣어주세요.",
        "그릇에 담고 김가루를 뿌려 완성!",
      ],
      servings: "1인분",
      difficulty: "쉬움",
    },
    {
      id: 2,
      title: "집에서 만드는 크림 파스타",
      category: "양식",
      cookingTime: "20-30분",
      views: 1245,
      likes: 89,
      comments: 23,
      date: "1주 전",
      description: "생크림과 우유로 만드는 부드러운 크림 파스타",
      ingredients: [
        "파스타면 100g",
        "생크림 100ml",
        "우유 50ml",
        "마늘 2쪽",
        "베이컨 3줄",
        "파마산 치즈 약간",
      ],
      steps: [
        "파스타면을 삶아주세요.",
        "팬에 마늘과 베이컨을 볶아주세요.",
        "생크림과 우유를 넣고 끓여주세요.",
        "삶은 파스타와 치즈를 넣고 버무려 완성!",
      ],
      servings: "1인분",
      difficulty: "보통",
    },
    {
      id: 3,
      title: "치즈 듬뿍 오믈렛",
      category: "간식",
      cookingTime: "10분 이내",
      views: 987,
      likes: 72,
      comments: 18,
      date: "2주 전",
      description: "폭신한 오믈렛에 치즈를 가득 넣어 만드는 브런치 메뉴",
      ingredients: [
        "계란 3개",
        "우유 2큰술",
        "모짜렐라 치즈 50g",
        "소금 약간",
        "버터 1큰술",
      ],
      steps: [
        "계란을 풀고 우유와 소금을 넣어 섞어주세요.",
        "팬에 버터를 녹이고 계란물을 부어주세요.",
        "치즈를 가운데 올리고 반으로 접어주세요.",
        "약불에서 익혀 완성!",
      ],
      servings: "1인분",
      difficulty: "쉬움",
    },
  ];

  const myComments = [
    {
      id: 1,
      postTitle: "강남역 근처 맛집 추천",
      content: "저도 어제 거기 갔는데 진짜 맛있더라구요!",
      date: "1일 전",
    },
    {
      id: 2,
      postTitle: "코스트코 공동구매",
      content: "참여하고 싶어요! 어떻게 하면 되나요?",
      date: "3일 전",
    },
  ];

  const bookmarkedPosts = [
    {
      id: 1,
      category: "꿀팁",
      title: "혼자 살 때 꼭 알아야 할 생활비 절약법",
      author: "절약마스터",
      date: "1주 전",
    },
    {
      id: 2,
      category: "정보",
      title: "2024년 청년 주거지원 정책 총정리",
      author: "정책알리미",
      date: "2주 전",
    },
  ];

  const following = [
    { id: 1, nickname: "정리왕", posts: 45 },
    { id: 2, nickname: "요리초보", posts: 32 },
    { id: 3, nickname: "절약마스터", posts: 78 },
  ];

  const followers = [
    { id: 1, nickname: "혼밥탈출", posts: 23 },
    { id: 2, nickname: "카페러버", posts: 56 },
  ];

  const toggleRecipe = (id: number) => {
    const newExpanded = new Set(expandedRecipes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRecipes(newExpanded);
  };

  const filteredPosts =
    postCategory === "전체"
      ? myPosts
      : myPosts.filter((post) => post.category === postCategory);

  const postCategories = [
    "전체",
    ...Array.from(new Set(myPosts.map((post) => post.category))),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center mb-6">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarFallback className="text-2xl">
                          {user.nickname[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h2 className="text-xl font-bold mb-1">
                        {user.nickname}
                      </h2>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{user.location}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.bio}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        가입일: {user.joinDate}
                      </p>
                    </div>

                    <Separator className="mb-6" />

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {user.stats.posts}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          게시글
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {user.stats.comments}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          댓글
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {user.stats.bookmarks}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          북마크
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {user.stats.following}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          팔로잉
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Link href="/mypage/edit">
                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          프로필 수정
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive bg-transparent"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        로그아웃
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>참여중인 채팅방</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant={
                            chatType === "small-group" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setChatType("small-group")}
                        >
                          소그룹 채팅
                        </Button>
                        <Button
                          variant={
                            chatType === "group-buying" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setChatType("group-buying")}
                        >
                          공동구매
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-3">
                        진행중 ({activeChats.length})
                      </h4>
                      <div className="space-y-2">
                        {activeChats.map((chat) => (
                          <Link
                            key={chat.id}
                            href={`/local/${chatType}/${chat.id}/chat`}
                          >
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="font-medium">
                                        {chat.title}
                                      </h5>
                                      <Badge className="bg-green-500">
                                        {chat.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        <span>{chat.participants}명</span>
                                      </div>
                                      <span>{chat.date}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {chatType === "group-buying" &&
                      completedChats.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-semibold mb-3">
                              완료 ({completedChats.length})
                            </h4>
                            <div className="space-y-2">
                              {completedChats.map((chat) => (
                                <Card key={chat.id}>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h5 className="font-medium text-muted-foreground">
                                            {chat.title}
                                          </h5>
                                          <Badge variant="outline">
                                            {chat.status}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            <span>{chat.participants}명</span>
                                          </div>
                                          <span>{chat.date}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex gap-2 border-b">
                      <button
                        onClick={() => setActiveTab("posts")}
                        className={`px-4 py-2 font-medium transition-colors ${
                          activeTab === "posts"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <FileText className="h-4 w-4 inline mr-2" />내 게시글 (
                        {user.stats.posts})
                      </button>
                      <button
                        onClick={() => setActiveTab("recipes")}
                        className={`px-4 py-2 font-medium transition-colors ${
                          activeTab === "recipes"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <ChefHat className="h-4 w-4 inline mr-2" />내 레시피 (
                        {myRecipes.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("comments")}
                        className={`px-4 py-2 font-medium transition-colors ${
                          activeTab === "comments"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <MessageCircle className="h-4 w-4 inline mr-2" />내 댓글
                        ({user.stats.comments})
                      </button>
                      <button
                        onClick={() => setActiveTab("bookmarks")}
                        className={`px-4 py-2 font-medium transition-colors ${
                          activeTab === "bookmarks"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Bookmark className="h-4 w-4 inline mr-2" />
                        북마크 ({user.stats.bookmarks})
                      </button>
                      <button
                        onClick={() => setActiveTab("following")}
                        className={`px-4 py-2 font-medium transition-colors ${
                          activeTab === "following"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Users className="h-4 w-4 inline mr-2" />
                        팔로잉 ({user.stats.following})
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activeTab === "posts" && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2 pb-2 border-b">
                          {postCategories.map((category) => (
                            <Button
                              key={category}
                              variant={
                                postCategory === category
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setPostCategory(category)}
                            >
                              {category}
                            </Button>
                          ))}
                        </div>

                        <div className="space-y-3">
                          {filteredPosts.map((post) => (
                            <Link
                              key={post.id}
                              href={`/onelife/post/${post.id}`}
                            >
                              <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="secondary">
                                          {post.category}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {post.date}
                                        </span>
                                      </div>
                                      <h4 className="font-semibold mb-2">
                                        {post.title}
                                      </h4>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Eye className="h-3 w-3" />
                                          <span>{post.views}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Heart className="h-3 w-3" />
                                          <span>{post.likes}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MessageCircle className="h-3 w-3" />
                                          <span>{post.comments}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === "recipes" && (
                      <div className="space-y-4">
                        {myRecipes.map((recipe) => (
                          <Card key={recipe.id} className="overflow-hidden">
                            <CardHeader
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => toggleRecipe(recipe.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <CardTitle className="text-xl">
                                      {recipe.title}
                                    </CardTitle>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {recipe.category}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{recipe.cookingTime}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-muted-foreground">
                                  {expandedRecipes.has(recipe.id) ? (
                                    <ChevronUp className="h-5 w-5" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5" />
                                  )}
                                </div>
                              </div>
                            </CardHeader>

                            {expandedRecipes.has(recipe.id) && (
                              <CardContent className="space-y-6 pt-0">
                                <p className="text-muted-foreground">
                                  {recipe.description}
                                </p>

                                <div className="flex gap-6">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {recipe.servings}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ChefHat className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {recipe.difficulty}
                                    </span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {recipe.date}
                                  </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    <span>{recipe.views}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Heart className="h-3 w-3" />
                                    <span>{recipe.likes}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageCircle className="h-3 w-3" />
                                    <span>{recipe.comments}</span>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-3">
                                    필요한 재료
                                  </h3>
                                  <div className="grid grid-cols-2 gap-2">
                                    {recipe.ingredients.map(
                                      (ingredient: string, idx: number) => (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-2 text-sm"
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                          <span>{ingredient}</span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-3">
                                    조리 순서
                                  </h3>
                                  <div className="space-y-3">
                                    {recipe.steps.map(
                                      (step: string, idx: number) => (
                                        <div key={idx} className="flex gap-3">
                                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                            {idx + 1}
                                          </div>
                                          <p className="text-sm pt-0.5">
                                            {step}
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                  <Button
                                    variant="outline"
                                    className="flex-1 text-destructive bg-transparent"
                                  >
                                    삭제
                                  </Button>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}

                    {activeTab === "comments" && (
                      <div className="space-y-3">
                        {myComments.map((comment) => (
                          <Card key={comment.id}>
                            <CardContent className="p-4">
                              <div className="mb-2">
                                <Link
                                  href="#"
                                  className="text-sm font-medium hover:text-primary"
                                >
                                  {comment.postTitle}
                                </Link>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {comment.date}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {comment.content}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {activeTab === "bookmarks" && (
                      <div className="space-y-3">
                        {bookmarkedPosts.map((post) => (
                          <Link key={post.id} href={`/onelife/post/${post.id}`}>
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary">
                                    {post.category}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {post.date}
                                  </span>
                                </div>
                                <h4 className="font-semibold mb-2">
                                  {post.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {post.author}
                                </p>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )}

                    {activeTab === "following" && (
                      <div className="space-y-3">
                        {following.map((user) => (
                          <Card key={user.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>
                                      {user.nickname[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {user.nickname}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      게시글 {user.posts}개
                                    </p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">
                                  팔로잉
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
