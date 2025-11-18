"use client";

import type React from "react";
import { useState } from "react";
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

export default function RecipePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const savedRecipes = [
    { id: 1, title: "김치볶음밥", category: "한식", time: "10분" },
    { id: 2, title: "된장찌개", category: "한식", time: "20분" },
    { id: 3, title: "계란말이", category: "간식", time: "15분" },
    { id: 4, title: "토마토 파스타", category: "양식", time: "25분" },
    { id: 5, title: "불고기", category: "한식", time: "30분" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log(
      "[v0] Recipe query:",
      query,
      "category:",
      category,
      "cookingTime:",
      cookingTime
    );

    // TODO: Implement actual AI recipe recommendation
    setTimeout(() => {
      setRecipes([
        {
          title: "간단한 김치볶음밥",
          category: category || "한식",
          time: cookingTime || "10분",
          description:
            "냉장고에 있는 김치와 밥으로 5분 만에 완성하는 맛있는 한끼",
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
          title: "계란말이",
          category: category || "간식",
          time: cookingTime || "15분",
          description:
            "부드럽고 폭신한 계란말이, 아이부터 어른까지 모두 좋아하는 메뉴",
          ingredients: [
            "계란 3개",
            "우유 2큰술",
            "소금 약간",
            "식용유 1큰술",
            "파 약간",
          ],
          steps: [
            "계란을 풀고 우유와 소금을 넣어 섞어주세요.",
            "팬에 기름을 두르고 중불로 달궈주세요.",
            "계란물을 부어 익으면서 돌돌 말아주세요.",
            "적당한 크기로 잘라 접시에 담아 완성!",
          ],
          servings: "2인분",
          difficulty: "쉬움",
        },
        {
          title: "된장찌개",
          category: category || "한식",
          time: cookingTime || "20분",
          description: "구수한 된장의 풍미가 가득한 집밥 필수 메뉴",
          ingredients: [
            "된장 2큰술",
            "두부 1/2모",
            "애호박 1/4개",
            "양파 1/4개",
            "감자 1개",
            "육수 3컵",
          ],
          steps: [
            "냄비에 육수를 붓고 끓여주세요.",
            "된장을 풀어 넣고 감자를 먼저 넣어주세요.",
            "감자가 익으면 애호박, 양파, 두부를 넣어주세요.",
            "한소끔 끓여 완성!",
          ],
          servings: "2-3인분",
          difficulty: "보통",
        },
      ]);
      setIsLoading(false);
      setExpandedCards(new Set());
    }, 2000);
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
                    저장된 레시피
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {savedRecipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
                    >
                      <div className="font-medium text-sm mb-1">
                        {recipe.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs py-0">
                          {recipe.category}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {recipe.time}
                        </div>
                      </div>
                    </button>
                  ))}
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
                      <p className="text-xs text-muted-foreground mt-2">
                        보유 재료, 원하는 요리 종류, 조리 시간 등을 자유롭게
                        입력하세요
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          카테고리
                        </label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="한식">한식</SelectItem>
                            <SelectItem value="중식">중식</SelectItem>
                            <SelectItem value="일식">일식</SelectItem>
                            <SelectItem value="양식">양식</SelectItem>
                            <SelectItem value="분식">분식</SelectItem>
                            <SelectItem value="디저트">디저트</SelectItem>
                            <SelectItem value="간식">간식</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          조리시간
                        </label>
                        <Select
                          value={cookingTime}
                          onValueChange={setCookingTime}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10분 이내">10분 이내</SelectItem>
                            <SelectItem value="10-20분">10-20분</SelectItem>
                            <SelectItem value="20-30분">20-30분</SelectItem>
                            <SelectItem value="30분 이상">30분 이상</SelectItem>
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
                    <Card key={index} className="overflow-hidden">
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
                                {recipe.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{recipe.time}</span>
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
                              <span className="text-sm">{recipe.servings}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ChefHat className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {recipe.difficulty}
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
                            <Button className="flex-1">레시피 저장하기</Button>
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
