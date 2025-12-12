"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, ChefHat } from "lucide-react";
import {
  type RecipeResponse,
  mapCategoryToDisplay,
  mapCookingTimeToDisplay,
  mapDifficultyToDisplay,
  mapServingsToDisplay,
  fetchYoutubeVideoByTitle,
  type YoutubeVideoResponse,
} from "@/lib/api/recipeApi";

function decodeRecipeFromParam(
  encoded?: string | string[]
): RecipeResponse | null {
  if (!encoded) return null;
  const value = Array.isArray(encoded) ? encoded[0] : encoded;
  if (!value) return null;

  try {
    const binary = atob(decodeURIComponent(value));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as RecipeResponse;
  } catch (error) {
    console.error("공유 레시피 디코딩 실패:", error);
    return null;
  }
}

export default function SharedRecipePage({
  searchParams,
}: {
  searchParams: { data?: string | string[] };
}) {
  const recipe = useMemo(
    () => decodeRecipeFromParam(searchParams?.data),
    [searchParams?.data]
  );
  const [video, setVideo] = useState<YoutubeVideoResponse | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {!recipe ? (
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold">유효하지 않은 링크입니다.</h1>
              <p className="text-muted-foreground">
                공유 링크가 만료되었거나 올바르지 않습니다.
              </p>
              <Button asChild>
                <Link href="/recipe">레시피 생성하러 가기</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">공유된 레시피</p>
                <h1 className="text-4xl font-bold">{recipe.title}</h1>
                <p className="text-muted-foreground">
                  링크를 통해 공유된 레시피의 전체 내용을 확인할 수 있어요.
                </p>
              </div>

              <Card className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{recipe.title}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {mapCategoryToDisplay(recipe.category)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{mapCookingTimeToDisplay(recipe.cookingTime)}</span>
                        </div>
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
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-0">
                  <p className="text-muted-foreground">{recipe.description}</p>

                  <div>
                    <h3 className="font-semibold mb-3">필요한 재료</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {recipe.ingredients.map((ingredient: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
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

                  <div className="flex justify-end">
                    <Button asChild variant="outline">
                      <Link href="/recipe">다른 레시피 만들러 가기</Link>
                    </Button>
                  </div>

                  <div className="pt-4 space-y-3">
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
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}


