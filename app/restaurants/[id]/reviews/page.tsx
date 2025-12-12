"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useRouter, useParams } from "next/navigation";
import {
  fetchReviews,
  createReview,
  deleteReview,
  Review,
} from "@/lib/api/reviewApi";
import {
  fetchRestaurantById,
  createRestaurant,
  createRestaurantWithOpts,
  Restaurant,
} from "@/lib/restaurants";
import Image from "next/image";
import { useAuth } from "@/app/global/auth/useAuth";

export default function ReviewsPage() {
  const params = useParams();
  const id = Number(params?.id ?? NaN);
  const router = useRouter();
  const { isLogin, loginMember } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [restaurantInfo, setRestaurantInfo] = useState<Restaurant | null>(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  useEffect(() => {
    async function init() {
      try {
        setLoadingRestaurant(true);
        const raw = sessionStorage.getItem("selectedRestaurant");
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const parsedId = Number(parsed && parsed.id ? parsed.id : NaN);

            if (
              Number.isFinite(parsedId) &&
              Number.isFinite(id) &&
              parsedId === id
            ) {
              setRestaurantInfo(parsed as Restaurant);
            } else if (!Number.isFinite(id) || Number.isNaN(id)) {
              setRestaurantInfo(parsed as Restaurant);
            } else {
              try {
                const fetched = await fetchRestaurantById(id);
                setRestaurantInfo(fetched);
              } catch (e) {
                console.error(
                  "fetchRestaurantById (mismatch fallback) failed",
                  e
                );

                setRestaurantInfo(parsed as Restaurant);
              }
            }
          } catch (e) {
            console.error("parse selectedRestaurant", e);

            try {
              const fetched = await fetchRestaurantById(id);
              setRestaurantInfo(fetched);
            } catch (ef) {
              console.error("fetchRestaurantById fallback failed", ef);
            }
          }
        } else {
          try {
            const fetched = await fetchRestaurantById(id);
            setRestaurantInfo(fetched);
          } catch (e) {
            console.error("fetchRestaurantById fallback failed", e);
          }
        }
      } catch (e) {
        console.error("init restaurant info failed", e);
      } finally {
        setLoadingRestaurant(false);
      }

      await load();
    }
    init();
  }, [id]);

  async function load() {
    if (!Number.isFinite(id) || Number.isNaN(id)) {
      console.warn(
        "invalid restaurant id in route, skipping fetchReviews:",
        id
      );
      setReviews([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetchReviews(id);
      setReviews(res || []);
    } catch (e) {
      console.error("fetch reviews failed", e);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLogin) {
      if (
        confirm("리뷰 작성은 로그인 후 가능합니다. 로그인 페이지로 이동할까요?")
      ) {
        router.push("/login");
      }
      return;
    }

    const useId =
      Number.isFinite(id) && !Number.isNaN(id)
        ? id
        : Number(restaurantInfo?.id ?? NaN);

    if (!Number.isFinite(useId) || Number.isNaN(useId) || useId <= 0) {
      window.alert(
        "이 식당은 서버에 등록되어 있지 않아 리뷰 작성이 불가능합니다."
      );
      return;
    }

    if (!content || content.trim().length === 0) {
      window.alert("리뷰 내용을 입력해주세요.");
      return;
    }
    try {
      console.debug(
        "[reviews:onSubmit] routeId=",
        id,
        "restaurantInfo.id=",
        restaurantInfo?.id,
        "useId=",
        useId,
        "rating=",
        rating
      );
      setLoading(true);
      await createReview(useId, { rating, content });
      console.debug(
        "[reviews:onSubmit] createReview succeeded for useId=",
        useId
      );

      try {
        const refreshed = await fetchRestaurantById(useId);
        setRestaurantInfo(refreshed as Restaurant);
        try {
          const payload = {
            id: refreshed.id,
            name: refreshed.name,
            roadAddress: refreshed.roadAddress,
            jibunAddress: refreshed.jibunAddress,
            image: refreshed.image,
            phone: refreshed.phone,
            averageRating: refreshed.averageRating,
            reviewCount: refreshed.reviewCount,
            latitude: refreshed.latitude,
            longitude: refreshed.longitude,
            placeUrl:
              (refreshed as any).placeUrl || (restaurantInfo as any)?.placeUrl,
          };
          sessionStorage.setItem("selectedRestaurant", JSON.stringify(payload));
        } catch (e) {
          console.error("store selectedRestaurant after review create", e);
        }
      } catch (e) {
        console.error("refresh restaurant after review create failed", e);
      }
      setContent("");
      setRating(5);
      await load();

      try {
        const key = "myReviewedRestaurants";
        const raw = sessionStorage.getItem(key) || "[]";
        const arr = JSON.parse(raw);
        const next = Array.isArray(arr) ? arr.slice() : [];
        const rid = Number(useId);
        if (!next.includes(rid)) {
          next.push(rid);
          sessionStorage.setItem(key, JSON.stringify(next));
        }
      } catch (e) {
        console.error("store myReviewedRestaurants failed", e);
      }
      try {
        router.replace(`/restaurants/${useId}/reviews`);
      } catch (e) {}
    } catch (err) {
      console.error("create review failed", err);

      try {
        const maybe = err as any;
        const serverMsg =
          maybe && maybe.rsData && maybe.rsData.msg
            ? maybe.rsData.msg
            : err instanceof Error
            ? err.message
            : String(err);
        const resultCode =
          maybe && maybe.rsData && maybe.rsData.resultCode
            ? maybe.rsData.resultCode
            : null;
        const notFoundLike =
          resultCode === "404-001" || /존재하지|404|Not Found/i.test(serverMsg);
        if (notFoundLike && restaurantInfo) {
          try {
            const payload = {
              name: restaurantInfo.name ?? "",
              jibunAddress: restaurantInfo.jibunAddress ?? "",
              roadAddress: restaurantInfo.roadAddress ?? "",
              phone: restaurantInfo.phone ?? "",
              latitude:
                (restaurantInfo as any).latitude ??
                (restaurantInfo as any).lat ??
                NaN,
              longitude:
                (restaurantInfo as any).longitude ??
                (restaurantInfo as any).lng ??
                NaN,
            };
            if (
              !Number.isFinite(payload.latitude) ||
              !Number.isFinite(payload.longitude)
            ) {
              throw new Error("레스토랑 좌표 정보가 충분하지 않습니다.");
            }
            const created = await createRestaurantWithOpts(payload as any, {
              asImported: true,
            });
            try {
              const key = "kakaoImportedRestaurants";
              const stored = JSON.parse(sessionStorage.getItem(key) || "[]");
              if (Array.isArray(stored)) {
                stored.push(Number((created as any).id));
                sessionStorage.setItem(key, JSON.stringify(stored));
              } else {
                sessionStorage.setItem(
                  key,
                  JSON.stringify([Number((created as any).id)])
                );
              }
            } catch (e) {
              console.error("store kakaoImportedRestaurants", e);
            }
            if (created && (created as any).id) {
              const createdId = Number((created as any).id);
              console.debug(
                "[reviews:onSubmit] recovery created restaurant id=",
                createdId
              );
              await createReview(createdId, {
                rating,
                content,
              });

              try {
                setRestaurantInfo(created as any);
                const payload = {
                  id: created.id,
                  name: created.name,
                  roadAddress: created.roadAddress,
                  jibunAddress: created.jibunAddress,
                  image: created.image,
                  phone: created.phone,
                  averageRating: created.averageRating,
                  reviewCount: created.reviewCount,
                  latitude: created.latitude,
                  longitude: created.longitude,
                  placeUrl:
                    (created as any).placeUrl ||
                    (restaurantInfo as any).placeUrl,
                };
                sessionStorage.setItem(
                  "selectedRestaurant",
                  JSON.stringify(payload)
                );
              } catch (e) {
                console.error("store selectedRestaurant after create", e);
              }

              try {
                const fresh = await fetchReviews(createdId);
                setReviews(fresh || []);
              } catch (e) {
                console.error("fetch reviews after recovery failed", e);
              }

              try {
                const key = "myReviewedRestaurants";
                const raw = sessionStorage.getItem(key) || "[]";
                const arr = JSON.parse(raw);
                const next = Array.isArray(arr) ? arr.slice() : [];
                if (!next.includes(createdId)) {
                  next.push(createdId);
                  sessionStorage.setItem(key, JSON.stringify(next));
                }
              } catch (e) {
                console.error(
                  "store myReviewedRestaurants (recovery) failed",
                  e
                );
              }

              setContent("");
              setRating(5);
              try {
                router.replace(`/restaurants/${createdId}/reviews`);
              } catch (e) {}
              return;
            }
          } catch (e2) {
            console.error("recovery createRestaurant failed", e2);
          }
        }
      } catch (e) {
        console.error("create review recovery check failed", e);
      }

      try {
        const maybe = err as any;
        const serverMsg =
          maybe && maybe.rsData && maybe.rsData.msg
            ? maybe.rsData.msg
            : maybe?.message;
        if (serverMsg) window.alert(`리뷰 등록 중 오류: ${serverMsg}`);
        else window.alert("리뷰 등록 중 오류가 발생했습니다.");
      } catch (e) {
        window.alert("리뷰 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(rid: number) {
    if (!confirm("리뷰를 삭제하시겠습니까?")) return;
    try {
      await deleteReview(rid);
      await load();
    } catch (e) {
      console.error("delete review failed", e);
      window.alert("삭제 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-10 md:py-16">
        <div className="px-4 md:px-6 max-w-3xl mx-auto">
          {/* 상단 타이틀 영역 */}
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                리뷰
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                방문하신 식당에 대한 솔직한 후기를 남겨주세요.
              </p>
            </div>

            <button
              onClick={() => router.push("/restaurants")}
              className="inline-flex items-center justify-center rounded-md border bg-muted px-3 py-1.5 text-xs md:text-sm font-medium text-foreground shadow-sm hover:bg-muted/80 transition-colors"
            >
              식당 지도 돌아가기
            </button>
          </div>

          {/* 식당 정보 카드 */}
          {restaurantInfo && (
            <div className="mb-8 rounded-2xl border bg-card p-4 md:p-5 shadow-sm flex gap-4">
              <div className="relative h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-xl bg-muted">
                <Image
                  src={restaurantInfo.image || "/placeholder.svg"}
                  alt={restaurantInfo.name || "식당"}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="text-lg md:text-xl font-bold">
                    {restaurantInfo.name}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {restaurantInfo.roadAddress || restaurantInfo.jibunAddress}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">
                    ⭐{" "}
                    {typeof restaurantInfo.averageRating === "number" &&
                    Number.isFinite(restaurantInfo.averageRating)
                      ? (
                          Math.round(
                            Number(restaurantInfo.averageRating) * 10
                          ) / 10
                        ).toFixed(1)
                      : "-"}
                  </span>
                  <span className="text-xs">
                    리뷰 {restaurantInfo.reviewCount ?? 0}개
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 리뷰 작성 폼 */}
          <div className="mb-8 rounded-2xl border bg-card p-4 md:p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base md:text-lg font-semibold">리뷰 작성</h3>
              {loginMember && (
                <span className="text-xs text-muted-foreground">
                  {loginMember.nickname} 님으로 작성 중
                </span>
              )}
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">평점</label>
                <div className="flex gap-2">
                  {[5, 4, 3, 2, 1].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRating(v)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        rating === v
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted"
                      }`}
                    >
                      ⭐ {v}점
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">내용</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="resize-none w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                  placeholder="음식 맛, 분위기, 서비스 등 자유롭게 작성해주세요."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "작성 중..." : "리뷰 작성"}
                </button>
              </div>
            </form>
          </div>

          {/* 리뷰 리스트 */}
          <section className="mb-4">
            <h3 className="mb-3 text-base md:text-lg font-semibold">
              전체 리뷰
            </h3>

            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                로딩중...
              </div>
            )}

            {!loading && reviews.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground rounded-2xl border bg-card">
                등록된 리뷰가 없습니다. 첫 리뷰의 주인공이 되어주세요!
              </div>
            )}

            <ul className="space-y-3">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm md:text-base">
                          {r.memberNickname ?? "익명"}
                        </div>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(r.createdAt || "").toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-yellow-100/80 px-2 py-0.5 text-xs font-semibold">
                        ⭐ {r.rating}점
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-sm leading-relaxed whitespace-pre-line">
                    {r.content}
                  </div>

                  <div className="mt-3 flex justify-end">
                    {loginMember &&
                    r.memberId &&
                    Number(loginMember.id) === Number(r.memberId) ? (
                      <button
                        onClick={() => onDelete(r.id)}
                        className="text-xs text-red-500 hover:text-red-600 underline-offset-2 hover:underline"
                      >
                        리뷰 삭제
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
