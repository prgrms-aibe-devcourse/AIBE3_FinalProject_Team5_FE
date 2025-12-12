"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  Users,
  ChefHat,
  ArrowLeft,
  Share2,
  Bookmark,
} from "lucide-react";
import {
  fetchRecipeByShareToken,
  createShareLink,
  saveRecipe,
  fetchSavedRecipes,
  type RecipeResponse,
  mapCategoryToDisplay,
  mapCookingTimeToDisplay,
  mapDifficultyToDisplay,
  mapServingsToDisplay,
  fetchYoutubeVideoByTitle,
  type YoutubeVideoResponse,
} from "@/lib/api/recipeApi";
import { useAuth } from "@/app/global/auth/useAuth";
import Link from "next/link";

export default function SharedRecipePage() {
  const params = useParams();
  const router = useRouter();
  const shareToken = params.shareToken as string;
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLogin, setAccessToken, setApiKey } = useAuth();
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<number>>(new Set());
  const [savedRecipeKeys, setSavedRecipeKeys] = useState<Set<string>>(new Set());
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  const [isCopySuccess, setIsCopySuccess] = useState(false);
  const shareInputRef = useRef<HTMLInputElement | null>(null);
  const [video, setVideo] = useState<YoutubeVideoResponse | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (shareToken) {
      loadSharedRecipe();
    }
  }, [shareToken]);

  useEffect(() => {
    if (isLogin && recipe) {
      loadSavedRecipes();
    }
  }, [isLogin, recipe]);

  useEffect(() => {
    const loadVideo = async () => {
      if (!recipe) return;
      if (recipe.youtubeUrl) {
        setVideo({
          videoId: "",
          embedUrl: recipe.youtubeUrl,
          title: recipe.title,
          thumbnailUrl: "",
        });
        setVideoError("");
        return;
      }
      setIsVideoLoading(true);
      try {
        const result = await fetchYoutubeVideoByTitle(recipe.title);
        setVideo(result);
        setVideoError("");
      } catch (error) {
        console.error("공유 레시피 유튜브 로드 실패:", error);
        setVideo(null);
        const message =
          error instanceof Error && error.message
            ? error.message
            : "관련 영상을 찾을 수 없어요.";
        setVideoError(message);
      } finally {
        setIsVideoLoading(false);
      }
    };

    loadVideo();
  }, [recipe]);

  const loadSharedRecipe = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchRecipeByShareToken(shareToken);
      setRecipe(data);
    } catch (error: any) {
      console.error("공유 레시피 조회 실패:", error);
      setError("공유 링크가 유효하지 않거나 만료되었습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedRecipes = async () => {
    try {
      const saved = await fetchSavedRecipes();
      setSavedRecipeIds(new Set(saved.map((item) => item.id)));
      setSavedRecipeKeys(
        new Set(saved.map((item) => `${item.title}::${item.description}`))
      );
    } catch (error) {
      console.error("저장된 레시피 목록 불러오기 실패:", error);
    }
  };

  const handleSaveRecipe = async (recipe: RecipeResponse) => {
    if (!isLogin) {
      setShowLoginModal(true);
      return;
    }

    const key = `${recipe.title}::${recipe.description}`;
    if (savedRecipeIds.has(recipe.id) || savedRecipeKeys.has(key)) {
      alert("이미 저장한 레시피입니다.");
      return;
    }

    try {
      await saveRecipe({
        title: recipe.title,
        description: recipe.description,
        category: recipe.category,
        cookingTime: recipe.cookingTime,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        youtubeUrl: recipe.youtubeUrl,
      });
      setSavedRecipeIds((prev) => {
        const updated = new Set(prev);
        updated.add(recipe.id);
        return updated;
      });
      setSavedRecipeKeys((prev) => {
        const updated = new Set(prev);
        updated.add(key);
        return updated;
      });
      alert("레시피가 저장되었습니다.");
      loadSavedRecipes();
    } catch (error) {
      console.error("레시피 저장 실패:", error);
      alert("레시피 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const openShareModal = async (recipe: RecipeResponse) => {
    // 로그인 필요
    if (!isLogin) {
      setShowLoginModal(true);
      return;
    }

    // 공유 페이지에서는 이미 공개된 링크이므로 현재 URL을 그대로 사용해 모달만 열어준다.
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    if (currentUrl) {
      setShareLink(currentUrl);
      setShareModalOpen(true);
      setIsCopySuccess(false);
      return;
    }

    // 폴백: 혹시 모를 경우 백엔드 호출 (본인 레시피가 아니면 에러 응답 가능)
    try {
      const shareLinkData = await createShareLink(recipe.id);
      setShareLink(shareLinkData.shareUrl);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center">
                <p className="text-muted-foreground">레시피를 불러오는 중...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <p className="text-destructive">{error || "레시피를 찾을 수 없습니다."}</p>
                    <Button asChild>
                      <Link href="/recipe">레시피 페이지로 돌아가기</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => router.push("/recipe")}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                레시피 페이지로 돌아가기
              </Button>
            </div>

            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">{recipe.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {mapCategoryToDisplay(recipe.category)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{mapCookingTimeToDisplay(recipe.cookingTime)}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-0">
                <p className="text-muted-foreground">{recipe.description}</p>

                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {mapServingsToDisplay(recipe.servings)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {mapDifficultyToDisplay(recipe.difficulty)}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">필요한 재료</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {recipe.ingredients.map((ingredient: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">조리 순서</h3>
                  <div className="space-y-3">
                    {recipe.steps.map((step: string, idx: number) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {idx + 1}
                        </div>
                        <p className="text-sm pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">관련 유튜브 영상</h3>
                  </div>
                  {isVideoLoading ? (
                    <p className="text-sm text-muted-foreground">
                      영상을 불러오는 중입니다...
                    </p>
                  ) : video?.embedUrl ? (
                    <div className="aspect-video rounded-lg overflow-hidden border">
                      <iframe
                        title={`${recipe.title} 관련 유튜브 영상`}
                        src={video.embedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {videoError || "관련 영상을 찾을 수 없어요."}
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
                    공유하기
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleSaveRecipe(recipe)}
                    disabled={
                      savedRecipeIds.has(recipe.id) ||
                      savedRecipeKeys.has(`${recipe.title}::${recipe.description}`)
                    }
                    variant={
                      savedRecipeIds.has(recipe.id) ||
                      savedRecipeKeys.has(`${recipe.title}::${recipe.description}`)
                        ? "secondary"
                        : "default"
                    }
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    {savedRecipeIds.has(recipe.id) ||
                    savedRecipeKeys.has(`${recipe.title}::${recipe.description}`)
                      ? "이미 저장됨"
                      : "레시피 저장하기"}
                  </Button>
                </div>
                {(savedRecipeIds.has(recipe.id) ||
                  savedRecipeKeys.has(`${recipe.title}::${recipe.description}`)) && (
                  <p className="text-xs text-muted-foreground text-right">
                    이미 저장한 레시피예요
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      {/* 로그인 모달 - /recipe와 동일 UI 재사용 */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-center text-lg leading-relaxed">
              <div>간편하게 가입하고</div>
              <div>나만의 레시피를 공유하고 저장해봐요!</div>
            </DialogTitle>
          </DialogHeader>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                로그인
              </CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                OneLife에 오신 것을 환영합니다
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoginLoading(true);
                  setLoginError("");

                  try {
                    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        email: loginEmail,
                        password: loginPassword,
                      }),
                      credentials: "include",
                    });

                    if (!res.ok) {
                      throw new Error(
                        "로그인 실패: 이메일 또는 비밀번호를 확인하세요."
                      );
                    }

                    const data = await res.json();

                    if (res.ok) {
                      const authHeader = res.headers.get("Authorization");

                      if (authHeader) {
                        const parts = authHeader.split(" ");

                        if (parts.length >= 3) {
                          const [, apiKey, accessToken] = parts;
                          setApiKey(apiKey);
                          setAccessToken(accessToken);
                        }
                      }
                      setShowLoginModal(false);
                      setLoginEmail("");
                      setLoginPassword("");
                      // 로그인 후 저장된 레시피 갱신
                      loadSavedRecipes();
                    }
                  } catch (err: any) {
                    setLoginError(err.message);
                    console.error("Login error:", err);
                  } finally {
                    setLoginLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">이메일</label>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">비밀번호</label>
                  <Input
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                {loginError && (
                  <p className="text-red-500 text-sm">{loginError}</p>
                )}

                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? "로그인 중..." : "로그인"}
                </Button>
              </form>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  아직 회원이 아니신가요?{" "}
                </span>
                <Link
                  href="/signup"
                  className="text-primary hover:underline font-medium"
                  onClick={() => setShowLoginModal(false)}
                >
                  회원가입
                </Link>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* 공유 링크 모달 */}
      <Dialog
        open={shareModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setShareModalOpen(false);
            setShareLink("");
            setIsCopySuccess(false);
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
              <Button onClick={copyShareLink} disabled={isCopying}>
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

