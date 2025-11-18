import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "./global/auth/useAuth";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OneLife - 1인 가구 커뮤니티 플랫폼",
  description:
    "혼자여도 외롭지 않은 따뜻한 일상. 1인 가구를 위한 커뮤니티 플랫폼 OneLife에서 이웃들과 함께 더 풍요로운 혼라이프를 만들어보세요",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
