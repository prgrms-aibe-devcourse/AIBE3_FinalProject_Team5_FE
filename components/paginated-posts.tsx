"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, MessageCircle, Heart, Share2, ChevronLeft, ChevronRight } from "lucide-react"

type Post = any

export default function PaginatedPosts({
  posts,
  selectedCategory,
}: {
  posts: Post[]
  selectedCategory?: string
}) {
  const perPage = 5
  const [page, setPage] = useState(1)

  const filtered =
    !selectedCategory || selectedCategory === "all" ? posts : posts.filter((p: Post) => p.category === selectedCategory)

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))

  const start = (page - 1) * perPage
  const visible = filtered.slice(start, start + perPage)

  useEffect(() => {
    setPage(1)
  }, [selectedCategory])

  function goto(p: number) {
    if (p < 1 || p > totalPages) return
    setPage(p)
    const el = document.querySelector("#onelife-posts")
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <>
      <div id="onelife-posts" className="space-y-4">
        {visible.map((post) => (
          <Link key={post.id} href={`/onelife/post/${post.id}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{post.category}</Badge>
                      <span className="text-sm text-muted-foreground">{post.time}</span>
                    </div>

                    <h3 className="text-lg font-semibold mb-2 text-balance">{post.title}</h3>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags?.map((tag: string, index: number) => (
                        <span key={index} className="text-xs text-primary">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image
                          src={post.avatar || "/placeholder.svg" || "/placeholder.svg"}
                          alt={post.author}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <span className="text-sm text-muted-foreground">{post.author}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{post.views?.toLocaleString?.()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes}</span>
                        </div>
                        {/* 댓글 기능은 '정보' 카테고리에서는 숨깁니다 */}
                        {post.category !== "정보" && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comments}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Share2 className="h-4 w-4" />
                          <span>{post.shares}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block w-40 h-32 flex-shrink-0">
                    <Image
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                      width={160}
                      height={128}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goto(page - 1)}
          disabled={page === 1}
          className="cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {Array.from({ length: totalPages }).map((_, i) => (
          <Button
            key={i}
            variant={page === i + 1 ? "default" : "ghost"}
            size="icon"
            className={`${page === i + 1 ? "bg-primary" : ""} cursor-pointer`}
            onClick={() => goto(i + 1)}
          >
            {i + 1}
          </Button>
        ))}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => goto(page + 1)}
          disabled={page === totalPages}
          className="cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </>
  )
}
