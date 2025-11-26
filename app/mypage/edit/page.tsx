"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/app/global/auth/useAuth";

interface Location {
  code: string;
  full: string;
  small: string;
}

interface FormData {
  nickname: string;
  regions: Location[];
  introduction: string;
  email: string;
  profileImage: File | null;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginMember, isLogin, reloadMember } = useAuth();
  const [loading, setLoading] = useState(false);
  const [prevNickname, setPrevNickname] = useState("");
  const [nicknameAvailable, setNicknameAvailable] = useState(false);
  const [prevEmail, setPrevEmail] = useState("");
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [emailWait, setEamilWait] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [social, setSocial] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (nicknameAvailable !== true && formData?.nickname !== prevNickname) {
      alert("닉네임 중복확인을 해주세요.");
      setIsSubmitting(false);
      return;
    }

    if (emailAvailable !== true && formData?.email !== prevEmail) {
      alert("이메일 인증을 해주세요.");
      setIsSubmitting(false);
      return;
    }

    const fd = new FormData();

    fd.append(
      "request",
      JSON.stringify({
        nickname: formData?.nickname,
        email: formData?.email,
        introduction: formData?.introduction,
        regions: formData?.regions,
      })
    );

    if (formData?.profileImage) {
      fd.append("profileImage", formData.profileImage);
    }

    try {
      const response = await fetch(
        `${baseUrl}/api/v1/members/${loginMember?.id}`,
        {
          method: "PUT",
          body: fd,
          credentials: "include",
        }
      );

      if (response.ok) {
        alert("회원 정보 수정이 완료되었습니다!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || "회원 정보 수정에 실패하였습니다.";
        alert(message);
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    }

    setIsSubmitting(false);
    router.push("/mypage");
  };

  useEffect(() => {
    if (isLogin && loginMember?.id) {
      const getMemberDetail = async () => {
        try {
          const res = await fetch(
            `${baseUrl}/api/v1/members/edit/${loginMember.id}`
          );
          if (!res.ok) {
            alert("로그인 정보를 불러올 수 없습니다.");
            return;
          }
          const result = await res.json();
          if (result.email.split("__")[0] == "KAKAO") {
            setSocial(true);
          }
          setFormData(result);
          setPrevEmail(result.email);
          setPrevNickname(result.nickname);
          setLoading(true);
        } catch (err) {
          console.error("마이페이지 수정 요청 실패:", err);
        }
      };

      getMemberDetail();
    }
  }, [loginMember]);

  const checkNicknameAvailable = async () => {
    const res = await fetch(
      `${baseUrl}/api/v1/auth/check-nickname?nickname=${formData?.nickname}`
    );
    const result = await res.json();

    if (result?.data == true) {
      if (confirm("사용 가능한 닉네임 입니다. 사용 하시겠습니까?")) {
        setNicknameAvailable(true);
      }
    } else {
      alert("사용 불가능한 닉네임 입니다. 다시 입력해 주세요.");
    }
  };

  const removeRegion = (region: string) => {
    setFormData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        regions: prev.regions.filter((n) => n.full !== region),
      };
    });
    console.log(formData);
  };

  const sendEmailVerification = async () => {
    if (emailWait == true) return;

    setEmailLoading(true);
    try {
      const res = await fetch(
        `${baseUrl}/api/v1/email/send?email=${formData?.email}`,
        {
          method: "POST",
        }
      );
      const result = await res.json();

      if (result?.data == true) {
        alert("인증 메일을 전송했습니다.");
        setEamilWait(true);
      } else {
        alert("사용 불가능한 이메일 입니다. 다시 입력해 주세요.");
        setEamilWait(false);
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const checkEmailVerification = async () => {
    const res = await fetch(
      `${baseUrl}/api/v1/email/verify?email=${formData?.email}&verificationCode=${verificationCode}`,
      {
        method: "POST",
      }
    );
    const result = await res.json();

    if (result?.data == true) {
      alert("인증이 완료 되었습니다.");
      setEmailAvailable(true);
      setEamilWait(false);
    } else {
      alert("인증에 실패 하였습니다. 다시 시도해 주세요.");
      setVerificationCode("");
    }
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

      const formatted: Location[] = items.map((i: any) => ({
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const base = prev ?? {
        nickname: "",
        regions: [{ code: "", full: "", small: "" }],
        introduction: "",
        email: "",
        profileImage: null,
      };

      // nickname / email / introduction
      if (["nickname", "email", "introduction"].includes(name)) {
        return {
          ...base,
          [name]: value,
        };
      }

      // 지역 정보 업데이트
      if (name === "location") {
        const newRegions = [...base.regions];

        newRegions[0] = {
          ...newRegions[0],
          full: value,
        };

        return {
          ...base,
          regions: newRegions,
        };
      }

      return base;
    });
  };

  // 파일 선택 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageURL = URL.createObjectURL(file);
    setPreview(imageURL);

    // formData에 파일 저장 (서버로 보낼 때 사용)
    setFormData((prev: any) => ({
      ...prev,
      profileImage: file,
    }));
  };

  // 버튼 클릭 → 파일 선택창 오픈
  const openFileDialog = () => {
    fileInputRef.current?.click();
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

      <main className="flex-1 py-8 md:py-12">
        {loading && (
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
                          {preview ? (
                            <AvatarImage src={preview} />
                          ) : (
                            <AvatarFallback className="text-4xl">
                              {formData?.nickname?.[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="absolute bottom-0 right-0 rounded-full h-10 w-10"
                          onClick={openFileDialog}
                        >
                          <Camera className="h-5 w-5" />
                        </Button>

                        {/* 숨겨진 파일 input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>

                      <p className="text-sm text-muted-foreground">
                        프로필 사진을 변경하려면 클릭하세요
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nickname">닉네임</Label>
                        <div className="flex gap-2">
                          <Input
                            id="nickname"
                            name="nickname"
                            value={formData?.nickname}
                            onChange={handleInputChange}
                            placeholder="닉네임을 입력하세요"
                            disabled={nicknameAvailable}
                            required
                          />
                          <Button
                            type="button"
                            disabled={nicknameAvailable}
                            onClick={() => {
                              checkNicknameAvailable();
                            }}
                          >
                            중복 확인
                          </Button>
                        </div>
                      </div>
                      {social == false && (
                        <div className="space-y-2">
                          <Label htmlFor="email">이메일</Label>
                          <div className="flex gap-2">
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData?.email}
                              onChange={handleInputChange}
                              placeholder="이메일을 입력하세요"
                              required
                              disabled={emailAvailable || emailWait}
                            />
                            {emailWait ? (
                              <Button
                                type="button"
                                onClick={() => {
                                  setEamilWait(false);
                                }}
                              >
                                이메일 변경
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                disabled={emailWait || emailAvailable}
                                onClick={() => {
                                  sendEmailVerification();
                                }}
                              >
                                {emailLoading ? "로딩중..." : "이메일 인증"}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {emailWait == true && (
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            placeholder="인증번호"
                            value={verificationCode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              setVerificationCode(val === "" ? "" : val);
                            }}
                            required
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              checkEmailVerification();
                            }}
                          >
                            인증 확인
                          </Button>
                        </div>
                      )}
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
                              disabled={(formData?.regions?.length ?? 0) >= 4}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              setCurrentPage(1);
                              setIsModalOpen(true);
                              searchRegion(searchQuery);
                            }}
                            disabled={(formData?.regions?.length ?? 0) >= 4}
                          >
                            검색
                          </Button>
                        </div>
                        {(formData?.regions?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData?.regions?.map((region) => (
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
                      <div className="space-y-2">
                        <Label htmlFor="bio">소개</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData?.introduction ?? ""}
                          onChange={handleInputChange}
                          placeholder="자기소개를 입력하세요"
                          rows={4}
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {formData?.introduction
                            ? formData.introduction.length
                            : 0}{" "}
                          / 200
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
                  {social == false && (
                    <div>
                      <Link href="/mypage/password-change">
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-transparent"
                        >
                          비밀번호 변경
                        </Button>
                      </Link>
                    </div>
                  )}
                  <div>
                    <Link href="/mypage/delete-account">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-destructive hover:text-destructive bg-transparent"
                      >
                        계정 탈퇴
                      </Button>
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
                        disabled={(formData?.regions?.length ?? 0) >= 4}
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
                            if (!formData?.regions.includes(selected)) {
                              setFormData((prev) => {
                                if (!prev) {
                                  return {
                                    nickname: "",
                                    introduction: "",
                                    email: "",
                                    regions: [selected],
                                    profileImage: null,
                                  };
                                }

                                return {
                                  ...prev,
                                  regions: [...prev.regions, selected],
                                };
                              });
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
        )}
      </main>

      <Footer />
    </div>
  );
}
