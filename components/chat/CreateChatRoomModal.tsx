"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/global/auth/useAuth";
import { createChatRoom } from "@/lib/api/chatApi";
import { ChatRoomType } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Search, ChevronDown } from "lucide-react";

interface CreateChatRoomModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface Region {
  code: string;
  full: string;
  small: string;
}

const MAX_PARTICIPANTS_OPTIONS = Array.from({ length: 9 }, (_, i) => i + 2);

const CATEGORIES = [
  { value: "맛집", label: "맛집" },
  { value: "운동", label: "운동" },
  { value: "문화", label: "문화" },
  { value: "독서", label: "독서" },
  { value: "요리", label: "요리" },
  { value: "게임", label: "게임" },
  { value: "여행", label: "여행" },
  { value: "스터디", label: "스터디" },
  { value: "기타", label: "기타" },
];

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      requestAnimationFrame(() => {
        if (!buttonRef.current) return;

        const buttonRect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;

        let style: React.CSSProperties = {
          position: "fixed",
          width: buttonRect.width,
          left: buttonRect.left,
          zIndex: 9999,
        };

        if (spaceBelow < 200 && spaceAbove > spaceBelow) {
          style.bottom = window.innerHeight - buttonRect.top + 4;
        } else {
          style.top = buttonRect.bottom + 4;
        }

        setDropdownStyle(style);
      });
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} className="relative">
      {/* 트리거 버튼 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className={selectedOption ? "" : "text-muted-foreground"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 드롭다운 메뉴 - fixed로 모달 밖에 표시 */}
      {isOpen && dropdownStyle.top && (
        <div
          style={dropdownStyle}
          className="bg-background border border-input rounded-md shadow-lg max-h-[200px] overflow-y-auto"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                value === option.value ? "bg-accent" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateChatRoomModal({
  onClose,
  onSuccess,
}: CreateChatRoomModalProps) {
  const router = useRouter();
  const { isLogin } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [maxParticipants, setMaxParticipants] = useState<string>("4");
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Region[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

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

      const formatted: Region[] = items.map((i: any) => ({
        code: i.properties.emd_cd,
        full: i.properties.full_nm,
        small: i.properties.emd_kor_nm,
      }));

      setSearchResults(formatted);
    } catch (e) {
      console.error(e);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    if (isRegionModalOpen) {
      searchRegion(searchQuery);
    }
  }, [currentPage, isRegionModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!category) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    if (!selectedRegion) {
      alert("지역을 선택해주세요.");
      return;
    }

    try {
      setIsLoading(true);

      await createChatRoom({
        name,
        description,
        category,
        region: selectedRegion.small,
        maxParticipants: Number(maxParticipants),
        type: ChatRoomType.SMALL_GROUP,
      });

      alert("소모임이 생성되었습니다!");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error("채팅방 생성 실패:", error);
      alert("소모임 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg w-full max-w-md border shadow-lg max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-card z-10">
          <h2 className="text-xl font-bold">소모임 만들기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 카테고리 - 커스텀 드롭다운 */}
          <div className="space-y-2">
            <Label htmlFor="category">카테고리 *</Label>
            <CustomSelect
              value={category}
              onChange={setCategory}
              options={CATEGORIES}
              placeholder="카테고리를 선택하세요"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">소모임 이름 *</Label>
            <Input
              id="name"
              placeholder="예: 강남 러닝크루"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">소모임 설명 *</Label>
            <Textarea
              id="description"
              placeholder="소모임에 대해 설명해주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />
          </div>

          {/* 지역 검색 */}
          <div className="space-y-2">
            <Label htmlFor="region">지역 *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="동네 이름 검색 (예: 역삼동)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={!!selectedRegion}
                />
              </div>
              <Button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  setIsRegionModalOpen(true);
                  searchRegion(searchQuery);
                }}
                disabled={!!selectedRegion}
              >
                검색
              </Button>
            </div>
            {selectedRegion && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="gap-1">
                  {selectedRegion.full}
                  <button
                    type="button"
                    onClick={removeRegion}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              동 단위로 입력해주세요 (예: 역삼동, 강남동)
            </p>
          </div>

          {/* 최대 인원 - 커스텀 드롭다운 */}
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">최대 인원 *</Label>
            <CustomSelect
              value={maxParticipants}
              onChange={setMaxParticipants}
              options={MAX_PARTICIPANTS_OPTIONS.map((num) => ({
                value: String(num),
                label: `${num}명`,
              }))}
              placeholder="최대 인원을 선택하세요"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isLoading ? "생성 중..." : "생성하기"}
            </Button>
          </div>
        </form>
      </div>

      {/* 지역 검색 모달 */}
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
    </div>
  );
}
