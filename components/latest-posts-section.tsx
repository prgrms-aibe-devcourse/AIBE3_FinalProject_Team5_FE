"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, MessageCircle, ThumbsUp } from "lucide-react"

const posts = [
  {
    id: 1,
    category: "꿀팁",
    time: "2시간 전",
    title: "원룸에서 효율적으로 수납하는 10가지 방법",
    author: "정리왕",
    views: "1,247",
    comments: "89",
    likes: "23",
  },
  {
    id: 2,
    category: "혼밥",
    time: "4시간 전",
    title: "5분만에 완성하는 간단 혼밥 레시피 모음",
    author: "요리초보",
    views: "892",
    comments: "67",
    likes: "15",
  },
  {
    id: 3,
    category: "정책정보",
    time: "6시간 전",
    title: "2024년 청년 주거지원 정책 총정리",
    author: "정책알리미",
    views: "2,156",
    comments: "134",
    likes: "41",
  },
  {
    id: 4,
    category: "꿀팁",
    time: "8시간 전",
    title: "혼자 살 때 꼭 알아야 할 생활비 절약법",
    author: "절약마스터",
    views: "1,543",
    comments: "98",
    likes: "32",
  },
  {
    id: 5,
    category: "혼밥",
    time: "10시간 전",
    title: "집에서 만드는 카페 스타일 브런치",
    author: "브런치러버",
    views: "756",
    comments: "45",
    likes: "12",
  },
  {
    id: 6,
    category: "꿀팁",
    time: "12시간 전",
    title: "원룸 인테리어 소품으로 분위기 바꾸기",
    author: "인테리어러",
    views: "1,089",
    comments: "72",
    likes: "18",
  },
]

export function LatestPostsSection() {
  const gridRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const prefersReduced =
      typeof window !== "undefined" &&
      (window as any).matchMedia &&
      (window as any).matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReduced) {
      Array.from(grid.querySelectorAll("[data-anim-card]")).forEach((el) => {
        el.classList.remove("opacity-0", "translate-y-6")
        el.classList.add("opacity-100", "translate-y-0")
      })
      return
    }

    const timeouts: number[] = []
    const rootEl = document.querySelector("main") || null

    const reveal = () => {
      const cards = Array.from(grid.querySelectorAll("[data-anim-card]")) as HTMLElement[]
      cards.forEach((card, i) => {
        const t = window.setTimeout(() => {
          card.classList.remove("opacity-0", "translate-y-6")
          card.classList.add("opacity-100", "translate-y-0")
        }, i * 120)
        timeouts.push(t)
      })
    }

    const reset = () => {
      timeouts.forEach((id) => clearTimeout(id))
      timeouts.length = 0
      Array.from(grid.querySelectorAll("[data-anim-card]")).forEach((el) => {
        el.classList.add("opacity-0", "translate-y-6")
        el.classList.remove("opacity-100", "translate-y-0")
      })
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal()
          else reset()
        })
      },
      { root: rootEl, threshold: 0.25 },
    )

    observer.observe(grid)
    return () => {
      observer.disconnect()
      timeouts.forEach((id) => clearTimeout(id))
    }
  }, [])

  return (
    <section className="py-20 md:py-24">
      <div className="w-full max-w-[1200px] mx-auto px-6">
        <div className="flex items-start justify-between mb-12">
          <div className="sticky" style={{ top: "calc(80px + 1rem)" }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">혼라이프 게시글 리스트</h2>
            <p className="text-lg text-muted-foreground text-pretty font-semibold">
              혼라이프 주요 게시판으로 빠르게 이동하세요
            </p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex bg-transparent text-black bg-primary">
            <Link href="/onelife">더보기</Link>
          </Button>
        </div>

        <div ref={gridRef} className="grid gap-8 md:grid-cols-2 items-stretch">
          {posts.map((post) => (
            <Link href={`/onelife/${post.id}`} key={post.id}>
              <Card
                data-anim-card
                className="h-full transition-all duration-700 ease-out opacity-0 translate-y-6 hover:shadow-lg hover:scale-105 flex items-center justify-center p-12 min-h-[180px] md:min-h-[260px]"
              >
                <CardContent>
                  <CardHeader>
                    <Badge>{post.category}</Badge>
                    <h3 className="font-semibold text-xl mt-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">by {post.author}</p>
                  </CardHeader>
                  <div className="flex justify-center mt-4">
                    <div className="flex items-center mr-4">
                      <Eye className="mr-2" />
                      <span>{post.views}</span>
                    </div>
                    <div className="flex items-center mr-4">
                      <MessageCircle className="mr-2" />
                      <span>{post.comments}</span>
                    </div>
                    <div className="flex items-center">
                      <ThumbsUp className="mr-2" />
                      <span>{post.likes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
