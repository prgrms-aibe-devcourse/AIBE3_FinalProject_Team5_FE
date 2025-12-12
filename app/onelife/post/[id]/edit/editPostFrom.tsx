"use client";

import type React from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ImagePlus, X } from "lucide-react";

import { getPostDetail, updatePost } from "@/app/api/post/postapi";
import type { PostResponse } from "@/app/onelife/types/postResponse";

export default function EditPostPage({ id }: { id: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostResponse | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("꿀팁");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getPostDetail(id);
        setPost(data);
        setTitle(data.title);
        setContent(data.content);

        const mappedCategory =
          data.postType === "TIP"
            ? "꿀팁"
            : data.postType === "FREE"
            ? "자유"
            : "정보";

        setCategory(mappedCategory);

        setTags(data.tags?.join(", ") ?? "");

        if (data.imageUrls) {
          setImages(data.imageUrls);
        }
      } catch (err) {
        console.error(err);
        alert("게시글을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const previewList: string[] = [];
    const fileList: File[] = [];

    Array.from(files).forEach((file) => {
      fileList.push(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        previewList.push(reader.result as string);

        if (previewList.length === files.length) {
          setImages((prev) => [...prev, ...previewList]);
          setImageFiles((prev) => [...prev, ...fileList]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("title", title);
    formData.append("content", content);

    const postType =
      category === "꿀팁" ? "TIP" : category === "자유" ? "FREE" : "INFO";
    formData.append("postType", postType);

    tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((tag) => formData.append("tags", tag));

    images.forEach((img) => {
      if (img.startsWith("http")) {
        formData.append("remainFileUrls", img);
      }
    });

    imageFiles.forEach((file) => formData.append("files", file));

    try {
      await updatePost(id, formData);
      alert("게시글이 수정되었습니다!");
      router.push(`/onelife/post/${id}`);
    } catch (err: any) {
      console.error("수정 실패:", err);
      alert("수정 중 오류 발생");
    }
  };

  if (loading) return <div className="text-center py-20">불러오는 중...</div>;
  if (!post) return <div>게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="p-6">
              <CardTitle className="text-2xl">게시글 수정</CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 제목 */}
                <div>
                  <label className="block mb-2 text-sm font-medium">제목</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="게시글 제목을 입력하세요"
                  />
                </div>

                {/* 카테고리 + 태그 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      카테고리
                    </label>

                    <Select
                      value={category}
                      onValueChange={(v) => setCategory(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="꿀팁">꿀팁</SelectItem>
                        <SelectItem value="자유">자유</SelectItem>
                        <SelectItem value="정보">정보</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      태그 (쉼표로 구분)
                    </label>
                    <Input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="#요리, #세탁"
                    />
                  </div>
                </div>

                {/* 내용 */}
                <div>
                  <label className="block mb-2 text-sm font-medium">내용</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px]"
                    placeholder="본문을 작성하세요"
                  />
                </div>

                {/* 이미지 */}
                <div className="space-y-2">
                  <Label>대표 사진 (선택)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      id="image-upload"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        클릭하여 사진을 업로드하세요
                      </p>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 버튼 */}
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => router.push(`/onelife/post/${id}`)}
                  >
                    취소
                  </Button>
                  <Button type="submit">저장하기</Button>
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
