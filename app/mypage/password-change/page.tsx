"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/app/global/auth/useAuth";

export default function PasswordChangePage() {
  const router = useRouter();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [emailWait, setEamilWait] = useState(false);
  const { reloadMember } = useAuth();

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleVerifyEmail = async () => {
    setEamilWait(true);
    try {
      const res = await fetch(`${baseUrl}/api/v1/email/send-for-password`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        alert("이메일 인증 요청 실패");
        return;
      }

      setEamilWait(false);
      alert("인증 이메일을 발송했습니다.");
    } catch (err) {
      console.error(err);
      alert("이메일 인증 요청 중 오류 발생");
      setEamilWait(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPw !== confirmPw) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPw.length < 8 || newPw.length > 13) {
      setError("비밀번호는 8자 이상 13자 이하이어야 합니다.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${baseUrl}/api/v1/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: currentPw,
          newPassword: newPw,
          authCode: authCode,
        }),
      });

      if (!res.ok) {
        alert("이메일 인증 요청 실패");
        return;
      }

      alert("비밀번호가 성공적으로 변경되었습니다!");
      router.push("/mypage");
    } catch (err) {
      console.error(err);
      setError(
        "비밀번호 변경에 실패했습니다. 이메일 인증을 새로 진행해 주세요."
      );
      setEamilWait(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const check = async () => {
      const login = await reloadMember();
      if (login === false) {
        alert("로그인 후 이용해 주세요.");
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
                  비밀번호 변경
                </CardTitle>
                <p className="text-sm text-muted-foreground text-center">
                  새로운 비밀번호를 설정해주세요
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={emailWait}
                  onClick={handleVerifyEmail}
                >
                  이메일 인증하기
                </Button>

                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="인증번호"
                  value={authCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setAuthCode(val === "" ? "" : val);
                  }}
                  required
                />

                <Separator />
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">현재 비밀번호</label>
                    <Input
                      type="password"
                      placeholder="현재 비밀번호"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">새 비밀번호</label>
                    <Input
                      type="password"
                      placeholder="새 비밀번호"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      새 비밀번호 확인
                    </label>
                    <Input
                      type="password"
                      placeholder="새 비밀번호 확인"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      required
                    />
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "변경 중..." : "비밀번호 변경"}
                  </Button>
                </form>

                <Separator />

                <Button variant="ghost" className="w-full mt-2" asChild>
                  <Link href="/mypage/edit">← 돌아가기</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
