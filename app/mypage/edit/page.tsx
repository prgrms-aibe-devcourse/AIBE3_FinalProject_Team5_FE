"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfileEditPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nickname: "혼라이프러버",
    location: "강남구 역삼동",
    bio: "1인 가구의 소소한 일상을 공유합니다",
    email: "user@example.com",
    phone: "010-1234-5678",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("[v0] Profile update submitted:", formData);

    setIsSubmitting(false);
    router.push("/mypage");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <Link href="/mypage">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  돌아가기
                </Button>
              </Link>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">프로필 수정</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col items-center gap-4 pb-6 border-b">
                    <div className="relative">
                      <Avatar className="h-32 w-32">
                        <AvatarFallback className="text-4xl">
                          {formData.nickname[0]}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-0 right-0 rounded-full h-10 w-10"
                      >
                        <Camera className="h-5 w-5" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      프로필 사진을 변경하려면 클릭하세요
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nickname">닉네임</Label>
                      <Input
                        id="nickname"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleInputChange}
                        placeholder="닉네임을 입력하세요"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">이메일</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="이메일을 입력하세요"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">전화번호</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="전화번호를 입력하세요"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">지역</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="거주 지역을 입력하세요"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">소개</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="자기소개를 입력하세요"
                        rows={4}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {formData.bio.length} / 200
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => router.push("/mypage")}
                    >
                      취소
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "저장 중..." : "저장"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl">계정 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    비밀번호 변경
                  </Button>
                </div>
                <div>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-destructive hover:text-destructive bg-transparent"
                  >
                    계정 탈퇴
                  </Button>
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
