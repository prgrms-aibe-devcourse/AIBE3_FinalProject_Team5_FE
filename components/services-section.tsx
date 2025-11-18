"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Users, ShoppingCart, Lightbulb } from "lucide-react"

const services = [
  {
    title: "혼라이프",
    description: "혼자 사는 일상 꿀팁과 정보를 나누는 공간",
    features: ["생활 꿀팁", "혼밥 레시피", "정책 정보"],
    icon: Home,
    href: "/onelife",
    bgColor: "bg-[#ffffff]",
  },
  {
    title: "로컬 커뮤니티",
    description: "우리 동네 이웃들과 함께하는 따뜻한 소통",
    features: ["동네 소식", "밥친구 찾기", "소모임"],
    icon: Users,
    href: "/local",
    bgColor: "bg-[#ffffff]",
  },
  {
    title: "공동구매",
    description: "함께 사면 저렴하고 재미있는 공동구매",
    features: ["생필품 공구", "실시간 채팅", "배송비 절약"],
    icon: ShoppingCart,
    href: "/local/group-buying",
    bgColor: "bg-[#ffffff]",
  },
  {
    title: "생활꿀팁",
    description: "혼자 살기 위한 실용적인 생활 정보",
    features: ["절약 노하우", "요리 팁", "인테리어"],
    icon: Lightbulb,
    href: "/onelife?category=tips",
    bgColor: "bg-[#ffffff]",
  },
]

export function ServicesSection() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      (window as any).matchMedia &&
      (window as any).matchMedia("(prefers-reduced-motion: reduce)").matches

    const grid = containerRef.current
    if (!grid) return

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
          if (entry.isIntersecting) {
            reveal()
          } else {
            reset()
          }
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
      <div className="w-full max-w-[2400px] mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">OneLife 서비스</h2>
          <p className="text-lg text-muted-foreground text-pretty font-semibold">
            혼자 살아도 함께하는 즐거움을 경험해보세요.
          </p>
        </div>

        <div
          ref={containerRef}
          className="grid gap-12 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 items-stretch"
        >
          {services.map((service) => {
            const Icon = service.icon
            return (
              <Link key={service.title} href={service.href}>
                <Card
                  data-anim-card
                  className={`h-full transition-all duration-700 ease-out opacity-0 translate-y-6 hover:shadow-lg hover:scale-105 ${service.bgColor} border-0 p-12 md:p-14 min-h-[380px] flex flex-col justify-between`}
                >
                  <CardHeader className="flex flex-col items-center text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-lg mx-auto">
                      <Icon className="h-10 w-10 md:h-12 md:w-12 text-primary2" />
                    </div>
                    <CardTitle className="text-xl md:text-xl lg:text-xl font-semibold md:whitespace-nowrap">
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed mt-1 text-black">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mt-4">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-3 h-2 w-2 rounded-full bg-primary2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
