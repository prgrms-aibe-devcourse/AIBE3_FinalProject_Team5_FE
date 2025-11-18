"use client"

import type React from "react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault()
    const services = document.getElementById("services")
    if (!services) return
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    services.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    })
    try {
      if (history && history.replaceState) {
        history.replaceState(null, "", "#services")
      }
    } catch {}
  }

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-balance sm:text-6xl md:text-7xl lg:text-6xl mb-6">
            <span className="block">혼자여도 외롭지 않은</span>
            <span className="block mt-4 sm:mt-6 md:mt-8">따뜻한 일상</span>
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground text-pretty leading-relaxed mb-8 max-w-2xl mx-auto">
            1인 가구를 위한 커뮤니티 플랫폼 OneLife에서
            <br />
            이웃들과 함께 더 풍요로운 혼라이프를 만들어보세요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto px-22 py-8 text-xl sm:text-2xl rounded-xl shadow-lg tracking-wide min-w-[220px] sm:min-w-[320px]"
              onClick={handleStart}
            >
              지금 시작하기
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
