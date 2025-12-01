import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import PostDetailFetch from "./PostDetailFetch";

export default async function PostDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <PostDetailFetch id={id} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
