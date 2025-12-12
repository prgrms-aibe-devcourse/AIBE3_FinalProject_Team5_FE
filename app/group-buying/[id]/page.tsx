"use client";

import { useState, useEffect, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isLoadingRef = useRef(false);

  const isCreator = post && loginMember && post.creatorId === loginMember.id;
  const isParticipant =
    loginMember && participants.some((p) => p.memberId === loginMember.id);

  useEffect(() => {
    if (!postId) return;
    loadPostData();
  }, [postId]);

  const loadPostData = async () => {
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;

    try {
      const postData = await fetchGroupBuyingPost(Number(postId));
      setPost(postData);

      if (isLogin) {
        const participantsData = await fetchGroupBuyingParticipants(
          Number(postId)
        );
        setParticipants(participantsData);
      } else {
        setParticipants([]);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      alert("게시글을 불러오는데 실패했습니다.");
      router.push("/group-buying");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  const handleJoin = async () => {
    if (!isLogin) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    if (!post) return;

    const amount = Number(contributedAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    try {
      await joinGroupBuyingPost(post.id, { contributedAmount: amount });
      alert("참여가 완료되었습니다!");
      loadPostData();
      setContributedAmount("");
    } catch (error: any) {
      console.error("참여 실패:", error);
      alert(error.message || "참여에 실패했습니다.");
    }
  };

  const handleLeave = async () => {
    if (!post) return;

    if (!confirm("정말 참여를 취소하시겠습니까?")) {
      return;
    }

    try {
      await leaveGroupBuyingPost(post.id);
      alert("참여가 취소되었습니다.");
      loadPostData();
    } catch (error: any) {
      console.error("참여 취소 실패:", error);
      alert(error.message || "참여 취소에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!post) return;

    if (!confirm("정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    try {
      await deleteGroupBuyingPost(post.id);
      alert("게시글이 삭제되었습니다.");
      router.push("/group-buying");
    } catch (error: any) {
      console.error("삭제 실패:", error);
      alert(error.message || "게시글 삭제에 실패했습니다.");
    }
  };

  const getStatusBadge = (status: GroupBuyingStatus) => {
    if (status === "RECRUITING") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          모집중
        </Badge>
      );
    } else if (status === "COMPLETED") {
      return <Badge className="bg-gray-400 text-white">완료</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const handlePrevImage = () => {
    if (!post?.images || post.images.length === 0) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? post.images!.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!post?.images || post.images.length === 0) return;
    setCurrentImageIndex((prev) =>
      prev === post.images!.length - 1 ? 0 : prev + 1
    );
  };

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

                {post.images && post.images.length > 0 && (
                  <div className="relative">
                    <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                      <Image
                        src={post.images[currentImageIndex]}
                        alt={`${post.title} - 이미지 ${currentImageIndex + 1}`}
                        width={800}
                        height={450}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>

                    {post.images.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={handlePrevImage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={handleNextImage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {post.images.map((_: string, index: number) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentImageIndex
                                  ? "bg-white w-6"
                                  : "bg-white/50"
                              }`}
                            />
                          ))}
                        </div>

                        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {post.images.length}
                        </div>
                      </>
                    )}
                  </div>
                )}

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
                    {participants.map((participant, index: number) => (
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

              {isLogin && !isParticipant && !isCreator && (
                <Card className="hidden lg:block">
                  <CardContent className="pt-6 space-y-3">
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
                          className="w-full"
                          onClick={handleJoin}
                          disabled={!isLogin}
                        >
                          참여하기
                        </Button>
                      </>
                    )}

                    {isFull && (
                      <p className="text-center text-sm text-muted-foreground py-3">
                        모집이 마감되었습니다
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {isParticipant && !isCreator && (
                <Card>
                  <CardContent className="pt-6">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleLeave}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      참여 취소
                    </Button>
                  </CardContent>
                </Card>
              )}

              {isCreator && (
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        router.push(`/group-buying/${post.id}/edit`)
                      }
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      수정하기
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제하기
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* 참여자이거나 작성자만 채팅방 입장 가능 */}
              {(isParticipant || isCreator) && (
                <Button
                  className="w-full"
                  onClick={() => router.push(`/group-buying/${post.id}/chat`)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  채팅방 입장
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
