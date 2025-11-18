"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  MessageCircle,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { useRouter } from "next/navigation";

const groups = [
  {
    id: 1,
    name: "혼밥러들의 맛집 탐방",
    description:
      "서울 곳곳의 혼밥하기 좋은 맛집을 함께 찾아가요! 매주 새로운 곳을 방문합니다.",
    leader: "김혼밥",
    memberCount: 12,
    maxMembers: 20,
    category: "맛집",
    location: "서울 전역",
    meetingDay: "매주 토요일",
  },
  {
    id: 2,
    name: "주말 등산 모임",
    description:
      "주말마다 서울 근교 산을 오르는 소모임입니다. 초보자도 환영합니다!",
    leader: "박등산",
    memberCount: 8,
    maxMembers: 15,
    category: "운동",
    location: "서울 근교",
    meetingDay: "매주 일요일",
  },
  {
    id: 3,
    name: "영화 감상 모임",
    description: "매주 다양한 영화를 함께 보고 이야기 나누는 모임입니다.",
    leader: "이영화",
    memberCount: 15,
    maxMembers: 25,
    category: "문화",
    location: "강남/홍대",
    meetingDay: "매주 금요일",
  },
  {
    id: 4,
    name: "독서 클럽",
    description: "한 달에 한 권씩 책을 읽고 토론하는 모임입니다.",
    leader: "최책방",
    memberCount: 10,
    maxMembers: 20,
    category: "독서",
    location: "온라인/오프라인",
    meetingDay: "매월 마지막 주 일요일",
  },
  {
    id: 5,
    name: "요리 배우기 모임",
    description: "초보자를 위한 요리 배우기 모임! 함께 만들어 먹어요.",
    leader: "정요리사",
    memberCount: 6,
    maxMembers: 10,
    category: "요리",
    location: "강남구",
    meetingDay: "격주 토요일",
  },
  {
    id: 6,
    name: "보드게임 모임",
    description: "다양한 보드게임을 즐기는 모임입니다. 게임은 준비되어 있어요!",
    leader: "강보드",
    memberCount: 14,
    maxMembers: 20,
    category: "게임",
    location: "홍대",
    meetingDay: "매주 수요일",
  },
  {
    id: 7,
    name: "러닝 크루",
    description:
      "한강에서 함께 러닝하는 모임입니다. 체력 향상과 건강한 취미생활!",
    leader: "김러너",
    memberCount: 18,
    maxMembers: 30,
    category: "운동",
    location: "한강공원",
    meetingDay: "매주 화, 목요일",
  },
  {
    id: 8,
    name: "사진 동호회",
    description: "사진 촬영 기술을 배우고 출사를 다니는 모임입니다.",
    leader: "이사진",
    memberCount: 11,
    maxMembers: 15,
    category: "문화",
    location: "서울 전역",
    meetingDay: "격주 일요일",
  },
  {
    id: 9,
    name: "와인 테이스팅 모임",
    description: "매달 다른 종류의 와인을 테이스팅하며 지식을 쌓아가요.",
    leader: "박와인",
    memberCount: 7,
    maxMembers: 12,
    category: "맛집",
    location: "강남구",
    meetingDay: "매월 셋째 주 토요일",
  },
];

const ITEMS_PER_PAGE = 6;

export default function GroupsPage() {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<(typeof groups)[0] | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);

  const categories = ["전체", "맛집", "운동", "문화", "독서", "요리", "게임"];

  const filteredGroups =
    selectedCategory === "전체"
      ? groups
      : groups.filter((group) => group.category === selectedCategory);

  const totalPages = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentGroups = filteredGroups.slice(startIndex, endIndex);

  const handleGroupClick = (group: (typeof groups)[0]) => {
    setSelectedGroup(group);
    setIsDialogOpen(true);
  };

  const handleJoin = () => {
    if (selectedGroup) {
      alert(`"${selectedGroup.name}" 소모임에 참여 신청했습니다!`);
      setIsDialogOpen(false);
      router.push(`/groups/${selectedGroup.id}/chat`);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">소모임</h1>
              <p className="text-muted-foreground">
                관심사가 같은 사람들과 함께 활동해보세요
              </p>
            </div>
            <Link href="/groups/write">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                소모임 만들기
              </Button>
            </Link>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentGroups.map((group) => (
              <Card
                key={group.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleGroupClick(group)}
              >
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="secondary">{group.category}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>
                      {group.memberCount}/{group.maxMembers}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {group.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{group.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{group.meetingDay}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    방장:{" "}
                    <span className="font-medium text-foreground">
                      {group.leader}
                    </span>
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Join Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedGroup?.name}</DialogTitle>
                <DialogDescription>소모임 정보</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-semibold mb-2">소모임 설명</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedGroup?.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">방장</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedGroup?.leader}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">참여 인원</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedGroup?.memberCount}/{selectedGroup?.maxMembers}명
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">활동 지역</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedGroup?.location}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">모임 일정</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedGroup?.meetingDay}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>채팅방에 참여하면 활동 소식을 받을 수 있습니다</span>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  취소
                </Button>
                <Button onClick={handleJoin}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  채팅 참여
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Footer />
    </>
  );
}
