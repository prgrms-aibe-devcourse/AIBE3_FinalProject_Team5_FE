"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
  Sparkles,
  Clock,
  Users,
  ChefHat,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
} from "lucide-react";
import { useAuth } from "@/app/global/auth/useAuth";
import {
  generateRecipes,
  saveRecipe,
  fetchGeneratedRecipes,
  type RecipeResponse,
  mapServingsToNumber,
  mapCategoryToDisplay,
  mapCookingTimeToDisplay,
  mapDifficultyToDisplay,
  mapServingsToDisplay,
  RecipeCategory,
  CookingTime,
  Difficulty,
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
  const { isLogin } = useAuth();

  // 생성된 레시피 목록 불러오기
  useEffect(() => {
    if (isLogin) {
      loadGeneratedRecipes();
    }
  }, [isLogin]);

  const loadGeneratedRecipes = async () => {
    try {
      setIsLoadingGenerated(true);
      const data = await fetchGeneratedRecipes();
      setGeneratedRecipes(data);
    } catch (error) {
      console.error("생성된 레시피 목록 불러오기 실패:", error);
    } finally {
      setIsLoadingGenerated(false);
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

      // 로그인한 경우 생성된 레시피 목록 새로고침
      if (isLogin) {
        loadGeneratedRecipes();
      }
    } catch (error) {
      console.error("레시피 생성 실패:", error);
      alert("레시피 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecipe = async (recipe: RecipeResponse) => {
    if (!isLogin) {
      alert("로그인이 필요합니다.");
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
      });
      alert("레시피가 저장되었습니다.");
      // 생성된 레시피 목록 새로고침
      loadGeneratedRecipes();
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
    }
    setExpandedCards(newExpanded);
  };

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
                    <BookmarkCheck className="h-5 w-5" />
                    생성된 레시피
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
                        : "로그인 후 생성된 레시피를 확인할 수 있습니다."}
                    </div>
                  ) : (
                    generatedRecipes.map((recipe) => (
                      <button
                        key={recipe.id}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
                        onClick={() => {
                          // 레시피 클릭 시 해당 레시피로 스크롤
                          const recipeElement = document.getElementById(
                            `recipe-${recipe.id}`
                          );
                          if (recipeElement) {
                            recipeElement.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }
                        }}
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
                  추천해드립니다
                </p>
              </div>

              <Card className="mb-8">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        어떤 요리를 만들고 싶으신가요?
                      </label>
                      <Textarea
                        placeholder="예: 냉장고에 김치와 밥이 있어요. 간단한 요리 추천해주세요."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
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

              {recipes.length > 0 && (
                <div className="space-y-4">
                  {recipes.map((recipe, index) => (
                    <Card
                      key={recipe.id || index}
                      id={`recipe-${recipe.id || index}`}
                      className="overflow-hidden"
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

                      {expandedCards.has(index) && (
                        <CardContent className="space-y-6 pt-0">
                          <p className="text-muted-foreground">
                            {recipe.description}
                          </p>

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

                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="outline"
                              className="flex-1 bg-transparent"
                            >
                              공유하기
                            </Button>
                            <Button
                              className="flex-1"
                              onClick={() => handleSaveRecipe(recipe)}
                            >
                              레시피 저장하기
                            </Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
