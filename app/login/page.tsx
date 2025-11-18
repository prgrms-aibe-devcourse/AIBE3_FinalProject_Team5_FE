"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Login attempt:", { email, password })
    // TODO: Implement actual login logic with backend
    router.push("/")
  }

  const handleKakaoLogin = () => {
    console.log("[v0] Kakao login clicked")
    // TODO: Implement Kakao OAuth login
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
                <p className="text-sm text-muted-foreground text-center">OneLife에 오신 것을 환영합니다</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">이메일</label>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">비밀번호</label>
                    <Input
                      type="password"
                      placeholder="비밀번호를 입력하세요"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <Link href="/forgot-password" className="text-primary hover:underline">
                      비밀번호 찾기
                    </Link>
                  </div>

                  <Button type="submit" className="w-full">
                    로그인
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">또는</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={handleKakaoLogin}
                  style={{
                    backgroundColor: "#FEE500",
                    borderColor: "#FEE500",
                    color: "#000000",
                  }}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.636 1.752 4.944 4.4 6.32-.192.71-.633 2.366-.732 2.742-.118.448.164.441.345.32.145-.096 2.118-1.405 2.923-1.946.61.083 1.233.126 1.864.126 5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
                  </svg>
                  카카오 로그인
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">아직 회원이 아니신가요? </span>
                  <Link href="/signup" className="text-primary hover:underline font-medium">
                    회원가입
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
