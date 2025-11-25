"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/app/global/auth/useAuth";
import { useRouter } from "next/navigation";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { logoutMember, reloadMember, loginMember, isLogin } = useAuth();
  const [social, setSocial] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 실제 회원탈퇴 API 호출
      const res = await fetch(`${baseUrl}/api/v1/auth`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "회원탈퇴 실패");
        setLoading(false);
        return;
      }

      alert("회원탈퇴가 완료되었습니다.");
      logoutMember();
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setError("회원탈퇴 요청 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const check = async () => {
      const login = await reloadMember();
      if (login === false) {
        router.push("/login");
      }
    };

    check();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                  회원탈퇴
                </CardTitle>
                <p className="text-sm text-muted-foreground text-center">
                  정말 탈퇴를 진행합니까?
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <form onSubmit={handleDelete} className="space-y-4">
                  <div className="space-y-2">
                    {loginMember?.email?.split("__")[0] !== "KAKAO" && (
                      <>
                        <label className="text-sm font-medium">
                          비밀번호 확인
                        </label>
                        <Input
                          type="password"
                          placeholder="현재 비밀번호"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </>
                    )}
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    disabled={loading}
                  >
                    {loading ? "처리 중..." : "회원탈퇴"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      주의
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center leading-5">
                  회원탈퇴 시 모든 게시물 및 정보가 삭제되며
                  <br />
                  복구할 수 없습니다.
                </p>

                <div className="text-center text-sm">
                  <Link
                    href="/mypage"
                    className="text-primary hover:underline font-medium"
                  >
                    돌아가기
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
