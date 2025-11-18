import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="py-8 md:py-12 bg-[rgba(183,212,145,0.06)]">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">지금 OneLife와 함께 시작하세요</h2>
          <p className="text-lg text-muted-foreground mb-8 text-pretty leading-relaxed">
            혼자여도 외롭지 않은 따뜻한 커뮤니티가 기다리고 있습니다.
          </p>
          <Button size="lg" asChild className="w-full sm:w-auto h-auto py-4 px-8 text-lg md:text-xl">
            <Link href="/signup">무료로 가입하기</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
