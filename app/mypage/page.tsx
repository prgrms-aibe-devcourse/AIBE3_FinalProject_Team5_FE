"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/app/global/auth/useAuth";
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
  Share2,
} from "lucide-react";
import {
  fetchSavedRecipes,
  deleteRecipe,
  createShareLink,
  type RecipeResponse,
  mapCategoryToDisplay,
  mapCookingTimeToDisplay,
  mapDifficultyToDisplay,
  mapServingsToDisplay,
} from "@/lib/api/recipeApi";

interface User {
  nickname: string;
  regions: string[];
  bio: string;
  avatar: string;
  joinDate: string;
  stats: {
    postCount: number;
    commentCount: number;
    bookmarkCount: number;
    followingCount: number;
    followerCount: number;
  };
}

interface Post {
  id: number;
  title: string;
  postType: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: number;
  postTitle: string;
  content: string;
  createdAt: string;
}

interface Chat {
  chatRoomId: number;
  name: string;
  currentParticipants: number;
  status: string;
  maxParticipants: number;
  createdAt: string;
}

interface Bookmark {
  id: number;
  category: string;
  title: string;
  author: string;
  date: string;
}

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("posts");
  const [chatType, setChatType] = useState<"small-group" | "group-buying">(
    "small-group"
  );
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(
    new Set()
  );
  const [postCategory, setPostCategory] = useState<string>("전체");
  const { loginMember, isLogin, reloadMember } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [loading, setLoading] = useState(false);
  const [activeChats, setActiveChats] = useState<Chat[] | null>([]);
  const [completedChats, setCompletedChats] = useState<Chat[] | null>([]);
  const [groupChats, setGroupChats] = useState<Chat[] | null>([]);
  const [groupChatPage, setGroupChatPage] = useState(1);
  const [groupBuyChats, setGroupBuyChats] = useState<Chat[] | null>([]);
  const [groupBuyChatPage, setGroupBuyChatPage] = useState(1);
  const [myPosts, setMyPosts] = useState<Post[] | null>([]);
  const [postPage, setPostPage] = useState(1);
  const [myComments, setMyComments] = useState<Comment[] | null>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Bookmark[] | null>([]);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5;
  const postCategories = ["전체", "자유", "꿀팁", "정보"];

  // 로그인 여부 확인
  useEffect(() => {
    const check = async () => {
      const login = await reloadMember();
      if (login === false) {
        alert("로그인 후 이용해 주세요.");
        router.push("/login");
      }
    };

    check();
  }, []);

  const [myRecipes, setMyRecipes] = useState<RecipeResponse[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTargetRecipe, setShareTargetRecipe] = useState<RecipeResponse | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  const [isCopySuccess, setIsCopySuccess] = useState(false);
  const shareInputRef = useRef<HTMLInputElement | null>(null);

  // const bookmarkedPosts = [
  //   {
  //     id: 1,
  //     category: "꿀팁",
  //     title: "혼자 살 때 꼭 알아야 할 생활비 절약법",
  //     author: "절약마스터",
  //     date: "1주 전",
  //   },
  //   {
  //     id: 2,
  //     category: "정보",
  //     title: "2024년 청년 주거지원 정책 총정리",
  //     author: "정책알리미",
  //     date: "2주 전",
  //   },
  // ];

  // 하단 게시글, 레시피, 댓글 등 변환시 페이지 초기화
  // useEffect(() => {} ,[])

  const getBookmarks = async () => {
    try {
      const res = await fetch(
        `${baseUrl}/api/v1/members/bookmark?page=${
          groupChatPage - 1
        }&size=${pageSize}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        alert("내 북마크 정보를 불러오지 못했습니다.");
        return;
      }

      const result = await res.json();

      if (result == null) {
        return;
      }

      setTotalPages(result.totalPages);
      setBookmarkedPosts(result.content);
      console.log("결과", result.content);
    } catch (err) {
      console.error("내 북마크 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "bookmarks") {
      getBookmarks();
    }
  }, [activeTab]);

  // 마이페이지 유저 정보 불러오기
  useEffect(() => {
    if (isLogin && loginMember?.id) {
      const getMemberDetail = async () => {
        try {
          const res = await fetch(
            `${baseUrl}/api/v1/members/${loginMember.id}`
          );
          if (!res.ok) {
            alert("로그인 정보를 불러올 수 없습니다.");
            return;
          }
          const result = await res.json();
          console.log(result?.avatar);
          setUser(result);
          setLoading(true);
        } catch (err) {
          console.error("마이페이지 요청 실패:", err);
        }
      };

      getMemberDetail();
      getMemberPosts();
    }
  }, [isLogin, loginMember]);

  const arrange = () => {
    if (chatType === "small-group") {
      setActiveChats(groupChats ?? []);
      setCompletedChats([]);
    } else {
      setActiveChats(
        (groupBuyChats ?? []).filter((c) => c.status === "진행중")
      );
      setCompletedChats(
        (groupBuyChats ?? []).filter((c) => c.status === "완료")
      );
    }
  };

  // 사용자가 참여중인 소그룹 목록 불러오기
  const getMemberGroupChats = async () => {
    try {
      const res = await fetch(
        `${baseUrl}/api/v1/members/groups?page=${
          groupChatPage - 1
        }&size=${pageSize}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        alert("내 소그룹 정보를 불러오지 못했습니다.");
        return;
      }

      const result = await res.json();

      if (result == null) {
        return;
      }

      setTotalPages(result.totalPages);
      setGroupChats(result.content);
      console.log("결과", result.content);
    } catch (err) {
      console.error("내 소그룹 불러오기 실패:", err);
    }
  };

  // 사용자가 참여중인 공동구매 목록 불러오기
  const getMemberGroupBuyChats = async () => {
    try {
      const res = await fetch(
        `${baseUrl}/api/v1/members/group-buys?page=${
          groupBuyChatPage - 1
        }&size=${pageSize}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        alert("내 공동구매 정보를 불러오지 못했습니다.");
        return;
      }

      const result = await res.json();
      if (!result) return;

      const chat = result.content.map((item: any) => ({
        ...item,
        status: convertByStatus(item.status),
      }));

      setTotalPages(result.totalPages);
      setGroupBuyChats(chat);
    } catch (err) {
      console.error("내 공동구매 불러오기 실패:", err);
    }
  };

  // 공동구매 상태 변환기
  const convertByStatus = (status: string | null | undefined) => {
    switch (status) {
      case "RECRUITING":
        return "진행중";
      case "COMPLETED":
        return "완료";
      default:
        return "완료";
    }
  };

  useEffect(() => {
    if (chatType == "small-group") {
      getMemberGroupChats();
    } else {
      getMemberGroupBuyChats();
    }
  }, [chatType]);
  useEffect(() => {
    arrange();
  }, [chatType, groupBuyChats, groupChats]);

  // 사용자가 작성한 게시글 불러오기
  const getMemberPosts = async () => {
    const cat = convertCategoryToEnum(postCategory);
    try {
      const res = await fetch(
        `${baseUrl}/api/v1/members/posts?page=${
          postPage - 1
        }&size=${pageSize}&postType=${cat}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        alert("내 게시글 정보를 불러오지 못했습니다.");
        return;
      }

      const result = await res.json();

      if (result == null) {
        return;
      }

      const posts = result.content.map((item: any) => ({
        ...item,
        postType: convertEnumToCategory(item.postType),
      }));
      setTotalPages(result.totalPages);
      setMyPosts(posts.content ?? posts ?? []);
    } catch (err) {
      console.error("내 게시글 불러오기 실패:", err);
    }
  };

  function convertCategoryToEnum(category: string | null | undefined) {
    switch (category) {
      case "자유":
        return "FREE";
      case "꿀팁":
        return "TIP";
      case "정보":
        return "INFO";
      case "인기":
        return "HOT";
      default:
        return "ALL";
    }
  }

  function convertEnumToCategory(category: string | null | undefined) {
    switch (category) {
      case "FREE":
        return "자유";
      case "TIP":
        return "꿀팁";
      case "INFO":
        return "정보";
      case "HOT":
        return "인기";
      default:
        return "기타";
    }
  }

  useEffect(() => {
    getMemberPosts();
  }, [postPage, postCategory]);

  // 저장된 레시피, 소그룹, 공동구매 목록 불러오기
  useEffect(() => {
    if (isLogin && loading) {
      loadSavedRecipes(); // 레시피
      getMemberGroupChats(); // 소그룹
      getMemberPosts(); // 게시글
      arrange();
    }
  }, [isLogin, loading]);

  const loadSavedRecipes = async () => {
    try {
      setIsLoadingRecipes(true);
      const data = await fetchSavedRecipes();
      setMyRecipes(data);
    } catch (error) {
      console.error("저장된 레시피 목록 불러오기 실패:", error);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  const handleDeleteRecipe = async (recipeId: number) => {
    if (!confirm("정말 이 레시피를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteRecipe(recipeId);
      alert("레시피가 삭제되었습니다.");
      loadSavedRecipes();
    } catch (error) {
      console.error("레시피 삭제 실패:", error);
      alert("레시피 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const openShareModal = async (recipe: RecipeResponse) => {
    try {
      const shareLinkData = await createShareLink(recipe.id);
      setShareLink(shareLinkData.shareUrl);
      setShareTargetRecipe(recipe);
      setShareModalOpen(true);
      setIsCopySuccess(false);
    } catch (error) {
      console.error("공유 링크 생성 실패:", error);
      alert("공유 링크 생성에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    setIsCopying(true);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareLink);
      } else if (shareInputRef.current) {
        shareInputRef.current.select();
        document.execCommand("copy");
      }
      setIsCopySuccess(true);
      setTimeout(() => setIsCopySuccess(false), 2000);
    } catch (error) {
      console.error("공유 링크 복사 실패:", error);
      alert("링크 복사에 실패했어요. 다시 시도해주세요.");
    } finally {
      setIsCopying(false);
    }
  };

  const toggleRecipe = (id: number) => {
    const newExpanded = new Set(expandedRecipes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRecipes(newExpanded);
  };

  // 내 댓글 불러오기
  const getMemberComments = async () => {
    try {
      const res = await fetch(
        `${baseUrl}/api/v1/members/comments?page=${
          commentPage - 1
        }&size=${pageSize}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        alert("내 댓글 정보를 불러오지 못했습니다.");
        return;
      }

      const result = await res.json();

      if (result == null) {
        return;
      }

      setTotalPages(result.totalPages);
      setMyComments(result.content ?? result ?? []);
    } catch (err) {
      console.error("내 댓글 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    if (activeTab !== "comments") return;
    getMemberComments();
  }, [commentPage, activeTab]);

  // 날짜 포맷 문자열 변환
  function formatDate(dateString: string) {
    const date = new Date(dateString);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        {loading && (
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <Card className="sticky top-4">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center mb-6">
                        <Avatar className="h-24 w-24 mb-4">
                          {user?.avatar ? (
                            <AvatarImage
                              src={user.avatar}
                              alt={user.nickname}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <AvatarFallback className="text-2xl">
                              {user?.nickname[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <h2 className="text-xl font-bold mb-1">
                          {user?.nickname}
                        </h2>
                        <div className="flex items-start gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3 mt-[2px]" />
                          <div className="leading-tight">
                            {user?.regions?.length ? (
                              user.regions.length === 1 ? (
                                <span>{user.regions[0]}</span>
                              ) : (
                                <>
                                  <span>{user.regions[0]}</span>
                                  <br />
                                  <span>
                                    외 {user.regions.length - 1}개 지역
                                  </span>
                                </>
                              )
                            ) : null}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user?.bio}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          <span>
                            가입일:{" "}
                            {user?.joinDate
                              ? new Date(user.joinDate).toLocaleDateString(
                                  "ko-KR"
                                )
                              : ""}
                          </span>
                        </p>
                      </div>

                      <Separator className="mb-6" />

                      <div className="flex justify-between mb-6">
                        <div className="flex-1 text-center">
                          <div className="text-2xl font-bold text-primary">
                            {user?.stats?.postCount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            게시글
                          </div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-2xl font-bold text-primary">
                            {user?.stats?.commentCount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            댓글
                          </div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-2xl font-bold text-primary">
                            {user?.stats?.bookmarkCount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            북마크
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
                              chatType === "group-buying"
                                ? "default"
                                : "outline"
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
                          진행중 ({activeChats?.length})
                        </h4>
                        <div className="space-y-2">
                          {activeChats?.map((chat) => {
                            const link =
                              chatType === "small-group"
                                ? `/groups/${chat.chatRoomId}/chat`
                                : `/group-buying/${chat.chatRoomId}`;

                            return (
                              <Link key={chat.chatRoomId} href={link}>
                                <Card className="hover:shadow-md transition-shadow">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h5 className="font-medium">
                                            {chat.name}
                                          </h5>

                                          {chatType === "group-buying" && (
                                            <Badge className="bg-green-500">
                                              {chat.status}
                                            </Badge>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            <span>
                                              {chat.currentParticipants}명 /{" "}
                                              {chat.maxParticipants}명
                                            </span>
                                          </div>
                                          <span>
                                            {formatDate(chat.createdAt)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            );
                          })}
                        </div>
                      </div>

                      {chatType === "group-buying" &&
                        (completedChats ?? []).length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="text-sm font-semibold mb-3">
                                완료 ({completedChats?.length})
                              </h4>
                              <div className="space-y-2">
                                {completedChats?.map((chat) => (
                                  <Card key={chat.chatRoomId}>
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h5 className="font-medium text-muted-foreground">
                                              {chat.name}
                                            </h5>
                                            <Badge variant="outline">
                                              {chat.status}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                              <Users className="h-3 w-3" />
                                              <span>
                                                {chat.currentParticipants}명 /{" "}
                                                {chat.maxParticipants}명
                                              </span>
                                            </div>
                                            <span>
                                              {formatDate(chat.createdAt)}
                                            </span>
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
                    <div className="flex border-b">
                      <button
                        onClick={() => setActiveTab("posts")}
                        className={`flex-1 px-4 py-2 text-center font-medium transition-colors ${
                          activeTab === "posts"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <FileText className="h-4 w-4 inline mr-2" />내 게시글 (
                        {user?.stats?.postCount})
                      </button>

                      <button
                        onClick={() => setActiveTab("recipes")}
                        className={`flex-1 px-4 py-2 text-center font-medium transition-colors ${
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
                        className={`flex-1 px-4 py-2 text-center font-medium transition-colors ${
                          activeTab === "comments"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <MessageCircle className="h-4 w-4 inline mr-2" />내 댓글
                        ({user?.stats?.commentCount})
                      </button>

                      <button
                        onClick={() => setActiveTab("bookmarks")}
                        className={`flex-1 px-4 py-2 text-center font-medium transition-colors ${
                          activeTab === "bookmarks"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Bookmark className="h-4 w-4 inline mr-2" />
                        북마크 ({user?.stats?.bookmarkCount})
                      </button>
                    </div>
                    <CardContent>
                      {activeTab === "posts" && (
                        <div className="space-y-4">
                          {/* 카테고리 버튼 */}
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
                                onClick={() => {
                                  setPostCategory(category);
                                  setPostPage(1); // 카테고리 변경 시 1페이지로 이동
                                }}
                              >
                                {category}
                              </Button>
                            ))}
                          </div>
                          {/* 게시글 리스트 */}
                          <div className="space-y-3">
                            {myPosts?.map((post) => (
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
                                            {post.postType}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {formatDate(post.createdAt)}
                                          </span>
                                        </div>
                                        <h4 className="font-semibold mb-2">
                                          {post.title}
                                        </h4>

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <Eye className="h-3 w-3" />
                                            <span>{post.viewCount}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Heart className="h-3 w-3" />
                                            <span>{post.likeCount}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <MessageCircle className="h-3 w-3" />
                                            <span>{post.commentCount}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}

                            {/* 게시글이 없을 때 */}
                            {myPosts?.length === 0 && (
                              <p className="text-center text-sm text-muted-foreground py-4">
                                게시글이 없습니다.
                              </p>
                            )}
                          </div>

                          {/* 페이징 UI */}
                          {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={postPage === 1}
                                onClick={() => setPostPage(postPage - 1)}
                              >
                                이전
                              </Button>

                              <span className="text-sm">
                                {postPage} / {totalPages}
                              </span>

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={postPage === totalPages}
                                onClick={() => setPostPage(postPage + 1)}
                              >
                                다음
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === "recipes" && (
                        <div className="space-y-4">
                          {isLoadingRecipes ? (
                            <div className="text-center py-8 text-muted-foreground">
                              로딩 중...
                            </div>
                          ) : myRecipes.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              저장된 레시피가 없습니다.
                            </div>
                          ) : (
                            myRecipes.map((recipe) => (
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
                                          {mapCategoryToDisplay(
                                            recipe.category
                                          )}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-4 w-4" />
                                          <span>
                                            {mapCookingTimeToDisplay(
                                              recipe.cookingTime
                                            )}
                                          </span>
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
                                          {mapServingsToDisplay(
                                            recipe.servings
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <ChefHat className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                          {mapDifficultyToDisplay(
                                            recipe.difficulty
                                          )}
                                        </span>
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
                                            <div
                                              key={idx}
                                              className="flex gap-3"
                                            >
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

                                    <div className="pt-6 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">관련 유튜브 영상</h3>
                                      </div>
                                      {recipe.youtubeUrl ? (
                                        <div className="aspect-video rounded-lg overflow-hidden border">
                                          <iframe
                                            title={`${recipe.title} 관련 유튜브 영상`}
                                            src={recipe.youtubeUrl}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          />
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          저장된 유튜브 영상이 없습니다.
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                      <Button
                                        variant="outline"
                                        className="flex-1 bg-transparent"
                                        onClick={() => openShareModal(recipe)}
                                      >
                                        <Share2 className="h-4 w-4 mr-2" />
                                        공유
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="flex-1 text-destructive bg-transparent"
                                        onClick={() =>
                                          handleDeleteRecipe(recipe.id)
                                        }
                                      >
                                        삭제
                                      </Button>
                                    </div>
                                  </CardContent>
                                )}
                              </Card>
                            ))
                          )}
                        </div>
                      )}

                      {activeTab === "comments" && (
                        <div className="space-y-3">
                          {/* 댓글 리스트 */}
                          {myComments?.map((comment) => (
                            <Card>
                              <CardContent className="p-4">
                                <div className="mb-2">
                                  <Link
                                    href={`/onelife/post/${comment.id}`}
                                    className="text-sm font-medium hover:text-primary"
                                  >
                                    {comment.postTitle}
                                  </Link>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {formatDate(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {comment.content}
                                </p>
                              </CardContent>
                            </Card>
                          ))}

                          {/* 데이터 없을 때 */}
                          {myComments?.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              작성한 댓글이 없습니다.
                            </p>
                          )}

                          {/* 페이징 UI */}
                          {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={commentPage === 1}
                                onClick={() => setCommentPage(commentPage - 1)}
                              >
                                이전
                              </Button>

                              <span className="text-sm">
                                {commentPage} / {totalPages}
                              </span>

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={commentPage === totalPages}
                                onClick={() => setCommentPage(commentPage + 1)}
                              >
                                다음
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === "bookmarks" && (
                        <div className="space-y-3">
                          {bookmarkedPosts?.map((post) => (
                            <Link
                              key={post.id}
                              href={`/onelife/post/${post.id}`}
                            >
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
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* 공유 링크 모달 */}
      <Dialog
        open={shareModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setShareModalOpen(false);
            setShareLink("");
            setIsCopySuccess(false);
            setShareTargetRecipe(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-semibold">
              레시피 공유 링크
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              링크를 복사해 친구에게 보내면 전체 레시피 내용을 바로 볼 수
              있어요.
            </p>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                ref={shareInputRef}
                value={shareLink}
                readOnly
                onFocus={(e) => e.target.select()}
                className="flex-1"
              />
              <Button className="whitespace-nowrap" onClick={copyShareLink} disabled={isCopying}>
                {isCopying ? "복사 중..." : "링크 복사"}
              </Button>
            </div>
            {isCopySuccess && (
              <p className="text-xs text-green-600">복사되었어요!</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
