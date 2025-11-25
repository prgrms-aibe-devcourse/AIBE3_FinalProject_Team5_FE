"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/global/auth/useAuth";

export function Header() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);
  const { loginMember, isLogin, logoutMember } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY || 0;

      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          // Hide header when scrolling down past threshold
          if (currentY > lastY.current && currentY > 50) {
            setHidden(true);
          } else {
            // Only show header when scrolled all the way to top (near 0)
            if (currentY <= 10) {
              setHidden(false);
            }
            // Otherwise, keep current hidden state (do not show on mid-page scroll-up)
          }

          lastY.current = currentY;
          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logout = () => {
    logoutMember();
    router.push("/"); // 메인으로 이동
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80 transform transition-transform duration-300 ease-in-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
      style={{ WebkitBackdropFilter: "blur(6px)" }}
    >
      <div className="container mx-auto px-4 flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-icon.png"
            alt="OneLife"
            width={80}
            height={80}
            className="object-contain h-36 w-36 border-0 outline-0 shadow-none"
            style={{
              border: "none",
              outline: "none",
              boxShadow: "none",
            }}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/onelife"
            className="text-lg font-medium text-black dark:text-foreground hover:text-primary transition-colors font-semibold"
          >
            혼라이프
          </Link>
          <Link
            href="/restaurants"
            className="text-lg font-medium text-black dark:text-foreground hover:text-primary transition-colors font-semibold"
          >
            혼밥 식당
          </Link>
          <Link
            href="/recipe"
            className="text-lg font-medium text-black dark:text-foreground hover:text-primary transition-colors font-semibold"
          >
            AI 레시피
          </Link>
          <Link
            href="/group-buying"
            className="text-lg font-medium text-black dark:text-foreground hover:text-primary transition-colors font-semibold"
          >
            공동구매
          </Link>
          <Link
            href="/groups"
            className="text-lg font-medium text-black dark:text-foreground hover:text-primary transition-colors font-semibold"
          >
            소모임
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isLogin ? (
            <>
              <span className="text-sm font-medium text-muted-foreground">
                {loginMember?.nickname} 님
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-red-500 border-red-300 hover:bg-red-50"
              >
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">로그인</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">회원가입</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
