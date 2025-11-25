"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";

interface Region {
  code: string;
  full: string;
  small: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (regions.length === 0) {
      alert("최소 1개의 동네를 선택해주세요.");
      return;
    }

    const signupData = {
      nickname,
      email,
      password,
      regions,
    };

    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      if (response.ok) {
        alert("회원가입이 완료되었습니다!");
        router.push("/login");
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.message || "회원가입에 실패했습니다. 다시 시도해주세요.";
        alert(message);
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const removeRegion = (region: string) => {
    setRegions(regions.filter((n) => n.full !== region));
  };

  const searchRegion = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(
        `${baseUrl}/api/v1/region/search?query=${query}&page=${currentPage}&pageSize=5`
      );

      const json = await res.json();

      setTotalPage(parseInt(json?.response?.page?.total));

      const items = json?.response?.result?.featureCollection?.features ?? [];

      const formatted: Region[] = items.map((i: any) => ({
        code: i.properties.emd_cd,
        full: i.properties.full_nm,
        small: i.properties.emd_kor_nm,
      }));

      console.log(formatted);

      setSearchResults(formatted);
    } catch (e) {
      console.error(e);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    searchRegion(searchQuery);
  }, [currentPage]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                  회원가입
                </CardTitle>
                <p className="text-sm text-muted-foreground text-center">
                  OneLife와 함께 시작하세요
                </p>
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
                    <label className="text-sm font-medium">
                      내 동네 설정 (최대 4개)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="동네 이름 검색..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                          disabled={regions.length >= 4}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          setCurrentPage(1);
                          setIsModalOpen(true);
                          searchRegion(searchQuery);
                        }}
                        disabled={regions.length >= 4}
                      >
                        검색
                      </Button>
                    </div>
                    {regions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {regions.map((region) => (
                          <Badge
                            key={region.code}
                            variant="secondary"
                            className="gap-1"
                          >
                            {region.full}
                            <button
                              type="button"
                              onClick={() => removeRegion(region.full)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      동 단위로 입력해주세요 (예: 역삼동, 강남동)
                    </p>
                  </div>

                  <Button type="submit" className="w-full">
                    회원가입
                  </Button>
                </form>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">
                    이미 회원이신가요?{" "}
                  </span>
                  <Link
                    href="/login"
                    className="text-primary hover:underline font-medium"
                  >
                    로그인
                  </Link>
                </div>
              </CardContent>
            </Card>
            {isModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-80">
                  <h2 className="text-lg font-semibold mb-4">동네 검색</h2>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="빛가람동, 역삼동 등..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                        }}
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        searchRegion(searchQuery);
                        setCurrentPage(1);
                      }}
                      disabled={regions.length >= 4}
                    >
                      검색
                    </Button>
                  </div>
                  <div className="max-h-56 overflow-y-auto mt-3 border rounded">
                    {searchResults.length === 0 ? (
                      <p className="text-center text-sm text-gray-500 py-4">
                        검색 결과가 없습니다.
                      </p>
                    ) : (
                      searchResults.map((item, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedIndex(index)}
                          className={`px-3 py-2 cursor-pointer ${
                            selectedIndex === index
                              ? "bg-blue-500 text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {item.full}
                        </div>
                      ))
                    )}
                  </div>

                  {totalPage > 1 && (
                    <div className="flex justify-center mt-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        이전
                      </Button>

                      <span className="text-sm flex items-center">
                        {currentPage} / {totalPage}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPage}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        다음
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      취소
                    </Button>

                    <Button
                      onClick={() => {
                        if (selectedIndex !== null) {
                          const selected = searchResults[selectedIndex];
                          if (!regions.includes(selected)) {
                            setRegions([...regions, selected]);
                          }
                        }
                        setIsModalOpen(false);
                        setSelectedIndex(null);
                        setSearchResults([]);
                        setSearchQuery("");
                      }}
                      disabled={selectedIndex === null}
                    >
                      추가
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
