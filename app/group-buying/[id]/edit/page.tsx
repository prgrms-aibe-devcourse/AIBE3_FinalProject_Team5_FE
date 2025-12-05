"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/app/global/auth/useAuth";
import {
  fetchGroupBuyingPost,
  updateGroupBuyingPost,
} from "@/lib/api/groupBuyingApi";
import {
  GroupBuyingPost,
  GROUP_BUYING_CATEGORIES,
  GroupBuyingCategory,
} from "@/types/groupBuying";

export default function GroupBuyingEditPage() {
  const router = useRouter();
  const params = useParams();
  const { isLogin, loginMember } = useAuth();
  const postId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [post, setPost] = useState<GroupBuyingPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "food" as GroupBuyingCategory,
    region: "",
  });
  const [deadline, setDeadline] = useState<Date>();

  useEffect(() => {
    if (!isLogin) {
      alert("로그인이 필요한 기능입니다.");
      router.push("/login");
      return;
    }

    if (!postId) return;
    loadPostData();
  }, [postId, isLogin]);

  const loadPostData = async () => {
    try {
      const postData = await fetchGroupBuyingPost(Number(postId));
      setPost(postData);

      // 주최자 확인
      if (loginMember && postData.creatorId !== loginMember.id) {
        alert("게시글 작성자만 수정할 수 있습니다.");
        router.push(`/group-buying/${postId}`);
        return;
      }

      // 폼 데이터 설정
      const deadlineDate = new Date(postData.deadline);

      setFormData({
        title: postData.title,
        content: postData.content,
        category: postData.category as GroupBuyingCategory,
        region: postData.region,
      });
      setDeadline(deadlineDate);

      setIsLoading(false);
    } catch (error) {
      console.error("게시글 로드 실패:", error);
      alert("게시글을 불러오는데 실패했습니다.");
      router.push("/group-buying");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!post) return;

    // 유효성 검사
    if (!formData.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!formData.content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    if (!formData.category) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    if (!formData.region.trim()) {
      alert("지역을 입력해주세요.");
      return;
    }

    if (!deadline) {
      alert("마감일을 선택해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      const deadlineWithTime = new Date(deadline);
      deadlineWithTime.setHours(23, 59, 59, 0);

      const isoString = deadlineWithTime.toISOString();
      const formattedDeadline = isoString.replace(/\.\d{3}Z$/, ""); // "2025-12-10T14:59:59"

      console.log("전송할 마감일:", formattedDeadline);

      await updateGroupBuyingPost(post.id, {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        region: formData.region.trim(),
        deadline: formattedDeadline,
      });

      alert("게시글이 수정되었습니다.");
      router.push(`/group-buying/${post.id}`);
    } catch (error: any) {
      console.error("수정 실패:", error);
      alert(error.message || "게시글 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLogin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <p className="text-muted-foreground">게시글을 찾을 수 없습니다.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Link
            href={`/group-buying/${postId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            상세 페이지로 돌아가기
          </Link>

          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold">게시글 수정</h1>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 제목 */}
                <div className="space-y-2">
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="제목을 입력하세요"
                    required
                  />
                </div>

                {/* 카테고리 */}
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리 *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        category: value as GroupBuyingCategory,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GROUP_BUYING_CATEGORIES).map(
                        ([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* 지역 */}
                <div className="space-y-2">
                  <Label htmlFor="region">지역 *</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({ ...formData, region: e.target.value })
                    }
                    placeholder="예: 서울시 강남구"
                    required
                  />
                </div>

                {/* 마감일 */}
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
                        disabled={(date) => date < new Date()} // 오늘 이전 날짜 선택 불가
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    선택한 날짜의 23:59:59까지 모집됩니다.
                  </p>
                </div>

                {/* 내용 */}
                <div className="space-y-2">
                  <Label htmlFor="content">내용 *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="공동구매 내용을 자세히 입력하세요"
                    rows={10}
                    required
                  />
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/group-buying/${postId}`)}
                    disabled={isSubmitting}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "수정 중..." : "수정하기"}
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
