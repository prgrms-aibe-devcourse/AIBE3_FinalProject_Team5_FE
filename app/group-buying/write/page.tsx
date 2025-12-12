"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { CalendarIcon, Search, X, ImagePlus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { useAuth } from "@/app/global/auth/useAuth";
import {
  createGroupBuyingPost,
  uploadGroupBuyingImages,
} from "@/lib/api/groupBuyingApi";
import {
  GROUP_BUYING_CATEGORIES,
  GroupBuyingCategory,
} from "@/types/groupBuying";

interface Region {
  code: string;
  full: string;
  small: string;
}

const TARGET_PEOPLE_OPTIONS = Array.from({ length: 19 }, (_, i) => i + 2);

export default function GroupBuyingWritePage() {
  const router = useRouter();
  const { isLogin } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GroupBuyingCategory>("food");
  const [content, setContent] = useState("");
  const [targetPeople, setTargetPeople] = useState("4");
  const [isPeopleDropdownOpen, setIsPeopleDropdownOpen] = useState(false);
  const [deadline, setDeadline] = useState<Date>();
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Region[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (file.size > 10 * 1024 * 1024) {
      alert("이미지는 10MB 이하여야 합니다.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setSelectedImage(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
  };

  const removeImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl("");
  };

  const searchRegion = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const url = `${baseUrl}/api/v1/region/search?query=${query}&page=${currentPage}&pageSize=5`;

      const res = await fetch(url);

      const json = await res.json();

      setTotalPage(parseInt(json?.response?.page?.total));

      const items = json?.response?.result?.featureCollection?.features ?? [];

      const formatted: Region[] = items.map((i: any) => ({
        code: i.properties.emd_cd,
        full: i.properties.full_nm,
        small: i.properties.emd_kor_nm,
      }));

      setSearchResults(formatted);
    } catch (e) {
      console.error("지역 검색 오류:", e);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    if (isRegionModalOpen) {
      searchRegion(searchQuery);
    }
  }, [currentPage, isRegionModalOpen]);

  const handleRegionSelect = () => {
    if (selectedIndex !== null) {
      const selected = searchResults[selectedIndex];
      setSelectedRegion(selected);
    }
    setIsRegionModalOpen(false);
    setSelectedIndex(null);
    setSearchResults([]);
    setSearchQuery("");
  };

  const removeRegion = () => {
    setSelectedRegion(null);
  };

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

    if (!selectedRegion) {
      alert("거래 지역을 선택해주세요.");
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

      let imageIds: number[] = [];
      if (selectedImage) {
        setIsUploading(true);

        try {
          const uploadedFiles = await uploadGroupBuyingImages([selectedImage]);
          imageIds = uploadedFiles.map((file) => file.id);
        } catch (error) {
          console.error("이미지 업로드 실패:", error);
          alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
          setIsUploading(false);
          setIsSubmitting(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const deadlineWithTime = new Date(deadline);
      deadlineWithTime.setHours(23, 59, 59, 999);

      const requestData = {
        title: title.trim(),
        category: category,
        content: content.trim(),
        targetAmount,
        targetParticipants,
        deadline: deadlineWithTime.toISOString(),
        region: selectedRegion.small,
        chatRoomName: title.trim(),
        chatRoomDescription: content.trim(),
        chatRoomMaxParticipants: targetParticipants,
        imageIds,
      };

      const createdPost = await createGroupBuyingPost(requestData);

      alert("공동구매 모집글이 등록되었습니다!");
      router.push(`/group-buying/${createdPost.id}`);
    } catch (error: any) {
      console.error("등록 실패:", error);
      alert(error.message || "등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
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
            <h1 className="text-3xl font-bold">공동구매 모집하기</h1>
            <p className="text-muted-foreground mt-2">
              함께 구매하면 더 저렴하게! 공동구매 모집 글을 작성해보세요.
            </p>
          </div>

          <Card className="shadow-none border-0">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    placeholder="예: 사과 10kg 공동구매 하실 분~"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리 *</Label>
                  <Select
                    value={category}
                    onValueChange={setCategory as any}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
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
                </div>

                {/* Region */}
                <div className="space-y-2">
                  <Label>거래 지역 *</Label>
                  <div className="flex gap-2">
                    {selectedRegion ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-sm py-2 px-3 flex-1 justify-between"
                        >
                          <span>{selectedRegion.small}</span>
                          <button
                            type="button"
                            onClick={removeRegion}
                            className="ml-2 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </Badge>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => setIsRegionModalOpen(true)}
                      >
                        <Search className="mr-2 h-4 w-4" />
                        지역 검색
                      </Button>
                    )}
                  </div>
                </div>

                {/* Amount & Target People */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">목표 금액 (원) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="예: 50000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      min="1"
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="targetPeople">모집 인원 *</Label>
                    <button
                      type="button"
                      onClick={() =>
                        setIsPeopleDropdownOpen(!isPeopleDropdownOpen)
                      }
                      className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {targetPeople}명
                    </button>

                    {/* 커스텀 드롭다운 */}
                    {isPeopleDropdownOpen && (
                      <>
                        {/* 배경 오버레이 */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsPeopleDropdownOpen(false)}
                        />

                        {/* 드롭다운 메뉴 */}
                        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {TARGET_PEOPLE_OPTIONS.map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                setTargetPeople(String(num));
                                setIsPeopleDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground ${
                                targetPeople === String(num)
                                  ? "bg-accent font-medium"
                                  : ""
                              }`}
                            >
                              {num}명
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Deadline */}
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
                        locale={ko}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
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

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>상품 사진 (선택)</Label>

                  {!selectedImage ? (
                    // 이미지 선택 전
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        id="image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading || isSubmitting}
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          클릭하여 사진을 업로드하세요
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          상품 사진을 추가하면 더 많은 관심을 받을 수 있어요
                        </p>
                      </label>
                    </div>
                  ) : (
                    // 이미지 선택 후
                    <div className="relative group">
                      <img
                        src={previewUrl}
                        alt="상품 사진"
                        className="w-full max-h-96 object-contain rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        disabled={isUploading || isSubmitting}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <Link href="/group-buying" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent"
                      disabled={isSubmitting || isUploading}
                    >
                      취소
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting || isUploading}
                  >
                    {isUploading || isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isUploading ? "이미지 업로드 중..." : "등록 중..."}
                      </>
                    ) : (
                      "등록하기"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Region Search Modal */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-60">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-4">지역 검색</h2>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="역삼동, 강남동 등..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button
                type="button"
                onClick={() => {
                  searchRegion(searchQuery);
                  setCurrentPage(1);
                }}
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
                onClick={() => {
                  setIsRegionModalOpen(false);
                  setSelectedIndex(null);
                  setSearchResults([]);
                  setSearchQuery("");
                }}
              >
                취소
              </Button>

              <Button
                onClick={handleRegionSelect}
                disabled={selectedIndex === null}
              >
                선택
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
