import type React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export type BoardLayoutProps = Readonly<{
  title?: string
  subtitle?: string
  hero?: React.ReactNode
  children: React.ReactNode
}>

export default function BoardLayout({ title, subtitle, hero, children }: BoardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {hero ? (
          hero
        ) : title ? (
          <section className="border-b bg-background py-8">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{title}</h1>
              {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
            </div>
          </section>
        ) : null}

        {children}
      </main>

      <Footer />
    </div>
  )
}
