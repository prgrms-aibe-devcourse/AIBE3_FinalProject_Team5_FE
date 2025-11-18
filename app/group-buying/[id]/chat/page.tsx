"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Send, Users, MapPin, Clock, DollarSign, ArrowLeft, MoreVertical } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function GroupBuyingChatPage({
  params,
}: {
  params: { id: string }
}) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      id: 1,
      author: "과일러버",
      role: "주최자",
      content: "안녕하세요! 공동구매 채팅방에 오신 것을 환영합니다 😊",
      time: "오전 10:00",
      isMe: false,
    },
    {
      id: 2,
      author: "건강식",
      role: "참여자",
      content: "참여하고 싶어요! 어떻게 하면 되나요?",
      time: "오전 10:05",
      isMe: false,
    },
    {
      id: 3,
      author: "과일러버",
      role: "주최자",
      content: "12월 15일 오후 2시에 강남역 2번 출구에서 만나서 함께 코스트코로 이동할 예정입니다!",
      time: "오전 10:07",
      isMe: false,
    },
    {
      id: 4,
      author: "과일좋아",
      role: "참여자",
      content: "딸기 좋아하는데 딱이네요! 참여할게요!",
      time: "오전 10:15",
      isMe: false,
    },
    {
      id: 5,
      author: "신선과일",
      role: "참여자",
      content: "지퍼백은 각자 준비해가는 거죠?",
      time: "오전 10:20",
      isMe: false,
    },
    {
      id: 6,
      author: "과일러버",
      role: "주최자",
      content: "네 맞아요! 지퍼백 준비해오시면 좋습니다. 저도 여분 몇 개 가져갈게요~",
      time: "오전 10:22",
      isMe: false,
    },
  ])

  const groupBuy = {
    title: "코스트코 과일 공동구매",
    currentPeople: 7,
    targetPeople: 10,
    price: "1인당 15,000원",
    meetingPlace: "강남역 2번 출구",
    meetingTime: "12월 15일 오후 2시",
  }

  const participants = [
    { name: "과일러버", role: "주최자", status: "online" },
    { name: "건강식", role: "참여자", status: "online" },
    { name: "과일좋아", role: "참여자", status: "online" },
    { name: "신선과일", role: "참여자", status: "offline" },
    { name: "비타민", role: "참여자", status: "online" },
    { name: "과일마니아", role: "참여자", status: "offline" },
    { name: "딸기러버", role: "참여자", status: "online" },
  ]

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          author: "나",
          role: "참여자",
          content: message,
          time: "방금",
          isMe: true,
        },
      ])
      setMessage("")
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-4 md:py-8">
        <div className="container mx-auto px-4 h-full">
          <div className="max-w-6xl mx-auto h-full">
            {/* Back Button */}
            <Link
              href={`/local/group-buying/${params.id}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              공동구매 상세로 돌아가기
            </Link>

            <div className="grid lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
              {/* Chat Area */}
              <div className="lg:col-span-3 flex flex-col">
                <Card className="flex-1 flex flex-col">
                  {/* Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">{groupBuy.title}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {participants.filter((p) => p.status === "online").length}명 접속 중
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* System Message */}
                    <div className="flex justify-center">
                      <Badge variant="secondary" className="text-xs">
                        공동구매 채팅방에 입장하셨습니다
                      </Badge>
                    </div>

                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex gap-3 ${msg.isMe ? "flex-row-reverse" : ""}`}>
                        {!msg.isMe && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{msg.author[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                          {!msg.isMe && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{msg.author}</span>
                              {msg.role === "주최자" && (
                                <Badge variant="secondary" className="text-xs">
                                  주최자
                                </Badge>
                              )}
                            </div>
                          )}
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              msg.isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">{msg.time}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="메시지를 입력하세요..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleSendMessage()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                {/* Group Info */}
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold">공동구매 정보</h3>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">모집 인원</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">
                          {groupBuy.currentPeople}/{groupBuy.targetPeople}명
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">1인당 금액</p>
                          <p className="text-sm font-medium">{groupBuy.price}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">만날 장소</p>
                          <p className="text-sm font-medium">{groupBuy.meetingPlace}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">만날 시간</p>
                          <p className="text-sm font-medium">{groupBuy.meetingTime}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Participants */}
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      참여자 ({participants.length})
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {participants.map((participant, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{participant.name[0]}</AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${
                              participant.status === "online" ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{participant.name}</p>
                            {participant.role === "주최자" && (
                              <Badge variant="secondary" className="text-xs">
                                주최자
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
