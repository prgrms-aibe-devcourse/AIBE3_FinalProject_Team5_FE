"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Users,
  MapPin,
  Clock,
  DollarSign,
  ArrowLeft,
  Trash2,
  Edit,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/app/global/auth/useAuth";
import {
  fetchGroupBuyingPost,
  joinGroupBuyingPost,
  deleteGroupBuyingPost,
  leaveGroupBuyingPost,
  fetchGroupBuyingParticipants,
} from "@/lib/api/groupBuyingApi";
import {
  GroupBuyingPost,
  GroupBuyingStatus,
  GroupBuyingParticipant,
  GROUP_BUYING_CATEGORIES,
} from "@/types/groupBuying";

export default function GroupBuyingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isLogin, loginMember } = useAuth();
  const postId = params.id as string;

  const [post, setPost] = useState<GroupBuyingPost | null>(null);
  const [participants, setParticipants] = useState<GroupBuyingParticipant[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [contributedAmount, setContributedAmount] = useState("");

  const isCreator = post && loginMember && post.creatorId === loginMember.id;
  const isParticipant =
    loginMember && participants.some((p) => p.memberId === loginMember.id);

  useEffect(() => {
    if (!postId) return;
    loadPostData();
  }, [postId]);

  const loadPostData = async () => {
    try {
      const postData = await fetchGroupBuyingPost(Number(postId));
      setPost(postData);

      const participantsData = await fetchGroupBuyingParticipants(
        Number(postId)
      );
      setParticipants(participantsData);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      alert("게시글을 불러오는데 실패했습니다.");
      router.push("/group-buying");
    } finally {
      setIsLoading(false);
    }
  };

  const handleParticipate = async () => {
    if (!isLogin) {
      alert("로그인이 필요한 기능입니다.");
      router.push("/login");
      return;
    }

    if (!post) return;

    const amount = Number(contributedAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    // 1인당 정확한 금액 체크
    const perPersonAmount = post.targetAmount / post.targetParticipants;
    if (amount !== perPersonAmount) {
      alert(
        `1인당 정확한 금액 ${perPersonAmount.toLocaleString()}원을 입력해주세요.\n` +
          `입력한 금액: ${amount.toLocaleString()}원`
      );
      return;
    }

    try {
      await joinGroupBuyingPost(post.id, { contributedAmount: amount });
      alert("공동구매에 참여했습니다!");
      setContributedAmount("");
      loadPostData();
    } catch (error: any) {
      console.error("참여 실패:", error);
      alert(error.message || "참여에 실패했습니다.");
    }
  };

  const handleLeave = async () => {
    if (!post) return;

    const confirmed = confirm("공동구매를 나가시겠습니까?");
    if (!confirmed) return;

    try {
      await leaveGroupBuyingPost(post.id);
      alert("공동구매를 나갔습니다.");
      router.push("/group-buying");
    } catch (error: any) {
      console.error("나가기 실패:", error);
      alert(error.message || "나가기에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!post) return;

    const confirmed = confirm(
      "정말 삭제하시겠습니까?\n채팅방에 다른 참여자가 존재하면 삭제할 수 없습니다."
    );
    if (!confirmed) return;

    try {
      await deleteGroupBuyingPost(post.id);
      alert("게시글이 삭제되었습니다.");
      router.push("/group-buying");
    } catch (error: any) {
      console.error("삭제 실패:", error);
      alert(error.message || "삭제에 실패했습니다.");
    }
  };

  const getStatusBadge = (status: GroupBuyingStatus) => {
    switch (status) {
      case GroupBuyingStatus.RECRUITING:
        return <Badge className="bg-green-500">모집중</Badge>;
      case GroupBuyingStatus.COMPLETED:
        return <Badge variant="secondary">완료</Badge>;
      case GroupBuyingStatus.CANCELLED:
        return <Badge variant="destructive">취소</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
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
      </div>
    );
  }

  // 모집 마감 여부 확인
  const isFull = post.currentParticipants >= post.targetParticipants;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/group-buying"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로 돌아가기
          </Link>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {GROUP_BUYING_CATEGORIES[
                          post.category as keyof typeof GROUP_BUYING_CATEGORIES
                        ] || post.category}
                      </Badge>
                      {getStatusBadge(post.status)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(post.createdAt), "yyyy년 M월 d일", {
                        locale: ko,
                      })}
                    </span>
                  </div>

                  <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{post.region}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        마감일:{" "}
                        {format(new Date(post.deadline), "M월 d일", {
                          locale: ko,
                        })}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{post.content}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-semibold">
                    참여자 ({participants.length})
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {participants.map((participant, index) => (
                      <div
                        key={participant.memberId}
                        className="flex items-center gap-3"
                      >
                        <span className="text-sm text-muted-foreground w-6">
                          {index + 1}
                        </span>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {participant.memberNickname?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {participant.memberNickname || "알 수 없음"}
                          </p>
                          {participant.contributedAmount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              기여:{" "}
                              {participant.contributedAmount.toLocaleString()}원
                            </p>
                          )}
                        </div>
                        {post.creatorId === participant.memberId && (
                          <Badge variant="secondary" className="text-xs">
                            주최자
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">모집 현황</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      모집 인원
                    </span>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-primary">
                        {post.currentParticipants}/{post.targetParticipants}명
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">목표 금액</p>
                      <p className="text-sm font-medium">
                        {post.targetAmount.toLocaleString()}원
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        현재: {post.currentAmount.toLocaleString()}원 (
                        {post.progressPercentage}%)
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3">
                    <DollarSign className="h-4 w-4 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        1인당 금액
                      </p>
                      <p className="text-base font-bold text-primary">
                        {Math.ceil(
                          post.targetAmount / post.targetParticipants
                        ).toLocaleString()}
                        원
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        목표 금액 ÷ {post.targetParticipants}명
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">
                        진행률
                      </span>
                      <span className="text-xs font-medium">
                        {post.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${post.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 사이드바 참여 카드 */}
              {!isParticipant && (
                <Card className="hidden lg:block">
                  <CardContent className="pt-6 space-y-3">
                    {/* 모집 중 (자리 있음) */}
                    {!isFull && (
                      <>
                        <input
                          type="number"
                          placeholder={`1인당 금액: ${(
                            post.targetAmount / post.targetParticipants
                          ).toLocaleString()}원`}
                          value={contributedAmount}
                          onChange={(e) => setContributedAmount(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={handleParticipate}
                        >
                          <Users className="mr-2 h-5 w-5" />
                          공동구매 참여하기
                        </Button>
                      </>
                    )}

                    {/* 모집 마감 (자리 없음) */}
                    {isFull && (
                      <Button size="lg" className="w-full" disabled>
                        모집 마감
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Buttons - 상태 조건 제거, 인원만 체크 */}
      <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="container mx-auto max-w-4xl flex justify-center gap-3">
          {/* 비참여자 (lg 미만에서만 표시) */}
          {!isParticipant && (
            <div className="w-full max-w-md lg:hidden flex flex-col gap-2">
              {/* 모집 중 (자리 있음) */}
              {!isFull && (
                <>
                  <input
                    type="number"
                    placeholder={`1인당 금액: ${(
                      post.targetAmount / post.targetParticipants
                    ).toLocaleString()}원`}
                    value={contributedAmount}
                    onChange={(e) => setContributedAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleParticipate}
                  >
                    <Users className="mr-2 h-5 w-5" />
                    공동구매 참여하기
                  </Button>
                </>
              )}

              {/* 모집 마감 (자리 없음) */}
              {isFull && (
                <Button size="lg" className="w-full" disabled>
                  모집 마감
                </Button>
              )}
            </div>
          )}

          {/* 참여자 - 버튼 너비 고정 */}
          {isParticipant && (
            <div className="flex gap-3 w-full max-w-md justify-center">
              <Button
                size="lg"
                className="flex-1 max-w-[180px]"
                onClick={() => router.push(`/group-buying/${post.id}/chat`)}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                채팅방 입장
              </Button>
              {isCreator && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 max-w-[140px]"
                    onClick={() => router.push(`/group-buying/${post.id}/edit`)}
                  >
                    <Edit className="mr-2 h-5 w-5" />
                    수정
                  </Button>

                  <Button
                    variant="destructive"
                    size="lg"
                    className="flex-1 max-w-[140px]"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-2 h-5 w-5" />
                    삭제
                  </Button>
                </>
              )}

              {!isCreator && (
                <Button
                  variant="destructive"
                  size="lg"
                  className="flex-1 max-w-[140px]"
                  onClick={handleLeave}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  나가기
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
