"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { useAuth } from "@/app/global/auth/useAuth";
import { createGroupBuyingPost } from "@/lib/api/groupBuyingApi";
import {
  GROUP_BUYING_CATEGORIES,
  GroupBuyingCategory,
} from "@/types/groupBuying";

export default function GroupBuyingWritePage() {
  const router = useRouter();
  const { isLogin } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GroupBuyingCategory>("food");
  const [content, setContent] = useState("");
  const [targetPeople, setTargetPeople] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const [region, setRegion] = useState("");
  const [amount, setAmount] = useState("");
  const [chatRoomName, setChatRoomName] = useState("");
  const [chatRoomDescription, setChatRoomDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      alert("로그인이 필요한 기능입니다.");
      router.push("/login");
      return;
    }

    if (!deadline) {
      alert("마감일을 선택해주세요.");
      return;
    }

    const targetAmount = Number(amount);
    const targetParticipants = Number(targetPeople);

    if (isNaN(targetAmount) || targetAmount <= 0) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    if (isNaN(targetParticipants) || targetParticipants < 2) {
      alert("모집 인원은 최소 2명 이상이어야 합니다.");
      return;
    }

    try {
      setIsSubmitting(true);

      console.log("선택된 카테고리:", category);
      console.log("카테고리 한글명:", GROUP_BUYING_CATEGORIES[category]);

      // 마감일에 시간 추가 (23:59:59)
      const deadlineWithTime = new Date(deadline);
      deadlineWithTime.setHours(23, 59, 59, 999);

      const requestData = {
        title: title.trim(),
        category: category,
        content: content.trim(),
        targetAmount,
        targetParticipants,
        deadline: deadlineWithTime.toISOString(),
        region: region.trim(),
        chatRoomName: chatRoomName.trim() || title.trim(),
        chatRoomDescription: chatRoomDescription.trim() || content.trim(),
        chatRoomMaxParticipants: targetParticipants,
      };

      console.log("전송할 데이터:", requestData);

      const createdPost = await createGroupBuyingPost(requestData);

      console.log("생성된 게시글:", createdPost);

      alert("공동구매 모집글이 등록되었습니다!");
      router.push(`/group-buying/${createdPost.id}`);
    } catch (error: any) {
      console.error("등록 실패:", error);
      alert(error.message || "등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                홈
              </Link>
              <span>/</span>
              <Link href="/local" className="hover:text-foreground">
                로컬 커뮤니티
              </Link>
              <span>/</span>
              <Link href="/group-buying" className="hover:text-foreground">
                공동구매
              </Link>
              <span>/</span>
              <span className="text-foreground">글쓰기</span>
            </div>

            <h1 className="text-3xl font-bold mb-2">공동구매 모집글 작성</h1>
            <p className="text-muted-foreground">
              함께 구매할 상품 정보를 작성해주세요
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    placeholder="예: 코스트코 과일 공동구매 (3명 더 모집)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* 카테고리 선택 */}
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리 *</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => {
                      setCategory(value as GroupBuyingCategory);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GROUP_BUYING_CATEGORIES).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  {/* 현재 선택된 카테고리 표시 */}
                  <p className="text-xs text-muted-foreground">
                    현재 선택: {GROUP_BUYING_CATEGORIES[category]} ({category})
                  </p>
                </div>

                {/* Region and Amount Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">거래 지역 *</Label>
                    <Input
                      id="region"
                      placeholder="예: 강남구"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">목표 금액 *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="예: 100000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Target People and Deadline Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetPeople">모집 인원 *</Label>
                    <Input
                      id="targetPeople"
                      type="number"
                      placeholder="예: 10"
                      value={targetPeople}
                      onChange={(e) => setTargetPeople(e.target.value)}
                      required
                      min="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>마감일 *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deadline ? (
                            format(deadline, "PPP", { locale: ko })
                          ) : (
                            <span>날짜를 선택하세요</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={deadline}
                          onSelect={setDeadline}
                          initialFocus
                          locale={ko}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">내용 *</Label>
                  <Textarea
                    id="content"
                    placeholder="상품 상세 정보, 거래 방법, 주의사항 등을 자세히 작성해주세요"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <Link href="/group-buying" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent"
                      disabled={isSubmitting}
                    >
                      취소
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "등록 중..." : "등록하기"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
