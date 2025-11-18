"use client";

import type React from "react";

import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GroupWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [location, setLocation] = useState("");
  const [meetingDay, setMeetingDay] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            setImages((prev) => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("소모임이 생성되었습니다!");
    router.push("/groups");
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
              <Link href="/groups" className="hover:text-foreground">
                소모임
              </Link>
              <span>/</span>
              <span className="text-foreground">소모임 만들기</span>
            </div>

            <h1 className="text-3xl font-bold mb-2">소모임 만들기</h1>
            <p className="text-muted-foreground">
              관심사가 같은 사람들과 함께할 소모임을 만들어보세요
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리 *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="카테고리를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="맛집">맛집</SelectItem>
                      <SelectItem value="운동">운동</SelectItem>
                      <SelectItem value="문화">문화</SelectItem>
                      <SelectItem value="독서">독서</SelectItem>
                      <SelectItem value="요리">요리</SelectItem>
                      <SelectItem value="게임">게임</SelectItem>
                      <SelectItem value="여행">여행</SelectItem>
                      <SelectItem value="스터디">스터디</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">소모임 이름 *</Label>
                  <Input
                    id="title"
                    placeholder="예: 혼밥러들의 맛집 탐방"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">소모임 소개 *</Label>
                  <Textarea
                    id="description"
                    placeholder="소모임의 활동 내용, 모임 분위기, 참여 대상 등을 자세히 작성해주세요"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    required
                  />
                </div>

                {/* Max Members and Location Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxMembers">최대 인원 *</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      placeholder="예: 20"
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">활동 지역 *</Label>
                    <Input
                      id="location"
                      placeholder="예: 서울 전역"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Meeting Day */}
                <div className="space-y-2">
                  <Label htmlFor="meetingDay">모임 일정 *</Label>
                  <Input
                    id="meetingDay"
                    placeholder="예: 매주 토요일"
                    value={meetingDay}
                    onChange={(e) => setMeetingDay(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    정기 모임 일정을 입력해주세요
                  </p>
                </div>

                {/* Image Upload */}
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
                      <p className="text-xs text-muted-foreground mt-1">
                        소모임을 대표할 수 있는 사진을 추가해보세요
                      </p>
                    </label>
                  </div>

                  {/* Image Preview Grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image || "/placeholder.svg"}
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

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <Link href="/groups" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      취소
                    </Button>
                  </Link>
                  <Button type="submit" className="flex-1">
                    소모임 만들기
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
