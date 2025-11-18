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
import { Badge } from "@/components/ui/badge"
import { X, Search } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [neighborhoods, setNeighborhoods] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }

    if (neighborhoods.length === 0) {
      alert("최소 1개의 동네를 선택해주세요.")
      return
    }

    console.log("[v0] Signup data:", {
      nickname,
      email,
      password,
      neighborhoods,
    })

    // TODO: Implement actual signup logic with backend
    router.push("/login")
  }

  const addNeighborhood = () => {
    if (searchQuery.trim() && neighborhoods.length < 4) {
      if (!neighborhoods.includes(searchQuery.trim())) {
        setNeighborhoods([...neighborhoods, searchQuery.trim()])
        setSearchQuery("")
      }
    }
  }

  const removeNeighborhood = (neighborhood: string) => {
    setNeighborhoods(neighborhoods.filter((n) => n !== neighborhood))
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">회원가입</CardTitle>
                <p className="text-sm text-muted-foreground text-center">OneLife와 함께 시작하세요</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">닉네임</label>
                    <Input
                      placeholder="사용할 닉네임을 입력하세요"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      required
                    />
                  </div>

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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">비밀번호 확인</label>
                    <Input
                      type="password"
                      placeholder="비밀번호를 다시 입력하세요"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">내 동네 설정 (최대 4개)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="동네 이름 검색..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addNeighborhood()
                            }
                          }}
                          className="pl-10"
                          disabled={neighborhoods.length >= 4}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={addNeighborhood}
                        disabled={!searchQuery.trim() || neighborhoods.length >= 4}
                      >
                        추가
                      </Button>
                    </div>
                    {neighborhoods.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {neighborhoods.map((neighborhood) => (
                          <Badge key={neighborhood} variant="secondary" className="gap-1">
                            {neighborhood}
                            <button
                              type="button"
                              onClick={() => removeNeighborhood(neighborhood)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">동 단위로 입력해주세요 (예: 역삼동, 강남동)</p>
                  </div>

                  <Button type="submit" className="w-full">
                    회원가입
                  </Button>
                </form>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">이미 회원이신가요? </span>
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    로그인
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
