"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Clock,
  Users,
  ChefHat,
  ChevronDown,
  ChevronUp,
  History,
  Share2,
  Bookmark,
} from "lucide-react";
import { useAuth } from "@/app/global/auth/useAuth";
import {
  generateRecipes,
  saveRecipe,
  fetchGeneratedRecipes,
  fetchSavedRecipes,
  createShareLink,
  type RecipeResponse,
  mapServingsToNumber,
  mapCategoryToDisplay,
  mapCookingTimeToDisplay,
  mapDifficultyToDisplay,
  mapServingsToDisplay,
  RecipeCategory,
  CookingTime,
  Difficulty,
  fetchYoutubeVideoByTitle,
  type YoutubeVideoResponse,
} from "@/lib/api/recipeApi";

export default function RecipePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RecipeCategory | "">("");
  const [cookingTime, setCookingTime] = useState<CookingTime | "">("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [recipes, setRecipes] = useState<RecipeResponse[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [servings, setServings] = useState("");
  const [generatedRecipes, setGeneratedRecipes] = useState<RecipeResponse[]>([]);
  const [isLoadingGenerated, setIsLoadingGenerated] = useState(false);
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<number>>(new Set());
  const [savedRecipeKeys, setSavedRecipeKeys] = useState<Set<string>>(new Set());
  const [showSparkle, setShowSparkle] = useState(false);
  const sparkleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { isLogin, setAccessToken, setApiKey } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [focusedRecipe, setFocusedRecipe] = useState<RecipeResponse | null>(null);
  const focusedRecipeRef = useRef<HTMLDivElement | null>(null);
  const [shareTargetRecipe, setShareTargetRecipe] =
    useState<RecipeResponse | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  const [isCopySuccess, setIsCopySuccess] = useState(false);
  const shareInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [videoMap, setVideoMap] = useState<Record<string, YoutubeVideoResponse | null>>({});
  const [videoLoading, setVideoLoading] = useState<Set<string>>(new Set());
  const [videoError, setVideoError] = useState<Record<string, string>>({});

  // 생성된 레시피 목록 불러오기
  useEffect(() => {
    if (isLogin) {
      loadGeneratedRecipes();
      loadSavedRecipes();
    } else {
      setSavedRecipeIds(new Set());
      setSavedRecipeKeys(new Set());
    }
  }, [isLogin]);

  useEffect(() => {
    return () => {
      if (sparkleTimerRef.current) {
        clearTimeout(sparkleTimerRef.current);
      }
    };
  }, []);

  const loadGeneratedRecipes = async () => {
    try {
      setIsLoadingGenerated(true);
      const data = await fetchGeneratedRecipes();
      setGeneratedRecipes(data.slice(0, 9));
    } catch (error) {
      console.error("생성된 레시피 목록 불러오기 실패:", error);
    } finally {
      setIsLoadingGenerated(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const request = {
        prompt: query,
        category: category || undefined,
        cookingTime: cookingTime || undefined,
        difficulty: difficulty || undefined,
        servings: servings ? mapServingsToNumber(servings) : undefined,
        count: 3,
      };

      const data = await generateRecipes(request);
      setRecipes(data);
      setExpandedCards(new Set());
      setQuery("");
      setCategory("");
      setCookingTime("");
      setDifficulty("");
      setServings("");
      setFocusedRecipe(null);
      if (sparkleTimerRef.current) {
        clearTimeout(sparkleTimerRef.current);
      }
      setShowSparkle(true);
      sparkleTimerRef.current = setTimeout(() => setShowSparkle(false), 2200);

      // 로그인한 경우 생성된 레시피 목록 새로고침
      if (isLogin) {
        loadGeneratedRecipes();
        loadSavedRecipes();
      }
      // 생성된 3개 카드가 보이도록 스크롤을 맨 아래로 이동
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 200);
    } catch (error) {
      console.error("레시피 생성 실패:", error);
      alert("레시피 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
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
      const ensuredEmbedUrl =
        videoMap[recipe.title]?.embedUrl ||
        recipe.youtubeUrl ||
        (await ensureYoutubeVideo(recipe));

      await saveRecipe({
        title: recipe.title,
        description: recipe.description,
        category: recipe.category,
        cookingTime: recipe.cookingTime,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        youtubeUrl: ensuredEmbedUrl || undefined,
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
      // 생성된 레시피 목록 새로고침
      loadGeneratedRecipes();
      loadSavedRecipes();
    } catch (error) {
      console.error("레시피 저장 실패:", error);
      alert("레시피 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const toggleCard = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
      const recipe = recipes[index];
      if (recipe) {
        loadYoutubeVideo(recipe);
      }
    }
    setExpandedCards(newExpanded);
  };

  const ensureYoutubeVideo = async (recipe: RecipeResponse) => {
    // 이미 가져온 경우 재호출 방지
    const cached = videoMap[recipe.title];
    if (cached?.embedUrl) return cached.embedUrl;

    // 저장된 youtubeUrl이 있으면 그대로 사용
    if (recipe.youtubeUrl) {
      const video = {
        videoId: "",
        embedUrl: recipe.youtubeUrl,
        title: recipe.title,
        thumbnailUrl: "",
      };
      setVideoMap((prev) => ({ ...prev, [recipe.title]: video }));
      setVideoError((prev) => ({ ...prev, [recipe.title]: "" }));
      return video.embedUrl;
    }

    // 없으면 한 번만 검색
    setVideoLoading((prev) => new Set(prev).add(recipe.title));
    try {
      const video = await fetchYoutubeVideoByTitle(recipe.title);
      setVideoMap((prev) => ({ ...prev, [recipe.title]: video }));
      setVideoError((prev) => ({ ...prev, [recipe.title]: "" }));
      return video.embedUrl;
    } catch (error) {
      console.error("유튜브 영상 검색 실패:", error);
      setVideoMap((prev) => ({ ...prev, [recipe.title]: null }));
      const message =
        error instanceof Error && error.message
          ? error.message
          : "관련 영상을 찾을 수 없어요.";
      setVideoError((prev) => ({
        ...prev,
        [recipe.title]: message,
      }));
      return undefined;
    } finally {
      setVideoLoading((prev) => {
        const next = new Set(prev);
        next.delete(recipe.title);
        return next;
      });
    }
  };

  const loadYoutubeVideo = async (recipe: RecipeResponse) => {
    if (videoMap[recipe.title] !== undefined) return;
    await ensureYoutubeVideo(recipe);
  };

  const openShareModal = async (recipe: RecipeResponse) => {
    if (!isLogin) {
      setShowLoginModal(true);
      return;
    }

    try {
      const shareLinkData = await createShareLink(recipe.id);
      setShareLink(shareLinkData.shareUrl);
      setShareTargetRecipe(recipe);
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

  const handleFocusRecipe = (recipe: RecipeResponse) => {
    setFocusedRecipe(recipe);
    setExpandedCards(new Set());
    loadYoutubeVideo(recipe);
    setTimeout(() => {
      focusedRecipeRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const renderRecipeContent = (recipe: RecipeResponse) => (
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
        {videoLoading.has(recipe.title) ? (
          <p className="text-sm text-muted-foreground">영상을 불러오는 중입니다...</p>
        ) : videoMap[recipe.title]?.embedUrl ? (
          <div className="aspect-video rounded-lg overflow-hidden border">
            <iframe
              title={`${recipe.title} 관련 유튜브 영상`}
              src={videoMap[recipe.title]!.embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : videoError[recipe.title] ? (
          <p className="text-sm text-muted-foreground">{videoError[recipe.title]}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            아직 영상을 불러오지 않았어요. 버튼을 눌러 검색해보세요.
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
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-[280px_1fr] gap-8 max-w-7xl mx-auto">
            <aside className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    최근 생성된 레시피
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isLoadingGenerated ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      로딩 중...
                    </div>
                  ) : generatedRecipes.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      {isLogin
                        ? "생성된 레시피가 없습니다."
                        : "로그인 후 생성된 레시피를 확인할 수 있어요."}
                    </div>
                  ) : (
                    generatedRecipes.map((recipe) => (
                      <button
                        key={recipe.id}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
                        onClick={() => handleFocusRecipe(recipe)}
                      >
                        <div className="font-medium text-sm mb-1">
                          {recipe.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs py-0">
                            {mapCategoryToDisplay(recipe.category)}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {mapCookingTimeToDisplay(recipe.cookingTime)}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            </aside>

            <div>
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">AI 레시피 추천</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  레시피 찾기
                </h1>
                <p className="text-lg text-muted-foreground">
                  재료나 원하는 요리를 입력하면 AI가 맞춤 레시피를
                  추천드려요!
                </p>
              </div>

              <Card className="mb-8">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        어떤 재료로 무슨 요리를 만들고 싶으신가요?
                      </label>
                      <Textarea
                        placeholder="예: 냉장고에 김치와 밥이 있어요. 간단한 요리 추천해주세요."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e as any);
                          }
                        }}
                        className="min-h-[120px]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          카테고리
                        </label>
                        <Select
                          value={category}
                          onValueChange={(value) =>
                            setCategory(value as RecipeCategory)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={RecipeCategory.KOREAN}>
                              한식
                            </SelectItem>
                            <SelectItem value={RecipeCategory.CHINESE}>
                              중식
                            </SelectItem>
                            <SelectItem value={RecipeCategory.JAPANESE}>
                              일식
                            </SelectItem>
                            <SelectItem value={RecipeCategory.WESTERN}>
                              양식
                            </SelectItem>
                            <SelectItem value={RecipeCategory.DESSERT}>
                              디저트
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          조리시간
                        </label>
                        <Select
                          value={cookingTime}
                          onValueChange={(value) =>
                            setCookingTime(value as CookingTime)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={CookingTime.UNDER_10}>
                              10분 이내
                            </SelectItem>
                            <SelectItem value={CookingTime.FROM_10_TO_20}>
                              10-20분
                            </SelectItem>
                            <SelectItem value={CookingTime.FROM_20_TO_30}>
                              20-30분
                            </SelectItem>
                            <SelectItem value={CookingTime.OVER_30}>
                              30분 이상
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          난이도
                        </label>
                        <Select
                          value={difficulty}
                          onValueChange={(value) =>
                            setDifficulty(value as Difficulty)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={Difficulty.EASY}>
                              쉬움
                            </SelectItem>
                            <SelectItem value={Difficulty.MEDIUM}>
                              보통
                            </SelectItem>
                            <SelectItem value={Difficulty.HARD}>
                              어려움
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          인분
                        </label>
                        <Select
                          value={servings}
                          onValueChange={setServings}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1인분">1인분</SelectItem>
                            <SelectItem value="2인분">2인분</SelectItem>
                            <SelectItem value="3인분">3인분</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                          AI가 레시피를 찾고 있어요...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          레시피 추천받기
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {focusedRecipe ? (
                <div
                  className="space-y-4"
                  ref={focusedRecipeRef}
                  id="focused-recipe"
                >
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => setFocusedRecipe(null)}
                    >
                      이전으로
                    </Button>
                  </div>

                  <Card
                    id={`recipe-${focusedRecipe.id}`}
                    className="overflow-hidden"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">
                              {focusedRecipe.title}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {mapCategoryToDisplay(focusedRecipe.category)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {mapCookingTimeToDisplay(
                                  focusedRecipe.cookingTime
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    {renderRecipeContent(focusedRecipe)}
                  </Card>
                </div>
              ) : (
                recipes.length > 0 && (
                  <div className="space-y-4">
                    {recipes.map((recipe, index) => (
                      <Card
                        key={recipe.id || index}
                        id={`recipe-${recipe.id || index}`}
                        className={`overflow-hidden ${
                          showSparkle ? "recipe-sparkle" : ""
                        }`}
                      >
                        <CardHeader
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleCard(index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-xl">
                                  {recipe.title}
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                  {mapCategoryToDisplay(recipe.category)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {mapCookingTimeToDisplay(recipe.cookingTime)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-muted-foreground">
                              {expandedCards.has(index) ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        {expandedCards.has(index) &&
                          renderRecipeContent(recipe)}
                      </Card>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* 공유 링크 모달 */}
      <Dialog
        open={!!shareTargetRecipe}
        onOpenChange={(open) => {
          if (!open) {
            setShareTargetRecipe(null);
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

      {/* 로그인 모달 */}
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
                      // 저장된 레시피 목록 새로고침
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    또는
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => {
                  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                  const frontedBaseUrl =
                    process.env.NEXT_PUBLIC_FRONTEND_BASE_URL;
                  const redirectUrl = encodeURIComponent(`${frontedBaseUrl}`);
                  const kakaoLoginUrl = `${apiBaseUrl}/oauth2/authorization/kakao?redirectUrl=${redirectUrl}`;
                  window.location.href = kakaoLoginUrl;
                }}
                style={{
                  backgroundColor: "#FEE500",
                  borderColor: "#FEE500",
                  color: "#000000",
                }}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.636 1.752 4.944 4.4 6.32-.192.71-.633 2.366-.732 2.742-.118.448.164.441.345.32.145-.096 2.118-1.405 2.923-1.946.61.083 1.233.126 1.864.126 5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
                </svg>
                카카오 로그인
              </Button>

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
    </div>
  );
}
