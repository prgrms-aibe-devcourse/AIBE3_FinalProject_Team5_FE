import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
    return (
        <footer className="border-t bg-background backdrop-blur supports-[backdrop-filter]:bg-background">
            <div className="container mx-auto px-4 py-6 md:py-8">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <Image
                                src="/logo-icon.png"
                                alt="OneLife"
                                width={64}
                                height={64}
                                className="object-contain h-10 w-15 rounded-lg transform scale-550 mt-5"
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">서비스</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link
                                    href="/onelife"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    혼라이프
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/local"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    로컬 커뮤니티
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/local/group-buying"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    공동구매
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">회사</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link
                                    href="/about"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    회사 소개
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    문의하기
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/careers"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    채용
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">법적 고지</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link
                                    href="/terms"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    이용약관
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    개인정보처리방침
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
                    <p>© 2025 OneLife. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
