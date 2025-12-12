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
import { ArrowLeft, CalendarIcon, ImagePlus, X, Search } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/app/global/auth/useAuth";
import {
  fetchGroupBuyingPost,
  updateGroupBuyingPost,
  uploadGroupBuyingImages,
} from "@/lib/api/groupBuyingApi";
import {
  GroupBuyingPost,
  GROUP_BUYING_CATEGORIES,
  GroupBuyingCategory,
} from "@/types/groupBuying";

interface Region {
  code: string;
  full: string;
  small: string;
}

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

  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Region[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState<string>("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

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

      if (loginMember && postData.creatorId !== loginMember.id) {
        alert("게시글 작성자만 수정할 수 있습니다.");
        router.push(`/group-buying/${postId}`);
        return;
      }

      const deadlineDate = new Date(postData.deadline);

      setFormData({
        title: postData.title,
        content: postData.content,
        category: postData.category as GroupBuyingCategory,
        region: postData.region,
      });

      if (postData.region) {
        setSelectedRegion({
          code: "",
          full: postData.region,
          small: postData.region,
        });
      }
      setDeadline(deadlineDate);

      if (postData.images && postData.images.length > 0) {
        setExistingImages(postData.images);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("게시글 로드 실패:", error);
      alert("게시글을 불러오는데 실패했습니다.");
      router.push("/group-buying");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (existingImages.length > 0) {
      alert("기존 이미지를 먼저 삭제해주세요.");
      return;
    }

    const file = files[0];

    if (file.size > 10 * 1024 * 1024) {
      alert("이미지는 10MB 이하여야 합니다.");
      return;
    }

    setNewImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) =>
      prev.filter((_: string, i: number) => i !== index)
    );
  };

  const removeNewImage = () => {
    setNewImage("");
    setNewImageFile(null);
  };

  const searchRegions = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const url = `${baseUrl}/api/v1/region/search?query=${encodeURIComponent(
        query
      )}&page=${page}&pageSize=5`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error("응답 실패:", response.status);
        throw new Error("지역 검색 실패");
      }

      const json = await response.json();

      setTotalPage(parseInt(json?.response?.page?.total) || 0);

      const items = json?.response?.result?.featureCollection?.features ?? [];

      const formatted: Region[] = items.map((i: any) => ({
        code: i.properties.emd_cd,
        full: i.properties.full_nm,
        small: i.properties.emd_kor_nm,
      }));

      setSearchResults(formatted);
      setCurrentPage(page);
    } catch (error) {
      console.error("지역 검색 오류:", error);
      setSearchResults([]);
    }
  };

  const handleRegionSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchRegions(searchQuery, 1);
  };

  const selectRegion = (region: Region) => {
    setSelectedRegion(region);
    setFormData({ ...formData, region: region.small });
    setIsRegionModalOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeRegion = () => {
    setSelectedRegion(null);
    setFormData({ ...formData, region: "" });
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

    if (!selectedRegion) {
      alert("거래 지역을 선택해주세요.");
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
      const formattedDeadline = isoString.replace(/\.\d{3}Z$/, "");

      console.log("전송할 마감일:", formattedDeadline);
      console.log("기존 이미지:", existingImages.length, "개");
      console.log("새 이미지:", newImage ? 1 : 0, "개");

      let imageIds: number[] = [];
      if (newImageFile) {
        try {
          const uploadedFiles = await uploadGroupBuyingImages([newImageFile]);
          imageIds = uploadedFiles.map((file) => file.id);
        } catch (error) {
          console.error("이미지 업로드 실패:", error);
          alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
          setIsSubmitting(false);
          return;
        }
      }

      await updateGroupBuyingPost(post.id, {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        region: formData.region.trim(),
        deadline: formattedDeadline,
        imageIds: imageIds.length > 0 ? imageIds : undefined,
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
                  <Label>거래 지역 *</Label>
                  <div className="flex gap-2">
                    {selectedRegion ? (
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 border rounded-md bg-gray-50 flex items-center justify-between">
                          <span>{selectedRegion.small}</span>
                          <button
                            type="button"
                            onClick={removeRegion}
                            className="ml-2 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => setIsRegionModalOpen(true)}
                      >
                        지역 검색
                      </Button>
                    )}
                  </div>
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
                        disabled={(date) => date < new Date()}
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

                {/* 이미지 업로드 (1개만 - 큰 화면) */}
                <div className="space-y-2">
                  <Label>상품 사진 (선택)</Label>

                  {/* 기존 이미지 표시 */}
                  {existingImages.length > 0 && !newImage && (
                    <div className="relative group">
                      <img
                        src={existingImages[0]}
                        alt="상품 사진"
                        className="w-full max-h-96 object-contain rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(0)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* 새 이미지 표시 */}
                  {newImage && (
                    <div className="relative group">
                      <img
                        src={newImage}
                        alt="새 상품 사진"
                        className="w-full max-h-96 object-contain rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage()}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">
                        새 이미지
                      </div>
                    </div>
                  )}

                  {/* 이미지 없을 때 업로드 영역 */}
                  {existingImages.length === 0 && !newImage && (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        id="image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
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
                  )}
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

      {/* 지역 검색 모달 */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">지역 검색</h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegionModalOpen(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="hover:text-destructive"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              <form onSubmit={handleRegionSearch} className="flex gap-2 mb-4">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="지역을 검색하세요 (예: 강남구)"
                  className="flex-1"
                />
                <Button type="submit">
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              <div className="flex-1 overflow-y-auto border rounded-md">
                {searchResults.length > 0 ? (
                  <div className="divide-y">
                    {searchResults.map((region, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectRegion(region)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                          selectedIndex === index ? "bg-gray-50" : ""
                        }`}
                      >
                        <div className="font-medium">{region.small}</div>
                        <div className="text-sm text-muted-foreground">
                          {region.full}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {searchQuery
                      ? "검색 결과가 없습니다"
                      : "지역을 검색해주세요"}
                  </div>
                )}
              </div>

              {totalPage > 1 && (
                <div className="flex gap-2 justify-center mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => searchRegions(searchQuery, currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    이전
                  </Button>
                  <span className="flex items-center px-3">
                    {currentPage} / {totalPage}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => searchRegions(searchQuery, currentPage + 1)}
                    disabled={currentPage === totalPage}
                  >
                    다음
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
